import { NextRequest, NextResponse } from "next/server";
import { getAllReports } from "@/lib/services/report.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const department = searchParams.get("department") || undefined;
        const reports = await getAllReports(department);
        return NextResponse.json({
            success: true,
            reports,
        });
    } catch (error) {
        console.error("GET /api/reports error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch reports",
            },
            { status: 500 }
        );
    }
}
