"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";

type Report = {
    id: string;
    userId: string;
    issueType: string;
    severity: string;
    status: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    description: string;
    affectedCount: number;
    communityReports: number;
    confirmedBy: string[];
    verificationConfidence?: number | null;
};

// --- EMOJI MARKER GENERATOR ---
const getEmojiForIssue = (issueType: string): string => {
    switch (issueType) {
        case "Pothole": return "🕳️";
        case "Garbage": return "🗑️";
        case "Broken Streetlight": return "💡";
        case "Water Logging": return "💧";
        case "Sewage Issue": return "🤢";
        default: return "📍";
    }
};

const getColorForSeverity = (severity: string, status: string): string => {
    if (status === "resolved") return "#10B981";
    switch (severity) {
        case "Severe": return "#EF4444";
        case "High": return "#F59E0B";
        case "Medium": return "#3B82F6";
        case "Low": return "#6B7280";
        default: return "#3B82F6";
    }
};

const createEmojiMarker = (issueType: string, severity: string, status: string, affectedCount: number) => {
    const emoji = getEmojiForIssue(issueType);
    const color = getColorForSeverity(severity, status);

    const baseSize = 32;
    const growthFactor = 1.3;
    let size = baseSize * Math.pow(growthFactor, affectedCount - 1);
    size = Math.min(size, 70);

    const fontSize = Math.round(size * 0.6);
    const borderWidth = Math.max(2, Math.round(size * 0.05));

    const glow = status !== "resolved" ? `
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 + 2}" fill="${color}" opacity="0.12">
            <animate attributeName="r" values="${size / 2 + 2};${size / 2 + 8};${size / 2 + 2}" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.12;0.04;0.12" dur="2s" repeatCount="indefinite"/>
        </circle>
    ` : "";

    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow-${issueType}">
                    <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.25"/>
                </filter>
            </defs>
            ${glow}
            <g filter="url(#shadow-${issueType})">
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white" stroke="${color}" stroke-width="${borderWidth}" opacity="0.95"/>
                <text x="${size / 2}" y="${size / 2 + fontSize * 0.2}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">
                    ${emoji}
                </text>
                ${affectedCount > 1 ? `
                    <circle cx="${size - 6}" cy="${size - 6}" r="10" fill="${color}" stroke="white" stroke-width="2"/>
                    <text x="${size - 6}" y="${size - 5}" font-size="9" text-anchor="middle" font-weight="bold" fill="white">
                        ${affectedCount}
                    </text>
                ` : ''}
            </g>
        </svg>
    `;

    return L.divIcon({
        html: svg,
        className: "custom-emoji-marker",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });
};

export default function IssueMap({
    reports,
    center: demoCenter,
}: {
    reports: Report[];
    center: [number, number];
}) {
    const { user } = useAuth();
    const router = useRouter();

    const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
    const [localCounts, setLocalCounts] = useState<Record<string, number>>({});
    const [confirmedReports, setConfirmedReports] = useState<Set<string>>(new Set());

    // ---- Smart Location & Demo Mode ----
    const [mapCenter, setMapCenter] = useState<[number, number]>(demoCenter);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [hasLocation, setHasLocation] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(true);

    // Get user location on mount
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
                setUserLocation(loc);
                setHasLocation(true);
                setMapCenter(loc);
                setIsDemoMode(false);
            },
            () => {
                setHasLocation(false);
                setIsDemoMode(true);
                if (reports.length > 0) {
                    const avgLat = reports.reduce((sum, r) => sum + r.latitude, 0) / reports.length;
                    const avgLng = reports.reduce((sum, r) => sum + r.longitude, 0) / reports.length;
                    setMapCenter([avgLat, avgLng]);
                } else {
                    setMapCenter(demoCenter);
                }
            }
        );
    }, [demoCenter, reports]);

    useEffect(() => {
        if (isDemoMode && reports.length > 0) {
            const avgLat = reports.reduce((sum, r) => sum + r.latitude, 0) / reports.length;
            const avgLng = reports.reduce((sum, r) => sum + r.longitude, 0) / reports.length;
            setMapCenter([avgLat, avgLng]);
        }
    }, [reports, isDemoMode]);

    // ---- Existing logic ----
    const markerCache = useMemo(() => new Map(), []);

    const getMarkerForReport = (report: Report) => {
        const displayCount = localCounts[report.id] ?? report.affectedCount;
        const key = `${report.id}-${displayCount}`;
        if (markerCache.has(key)) {
            return markerCache.get(key);
        }
        const marker = createEmojiMarker(
            report.issueType,
            report.severity,
            report.status,
            displayCount
        );
        markerCache.set(key, marker);
        return marker;
    };

    useEffect(() => {
        if (!user) return;
        const userConfirmedIds = reports
            .filter((r) => (r.confirmedBy ?? []).includes(user.uid))
            .map((r) => r.id);
        if (userConfirmedIds.length > 0) {
            setConfirmedReports((prev) => {
                const next = new Set(prev);
                userConfirmedIds.forEach((id) => next.add(id));
                return next;
            });
        }
    }, [reports, user]);

    async function handleConfirm(report: Report) {
        if (!user) {
            router.push("/auth");
            return;
        }

        if (confirmedReports.has(report.id) || (report.confirmedBy ?? []).includes(user.uid)) {
            alert("You have already confirmed this issue.");
            return;
        }

        try {
            setLoadingReportId(report.id);

            const res = await fetch("/api/reports/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reportId: report.id, userId: user.uid }),
            });
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.error || "Failed to confirm issue");
            }
            const success = result.confirmed;

            if (!success) {
                alert("Already confirmed.");
                return;
            }

            setLocalCounts((prev) => ({
                ...prev,
                [report.id]: (prev[report.id] ?? report.affectedCount) + 1,
            }));

            setConfirmedReports((prev) => {
                const next = new Set(prev);
                next.add(report.id);
                return next;
            });
        } catch (error) {
            console.error(error);
            alert("Failed to confirm issue.");
        } finally {
            setLoadingReportId(null);
        }
    }

    // Empty state
    if (!reports || reports.length === 0) {
        return (
            <div className="relative h-72 sm:h-96 md:h-[450px] w-full rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-6 text-center border border-slate-200 dark:border-white/10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No issues reported yet</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Be the first to report a civic issue in your community.
                </p>
                <Link
                    href="/report"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition hover:scale-105 active:scale-95"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Report Issue
                </Link>
            </div>
        );
    }

    return (
        <div className="relative z-0 isolate w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200 dark:ring-white/10">
            {/* ===== LOCATION CONTROLS (top-right) ===== */}
            <div className="absolute top-4 right-4 z-[1000] pointer-events-none flex flex-col gap-2">
                {/* Status indicator */}
                <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg text-xs border border-slate-200 dark:border-white/10">
                    {hasLocation ? (
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Live location
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            🎯 Demo Mode – All Reports Visible
                        </span>
                    )}
                </div>

                {/* "My Location" button */}
                {userLocation && (
                    <button
                        onClick={() => {
                            setMapCenter(userLocation);
                            setIsDemoMode(false);
                        }}
                        className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        📍 My Location
                    </button>
                )}

                {/* "Show All Reports" button */}
                {hasLocation && !isDemoMode && (
                    <button
                        onClick={() => {
                            if (reports.length > 0) {
                                const avgLat = reports.reduce((sum, r) => sum + r.latitude, 0) / reports.length;
                                const avgLng = reports.reduce((sum, r) => sum + r.longitude, 0) / reports.length;
                                setMapCenter([avgLat, avgLng]);
                            } else {
                                setMapCenter(demoCenter);
                            }
                            setIsDemoMode(true);
                        }}
                        className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-medium text-blue-600 dark:text-blue-400"
                    >
                        🗺️ Show All Reports
                    </button>
                )}
            </div>

            {/* ===== LEGEND (top-left) ===== */}
            <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
                <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 text-sm max-w-[160px]">
                    <p className="font-semibold text-slate-700 dark:text-white mb-2 text-xs uppercase tracking-wider">Issue Types</p>
                    <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🕳️</span>
                            <span className="text-slate-600 dark:text-slate-300">Pothole</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🗑️</span>
                            <span className="text-slate-600 dark:text-slate-300">Garbage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            <span className="text-slate-600 dark:text-slate-300">Streetlight</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💧</span>
                            <span className="text-slate-600 dark:text-slate-300">Water Logging</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🤢</span>
                            <span className="text-slate-600 dark:text-slate-300">Sewage</span>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Resolved</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Severe</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">High</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Low</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-semibold">Size</span> = Affected count
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Badge</span> = Count (if &gt;1)
                        </p>
                    </div>
                </div>
            </div>

            {/* ===== MAP ===== */}
            <MapContainer
                key={`${mapCenter[0]}-${mapCenter[1]}`}
                center={mapCenter}
                zoom={15}
                className="h-72 sm:h-96 md:h-[450px] w-full"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {reports.map((report) => {
                    const displayCount = localCounts[report.id] ?? report.affectedCount;
                    const marker = getMarkerForReport(report);

                    return (
                        <Marker
                            key={report.id}
                            icon={marker}
                            position={[report.latitude, report.longitude]}
                        >
                            <Popup maxWidth={320} minWidth={220} className="custom-popup" autoPan>
                                {/* --- POPUP CONTENT (unchanged) --- */}
                                <div className="relative">
                                    <img
                                        src={report.imageUrl}
                                        alt={report.issueType}
                                        className="w-full h-44 object-cover rounded-t-xl"
                                        loading="lazy"
                                    />

                                    <span
                                        className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white shadow-lg ${report.status === "resolved"
                                            ? "bg-emerald-500"
                                            : report.status === "under_review"
                                                ? "bg-amber-500"
                                                : report.status === "reported"
                                                    ? "bg-red-500"
                                                    : "bg-gray-500"
                                            }`}
                                    >
                                        {report.status.replace("_", " ")}
                                    </span>

                                    {report.status === "resolved" && report.verificationConfidence && (
                                        <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-lg backdrop-blur-sm">
                                            🤖 AI Verified {report.verificationConfidence}%
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                            {report.issueType}
                                        </h3>

                                        <span
                                            className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${report.severity === "Severe"
                                                ? "bg-red-600"
                                                : report.severity === "High"
                                                    ? "bg-orange-500"
                                                    : report.severity === "Medium"
                                                        ? "bg-yellow-500"
                                                        : "bg-green-600"
                                                }`}
                                        >
                                            {report.severity}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                        {report.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                                        <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2 text-center">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Evidence</p>
                                            <p className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                                📸 {report.communityReports}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2 text-center">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Affected</p>
                                            <p className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                                👥 {displayCount}
                                            </p>
                                        </div>
                                    </div>

                                    {report.status === "resolved" && (
                                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                                            <span>✅</span>
                                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                                AI Verified Repair
                                                {report.verificationConfidence
                                                    ? ` (${report.verificationConfidence}% confidence)`
                                                    : ""}
                                            </span>
                                        </div>
                                    )}

                                    {report.status === "disputed" && (
                                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800">
                                            <span>⚠️</span>
                                            <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                                AI Disputed – Needs Review
                                            </span>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                                        {user && user.uid !== report.userId ? (
                                            <button
                                                disabled={
                                                    loadingReportId === report.id ||
                                                    confirmedReports.has(report.id) ||
                                                    (report.confirmedBy ?? []).includes(user.uid)
                                                }
                                                onClick={() => handleConfirm(report)}
                                                className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${confirmedReports.has(report.id) ||
                                                    (report.confirmedBy ?? []).includes(user.uid)
                                                    ? "bg-green-600 text-white cursor-not-allowed opacity-80"
                                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95"
                                                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                                            >
                                                {loadingReportId === report.id ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Confirming...
                                                    </>
                                                ) : confirmedReports.has(report.id) ||
                                                    (report.confirmedBy ?? []).includes(user.uid) ? (
                                                    <>
                                                        <span>✓</span> You're Affected
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>📍</span> I'm Affected Too
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            user && user.uid === report.userId && (
                                                <div className="w-full py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-center font-semibold text-sm">
                                                    📝 You reported this issue
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}