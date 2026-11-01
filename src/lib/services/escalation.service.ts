import { prisma } from "../prisma";
import { getAuthorityForTier, getEscalatedPriority } from "./routing.service";

export interface EscalationSweepResult {
    evaluatedCount: number;
    escalatedCount: number;
    skippedCount: number;
    escalatedReportIds: string[];
    errors: { reportId: string; error: string }[];
}

/**
 * Formats time difference in milliseconds into human readable format (e.g. "2h 45m overdue").
 */
export function formatBreachDuration(diffMs: number): string {
    const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(" ") + " overdue";
}

/**
 * Idempotent service that scans unresolved reports past their deadline and escalates
 * them exactly one tier per breach up to Tier 2 (Final Escalation).
 *
 * Rules:
 * - Only evaluates unresolved reports ('reported', 'under_review'). Never 'resolved' or 'disputed'.
 * - Tier 0 evaluates against original `slaDeadline`.
 * - Tier 1 evaluates against supervisory `nextSlaDeadline`.
 * - Tier 2 is final: marked as Tier 2 — Final Escalation, and remains visibly overdue without extending deadlines.
 * - Concurrency-safe: uses atomic condition on `escalationTier` inside a transaction.
 */
export async function checkAndEscalateOverdueReports(): Promise<EscalationSweepResult> {
    const now = new Date();

    const activeReports = await prisma.report.findMany({
        where: {
            status: { in: ["reported", "under_review"] },
            escalationTier: { lt: 2 }, // Tier 2 is final
        },
        select: {
            id: true,
            status: true,
            department: true,
            zone: true,
            ward: true,
            assignedAuthority: true,
            priorityLevel: true,
            slaDeadline: true,
            nextSlaDeadline: true,
            escalationTier: true,
            escalationCount: true,
        },
    });

    const result: EscalationSweepResult = {
        evaluatedCount: activeReports.length,
        escalatedCount: 0,
        skippedCount: 0,
        escalatedReportIds: [],
        errors: [],
    };

    for (const report of activeReports) {
        try {
            const currentTier = report.escalationTier ?? 0;

            // Determine relevant deadline for current tier
            const effectiveDeadline =
                currentTier === 0
                    ? report.slaDeadline
                    : (report.nextSlaDeadline || report.slaDeadline);

            if (!effectiveDeadline) {
                result.skippedCount++;
                continue;
            }

            const deadlineTime = new Date(effectiveDeadline).getTime();
            const nowTime = now.getTime();

            // Check if deadline has actually passed
            if (nowTime < deadlineTime) {
                result.skippedCount++;
                continue;
            }

            const breachMs = nowTime - deadlineTime;
            const breachDuration = formatBreachDuration(breachMs);
            const nextTier = (currentTier + 1) as 1 | 2;

            const nextAuthorityInfo = getAuthorityForTier(
                report.department,
                report.zone,
                report.ward,
                nextTier
            );

            const newPriority = getEscalatedPriority(report.priorityLevel);

            // Tier 1 receives a 24h supervisory intervention window.
            // Tier 2 is Final Escalation: we do NOT push out a new deadline to avoid hiding the breach.
            const nextSlaDeadline =
                nextTier === 1
                    ? new Date(nowTime + 24 * 60 * 60 * 1000)
                    : null;

            const fromAuthority =
                report.assignedAuthority ||
                getAuthorityForTier(report.department, report.zone, report.ward, currentTier).designation;

            // Execute atomic update & audit log inside transaction
            const escalated = await prisma.$transaction(async (tx) => {
                // Atomic conditional guard: ensure escalationTier hasn't changed concurrently
                const updateRes = await tx.report.updateMany({
                    where: {
                        id: report.id,
                        escalationTier: currentTier,
                        status: { in: ["reported", "under_review"] },
                    },
                    data: {
                        escalationTier: nextTier,
                        escalationCount: { increment: 1 },
                        escalated: true,
                        escalatedAt: now,
                        lastSlaBreachAt: now,
                        assignedAuthority: nextAuthorityInfo.designation,
                        priorityLevel: newPriority,
                        nextSlaDeadline: nextSlaDeadline,
                    },
                });

                if (updateRes.count === 0) {
                    // Report was updated by a concurrent sweep or status changed
                    return false;
                }

                // Record durable audit event
                await tx.escalationEvent.create({
                    data: {
                        reportId: report.id,
                        fromTier: currentTier,
                        toTier: nextTier,
                        fromAuthority,
                        toAuthority: nextAuthorityInfo.designation,
                        triggeredAt: now,
                        breachedDeadline: effectiveDeadline,
                        breachDuration,
                        reason: `SLA commitment missed by ${breachDuration}. Autonomous escalation to ${nextAuthorityInfo.role}.`,
                        previousPriority: report.priorityLevel || "P3 - Medium",
                        newPriority,
                    },
                });

                return true;
            });

            if (escalated) {
                result.escalatedCount++;
                result.escalatedReportIds.push(report.id);
            } else {
                result.skippedCount++;
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`[EscalationService] Error escalating report ${report.id}:`, errorMsg);
            result.errors.push({ reportId: report.id, error: errorMsg });
        }
    }

    return result;
}

/**
 * Fetches all escalation audit events for a specific report.
 */
export async function getEscalationHistory(reportId: string) {
    return prisma.escalationEvent.findMany({
        where: { reportId },
        orderBy: { triggeredAt: "desc" },
    });
}
