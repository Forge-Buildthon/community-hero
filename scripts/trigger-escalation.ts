import "dotenv/config";
import { checkAndEscalateOverdueReports } from "../src/lib/services/escalation.service";
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("==================================================");
    console.log("   COMMUNITY HERO — AUTONOMOUS ESCALATION SWEEP   ");
    console.log(`   Execution Time: ${new Date().toISOString()}   `);
    console.log("==================================================\n");

    try {
        const sweepResult = await checkAndEscalateOverdueReports();

        console.log(`[Sweep Summary]`);
        console.log(`- Evaluated Active Reports: ${sweepResult.evaluatedCount}`);
        console.log(`- Newly Escalated Reports:  ${sweepResult.escalatedCount}`);
        console.log(`- Skipped (Not Overdue):    ${sweepResult.skippedCount}`);

        if (sweepResult.escalatedReportIds.length > 0) {
            console.log("\n[Escalated Report IDs]:");
            sweepResult.escalatedReportIds.forEach((id, idx) => {
                console.log(`  ${idx + 1}. ${id}`);
            });
        }

        if (sweepResult.errors.length > 0) {
            console.warn("\n[Errors Encountered]:", sweepResult.errors);
        }

        console.log("\n✅ Escalation sweep completed successfully.");
    } catch (error) {
        console.error("❌ Fatal error executing escalation sweep:", error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();
