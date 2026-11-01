import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { checkAndEscalateOverdueReports } from "../src/lib/services/escalation.service";
import crypto from "crypto";

async function runTestSuite() {
    console.log("==================================================");
    console.log("   AUTOMATED ESCALATION TEST SUITE               ");
    console.log("==================================================\n");

    const testReportIds: string[] = [];

    async function cleanup() {
        if (testReportIds.length > 0) {
            await prisma.escalationEvent.deleteMany({
                where: { reportId: { in: testReportIds } },
            });
            await prisma.report.deleteMany({
                where: { id: { in: testReportIds } },
            });
            console.log(`🧹 Cleaned up ${testReportIds.length} test reports and their events.`);
        }
    }

    try {
        const now = new Date();
        const pastDeadline = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
        const futureDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours in future

        // 1. Future Deadline Test Report
        const futureReport = await prisma.report.create({
            data: {
                id: `test-future-${crypto.randomUUID()}`,
                userId: "test-user-1",
                userEmail: "tester@example.com",
                imageUrl: "https://example.com/test.jpg",
                issueType: "Pothole",
                severity: "Medium",
                description: "Test future deadline",
                latitude: 12.9716,
                longitude: 77.5946,
                status: "reported",
                department: "PWD_ROADS",
                departmentName: "Public Works Department",
                assignedAuthority: "Ward 12 Field Office (PWD Roads)",
                zone: "South Zone",
                ward: "Ward 12",
                priorityLevel: "P3 - Medium",
                slaDeadline: futureDeadline,
                escalationTier: 0,
                escalationCount: 0,
            },
        });
        testReportIds.push(futureReport.id);

        // 2. Overdue Report (Eligible for Tier 0 -> Tier 1)
        const overdueReport = await prisma.report.create({
            data: {
                id: `test-overdue-${crypto.randomUUID()}`,
                userId: "test-user-2",
                userEmail: "tester@example.com",
                imageUrl: "https://example.com/test.jpg",
                issueType: "Garbage Dump",
                severity: "Medium",
                description: "Test overdue deadline",
                latitude: 12.9716,
                longitude: 77.5946,
                status: "reported",
                department: "SWM_SANITATION",
                departmentName: "Solid Waste Management",
                assignedAuthority: "Ward 12 Field Office (Sanitation & Waste)",
                zone: "South Zone",
                ward: "Ward 12",
                priorityLevel: "P3 - Medium",
                slaDeadline: pastDeadline,
                escalationTier: 0,
                escalationCount: 0,
            },
        });
        testReportIds.push(overdueReport.id);

        // 3. Resolved Report (Past deadline, but resolved - MUST NOT ESCALATE)
        const resolvedReport = await prisma.report.create({
            data: {
                id: `test-resolved-${crypto.randomUUID()}`,
                userId: "test-user-3",
                userEmail: "tester@example.com",
                imageUrl: "https://example.com/test.jpg",
                issueType: "Streetlight",
                severity: "Low",
                description: "Test resolved report past deadline",
                latitude: 12.9716,
                longitude: 77.5946,
                status: "resolved",
                department: "ELECTRICITY_BOARD",
                assignedAuthority: "Ward 12 Field Office",
                priorityLevel: "P4 - Low",
                slaDeadline: pastDeadline,
                escalationTier: 0,
                escalationCount: 0,
            },
        });
        testReportIds.push(resolvedReport.id);

        // 4. Disputed Report (Past deadline, disputed - MUST NOT ESCALATE via routine SLA)
        const disputedReport = await prisma.report.create({
            data: {
                id: `test-disputed-${crypto.randomUUID()}`,
                userId: "test-user-4",
                userEmail: "tester@example.com",
                imageUrl: "https://example.com/test.jpg",
                issueType: "Sewage",
                severity: "High",
                description: "Test disputed report past deadline",
                latitude: 12.9716,
                longitude: 77.5946,
                status: "disputed",
                department: "WATER_SEWERAGE",
                assignedAuthority: "Ward 12 Field Office",
                priorityLevel: "P2 - High",
                slaDeadline: pastDeadline,
                escalationTier: 0,
                escalationCount: 0,
            },
        });
        testReportIds.push(disputedReport.id);

        // --- TEST 1: First Sweep Execution ---
        console.log("▶ Test 1: Running Initial Escalation Sweep...");
        const sweep1 = await checkAndEscalateOverdueReports();
        console.log(`  Sweep 1 Result: evaluated=${sweep1.evaluatedCount}, escalated=${sweep1.escalatedCount}`);

        // Verify overdueReport was escalated
        const overdueAfterSweep1 = await prisma.report.findUnique({
            where: { id: overdueReport.id },
            include: { escalationEvents: true },
        });

        if (
            overdueAfterSweep1?.escalationTier === 1 &&
            overdueAfterSweep1.priorityLevel === "P2 - High" &&
            overdueAfterSweep1.escalated === true &&
            overdueAfterSweep1.slaDeadline?.toISOString() === pastDeadline.toISOString() && // Original SLA untouched!
            overdueAfterSweep1.nextSlaDeadline !== null &&
            overdueAfterSweep1.escalationEvents.length === 1 &&
            overdueAfterSweep1.escalationEvents[0].fromTier === 0 &&
            overdueAfterSweep1.escalationEvents[0].toTier === 1
        ) {
            console.log("  ✅ PASS: Overdue report successfully escalated from Tier 0 to Tier 1 with durable audit event!");
            console.log(`     - New Assigned Authority: ${overdueAfterSweep1.assignedAuthority}`);
            console.log(`     - Original slaDeadline preserved: ${overdueAfterSweep1.slaDeadline.toISOString()}`);
            console.log(`     - Supervisory nextSlaDeadline set: ${overdueAfterSweep1.nextSlaDeadline?.toISOString()}`);
            console.log(`     - Audit Event Breach Duration: ${overdueAfterSweep1.escalationEvents[0].breachDuration}`);
        } else {
            throw new Error(`FAIL: Overdue report state unexpected: ${JSON.stringify(overdueAfterSweep1)}`);
        }

        // Verify future report NOT escalated
        const futureAfterSweep1 = await prisma.report.findUnique({ where: { id: futureReport.id } });
        if (futureAfterSweep1?.escalationTier === 0) {
            console.log("  ✅ PASS: Future deadline report was NOT escalated (remains Tier 0).");
        } else {
            throw new Error(`FAIL: Future report was escalated: ${JSON.stringify(futureAfterSweep1)}`);
        }

        // Verify resolved report NOT escalated
        const resolvedAfterSweep1 = await prisma.report.findUnique({ where: { id: resolvedReport.id } });
        if (resolvedAfterSweep1?.escalationTier === 0) {
            console.log("  ✅ PASS: Resolved report was NOT escalated.");
        } else {
            throw new Error("FAIL: Resolved report was escalated.");
        }

        // Verify disputed report NOT escalated
        const disputedAfterSweep1 = await prisma.report.findUnique({ where: { id: disputedReport.id } });
        if (disputedAfterSweep1?.escalationTier === 0) {
            console.log("  ✅ PASS: Disputed report was NOT escalated.");
        } else {
            throw new Error("FAIL: Disputed report was escalated.");
        }

        // --- TEST 2: Repeated Sweep Idempotence ---
        console.log("\n▶ Test 2: Testing Idempotence on Repeated Sweep...");
        const sweep2 = await checkAndEscalateOverdueReports();
        const overdueAfterSweep2 = await prisma.report.findUnique({
            where: { id: overdueReport.id },
            include: { escalationEvents: true },
        });

        if (
            overdueAfterSweep2?.escalationTier === 1 &&
            overdueAfterSweep2.escalationEvents.length === 1
        ) {
            console.log("  ✅ PASS: Repeated sweep did NOT re-escalate (idempotent, remains Tier 1).");
        } else {
            throw new Error(`FAIL: Report re-escalated unexpectedly: Tier ${overdueAfterSweep2?.escalationTier}`);
        }

        // --- TEST 3: Tier 1 -> Tier 2 Escalation when supervisory deadline breaches ---
        console.log("\n▶ Test 3: Simulating Tier 1 Supervisory Deadline Breach...");
        // Set nextSlaDeadline to past
        await prisma.report.update({
            where: { id: overdueReport.id },
            data: { nextSlaDeadline: new Date(now.getTime() - 1 * 60 * 60 * 1000) }, // 1h ago
        });

        const sweep3 = await checkAndEscalateOverdueReports();
        const overdueAfterSweep3 = await prisma.report.findUnique({
            where: { id: overdueReport.id },
            include: { escalationEvents: { orderBy: { triggeredAt: "desc" } } },
        });

        if (
            overdueAfterSweep3?.escalationTier === 2 &&
            overdueAfterSweep3.priorityLevel === "P1 - Critical" &&
            overdueAfterSweep3.nextSlaDeadline === null && // At Tier 2, no infinite extension!
            overdueAfterSweep3.escalationEvents.length === 2 &&
            overdueAfterSweep3.escalationEvents[0].fromTier === 1 &&
            overdueAfterSweep3.escalationEvents[0].toTier === 2
        ) {
            console.log("  ✅ PASS: Tier 1 report escalated to Tier 2 (City Central Grievance Authority)!");
            console.log(`     - Priority upgraded to: ${overdueAfterSweep3.priorityLevel}`);
            console.log(`     - Assigned Authority: ${overdueAfterSweep3.assignedAuthority}`);
            console.log("     - nextSlaDeadline is null (no infinite extensions; permanently visibly overdue at Tier 2).");
            console.log(`     - Audit events count: ${overdueAfterSweep3.escalationEvents.length}`);
        } else {
            throw new Error(`FAIL: Tier 2 escalation mismatch: ${JSON.stringify(overdueAfterSweep3)}`);
        }

        // --- TEST 4: Tier 2 Final Escalation Boundary ---
        console.log("\n▶ Test 4: Testing Tier 2 Final Escalation Boundary...");
        const sweep4 = await checkAndEscalateOverdueReports();
        const overdueAfterSweep4 = await prisma.report.findUnique({
            where: { id: overdueReport.id },
            include: { escalationEvents: true },
        });

        if (
            overdueAfterSweep4?.escalationTier === 2 &&
            overdueAfterSweep4.escalationEvents.length === 2
        ) {
            console.log("  ✅ PASS: Tier 2 report was NOT escalated further (capped at Tier 2 — Final Escalation).");
        } else {
            throw new Error(`FAIL: Tier 2 report changed unexpectedly: ${JSON.stringify(overdueAfterSweep4)}`);
        }

        // --- TEST 5: Concurrency Safety (Simultaneous Sweeps) ---
        console.log("\n▶ Test 5: Testing Concurrency Safety with Parallel Sweeps...");
        const concurrentReport = await prisma.report.create({
            data: {
                id: `test-concurrent-${crypto.randomUUID()}`,
                userId: "test-user-5",
                userEmail: "tester@example.com",
                imageUrl: "https://example.com/test.jpg",
                issueType: "Water Main Burst",
                severity: "High",
                description: "Test concurrency",
                latitude: 12.9716,
                longitude: 77.5946,
                status: "reported",
                department: "WATER_SEWERAGE",
                assignedAuthority: "Ward 12 Field Office",
                priorityLevel: "P2 - High",
                slaDeadline: pastDeadline,
                escalationTier: 0,
                escalationCount: 0,
            },
        });
        testReportIds.push(concurrentReport.id);

        // Run 5 simultaneous sweeps in parallel
        await Promise.all([
            checkAndEscalateOverdueReports(),
            checkAndEscalateOverdueReports(),
            checkAndEscalateOverdueReports(),
            checkAndEscalateOverdueReports(),
            checkAndEscalateOverdueReports(),
        ]);

        const concurrentAfter = await prisma.report.findUnique({
            where: { id: concurrentReport.id },
            include: { escalationEvents: true },
        });

        if (
            concurrentAfter?.escalationTier === 1 &&
            concurrentAfter.escalationEvents.length === 1
        ) {
            console.log("  ✅ PASS: 5 concurrent sweeps resolved cleanly with atomic locking (escalated exactly once to Tier 1)!");
        } else {
            throw new Error(
                `FAIL: Concurrency race detected! escalationTier=${concurrentAfter?.escalationTier}, eventsCount=${concurrentAfter?.escalationEvents.length}`
            );
        }

        console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The escalation engine is rock solid.\n");
    } finally {
        await cleanup();
        await prisma.$disconnect();
    }
}

runTestSuite().catch((err) => {
    console.error("❌ Test suite encountered failure:", err);
    process.exit(1);
});
