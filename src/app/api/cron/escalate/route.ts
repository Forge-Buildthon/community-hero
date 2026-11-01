import { NextRequest, NextResponse } from "next/server";
import { checkAndEscalateOverdueReports } from "@/lib/services/escalation.service";

export const dynamic = "force-dynamic";

/**
 * Validates request authorization using CRON_SECRET.
 * In development, permits access without secret for ease of local testing.
 */
function isAuthorized(req: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;

    // Allow in non-production if no secret is set
    if (!cronSecret && process.env.NODE_ENV !== "production") {
        return true;
    }

    if (!cronSecret) {
        return false;
    }

    const authHeader = req.headers.get("authorization");
    const customHeader = req.headers.get("x-cron-secret");
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get("secret");

    if (authHeader === `Bearer ${cronSecret}`) return true;
    if (customHeader === cronSecret) return true;
    if (querySecret === cronSecret) return true;

    return false;
}

export async function GET(req: NextRequest) {
    return handleEscalationSweep(req);
}

export async function POST(req: NextRequest) {
    return handleEscalationSweep(req);
}

async function handleEscalationSweep(req: NextRequest) {
    if (!isAuthorized(req)) {
        return NextResponse.json(
            {
                success: false,
                error: "Unauthorized. Provide a valid Bearer token or x-cron-secret header matching CRON_SECRET.",
            },
            { status: 401 }
        );
    }

    try {
        const sweepResult = await checkAndEscalateOverdueReports();

        return NextResponse.json({
            success: true,
            message: `Escalation sweep completed. Evaluated ${sweepResult.evaluatedCount} active reports, escalated ${sweepResult.escalatedCount}.`,
            ...sweepResult,
            timestamp: new Date().toISOString(),
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[Cron/Escalate] Fatal error running escalation sweep:", errorMessage);

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error during escalation sweep",
                details: errorMessage,
            },
            { status: 500 }
        );
    }
}
