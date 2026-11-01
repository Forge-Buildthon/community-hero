import { NextRequest, NextResponse } from "next/server";
import { reassignReportDepartment } from "@/lib/services/report.service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { reportId, department, reason } = body;

        if (!reportId || !department) {
            return NextResponse.json(
                { success: false, error: "Missing reportId or department" },
                { status: 400 }
            );
        }

        const updatedReport = await reassignReportDepartment(
            reportId,
            department,
            reason
        );

        return NextResponse.json({
            success: true,
            report: updatedReport,
            message: `Report reassigned to ${updatedReport.departmentName}`,
        });
    } catch (error: any) {
        console.error("Reassign error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to reassign department" },
            { status: 500 }
        );
    }
}
