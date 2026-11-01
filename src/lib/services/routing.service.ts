/**
 * Automatic Authority Routing Service
 * Identifies the responsible municipal department, jurisdiction/ward, SLA, and priority
 * using issue type, severity, community impact, and geolocation coordinates.
 */

export interface DepartmentInfo {
    code: string;
    name: string;
    shortName: string;
    icon: string;
    email: string;
    phone: string;
    description: string;
}

export const MUNICIPAL_DEPARTMENTS: Record<string, DepartmentInfo> = {
    PWD_ROADS: {
        code: "PWD_ROADS",
        name: "Public Works Department (Roads & Bridges)",
        shortName: "PWD Roads",
        icon: "🛣️",
        email: "roads-pwd@municipal.gov.in",
        phone: "1800-11-7931",
        description: "Responsible for asphalt repair, potholes, road cave-ins, and road resurfacing.",
    },
    SWM_SANITATION: {
        code: "SWM_SANITATION",
        name: "Solid Waste Management & Sanitation Dept",
        shortName: "Sanitation & Waste",
        icon: "🗑️",
        email: "sanitation@municipal.gov.in",
        phone: "1800-11-7932",
        description: "Responsible for garbage dumps, overflow bins, toxic waste, and street sweeping.",
    },
    ELECTRICITY_BOARD: {
        code: "ELECTRICITY_BOARD",
        name: "Municipal Lighting & Electricity Division",
        shortName: "Electrical / Power",
        icon: "💡",
        email: "lighting@municipal.gov.in",
        phone: "1800-11-7933",
        description: "Responsible for streetlights, broken poles, dangling wires, and dark intersections.",
    },
    STORMWATER_DRAINAGE: {
        code: "STORMWATER_DRAINAGE",
        name: "Stormwater Drainage & Flood Control Board",
        shortName: "Stormwater Drainage",
        icon: "🌊",
        email: "drainage@municipal.gov.in",
        phone: "1800-11-7934",
        description: "Responsible for water logging, choked drains, culvert clearance, and flood pumps.",
    },
    WATER_SEWERAGE: {
        code: "WATER_SEWERAGE",
        name: "Water Supply & Sewerage Board",
        shortName: "Water & Sewerage",
        icon: "🚰",
        email: "sewerage@municipal.gov.in",
        phone: "1800-11-7935",
        description: "Responsible for burst water mains, overflowing sewage, manhole repairs, and wastewater.",
    },
    EMERGENCY_RESPONSE: {
        code: "EMERGENCY_RESPONSE",
        name: "City Rapid Emergency Response Task Force",
        shortName: "Rapid Emergency",
        icon: "🚨",
        email: "emergency-taskforce@municipal.gov.in",
        phone: "112 / 108",
        description: "Dispatched on severe life-safety civic threats requiring sub-24h intervention.",
    },
    MUNICIPAL_GEN: {
        code: "MUNICIPAL_GEN",
        name: "General Municipal Administration",
        shortName: "General Municipal",
        icon: "🏛️",
        email: "grievances@municipal.gov.in",
        phone: "1800-11-7930",
        description: "General civic oversight and uncategorized municipal issues.",
    },
};

export interface JurisdictionResult {
    city: string;
    zone: string;
    ward: string;
    assignedAuthority: string;
    formattedAddress?: string;
}

export interface RoutingResult {
    department: string;
    departmentName: string;
    assignedAuthority: string;
    zone: string;
    ward: string;
    slaDeadline: Date;
    priorityLevel: "P1 - Critical" | "P2 - High" | "P3 - Medium" | "P4 - Low";
    routingReason: string;
    escalated: boolean;
}

/**
 * Resolves geolocation coordinates (latitude, longitude) into municipal zone, ward, and authority jurisdiction.
 * Uses OpenStreetMap reverse geocoding with a fail-safe fallback so routing never blocks.
 */
export async function resolveJurisdiction(
    latitude: number,
    longitude: number
): Promise<JurisdictionResult> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`;
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "CommunityHero-CivicRouting/1.0 (civic-triage-platform)",
            },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};

            const cityName =
                addr.city ||
                addr.town ||
                addr.municipality ||
                addr.county ||
                addr.state_district ||
                "Metropolitan Region";

            const neighborhood =
                addr.suburb ||
                addr.neighbourhood ||
                addr.residential ||
                addr.quarter ||
                addr.city_district ||
                "Central";

            const postcode = addr.postcode ? ` - ${addr.postcode}` : "";
            const wardNum = addr.postcode
                ? `Ward ${addr.postcode.slice(-2)}`
                : `Ward ${Math.abs(Math.round((latitude + longitude) * 100) % 50) + 1}`;

            const zone = `${neighborhood} Zone`;
            const assignedAuthority = `${cityName} Municipal Corporation (${neighborhood} Division)`;

            return {
                city: cityName,
                zone,
                ward: `${wardNum}${postcode}`,
                assignedAuthority,
                formattedAddress: data.display_name,
            };
        }
    } catch {
        // Fallback gracefully on timeout or network error
    }

    // Deterministic fallback based on coordinate sectors
    const latPrefix = latitude >= 0 ? "N" : "S";
    const lonPrefix = longitude >= 0 ? "E" : "W";
    const sectorCode = `${latPrefix}${Math.floor(Math.abs(latitude))}-${lonPrefix}${Math.floor(Math.abs(longitude))}`;
    const wardCalc = `Ward ${(Math.abs(Math.round((latitude + longitude) * 100)) % 60) + 1}`;

    return {
        city: "Municipal Jurisdiction",
        zone: `District Sector ${sectorCode}`,
        ward: wardCalc,
        assignedAuthority: `City Municipal Authority (Sector ${sectorCode})`,
    };
}

/**
 * Determines target department code based on issue type.
 */
export function mapIssueTypeToDepartment(issueType: string): DepartmentInfo {
    const normalized = (issueType || "").trim().toLowerCase();

    if (normalized.includes("pothole") || normalized.includes("road")) {
        return MUNICIPAL_DEPARTMENTS.PWD_ROADS;
    }
    if (normalized.includes("garbage") || normalized.includes("waste") || normalized.includes("trash")) {
        return MUNICIPAL_DEPARTMENTS.SWM_SANITATION;
    }
    if (normalized.includes("streetlight") || normalized.includes("light") || normalized.includes("electric")) {
        return MUNICIPAL_DEPARTMENTS.ELECTRICITY_BOARD;
    }
    if (normalized.includes("water log") || normalized.includes("drain") || normalized.includes("flood")) {
        return MUNICIPAL_DEPARTMENTS.STORMWATER_DRAINAGE;
    }
    if (normalized.includes("sewage") || normalized.includes("sewer") || normalized.includes("manhole")) {
        return MUNICIPAL_DEPARTMENTS.WATER_SEWERAGE;
    }

    return MUNICIPAL_DEPARTMENTS.MUNICIPAL_GEN;
}

/**
 * Automatically computes authority routing, SLA deadline, and priority
 * using issue type, severity, and coordinates.
 */
export async function computeAuthorityRouting(params: {
    issueType: string;
    severity: "Low" | "Medium" | "High" | "Severe" | string;
    latitude: number;
    longitude: number;
    communityReports?: number;
    affectedCount?: number;
}): Promise<RoutingResult> {
    const { issueType, severity, latitude, longitude, affectedCount = 1 } = params;

    const jurisdiction = await resolveJurisdiction(latitude, longitude);
    const departmentInfo = mapIssueTypeToDepartment(issueType);

    const normalizedSeverity = (severity || "Medium").toLowerCase();
    const now = new Date();

    let priorityLevel: RoutingResult["priorityLevel"];
    let slaHours: number;
    let escalated = false;
    let routingReason: string;

    if (normalizedSeverity === "severe" || affectedCount >= 10) {
        priorityLevel = "P1 - Critical";
        slaHours = 24; // 24-hour emergency SLA
        escalated = true;
        routingReason = `🚨 High-Urgency Dispatch: Severe ${issueType} detected in ${jurisdiction.ward}, ${jurisdiction.zone}. Auto-assigned to ${departmentInfo.name} with Emergency Escalation (24h SLA).`;
    } else if (normalizedSeverity === "high" || affectedCount >= 5) {
        priorityLevel = "P2 - High";
        slaHours = 48; // 48-hour SLA
        escalated = affectedCount >= 5;
        routingReason = `⚠️ High Priority: ${issueType} in ${jurisdiction.zone}. Auto-routed to ${departmentInfo.name} (48h resolution SLA).`;
    } else if (normalizedSeverity === "medium") {
        priorityLevel = "P3 - Medium";
        slaHours = 120; // 5 days SLA
        escalated = false;
        routingReason = `📋 Scheduled Maintenance: ${issueType} routed to ${departmentInfo.name} for ${jurisdiction.zone} (5-day standard SLA).`;
    } else {
        priorityLevel = "P4 - Low";
        slaHours = 336; // 14 days SLA
        escalated = false;
        routingReason = `🟢 Routine Inspection: Minor ${issueType} registered under ${departmentInfo.name} (14-day regular SLA).`;
    }

    const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    return {
        department: departmentInfo.code,
        departmentName: departmentInfo.name,
        assignedAuthority: jurisdiction.assignedAuthority,
        zone: jurisdiction.zone,
        ward: jurisdiction.ward,
        slaDeadline,
        priorityLevel,
        routingReason,
        escalated,
    };
}

/**
 * Evaluates whether an existing report should be escalated when merged with duplicates
 * or receiving community confirmations.
 */
export function evaluateEscalation(
    currentPriority: string | null | undefined,
    currentSlaDeadline: Date | null | undefined,
    newAffectedCount: number
): {
    shouldEscalate: boolean;
    priorityLevel: "P1 - Critical" | "P2 - High" | "P3 - Medium" | "P4 - Low";
    slaDeadline: Date;
    escalationReason: string;
} | null {
    if (newAffectedCount >= 5 && currentPriority !== "P1 - Critical") {
        const now = new Date();
        const escalatedDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from escalation
        return {
            shouldEscalate: true,
            priorityLevel: "P1 - Critical",
            slaDeadline: escalatedDeadline,
            escalationReason: `Auto-escalated to P1 - Critical due to community validation surge (${newAffectedCount} citizens confirmed affected).`,
        };
    }
    return null;
}

export type EscalationTier = 0 | 1 | 2;

export interface TierInfo {
    tier: EscalationTier;
    role: string;
    designation: string;
}

/**
 * Resolves the generic municipal supervisory designation based on department, zone, ward, and tier.
 * Tier 0: Field / Ward Authority
 * Tier 1: Zonal Supervisory Authority
 * Tier 2: City-Level Grievance Authority (Final Escalation)
 */
export function getAuthorityForTier(
    departmentCode: string | null | undefined,
    zone: string | null | undefined,
    ward: string | null | undefined,
    tier: number
): TierInfo {
    const dept = (departmentCode && MUNICIPAL_DEPARTMENTS[departmentCode])
        ? MUNICIPAL_DEPARTMENTS[departmentCode]
        : MUNICIPAL_DEPARTMENTS.MUNICIPAL_GEN;

    const safeZone = zone || "Central Zone";
    const safeWard = ward || "Ward Division";

    switch (tier) {
        case 1:
            return {
                tier: 1,
                role: "Tier 1 — Zonal Supervisory Authority",
                designation: `${safeZone} Supervisory Division (${dept.shortName})`,
            };
        case 2:
            return {
                tier: 2,
                role: "Tier 2 — City-Level Grievance Authority (Final Escalation)",
                designation: `City Central Grievance Authority (${dept.shortName})`,
            };
        case 0:
        default:
            return {
                tier: 0,
                role: "Tier 0 — Field / Ward Authority",
                designation: `${safeWard} Field Office (${dept.shortName})`,
            };
    }
}

/**
 * Upgrades priority by 1 level due to SLA breach, capped at P1 - Critical.
 * Preserves the original AI severity.
 */
export function getEscalatedPriority(currentPriority: string | null | undefined): string {
    switch (currentPriority) {
        case "P4 - Low":
            return "P3 - Medium";
        case "P3 - Medium":
            return "P2 - High";
        case "P2 - High":
        case "P1 - Critical":
        default:
            return "P1 - Critical";
    }
}

