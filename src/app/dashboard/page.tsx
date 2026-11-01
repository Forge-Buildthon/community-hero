"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
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
    status: string;
    affectedCount: number;
    confirmedBy: string[];
    communityReports: number;
    verificationConfidence?: number | null;
    verificationReason?: string;
    repairImageUrl?: string;
    createdAt?: any;
    department?: string | null;
    departmentName?: string | null;
    zone?: string | null;
    ward?: string | null;
    slaDeadline?: any;
    priorityLevel?: string | null;
    escalated?: boolean | null;
    escalationTier?: number;
    assignedAuthority?: string | null;
};

// Helper: Calculate distance between two coordinates (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CitizenDashboard() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [center, setCenter] = useState<[number, number]>([30.901, 75.8573]);

    // Get user location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCenter([position.coords.latitude, position.coords.longitude]);
            },
            () => { }
        );

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

    // Computed values
    const activeReports = useMemo(
        () => reports.filter((r) => r.status !== "resolved"),
        [reports]
    );

    const resolvedReports = useMemo(
        () => reports.filter((r) => r.status === "resolved"),
        [reports]
    );

    const totalCommunityReports = useMemo(
        () => reports.reduce((sum, report) => sum + (report.communityReports ?? 1), 0),
        [reports]
    );

    const resolutionRate = useMemo(() => {
        if (!reports.length) return 0;
        return Math.round((resolvedReports.length / reports.length) * 100);
    }, [reports, resolvedReports]);

    const totalAffected = useMemo(
        () => reports.reduce((sum, r) => sum + (r.affectedCount || 0), 0),
        [reports]
    );

    // Get the 4 NEAREST active reports (based on user's location)
    const nearestActiveReports = useMemo(() => {
        if (!center) return activeReports.slice(0, 4);

        const withDistance = activeReports.map((report) => ({
            ...report,
            distance: getDistance(
                center[0],
                center[1],
                report.latitude,
                report.longitude
            ),
        }));

        return withDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 4);
    }, [activeReports, center]);

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

    return (
        <main className="min-h-screen bg-slate-50">
            {/* ===== HERO SECTION ===== */}
            <section className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-10">
                    <div className="max-w-2xl text-center lg:text-left">
                        <p className="uppercase tracking-[0.3em] text-cyan-200 font-semibold text-sm">
                            COMMUNITY HERO
                        </p>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 leading-tight">
                            AI Powered Civic Transparency Platform
                        </h1>
                        <p className="mt-4 text-base sm:text-lg text-blue-100 leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Report issues, follow their progress, and watch your community
                            become better with AI‑assisted civic accountability.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                            <Link
                                href="/report"
                                className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition text-center"
                            >
                                Report an Issue
                            </Link>
                            <Link
                                href="/authority"
                                className="border border-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition text-center"
                            >
                                Authority Portal
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 hover:bg-white/20 transition">
                            <p className="text-sm text-cyan-100 font-medium">Active Issues</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
                                {activeReports.length}
                            </h2>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 hover:bg-white/20 transition">
                            <p className="text-sm text-cyan-100 font-medium">Resolved</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
                                {resolvedReports.length}
                            </h2>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 hover:bg-white/20 transition">
                            <p className="text-sm text-cyan-100 font-medium">Community Reports</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
                                {totalCommunityReports}
                            </h2>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 hover:bg-white/20 transition">
                            <p className="text-sm text-cyan-100 font-medium">Resolution Rate</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
                                {resolutionRate}%
                            </h2>
                        </div>
                        <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 hover:bg-white/20 transition">
                            <p className="text-sm text-cyan-100 font-medium">Total Impact</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
                                {totalAffected}
                            </h2>
                            <p className="text-xs text-cyan-200/80 mt-0.5">citizens affected</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== MAP SECTION ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-black">Live Community Map</h2>
                        <p className="text-slate-600 mt-1 text-sm sm:text-base">
                            Explore ongoing civic issues around your location in real time.
                        </p>
                    </div>
                </div>

                <Suspense
                    fallback={
                        <div className="h-72 sm:h-96 md:h-[450px] w-full rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center text-slate-400">
                            Loading map...
                        </div>
                    }
                >
                    <IssueMap reports={reports} center={center} />
                </Suspense>
            </section>

            {/* ===== ACTIVE ISSUES (NEAREST 4) ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-black">
                            Active Issues Near You
                        </h2>
                        <p className="text-slate-600 mt-1 text-sm sm:text-base">
                            Showing the <strong>4 nearest</strong> active reports to your location.
                            {activeReports.length > 4 && ` (${activeReports.length - 4} more nearby)`}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium bg-blue-100 text-blue-700 px-4 py-2 rounded-full whitespace-nowrap">
                            {activeReports.length} Active Total
                        </span>
                        <Link
                            href="/report"
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/25"
                        >
                            + Report New
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-16 text-slate-500">Loading reports...</div>
                ) : nearestActiveReports.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow p-10 text-center border border-slate-200">
                        <h3 className="text-2xl font-semibold text-black">No Active Reports Nearby</h3>
                        <p className="text-slate-600 mt-3">
                            No active civic issues near your current location.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                        {nearestActiveReports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-white rounded-3xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/50 hover:scale-[1.02]"
                            >
                                <img
                                    src={report.imageUrl}
                                    alt={report.issueType}
                                    className="w-full h-48 sm:h-56 md:h-64 object-cover"
                                    loading="lazy"
                                />
                                <div className="p-5 sm:p-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-black">
                                                {report.issueType}
                                            </h3>
                                            <p className="text-slate-700 mt-1 text-sm sm:text-base line-clamp-2">
                                                {report.description}
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                📍 {(report as any).distance?.toFixed(1)} km away
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span
                                                className={`shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${statusColor(
                                                    report.status
                                                )}`}
                                            >
                                                {formatStatus(report.status)}
                                            </span>
                                            {report.verificationConfidence && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                    🤖 {report.verificationConfidence}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-5">
                                        <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                                                Severity
                                            </p>
                                            <p
                                                className={`font-bold text-lg mt-1 ${getSeverityColor(
                                                    report.severity
                                                )}`}
                                            >
                                                {report.severity}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                                                Community Reports
                                            </p>
                                            <p className="font-bold text-lg mt-1 text-black">
                                                👥 {report.communityReports ?? 1}
                                            </p>
                                        </div>
                                    </div>

                                    {report.departmentName && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                                                🏛️ {report.departmentName}
                                            </span>
                                            {report.slaDeadline && (
                                                <span className="text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded font-mono font-medium">
                                                    Target: {new Date(report.slaDeadline).toLocaleDateString([], { month: "short", day: "numeric" })}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {(report.escalationTier ?? 0) > 0 && (
                                        <div className="mt-2.5 py-1.5 px-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
                                            <span className="font-medium flex items-center gap-1.5">
                                                <span>🚨</span>
                                                <span>
                                                    {report.escalationTier === 2
                                                        ? "Escalated to City Central Grievance Authority"
                                                        : "Escalated to Zonal Supervisory Authority"}
                                                </span>
                                            </span>
                                            <span className="font-bold text-amber-900">
                                                Tier {report.escalationTier}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* VIEW ALL REPORTS BUTTON */}
                <div className="text-center mt-8">
                    <Link
                        href="/all-reports"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95"
                    >
                        📋 View All {activeReports.length} Reports →
                    </Link>
                    <p className="text-xs text-slate-500 mt-2">
                        See all reports with advanced filtering and sorting
                    </p>
                </div>
            </section>

            {/* ===== RESOLVED ISSUES ===== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-black">
                            Recently Resolved
                        </h2>
                        <p className="text-slate-600 mt-1 text-sm sm:text-base">
                            AI verified repairs completed by local authorities.
                        </p>
                    </div>
                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
                        {resolvedReports.length} Resolved
                    </span>
                </div>

                {resolvedReports.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow p-10 text-center border border-slate-200">
                        <h3 className="text-2xl font-semibold text-black">No Resolved Issues Yet</h3>
                        <p className="text-slate-600 mt-3">
                            Resolved reports will appear here after AI verification.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                        {resolvedReports.slice(0, 4).map((report) => (
                            <div
                                key={report.id}
                                className="bg-white rounded-3xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden border border-green-100/50 hover:scale-[1.01]"
                            >
                                <img
                                    src={report.repairImageUrl || report.imageUrl}
                                    alt={report.issueType}
                                    className="w-full h-48 sm:h-56 md:h-64 object-cover"
                                    loading="lazy"
                                />
                                <div className="p-5 sm:p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-black">
                                                {report.issueType}
                                            </h3>
                                            <p className="text-slate-700 mt-1 text-sm sm:text-base line-clamp-2">
                                                {report.description}
                                            </p>
                                        </div>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold shrink-0">
                                            RESOLVED
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-5">
                                        <div className="bg-green-50 rounded-xl p-3 sm:p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                                                AI Verification
                                            </p>
                                            <p className="font-bold text-lg mt-1 text-black">
                                                {report.verificationConfidence ?? 100}%
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 rounded-xl p-3 sm:p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                                                Community Reports
                                            </p>
                                            <p className="font-bold text-lg mt-1 text-black">
                                                👥 {report.communityReports ?? 1}
                                            </p>
                                        </div>
                                    </div>

                                    {report.verificationReason && (
                                        <div className="mt-5 bg-slate-50 rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
                                                AI Reasoning
                                            </p>
                                            <p className="text-slate-700 text-sm">{report.verificationReason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {resolvedReports.length > 4 && (
                    <div className="text-center mt-6">
                        <Link
                            href="/all-reports"
                            className="inline-flex items-center gap-2 text-green-600 font-medium hover:underline"
                        >
                            View all {resolvedReports.length} resolved reports →
                        </Link>
                    </div>
                )}
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                        <h3 className="font-bold text-xl text-black">Community Hero</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Building safer communities with AI-powered civic transparency.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link
                            href="/report"
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-500/25"
                        >
                            Report Issue
                        </Link>
                        <Link
                            href="/authority"
                            className="border border-slate-300 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-100 transition text-slate-700"
                        >
                            Authority Dashboard
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}