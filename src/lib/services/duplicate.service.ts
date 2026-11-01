import { getNearbyReports } from "./report.service";
import { calculateDistance } from "../utils/distance";

// Configuration – can be moved to env if needed
const DUPLICATE_DISTANCE_THRESHOLD = 100; // meters

/**
 * Finds a duplicate report based on:
 * - Same issue type
 * - Within 100 meters of the new report
 * - Not already resolved
 * Returns the closest matching report or null.
 */
export async function findDuplicate(
    issueType: string,
    latitude: number,
    longitude: number
) {
    const reports = await getNearbyReports(issueType);
    console.log(`[Duplicate] Checking ${reports.length} candidate reports`);

    let closestReport = null;
    let shortestDistance = Infinity;

    for (const report of reports) {
        const distance = calculateDistance(
            latitude,
            longitude,
            report.latitude,
            report.longitude
        );

        if (distance <= DUPLICATE_DISTANCE_THRESHOLD && distance < shortestDistance) {
            shortestDistance = distance;
            closestReport = report;
        }
    }

    if (closestReport) {
        console.log(`[Duplicate] Found duplicate ${closestReport.id} at ${shortestDistance.toFixed(2)}m`);
    } else {
        console.log("[Duplicate] No duplicate found within threshold");
    }

    return closestReport;
}