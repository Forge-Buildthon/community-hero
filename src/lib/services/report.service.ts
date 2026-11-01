import { prisma } from "@/lib/prisma";
import type { Report } from "@/lib/types/report";
import crypto from "crypto";
import {
    computeAuthorityRouting,
    evaluateEscalation,
    MUNICIPAL_DEPARTMENTS,
} from "./routing.service";

/**
 * Maps a database Report record to the exact Report interface type.
 */
export function mapPrismaToReport(record: Record<string, unknown>): Report & { id: string } {
    return {
        id: record.id as string,
        userId: record.userId as string,
        userEmail: record.userEmail as string,
        imageUrl: record.imageUrl as string,
        issueType: record.issueType as string,
        severity: record.severity as "Low" | "Medium" | "High" | "Severe",
        description: record.description as string,
        latitude: record.latitude as number,
        longitude: record.longitude as number,
        status: record.status as "reported" | "under_review" | "resolved" | "disputed",
        repairImageUrl: (record.repairImageUrl as string) || null,
        verificationConfidence: record.verificationConfidence as number | null,
        verificationReason: (record.verificationReason as string) || undefined,
        fraudRisk: (record.fraudRisk as string) || undefined,
        communityReports: record.communityReports as number,
        affectedCount: record.affectedCount as number,
        confirmedBy: (record.confirmedBy as string[]) || [],
        supportingReports: (Array.isArray(record.supportingReports)
            ? record.supportingReports
            : []) as Report["supportingReports"],
        resolvedAt: (record.resolvedAt as Date) || null,
        createdAt: (record.createdAt as Date) || undefined,
        previousRepairImageUrl: (record.previousRepairImageUrl as string) || undefined,
        previousVerificationConfidence: (record.previousVerificationConfidence as number) || undefined,
        previousVerificationReason: (record.previousVerificationReason as string) || undefined,
        previousFraudRisk: (record.previousFraudRisk as string) || undefined,
        verificationAttempts: (record.verificationAttempts as number) || undefined,

        // Automatic Authority Routing & Jurisdiction
        department: (record.department as string) || null,
        departmentName: (record.departmentName as string) || null,
        assignedAuthority: (record.assignedAuthority as string) || null,
        zone: (record.zone as string) || null,
        ward: (record.ward as string) || null,
        slaDeadline: (record.slaDeadline as Date) || null,
        priorityLevel: (record.priorityLevel as string) || null,
        routingReason: (record.routingReason as string) || null,
        escalated: (record.escalated as boolean) ?? false,

        // Explicit SLA Escalation State
        escalationTier: (record.escalationTier as number) ?? 0,
        escalatedAt: (record.escalatedAt as Date) || null,
        lastSlaBreachAt: (record.lastSlaBreachAt as Date) || null,
        nextSlaDeadline: (record.nextSlaDeadline as Date) || null,
        escalationCount: (record.escalationCount as number) ?? 0,
        escalationEvents: (Array.isArray(record.escalationEvents)
            ? record.escalationEvents
            : []) as Report["escalationEvents"],
    };
}

/**
 * Creates a new report document in the database with automatic authority routing.
 * Initializes counters and timestamps.
 */
export async function createReport(report: Report) {
    const id = crypto.randomUUID();

    // Compute automatic authority routing if not already provided
    let routingData = {
        department: report.department || null,
        departmentName: report.departmentName || null,
        assignedAuthority: report.assignedAuthority || null,
        zone: report.zone || null,
        ward: report.ward || null,
        slaDeadline: report.slaDeadline ? new Date(report.slaDeadline) : null,
        priorityLevel: report.priorityLevel || null,
        routingReason: report.routingReason || null,
        escalated: report.escalated ?? false,
    };

    if (!routingData.department) {
        const computed = await computeAuthorityRouting({
            issueType: report.issueType,
            severity: report.severity,
            latitude: report.latitude,
            longitude: report.longitude,
            communityReports: report.communityReports ?? 1,
            affectedCount: report.affectedCount ?? 1,
        });

        routingData = {
            department: computed.department,
            departmentName: computed.departmentName,
            assignedAuthority: computed.assignedAuthority,
            zone: computed.zone,
            ward: computed.ward,
            slaDeadline: computed.slaDeadline,
            priorityLevel: computed.priorityLevel,
            routingReason: computed.routingReason,
            escalated: computed.escalated,
        };
    }

    const created = await prisma.report.create({
        data: {
            id,
            userId: report.userId,
            userEmail: report.userEmail,
            imageUrl: report.imageUrl,
            issueType: report.issueType,
            severity: report.severity,
            description: report.description,
            latitude: report.latitude,
            longitude: report.longitude,
            status: report.status || "reported",
            repairImageUrl: report.repairImageUrl || null,
            verificationConfidence: report.verificationConfidence || null,
            verificationReason: report.verificationReason || null,
            fraudRisk: report.fraudRisk || null,
            communityReports: report.communityReports ?? 1,
            affectedCount: report.affectedCount ?? 1,
            confirmedBy: report.confirmedBy || [],
            supportingReports: report.supportingReports
                ? JSON.parse(JSON.stringify(report.supportingReports))
                : [],
            resolvedAt: report.resolvedAt || null,
            previousRepairImageUrl: report.previousRepairImageUrl || null,
            previousVerificationConfidence: report.previousVerificationConfidence || null,
            previousVerificationReason: report.previousVerificationReason || null,
            previousFraudRisk: report.previousFraudRisk || null,
            verificationAttempts: report.verificationAttempts || null,

            // Automatic Authority Routing fields
            department: routingData.department,
            departmentName: routingData.departmentName,
            assignedAuthority: routingData.assignedAuthority,
            zone: routingData.zone,
            ward: routingData.ward,
            slaDeadline: routingData.slaDeadline,
            priorityLevel: routingData.priorityLevel,
            routingReason: routingData.routingReason,
            escalated: routingData.escalated,

            // Explicit SLA Escalation State
            escalationTier: 0,
            escalationCount: 0,
        },
    });

    return mapPrismaToReport(created);
}

/**
 * Fetches all non-resolved reports of a given issue type.
 * Used for duplicate detection.
 */
export async function getNearbyReports(
    issueType: string
): Promise<(Report & { id: string })[]> {
    const records = await prisma.report.findMany({
        where: {
            issueType,
            status: {
                not: "resolved",
            },
        },
    });
    return records.map(mapPrismaToReport);
}

/**
 * Merges a new report into an existing one.
 * Increments communityReports, affectedCount, adds the user to confirmedBy,
 * appends supporting evidence, and checks for SLA escalation.
 */
export async function mergeDuplicateReport(
    reportId: string,
    userId: string,
    supportingReport: {
        imageUrl: string;
        latitude: number;
        longitude: number;
        description: string;
    }
) {
    await prisma.$transaction(async (tx) => {
        const report = await tx.report.findUnique({
            where: { id: reportId },
            select: {
                confirmedBy: true,
                supportingReports: true,
                affectedCount: true,
                priorityLevel: true,
                slaDeadline: true,
                routingReason: true,
            },
        });
        if (!report) {
            throw new Error("Report not found");
        }

        const confirmedBy = Array.isArray(report.confirmedBy) ? [...report.confirmedBy] : [];
        if (!confirmedBy.includes(userId)) {
            confirmedBy.push(userId);
        }

        const supportingReports = Array.isArray(report.supportingReports)
            ? [...report.supportingReports]
            : [];
        supportingReports.push({
            ...supportingReport,
            reportedAt: new Date().toISOString(),
        });

        const newAffectedCount = (report.affectedCount || 0) + 1;
        const escalation = evaluateEscalation(
            report.priorityLevel,
            report.slaDeadline,
            newAffectedCount
        );

        const updateData: Record<string, unknown> = {
            communityReports: { increment: 1 },
            affectedCount: { increment: 1 },
            confirmedBy,
            supportingReports: JSON.parse(JSON.stringify(supportingReports)),
        };

        if (escalation?.shouldEscalate) {
            updateData.priorityLevel = escalation.priorityLevel;
            updateData.slaDeadline = escalation.slaDeadline;
            updateData.escalated = true;
            updateData.routingReason = `${report.routingReason || ""} | ${escalation.escalationReason}`;
        }

        await tx.report.update({
            where: { id: reportId },
            data: updateData,
        });
    });
    console.log(`[ReportService] Merged report from user ${userId} into ${reportId}`);
}

/**
 * Allows a user to confirm an existing issue (vote).
 * Uses a transaction to prevent double-counting and auto-escalates if threshold met.
 */
export async function confirmIssue(reportId: string, userId: string): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
        const report = await tx.report.findUnique({
            where: { id: reportId },
            select: {
                confirmedBy: true,
                affectedCount: true,
                priorityLevel: true,
                slaDeadline: true,
                routingReason: true,
            },
        });
        if (!report) {
            throw new Error("Report not found");
        }
        const confirmedBy = report.confirmedBy ?? [];
        if (confirmedBy.includes(userId)) {
            return false; // Already confirmed
        }

        const newAffectedCount = (report.affectedCount || 0) + 1;
        const escalation = evaluateEscalation(
            report.priorityLevel,
            report.slaDeadline,
            newAffectedCount
        );

        const updateData: Record<string, unknown> = {
            affectedCount: { increment: 1 },
            confirmedBy: {
                push: userId,
            },
        };

        if (escalation?.shouldEscalate) {
            updateData.priorityLevel = escalation.priorityLevel;
            updateData.slaDeadline = escalation.slaDeadline;
            updateData.escalated = true;
            updateData.routingReason = `${report.routingReason || ""} | ${escalation.escalationReason}`;
        }

        await tx.report.update({
            where: { id: reportId },
            data: updateData,
        });
        return true;
    });
}

/**
 * Re-assigns a report to a different authority/department.
 * Useful for the authority dashboard when an issue is cross-departmental or misrouted.
 */
export async function reassignReportDepartment(
    reportId: string,
    departmentCode: string,
    reassignReason?: string
) {
    const dept = MUNICIPAL_DEPARTMENTS[departmentCode];
    if (!dept) {
        throw new Error(`Invalid department code: ${departmentCode}`);
    }

    const current = await prisma.report.findUnique({
        where: { id: reportId },
        select: { routingReason: true },
    });

    const note = reassignReason
        ? `Manual Reassignment to ${dept.name}: ${reassignReason}`
        : `Manual Reassignment to ${dept.name}`;

    const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
            department: dept.code,
            departmentName: dept.name,
            routingReason: current?.routingReason
                ? `${current.routingReason} | ${note}`
                : note,
        },
    });

    return mapPrismaToReport(updated);
}

/**
 * Updates verification results on a report.
 * Called from verify-repair route.
 */
export async function updateVerificationResult(
    reportId: string,
    data: {
        repairImageUrl: string;
        verificationConfidence: number;
        verificationReason: string;
        fraudRisk: string;
        status: "resolved" | "disputed";
        resolvedAt?: Date | null;
    }
) {
    const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
            repairImageUrl: data.repairImageUrl,
            verificationConfidence: data.verificationConfidence,
            verificationReason: data.verificationReason,
            fraudRisk: data.fraudRisk,
            status: data.status,
            resolvedAt: data.resolvedAt,
        },
    });
    return mapPrismaToReport(updated);
}

/**
 * Fetches all reports in the database sorted by creation date descending.
 * Can optionally filter by department.
 */
export async function getAllReports(department?: string): Promise<(Report & { id: string })[]> {
    const whereClause: Record<string, unknown> = {};
    if (department && department !== "all") {
        whereClause.department = department;
    }

    const records = await prisma.report.findMany({
        where: whereClause,
        include: {
            escalationEvents: {
                orderBy: {
                    triggeredAt: "desc",
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return records.map(mapPrismaToReport);
}

/**
 * Fetches a single report by ID with its escalation audit history.
 */
export async function getReportById(reportId: string): Promise<(Report & { id: string }) | null> {
    const record = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
            escalationEvents: {
                orderBy: {
                    triggeredAt: "desc",
                },
            },
        },
    });
    return record ? mapPrismaToReport(record) : null;
}

/**
 * Marks report status as under review.
 */
export async function markReportUnderReview(reportId: string) {
    const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
            status: "under_review",
        },
    });
    return mapPrismaToReport(updated);
}