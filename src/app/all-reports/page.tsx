"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Report = {
    id: string;
    imageUrl: string;
    issueType: string;
    severity: string;
    description: string;
    latitude: number;
    longitude: number;
    status: string;
    affectedCount: number;
    confirmedBy: string[];
    communityReports: number;
    verificationConfidence?: number | null;
    verificationReason?: string;
    repairImageUrl?: string;
    createdAt?: any;
    distance?: number;
    department?: string | null;
    departmentName?: string | null;
    zone?: string | null;
    ward?: string | null;
    slaDeadline?: any;
    priorityLevel?: string | null;
    escalated?: boolean | null;
    escalationTier?: number;
};

// Helper: Calculate distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AllReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [center, setCenter] = useState<[number, number] | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterIssueType, setFilterIssueType] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"latest" | "severity" | "affected" | "distance">("latest");

    // Get user location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCenter([position.coords.latitude, position.coords.longitude]);
            },
            () => { }
        );
    }, []);

    // Load reports
    useEffect(() => {
        async function loadReports() {
            try {
                const res = await fetch("/api/reports");
                const result = await res.json();
                if (result.success) {
                    setReports(result.reports);
                } else {
                    console.error("Error loading reports:", result.error);
                }
            } catch (error) {
                console.error("Error loading reports:", error);
            } finally {
                setLoading(false);
            }
        }
        loadReports();
    }, []);

    // Get unique issue types for filter
    const issueTypes = useMemo(() => {
        const types = new Set(reports.map((r) => r.issueType));
        return Array.from(types);
    }, [reports]);

    // Filter and sort reports
    const filteredAndSortedReports = useMemo(() => {
        let filtered = [...reports];

        // Severity filter
        if (filterSeverity !== "all") {
            filtered = filtered.filter((r) => r.severity === filterSeverity);
        }

        // Status filter
        if (filterStatus !== "all") {
            filtered = filtered.filter((r) => r.status === filterStatus);
        }

        // Issue type filter
        if (filterIssueType !== "all") {
            filtered = filtered.filter((r) => r.issueType === filterIssueType);
        }

        // Add distance if center available
        if (center) {
            filtered = filtered.map((r) => ({
                ...r,
                distance: getDistance(center[0], center[1], r.latitude, r.longitude),
            }));
        }

        // Sorting
        switch (sortBy) {
            case "severity":
                const order = { Severe: 0, High: 1, Medium: 2, Low: 3 };
                filtered.sort((a, b) => (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4));
                break;
            case "affected":
                filtered.sort((a, b) => (b.affectedCount || 0) - (a.affectedCount || 0));
                break;
            case "distance":
                if (center) {
                    filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
                }
                break;
            default: // latest
                break;
        }

        return filtered;
    }, [reports, filterSeverity, filterStatus, filterIssueType, sortBy, center]);

    // Stats
    const stats = useMemo(() => {
        const total = filteredAndSortedReports.length;
        const active = filteredAndSortedReports.filter((r) => r.status !== "resolved").length;
        const resolved = filteredAndSortedReports.filter((r) => r.status === "resolved").length;
        const severe = filteredAndSortedReports.filter((r) => r.severity === "Severe").length;
        const high = filteredAndSortedReports.filter((r) => r.severity === "High").length;
        return { total, active, resolved, severe, high };
    }, [filteredAndSortedReports]);

    // Helper functions
    function statusColor(status: string) {
        switch (status) {
            case "resolved":
                return "bg-green-100 text-green-700";
            case "under_review":
                return "bg-yellow-100 text-yellow-700";
            default:
                return "bg-red-100 text-red-700";
        }
    }

    function formatStatus(status: string): string {
        return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    function getSeverityColor(severity: string): string {
        switch (severity) {
            case "Severe":
                return "text-red-600";
            case "High":
                return "text-orange-500";
            case "Medium":
                return "text-yellow-600";
            case "Low":
                return "text-green-600";
            default:
                return "text-slate-700";
        }
    }

    const getEmoji = (issueType: string) => {
        switch (issueType) {
            case "Pothole": return "🕳️";
            case "Garbage": return "🗑️";
            case "Broken Streetlight": return "💡";
            case "Water Logging": return "💧";
            case "Sewage Issue": return "🤢";
            default: return "📍";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50">
            {/* Header */}
            <section className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition mb-2"
                            >
                                ← Back to Dashboard
                            </Link>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white">All Reports</h1>
                            <p className="text-blue-100 mt-1">
                                Complete list of all civic issues reported in your community.
                            </p>
                        </div>
                        <Link
                            href="/report"
                            className="bg-white text-blue-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg"
                        >
                            + Report New Issue
                        </Link>
                    </div>

                    {/* Stats chips */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-white">
                            Total: {stats.total}
                        </span>
                        <span className="bg-red-500/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-white">
                            🔴 Active: {stats.active}
                        </span>
                        <span className="bg-green-500/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-white">
                            ✅ Resolved: {stats.resolved}
                        </span>
                        <span className="bg-red-600/40 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-white">
                            Severe: {stats.severe}
                        </span>
                        <span className="bg-orange-500/40 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-white">
                            High: {stats.high}
                        </span>
                    </div>
                </div>
            </section>

            {/* Filters - REMOVED SEARCH BAR */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {/* Severity Filter */}
                        <div>
                            <label className="text-xs font-medium text-black uppercase tracking-wider">Severity</label>
                            <select
                                value={filterSeverity}
                                onChange={(e) => setFilterSeverity(e.target.value)}
                                className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            >
                                <option value="all">All Severities</option>
                                <option value="Severe">🔴 Severe</option>
                                <option value="High">🟠 High</option>
                                <option value="Medium">🟡 Medium</option>
                                <option value="Low">🟢 Low</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="text-xs font-medium text-black uppercase tracking-wider">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            >
                                <option value="all">All Statuses</option>
                                <option value="reported">Reported</option>
                                <option value="under_review">Under Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="disputed">Disputed</option>
                            </select>
                        </div>

                        {/* Issue Type Filter */}
                        <div>
                            <label className="text-xs font-medium text-black uppercase tracking-wider">Issue Type</label>
                            <select
                                value={filterIssueType}
                                onChange={(e) => setFilterIssueType(e.target.value)}
                                className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            >
                                <option value="all">All Types</option>
                                {issueTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {getEmoji(type)} {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="text-xs font-medium text-black uppercase tracking-wider">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            >
                                <option value="latest">Latest</option>
                                <option value="severity">Severity (High → Low)</option>
                                <option value="affected">Most Affected</option>
                                {center && <option value="distance">Distance (Nearest)</option>}
                            </select>
                        </div>

                        {/* Clear filters */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilterSeverity("all");
                                    setFilterStatus("all");
                                    setFilterIssueType("all");
                                    setSortBy("latest");
                                }}
                                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black font-medium rounded-xl transition"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Results */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-black font-medium">
                        Showing <span className="font-bold">{filteredAndSortedReports.length}</span> reports
                    </p>
                </div>

                {filteredAndSortedReports.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow p-12 text-center border border-slate-200">
                        <h3 className="text-2xl font-semibold text-black">No Reports Found</h3>
                        <p className="text-slate-600 mt-2">
                            Try adjusting your filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedReports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/50 hover:scale-[1.02]"
                            >
                                <img
                                    src={report.imageUrl}
                                    alt={report.issueType}
                                    className="w-full h-48 object-cover"
                                    loading="lazy"
                                />
                                <div className="p-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                                                    <span className="text-2xl">{getEmoji(report.issueType)}</span>
                                                    {report.issueType}
                                                </h3>
                                                {(report.escalationTier ?? 0) > 0 && (
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                                                            report.escalationTier === 2
                                                                ? "bg-red-100 text-red-700 border-red-300"
                                                                : "bg-amber-100 text-amber-800 border-amber-300"
                                                        }`}
                                                    >
                                                        {report.escalationTier === 2
                                                            ? "🚨 Tier 2 Senior Escalation"
                                                            : "⚠️ Tier 1 Escalated"}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-700 text-sm mt-1 line-clamp-2">
                                                {report.description}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(
                                                report.status
                                            )}`}
                                        >
                                            {formatStatus(report.status)}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span
                                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${report.severity === "Severe"
                                                ? "bg-red-100 text-red-700"
                                                : report.severity === "High"
                                                    ? "bg-orange-100 text-orange-700"
                                                    : report.severity === "Medium"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-green-100 text-green-700"
                                                }`}
                                        >
                                            {report.severity}
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            👥 {report.affectedCount || 0}
                                        </span>
                                        {report.verificationConfidence && (
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                🤖 {report.verificationConfidence}%
                                            </span>
                                        )}
                                        {report.distance !== undefined && (
                                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                                📍 {report.distance.toFixed(1)} km
                                            </span>
                                        )}
                                    </div>

                                    {report.departmentName && (
                                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-800 truncate flex items-center gap-1">
                                                🏛️ {report.departmentName}
                                            </span>
                                            {report.slaDeadline && (
                                                <span className="text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded font-mono shrink-0 font-medium">
                                                    SLA: {new Date(report.slaDeadline).toLocaleDateString([], { month: "short", day: "numeric" })}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}