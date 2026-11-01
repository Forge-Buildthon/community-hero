"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_PRESET,
} from "@/lib/cloudinary";
import dynamic from "next/dynamic";
import Link from "next/link";

const IssueMap = dynamic(() => import("@/components/IssueMap"), {
    ssr: false,
});

type Report = {
    id: string;
    userId: string;
    imageUrl: string;
    issueType: string;
    severity: string;
    description: string;
    latitude: number;
    longitude: number;
    status: "reported" | "under_review" | "resolved" | "disputed";
    affectedCount: number;
    communityReports: number;
    confirmedBy: string[];
    verificationConfidence?: number | null;
    verificationReason?: string;
    fraudRisk?: string;
    repairImageUrl?: string;
    resolvedAt?: any;
    createdAt?: any;

    // Automatic Authority Routing fields
    department?: string | null;
    departmentName?: string | null;
    assignedAuthority?: string | null;
    zone?: string | null;
    ward?: string | null;
    slaDeadline?: any;
    priorityLevel?: string | null;
    routingReason?: string | null;
    escalated?: boolean | null;

    // Explicit SLA Escalation State
    escalationTier?: number;
    escalatedAt?: any;
    lastSlaBreachAt?: any;
    nextSlaDeadline?: any;
    escalationCount?: number;
    escalationEvents?: Array<{
        id: string;
        fromTier: number;
        toTier: number;
        fromAuthority: string;
        toAuthority: string;
        triggeredAt: any;
        breachedDeadline: any;
        breachDuration: string;
        reason: string;
        previousPriority: string;
        newPriority: string;
    }>;
};

const DEPARTMENTS = [
    { code: "all", name: "All Departments", icon: "🏢" },
    { code: "PWD_ROADS", name: "PWD Roads & Bridges", icon: "🛣️" },
    { code: "SWM_SANITATION", name: "Solid Waste & Sanitation", icon: "🗑️" },
    { code: "ELECTRICITY_BOARD", name: "Electrical & Lighting", icon: "💡" },
    { code: "STORMWATER_DRAINAGE", name: "Stormwater Drainage", icon: "🌊" },
    { code: "WATER_SEWERAGE", name: "Water & Sewerage", icon: "🚰" },
    { code: "EMERGENCY_RESPONSE", name: "Rapid Emergency", icon: "🚨" },
];

export default function AuthorityDashboard() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<
        "all" | "reported" | "under_review" | "resolved"
    >("all");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [zoneFilter, setZoneFilter] = useState<string>("all");
    const [slaFilter, setSlaFilter] = useState<"all" | "overdue" | "critical" | "ontrack">("all");
    const [sortBy, setSortBy] = useState<"newest" | "severity" | "sla" | "community" | "affected">("newest");
    const [center, setCenter] = useState<[number, number]>([30.901, 75.857]);
    const repairInputRef = useRef<HTMLInputElement>(null);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

    // Escalation sweep state
    const [runningSweep, setRunningSweep] = useState(false);
    const [sweepMessage, setSweepMessage] = useState<{ text: string; isError: boolean } | null>(null);

    // Reassignment state
    const [reassigningId, setReassigningId] = useState<string | null>(null);
    const [targetDept, setTargetDept] = useState<string>("PWD_ROADS");
    const [reassignReason, setReassignReason] = useState<string>("");
    const [reassignLoading, setReassignLoading] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Helper functions
    function formatStatus(status: string): string {
        return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    function getSeverityBadge(severity: string): string {
        switch (severity) {
            case "Severe": return "bg-red-500/20 text-red-400 border-red-500/30";
            case "High": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "Low": return "bg-green-500/20 text-green-400 border-green-500/30";
            default: return "bg-slate-700 text-slate-300 border-slate-600";
        }
    }

    function getStatusBadgeColor(status: string): string {
        switch (status) {
            case "reported": return "bg-amber-500/30 text-amber-300";
            case "under_review": return "bg-blue-500/30 text-blue-300";
            case "resolved": return "bg-green-500/30 text-green-300";
            case "disputed": return "bg-red-500/30 text-red-300";
            default: return "bg-slate-800 text-slate-300";
        }
    }

    function getFraudRiskColor(risk: string): string {
        switch (risk?.toLowerCase()) {
            case "high": return "text-red-400";
            case "medium": return "text-yellow-400";
            case "low": return "text-green-400";
            default: return "text-slate-400";
        }
    }

    function getDepartmentBadge(deptCode?: string | null) {
        switch (deptCode) {
            case "PWD_ROADS":
                return { label: "PWD Roads", icon: "🛣️", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
            case "SWM_SANITATION":
                return { label: "Sanitation & Waste", icon: "🗑️", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
            case "ELECTRICITY_BOARD":
                return { label: "Electrical / Power", icon: "💡", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
            case "STORMWATER_DRAINAGE":
                return { label: "Stormwater Drainage", icon: "🌊", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" };
            case "WATER_SEWERAGE":
                return { label: "Water & Sewerage", icon: "🚰", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" };
            case "EMERGENCY_RESPONSE":
                return { label: "Rapid Emergency", icon: "🚨", color: "bg-red-500/20 text-red-300 border-red-500/40" };
            default:
                return { label: "General Municipal", icon: "🏛️", color: "bg-slate-700 text-slate-300 border-slate-600" };
        }
    }

    function getSlaInfo(
        slaDeadline: any,
        status: string,
        escalationTier: number = 0,
        nextSlaDeadline?: any
    ) {
        if (status === "resolved") {
            return {
                text: "SLA Closed",
                badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                isOverdue: false,
                tierLabel: "Resolved",
            };
        }

        // Tier 2 is final escalation: perpetually overdue without endless deadline extensions
        if (escalationTier >= 2) {
            return {
                text: "🚨 Tier 2 Final Escalation (Overdue)",
                badge: "bg-red-600/30 text-red-300 border-red-500 font-bold animate-pulse",
                isOverdue: true,
                tierLabel: "Tier 2 — City Grievance Cell",
            };
        }

        // Tier 1 uses supervisory nextSlaDeadline
        const targetDeadline =
            escalationTier === 1 && nextSlaDeadline ? nextSlaDeadline : slaDeadline;

        if (!targetDeadline) {
            return {
                text: "SLA: Pending",
                badge: "bg-slate-800 text-slate-400 border-slate-700",
                isOverdue: false,
                tierLabel: "Tier 0 — Field",
            };
        }

        const now = new Date().getTime();
        const deadline = new Date(targetDeadline).getTime();
        const diffHours = (deadline - now) / (1000 * 3600);
        const prefix = escalationTier === 1 ? "[Tier 1 Sup.] " : "";

        if (diffHours < 0) {
            const overdueHours = Math.abs(Math.round(diffHours));
            return {
                text: `${prefix}Overdue by ${
                    overdueHours >= 24 ? Math.round(overdueHours / 24) + "d" : overdueHours + "h"
                }`,
                badge: "bg-red-500/25 text-red-400 border-red-500/40 animate-pulse font-bold",
                isOverdue: true,
                tierLabel: escalationTier === 1 ? "Tier 1 — Zonal Supervisory" : "Tier 0 — Field",
            };
        } else if (diffHours <= 12) {
            return {
                text: `${prefix}${Math.round(diffHours)}h remaining`,
                badge: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold",
                isOverdue: false,
                tierLabel: escalationTier === 1 ? "Tier 1 — Zonal Supervisory" : "Tier 0 — Field",
            };
        } else if (diffHours <= 48) {
            return {
                text: `${prefix}${Math.round(diffHours)}h remaining`,
                badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                isOverdue: false,
                tierLabel: escalationTier === 1 ? "Tier 1 — Zonal Supervisory" : "Tier 0 — Field",
            };
        } else {
            return {
                text: `${prefix}${Math.round(diffHours / 24)}d remaining`,
                badge: "bg-slate-800 text-slate-300 border-slate-700",
                isOverdue: false,
                tierLabel: escalationTier === 1 ? "Tier 1 — Zonal Supervisory" : "Tier 0 — Field",
            };
        }
    }

    async function fetchReports() {
        try {
            const res = await fetch("/api/reports");
            const data = await res.json();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleRunEscalationSweep() {
        setRunningSweep(true);
        setSweepMessage(null);
        try {
            const res = await fetch("/api/cron/escalate", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setSweepMessage({
                    text: `✅ Autonomous Escalation Sweep: Evaluated ${data.evaluatedCount} active reports, escalated ${data.escalatedCount}.`,
                    isError: false,
                });
                await fetchReports();
            } else {
                setSweepMessage({
                    text: `⚠️ Escalation sweep failed: ${data.error || "Unknown error"}`,
                    isError: true,
                });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setSweepMessage({
                text: `❌ Error running escalation sweep: ${msg}`,
                isError: true,
            });
        } finally {
            setRunningSweep(false);
        }
    }

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCenter([position.coords.latitude, position.coords.longitude]);
            },
            () => { }
        );

        fetchReports();
        const intervalId = setInterval(fetchReports, 5000);
        return () => clearInterval(intervalId);
    }, []);

    // Unique Zones
    const availableZones = useMemo(() => {
        const zones = new Set<string>();
        reports.forEach((r) => {
            if (r.zone) zones.add(r.zone);
        });
        return Array.from(zones);
    }, [reports]);

    // Dynamic stats
    const totalReports = reports.length;
    const reportedCount = reports.filter((r) => r.status === "reported").length;
    const underReviewCount = reports.filter((r) => r.status === "under_review").length;
    const resolvedCount = reports.filter((r) => r.status === "resolved").length;
    const disputedCount = reports.filter((r) => r.status === "disputed").length;

    const severeCount = reports.filter((r) => r.severity === "Severe").length;
    const escalatedCount = reports.filter(
        (r) => r.escalated || r.priorityLevel === "P1 - Critical" || (r.escalationTier ?? 0) > 0
    ).length;

    const overdueCount = reports.filter((r) => {
        if (r.status === "resolved") return false;
        if ((r.escalationTier ?? 0) >= 2) return true;
        const target = r.escalationTier === 1 && r.nextSlaDeadline ? r.nextSlaDeadline : r.slaDeadline;
        if (!target) return false;
        return new Date(target).getTime() < Date.now();
    }).length;

    const totalAffected = reports.reduce((sum, r) => sum + (r.affectedCount || 0), 0);
    const activeCases = reportedCount + underReviewCount;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;

    // Filtered Reports
    const filteredReports = useMemo(() => {
        let data = [...reports];

        if (statusFilter !== "all") {
            data = data.filter((r) => r.status === statusFilter);
        }

        if (departmentFilter !== "all") {
            data = data.filter((r) => r.department === departmentFilter);
        }

        if (zoneFilter !== "all") {
            data = data.filter((r) => r.zone === zoneFilter);
        }

        if (slaFilter === "overdue") {
            data = data.filter((r) => {
                if (r.status === "resolved") return false;
                if ((r.escalationTier ?? 0) >= 2) return true;
                const target = r.escalationTier === 1 && r.nextSlaDeadline ? r.nextSlaDeadline : r.slaDeadline;
                return target && new Date(target).getTime() < Date.now();
            });
        } else if (slaFilter === "critical") {
            data = data.filter(
                (r) => r.priorityLevel === "P1 - Critical" || r.escalated || (r.escalationTier ?? 0) > 0
            );
        } else if (slaFilter === "ontrack") {
            data = data.filter((r) => {
                if (r.status === "resolved") return false;
                if ((r.escalationTier ?? 0) >= 2) return false;
                const target = r.escalationTier === 1 && r.nextSlaDeadline ? r.nextSlaDeadline : r.slaDeadline;
                return target && new Date(target).getTime() >= Date.now();
            });
        }

        if (sortBy === "severity") {
            const order: Record<string, number> = { Severe: 4, High: 3, Medium: 2, Low: 1 };
            data.sort((a, b) => (order[b.severity] ?? 0) - (order[a.severity] ?? 0));
        } else if (sortBy === "sla") {
            data.sort((a, b) => {
                const timeA = a.slaDeadline ? new Date(a.slaDeadline).getTime() : Infinity;
                const timeB = b.slaDeadline ? new Date(b.slaDeadline).getTime() : Infinity;
                return timeA - timeB;
            });
        } else if (sortBy === "community") {
            data.sort((a, b) => (b.communityReports ?? 1) - (a.communityReports ?? 1));
        } else if (sortBy === "affected") {
            data.sort((a, b) => (b.affectedCount || 0) - (a.affectedCount || 0));
        } else {
            data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }

        return data;
    }, [reports, statusFilter, departmentFilter, zoneFilter, slaFilter, sortBy]);

    // Pagination
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const paginatedReports = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredReports.slice(start, start + itemsPerPage);
    }, [filteredReports, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, departmentFilter, zoneFilter, slaFilter, sortBy]);

    function handleReview(reportId: string) {
        setExpandedReportId((prev) => (prev === reportId ? null : reportId));
    }

    async function handleMarkUnderReview(reportId: string) {
        try {
            const res = await fetch("/api/reports/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reportId }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchReports();
            } else {
                alert("Failed to mark report under review");
            }
        } catch (error) {
            console.error("Failed to update report:", error);
        }
    }

    async function handleReassignSubmit(reportId: string) {
        setReassignLoading(true);
        try {
            const res = await fetch("/api/reports/reassign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportId,
                    department: targetDept,
                    reason: reassignReason || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message || "Department reassigned successfully!");
                setReassigningId(null);
                setReassignReason("");
                await fetchReports();
            } else {
                alert(data.error || "Failed to reassign department");
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting reassignment");
        } finally {
            setReassignLoading(false);
        }
    }

    function handleUploadRepair(reportId: string) {
        setSelectedReportId(reportId);
        repairInputRef.current?.click();
    }

    async function handleRepairImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !selectedReportId) return;

        try {
            const report = reports.find((r) => r.id === selectedReportId);
            if (!report) return;

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

            const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: formData }
            );
            const uploadData = await uploadResponse.json();

            let verifyData = null;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    const verifyResponse = await fetch("/api/verify-repair", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            reportId: selectedReportId,
                            originalImageUrl: report.imageUrl,
                            repairImageUrl: uploadData.secure_url,
                        }),
                    });
                    verifyData = await verifyResponse.json();
                    if (verifyData.success) break;

                    attempts++;
                    if (attempts < maxAttempts) {
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                    }
                } catch (retryError) {
                    attempts++;
                    if (attempts >= maxAttempts) throw retryError;
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }

            if (!verifyData?.success) {
                alert("AI verification failed. Please try again.");
                return;
            }

            const analysis = verifyData.analysis;
            await fetchReports();

            alert(
                analysis.resolved
                    ? "✅ Issue verified and marked as Resolved."
                    : "⚠ Repair disputed by AI."
            );
        } catch (error) {
            console.error(error);
            alert("Error processing repair. Please try again.");
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            {/* ===== HEADER ===== */}
            <section className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                                Smart City Operations
                            </span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Auto-Routing Active
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 leading-tight">
                            Municipal Authority Control Center
                        </h1>
                        <p className="text-slate-300 mt-4 max-w-2xl leading-relaxed">
                            Civic reports are automatically classified, prioritized, and assigned to responsible municipal departments based on issue type, severity, and GPS jurisdiction.
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap items-center">
                        <button
                            onClick={handleRunEscalationSweep}
                            disabled={runningSweep}
                            className="px-5 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold hover:bg-amber-500/30 transition hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
                            title="Run an on-demand audit sweep to escalate overdue SLA reports to the next supervisory tier"
                        >
                            <span>⚡</span>
                            <span>{runningSweep ? "Evaluating SLAs..." : "Run SLA Sweep"}</span>
                        </button>
                        <Link
                            href="/dashboard"
                            className="px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition hover:scale-105 active:scale-95 text-slate-300 hover:text-white"
                        >
                            Citizen Portal
                        </Link>
                        <Link
                            href="/report"
                            className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/25"
                        >
                            + Test Report
                        </Link>
                    </div>
                </div>

                {sweepMessage && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-4">
                        <div
                            className={`p-4 rounded-2xl border text-sm flex items-center justify-between ${
                                sweepMessage.isError
                                    ? "bg-red-950/60 border-red-500/40 text-red-200"
                                    : "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                            }`}
                        >
                            <span className="font-medium">{sweepMessage.text}</span>
                            <button
                                onClick={() => setSweepMessage(null)}
                                className="text-xs opacity-75 hover:opacity-100 ml-4 font-bold"
                            >
                                ✕ Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* ===== DEPARTMENT TABS ===== */}
            <section className="border-b border-slate-800/80 bg-slate-900/40 sticky top-0 z-20 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-2 min-w-max">
                        {DEPARTMENTS.map((dept) => {
                            const count =
                                dept.code === "all"
                                    ? reports.length
                                    : reports.filter((r) => r.department === dept.code).length;
                            const isActive = departmentFilter === dept.code;
                            return (
                                <button
                                    key={dept.code}
                                    onClick={() => setDepartmentFilter(dept.code)}
                                    className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                                        isActive
                                            ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-bold scale-[1.02]"
                                            : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white"
                                    }`}
                                >
                                    <span>{dept.icon}</span>
                                    <span>{dept.name}</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs ${
                                            isActive
                                                ? "bg-slate-950/20 text-slate-950 font-bold"
                                                : "bg-slate-700/60 text-slate-300"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== OPERATIONAL STATS ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-5 shadow-xl hover:scale-105 transition-all">
                        <p className="text-slate-400 text-sm font-medium">Total Routed</p>
                        <h2 className="text-3xl font-bold text-white mt-2">{totalReports}</h2>
                        <p className="text-xs text-slate-400 mt-1">across all departments</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/30 rounded-2xl border border-amber-500/30 p-5 shadow-xl hover:scale-105 transition-all">
                        <p className="text-amber-300 text-sm font-medium">Active Queue</p>
                        <h2 className="text-3xl font-bold text-white mt-2">{activeCases}</h2>
                        <p className="text-xs text-amber-300/70 mt-1">pending resolution</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-2xl border border-red-500/30 p-5 shadow-xl hover:scale-105 transition-all">
                        <p className="text-red-300 text-sm font-medium">🚨 P1 Critical / Escalated</p>
                        <h2 className="text-3xl font-bold text-white mt-2">{escalatedCount}</h2>
                        <p className="text-xs text-red-300/70 mt-1">{severeCount} severe issues</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-900/30 to-rose-950/30 rounded-2xl border border-rose-500/30 p-5 shadow-xl hover:scale-105 transition-all">
                        <p className="text-rose-300 text-sm font-medium">Overdue SLAs</p>
                        <h2 className="text-3xl font-bold text-white mt-2">{overdueCount}</h2>
                        <p className="text-xs text-rose-300/70 mt-1">breached resolution time</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 rounded-2xl border border-green-500/30 p-5 shadow-xl hover:scale-105 transition-all">
                        <p className="text-green-300 text-sm font-medium">Resolved Cases</p>
                        <h2 className="text-3xl font-bold text-white mt-2">{resolvedCount}</h2>
                        <p className="text-xs text-green-300/70 mt-1">{resolutionRate}% resolution rate</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/30 rounded-2xl border border-cyan-500/30 p-5 shadow-xl hover:scale-105 transition-all">
                        <p className="text-cyan-300 text-sm font-medium">Citizen Impact</p>
                        <h2 className="text-3xl font-bold text-white mt-2">{totalAffected}</h2>
                        <p className="text-xs text-cyan-400/70 mt-1">citizens supported</p>
                    </div>
                </div>
            </section>

            {/* ===== FILTERS & ROUTING OVERVIEW ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Authority Routing Matrix</h2>
                            <p className="text-slate-300 mt-1 text-sm">
                                Automated classification based on domain jurisdiction, severity, and geofence.
                            </p>
                        </div>
                        <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            Live Engine
                        </span>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Road Infrastructure</p>
                            <h4 className="font-bold text-white mt-1 text-base flex items-center gap-1.5">
                                🛣️ PWD Roads
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">Potholes, road collapses, asphalt restoration.</p>
                            <div className="mt-3 text-xs text-cyan-400 font-medium">
                                Active: {reports.filter((r) => r.department === "PWD_ROADS" && r.status !== "resolved").length} cases
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sanitation Division</p>
                            <h4 className="font-bold text-white mt-1 text-base flex items-center gap-1.5">
                                🗑️ Solid Waste Dept
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">Garbage dumps, overflowing bins, hazardous litter.</p>
                            <div className="mt-3 text-xs text-emerald-400 font-medium">
                                Active: {reports.filter((r) => r.department === "SWM_SANITATION" && r.status !== "resolved").length} cases
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Power Division</p>
                            <h4 className="font-bold text-white mt-1 text-base flex items-center gap-1.5">
                                💡 Electrical Division
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">Broken streetlights, dangling wires, dark sectors.</p>
                            <div className="mt-3 text-xs text-amber-400 font-medium">
                                Active: {reports.filter((r) => r.department === "ELECTRICITY_BOARD" && r.status !== "resolved").length} cases
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Flood Control</p>
                            <h4 className="font-bold text-white mt-1 text-base flex items-center gap-1.5">
                                🌊 Stormwater Board
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">Water logging, drain choking, storm culverts.</p>
                            <div className="mt-3 text-xs text-cyan-400 font-medium">
                                Active: {reports.filter((r) => r.department === "STORMWATER_DRAINAGE" && r.status !== "resolved").length} cases
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sewerage Authority</p>
                            <h4 className="font-bold text-white mt-1 text-base flex items-center gap-1.5">
                                🚰 Water & Sewerage
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">Sewage overflow, manhole repair, pipeline leaks.</p>
                            <div className="mt-3 text-xs text-indigo-400 font-medium">
                                Active: {reports.filter((r) => r.department === "WATER_SEWERAGE" && r.status !== "resolved").length} cases
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Emergency Unit</p>
                            <h4 className="font-bold text-white mt-1 text-base flex items-center gap-1.5">
                                🚨 Rapid Task Force
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">Severe 24h response & multi-confirmation surges.</p>
                            <div className="mt-3 text-xs text-red-400 font-medium">
                                Active: {escalatedCount} cases
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
                    <h2 className="text-2xl font-bold text-white">Operations Filters</h2>
                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-full mt-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 outline-none focus:border-cyan-500 text-white text-sm"
                            >
                                <option value="all">All Statuses ({reports.length})</option>
                                <option value="reported">Reported ({reportedCount})</option>
                                <option value="under_review">Under Review ({underReviewCount})</option>
                                <option value="resolved">Resolved ({resolvedCount})</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">SLA Urgency</label>
                            <select
                                value={slaFilter}
                                onChange={(e) => setSlaFilter(e.target.value as any)}
                                className="w-full mt-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 outline-none focus:border-cyan-500 text-white text-sm"
                            >
                                <option value="all">All SLAs</option>
                                <option value="overdue">🔴 Overdue SLAs ({overdueCount})</option>
                                <option value="critical">🚨 P1 Critical / Escalated ({escalatedCount})</option>
                                <option value="ontrack">⏱️ On-Track Active</option>
                            </select>
                        </div>

                        {availableZones.length > 0 && (
                            <div>
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Jurisdiction / Zone</label>
                                <select
                                    value={zoneFilter}
                                    onChange={(e) => setZoneFilter(e.target.value)}
                                    className="w-full mt-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 outline-none focus:border-cyan-500 text-white text-sm"
                                >
                                    <option value="all">All Zones ({availableZones.length})</option>
                                    {availableZones.map((z) => (
                                        <option key={z} value={z}>{z}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full mt-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 outline-none focus:border-cyan-500 text-white text-sm"
                            >
                                <option value="newest">Newest First</option>
                                <option value="sla">SLA Urgency (Earliest Deadline)</option>
                                <option value="severity">Severity (Severe → Low)</option>
                                <option value="community">Community Confirmations</option>
                                <option value="affected">Most Citizens Affected</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== MAP ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Live Municipal Deployment Map</h2>
                        <p className="text-slate-300 mt-1 text-sm">
                            Real-time geographic clusters filtered by current authority view ({filteredReports.length} visible).
                        </p>
                    </div>
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
                    <IssueMap reports={filteredReports} center={center} />
                </div>
            </section>

            {/* ===== INCIDENT QUEUE ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Department Incident Queue</h2>
                        <p className="text-slate-300 mt-2">
                            Assigned municipal reports ready for dispatch, verification, and resolution.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-white">
                            {filteredReports.length} Reports in Queue
                        </span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {loading ? (
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-300">
                            Loading incident queue...
                        </div>
                    ) : paginatedReports.length === 0 ? (
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
                            <h3 className="text-2xl font-bold text-white">No Reports in this Queue</h3>
                            <p className="text-slate-300 mt-2">Try switching department tabs or adjusting filters.</p>
                        </div>
                    ) : (
                        paginatedReports.map((report) => {
                            const isExpanded = expandedReportId === report.id;
                            const deptBadge = getDepartmentBadge(report.department);
                            const slaInfo = getSlaInfo(
                                report.slaDeadline,
                                report.status,
                                report.escalationTier ?? 0,
                                report.nextSlaDeadline
                            );

                            return (
                                <div
                                    key={report.id}
                                    className={`bg-slate-900 border rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
                                        (report.escalationTier ?? 0) >= 2
                                            ? "border-red-500 shadow-lg shadow-red-500/20"
                                            : report.escalated || report.priorityLevel === "P1 - Critical"
                                            ? "border-red-500/50 shadow-md shadow-red-500/10"
                                            : isExpanded
                                            ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                                            : "border-slate-800 hover:border-slate-700"
                                    }`}
                                >
                                    {/* Department & Jurisdiction Banner */}
                                    <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full font-semibold border ${deptBadge.color}`}>
                                                {deptBadge.icon} {report.departmentName || deptBadge.label}
                                            </span>
                                            {report.ward && (
                                                <span className="text-slate-400 font-medium">
                                                    📍 {report.ward}
                                                </span>
                                            )}
                                        </div>
                                        {report.slaDeadline && (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${slaInfo.badge}`}>
                                                {slaInfo.text}
                                            </span>
                                        )}
                                    </div>

                                    <img
                                        src={report.imageUrl}
                                        alt={report.issueType}
                                        className="w-full h-48 sm:h-56 object-cover"
                                    />

                                    <div className="p-5 sm:p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                                                        {report.issueType}
                                                    </h3>
                                                    {report.escalated && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                                                            🚨 Escalated
                                                        </span>
                                                    )}
                                                    {(report.escalationTier ?? 0) > 0 ? (
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                                report.escalationTier === 2
                                                                    ? "bg-red-950/90 text-red-300 border-red-500 animate-pulse"
                                                                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                                            }`}
                                                        >
                                                            {report.escalationTier === 2
                                                                ? "Tier 2 — City Grievance Cell (Final)"
                                                                : "Tier 1 — Zonal Supervisory"}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                                            Tier 0 — Field
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-slate-300 mt-2 text-sm leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                                                    {report.description}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(report.status)}`}>
                                                {formatStatus(report.status)}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityBadge(report.severity)}`}>
                                                {report.severity}
                                            </span>
                                            {report.priorityLevel && (
                                                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-700">
                                                    Priority: {report.priorityLevel}
                                                </span>
                                            )}
                                            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-700">
                                                👥 {report.affectedCount || 0} affected
                                            </span>
                                            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-700">
                                                📸 {report.communityReports || 1} reports
                                            </span>
                                        </div>

                                        {/* EXPANDED VIEW */}
                                        {isExpanded && (
                                            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                                                {/* Routing Engine Audit Box */}
                                                <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs uppercase tracking-wide text-cyan-400 font-bold flex items-center gap-1.5">
                                                            🤖 Authority Routing Audit
                                                        </p>
                                                        <span className="text-xs text-slate-400">
                                                            Auto-Assigned by AI Engine
                                                        </span>
                                                    </div>
                                                    <div className="grid sm:grid-cols-2 gap-3 text-sm mt-3">
                                                        <div>
                                                            <span className="text-slate-400 text-xs block">Responsible Authority</span>
                                                            <span className="font-semibold text-white">
                                                                {report.assignedAuthority || "Municipal Corporation"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 text-xs block">Jurisdiction Zone</span>
                                                            <span className="font-semibold text-white">
                                                                {report.zone || "Central Zone"} ({report.ward || "Ward 1"})
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 text-xs block">Original SLA Commitment</span>
                                                            <span className="font-semibold text-cyan-300">
                                                                {report.slaDeadline
                                                                    ? new Date(report.slaDeadline).toLocaleString()
                                                                    : "Standard SLA"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 text-xs block">Coordinates</span>
                                                            <span className="font-mono text-slate-300 text-xs">
                                                                {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {report.routingReason && (
                                                        <div className="mt-3 pt-3 border-t border-slate-700/80">
                                                            <span className="text-slate-400 text-xs block">Assignment Rationale</span>
                                                            <p className="text-xs text-slate-200 mt-1 italic leading-relaxed">
                                                                &ldquo;{report.routingReason}&rdquo;
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Autonomous Escalation & SLA Audit Box */}
                                                <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs uppercase tracking-wide text-amber-400 font-bold flex items-center gap-1.5">
                                                            ⏱️ Autonomous Escalation & SLA Audit Trail
                                                        </p>
                                                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-900 border border-slate-700 text-slate-300">
                                                            {report.escalationTier === 2
                                                                ? "Tier 2 — City Grievance Cell (Final)"
                                                                : report.escalationTier === 1
                                                                ? "Tier 1 — Zonal Supervisory Division"
                                                                : "Tier 0 — Field / Ward Office"}
                                                        </span>
                                                    </div>

                                                    <div className="grid sm:grid-cols-3 gap-3 text-sm mt-3">
                                                        <div>
                                                            <span className="text-slate-400 text-xs block">Current Supervisory Tier</span>
                                                            <span className="font-semibold text-white">
                                                                Tier {report.escalationTier ?? 0} ({report.escalationCount ?? 0} escalation{report.escalationCount === 1 ? "" : "s"})
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 text-xs block">Original Commitment Deadline</span>
                                                            <span className="font-semibold text-slate-200">
                                                                {report.slaDeadline ? new Date(report.slaDeadline).toLocaleString() : "None"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 text-xs block">Current Supervisory Deadline</span>
                                                            <span className="font-semibold text-cyan-300">
                                                                {report.escalationTier === 2
                                                                    ? "Final Escalation (Overdue)"
                                                                    : report.nextSlaDeadline
                                                                    ? new Date(report.nextSlaDeadline).toLocaleString()
                                                                    : report.slaDeadline
                                                                    ? new Date(report.slaDeadline).toLocaleString()
                                                                    : "Standard SLA"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Escalation Event Log */}
                                                    {report.escalationEvents && report.escalationEvents.length > 0 ? (
                                                        <div className="mt-4 pt-3 border-t border-slate-700/80">
                                                            <span className="text-slate-400 text-xs block mb-2 font-medium">Durable Escalation Events Log:</span>
                                                            <div className="space-y-2">
                                                                {report.escalationEvents.map((evt) => (
                                                                    <div key={evt.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs space-y-1">
                                                                        <div className="flex items-center justify-between text-slate-400">
                                                                            <span className="font-bold text-amber-300">
                                                                                Tier {evt.fromTier} ➔ Tier {evt.toTier}
                                                                            </span>
                                                                            <span>{new Date(evt.triggeredAt).toLocaleString()}</span>
                                                                        </div>
                                                                        <div className="text-slate-300">
                                                                            <span className="text-slate-400">Authority:</span> {evt.fromAuthority} <span className="text-cyan-400">➔</span> {evt.toAuthority}
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-slate-300">
                                                                            <span><span className="text-slate-400">Priority:</span> {evt.previousPriority} ➔ <span className="text-red-400 font-semibold">{evt.newPriority}</span></span>
                                                                            <span className="text-rose-400 font-medium">Breach: {evt.breachDuration}</span>
                                                                        </div>
                                                                        <p className="text-slate-400 italic mt-1 pt-1 border-t border-slate-800">
                                                                            &ldquo;{evt.reason}&rdquo;
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 pt-3 border-t border-slate-700/80 text-xs text-slate-400 italic">
                                                            No deadline breach recorded. Report is currently within its expected resolution SLA.
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Transfer Department Dropdown */}
                                                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs uppercase tracking-wide text-amber-300 font-bold">
                                                            🔄 Transfer to Another Department
                                                        </p>
                                                        {reassigningId === report.id && (
                                                            <button
                                                                onClick={() => setReassigningId(null)}
                                                                className="text-xs text-slate-400 hover:text-white"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>

                                                    {reassigningId === report.id ? (
                                                        <div className="mt-3 space-y-3">
                                                            <div>
                                                                <label className="text-xs text-slate-300">Target Department</label>
                                                                <select
                                                                    value={targetDept}
                                                                    onChange={(e) => setTargetDept(e.target.value)}
                                                                    className="w-full mt-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                                                                >
                                                                    {DEPARTMENTS.filter((d) => d.code !== "all").map((d) => (
                                                                        <option key={d.code} value={d.code}>
                                                                            {d.icon} {d.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-slate-300">Reason for Transfer (optional)</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. Requires electrical team before road work"
                                                                    value={reassignReason}
                                                                    onChange={(e) => setReassignReason(e.target.value)}
                                                                    className="w-full mt-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleReassignSubmit(report.id)}
                                                                disabled={reassignLoading}
                                                                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
                                                            >
                                                                {reassignLoading ? "Transferring..." : "Confirm Department Reassignment"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-xs text-slate-400">
                                                                Cross-jurisdiction or misrouted? Re-route instantly.
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    setReassigningId(report.id);
                                                                    setTargetDept(report.department || "PWD_ROADS");
                                                                }}
                                                                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition"
                                                            >
                                                                Change Department
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Before & After Comparison */}
                                                {report.repairImageUrl && (
                                                    <div>
                                                        <h4 className="font-semibold text-white mb-3">Before & After Repair Comparison</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">Original Incident</p>
                                                                <img
                                                                    src={report.imageUrl}
                                                                    alt="Original"
                                                                    className="w-full h-40 object-cover rounded-xl border border-slate-700"
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">Repair Evidence</p>
                                                                <img
                                                                    src={report.repairImageUrl}
                                                                    alt="Repair"
                                                                    className="w-full h-40 object-cover rounded-xl border border-emerald-600"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* AI Verification */}
                                                <div className="bg-slate-800 rounded-xl p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">AI Verification Status</p>
                                                        {report.verificationConfidence ? (
                                                            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                                                                🤖 Verified ({report.verificationConfidence}%)
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">Pending Repair</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">Fraud Risk</span>
                                                            <span className={`font-semibold ${getFraudRiskColor(report.fraudRisk || "")}`}>
                                                                {report.fraudRisk || "N/A"}
                                                            </span>
                                                        </div>
                                                        {report.verificationReason && (
                                                            <div className="border-t border-slate-700 pt-2 mt-2">
                                                                <p className="text-xs text-slate-400 mb-1">Reasoning</p>
                                                                <p className="text-xs text-slate-300">{report.verificationReason}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <button
                                                onClick={() => handleReview(report.id)}
                                                className={`flex-1 min-w-[140px] rounded-xl py-3 font-semibold transition-all ${
                                                    isExpanded
                                                        ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/25"
                                                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                                }`}
                                            >
                                                {isExpanded ? "Close Audit" : "Audit & Review"}
                                            </button>

                                            {report.status === "reported" && (
                                                <button
                                                    onClick={() => handleMarkUnderReview(report.id)}
                                                    className="flex-1 min-w-[170px] bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl py-3 font-semibold transition shadow-lg shadow-amber-500/25"
                                                >
                                                    Mark Under Review
                                                </button>
                                            )}

                                            {report.status === "under_review" && (
                                                <button
                                                    onClick={() => handleUploadRepair(report.id)}
                                                    className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-3 font-semibold text-white shadow-lg shadow-green-500/25 transition"
                                                >
                                                    Upload Repair Evidence
                                                </button>
                                            )}

                                            {report.status === "resolved" && (
                                                <div className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-center py-3 font-semibold">
                                                    ✅ Issue Successfully Resolved
                                                </div>
                                            )}

                                            {report.status === "disputed" && (
                                                <>
                                                    <div className="w-full rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-center py-3 font-semibold">
                                                        ⚠ Repair Evidence Disputed
                                                    </div>
                                                    <button
                                                        onClick={() => handleUploadRepair(report.id)}
                                                        className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 rounded-xl py-3 font-semibold transition"
                                                    >
                                                        Upload New Repair Evidence
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-10">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-xl font-medium transition ${
                                currentPage === 1
                                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                    : "bg-slate-800 hover:bg-slate-700 text-white"
                            }`}
                        >
                            ← Previous
                        </button>
                        <span className="text-sm text-slate-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-xl font-medium transition ${
                                currentPage === totalPages
                                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                    : "bg-slate-800 hover:bg-slate-700 text-white"
                            }`}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </section>

            {/* Hidden file input for repair upload */}
            <input
                ref={repairInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleRepairImageSelected}
            />

            {/* ===== FOOTER ===== */}
            <footer className="border-t border-slate-800 mt-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="text-center lg:text-left">
                        <h3 className="text-xl font-bold text-white">Community Hero</h3>
                        <p className="text-slate-400 mt-2">AI-Powered Municipal Operations Center</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition text-slate-300 hover:text-white"
                        >
                            Citizen Dashboard
                        </Link>
                        <Link
                            href="/report"
                            className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/25"
                        >
                            New Report
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}