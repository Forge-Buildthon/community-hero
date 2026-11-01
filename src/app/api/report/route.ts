import { NextRequest, NextResponse } from "next/server";

import { createReport, mergeDuplicateReport } from "@/lib/services/report.service";
import { findDuplicate } from "@/lib/services/duplicate.service";

export async function POST(req: NextRequest) {
    try {
        const report = await req.json();

        console.log(
            "API received:",
            report.latitude,
            report.longitude
        );

        const duplicate = await findDuplicate(
            report.issueType,
            report.latitude,
            report.longitude
        );

        console.log("Duplicate result:", duplicate);

        if (duplicate) {
            await mergeDuplicateReport(
                duplicate.id,
                report.userId,
                {
                    imageUrl: report.imageUrl,
                    latitude: report.latitude,
                    longitude: report.longitude,
                    description: report.description,
                }
            );

            return NextResponse.json({
                success: true,
                duplicate: true,
                message: "Merged with existing report",
            });
        }

        const createdReport = await createReport({
            ...report,
            communityReports: 1,
            supportingReports: [],
        });

        return NextResponse.json({
            success: true,
            duplicate: false,
            message: "New report created and automatically routed",
            report: createdReport,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to submit report",
            },
            { status: 500 }
        );
    }
}