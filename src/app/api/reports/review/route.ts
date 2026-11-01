import { NextRequest, NextResponse } from "next/server";
import { markReportUnderReview } from "@/lib/services/report.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { reportId } = await req.json();

        if (!reportId) {
            return NextResponse.json(
                { success: false, error: "Missing reportId" },
                { status: 400 }
            );
        }

        const report = await markReportUnderReview(reportId);
        return NextResponse.json({
            success: true,
            report,
        });
    } catch (error) {
        console.error("POST /api/reports/review error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to mark report under review",
            },
            { status: 500 }
        );
    }
}
