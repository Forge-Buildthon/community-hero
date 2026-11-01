export interface Report {
    // User info
    userId: string;
    userEmail: string;

    // Image & issue details
    imageUrl: string;
    issueType: string;
    severity: "Low" | "Medium" | "High" | "Severe"; // ← Added "Severe"
    description: string;

    // Location
    latitude: number;
    longitude: number;

    // Status
    status: "reported" | "under_review" | "resolved" | "disputed";

    // Verification (optional)
    repairImageUrl?: string | null;
    verificationConfidence?: number | null;
    verificationReason?: string;
    fraudRisk?: string;

    // Community engagement
    communityReports: number;
    affectedCount: number;
    confirmedBy: string[];

    // Supporting reports (merged duplicates)
    supportingReports: {
        imageUrl: string;
        latitude: number;
        longitude: number;
        description: string;
        reportedAt?: string | Date;
    }[];

    // Timestamps
    resolvedAt: Date | null;
    createdAt?: string | Date;

    // Re-verification tracking (optional)
    previousRepairImageUrl?: string;
    previousVerificationConfidence?: number | null;
    previousVerificationReason?: string;
    previousFraudRisk?: string;
    verificationAttempts?: number;

    // Automatic Authority Routing & Jurisdiction
    department?: string | null;
    departmentName?: string | null;
    assignedAuthority?: string | null;
    zone?: string | null;
    ward?: string | null;
    slaDeadline?: Date | string | null;
    priorityLevel?: string | null;
    routingReason?: string | null;
    escalated?: boolean | null;

    // Explicit SLA Escalation State
    escalationTier?: number;
    escalatedAt?: Date | string | null;
    lastSlaBreachAt?: Date | string | null;
    nextSlaDeadline?: Date | string | null;
    escalationCount?: number;
    escalationEvents?: EscalationEvent[];
}

export interface EscalationEvent {
    id: string;
    reportId: string;
    fromTier: number;
    toTier: number;
    fromAuthority: string;
    toAuthority: string;
    triggeredAt: Date | string;
    breachedDeadline: Date | string;
    breachDuration: string;
    reason: string;
    previousPriority: string;
    newPriority: string;
    createdAt?: Date | string;
}