import { NextRequest, NextResponse } from "next/server";
import { confirmIssue } from "@/lib/services/report.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { reportId, userId } = await req.json();

        if (!reportId || !userId) {
            return NextResponse.json(
                { success: false, error: "Missing reportId or userId" },
                { status: 400 }
            );
        }

        const success = await confirmIssue(reportId, userId);
        return NextResponse.json({
            success: true,
            confirmed: success,
        });
    } catch (error) {
        console.error("POST /api/reports/confirm error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to confirm issue",
            },
            { status: 500 }
        );
    }
}
