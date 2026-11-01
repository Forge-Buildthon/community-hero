"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_PRESET,
} from "@/lib/cloudinary";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

const LocationPicker = dynamic(
    () => import("@/components/LocationPicker"),
    {
        ssr: false,
    }
);

export default function ReportPage() {
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);

    const [locationError, setLocationError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [dragOver, setDragOver] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth");
        }
    }, [loading, user, router]);

    // Get user's location
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationError(null);
            },
            (error) => {
                console.error(error);
                setLocationError("Unable to detect your location. Please select it on the map.");
                // We still allow manual selection, so we don't block the user.
            }
        );
    }, []);

    // Handle image upload and AI analysis
    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

            const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: formData }
            );
            const uploadData = await uploadResponse.json();
            setImageUrl(uploadData.secure_url);

            const analysisResponse = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: uploadData.secure_url }),
            });
            const analysisData = await analysisResponse.json();

            if (!analysisData.success) {
                alert("AI service is temporarily busy. Please try again.");
                return;
            }

            if (!analysisData.analysis.isCommunityIssue) {
                alert(analysisData.analysis.reason);
                // Clear the image so user can try a different one
                setImageUrl("");
                return;
            }

            setAnalysis({
                ...analysisData.analysis,
                imageUrl: uploadData.secure_url,
            });
        } catch (error) {
            console.error(error);
            alert("An error occurred while processing your image.");
        } finally {
            setUploading(false);
        }
    }

    // Handle drag events for the drop zone
    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragOver(true);
    }

    function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragOver(false);
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            // Simulate a file input change
            const input = document.getElementById("file-upload") as HTMLInputElement;
            if (input) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                input.files = dataTransfer.files;
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }
    }

    // Reset the flow (clear image and analysis)
    function handleReset() {
        setImageUrl("");
        setAnalysis(null);
        // Optionally reset location? We'll keep location as is.
        const input = document.getElementById("file-upload") as HTMLInputElement;
        if (input) input.value = "";
    }

    const [submittedReport, setSubmittedReport] = useState<any | null>(null);

    // Submit the report
    async function submitReport() {
        if (!analysis || !location) return;

        setSubmitting(true);
        try {
            const response = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user!.uid,
                    userEmail: user!.email,
                    imageUrl: analysis.imageUrl,
                    issueType: analysis.issueType,
                    severity: analysis.severity,
                    description: analysis.description,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    status: "reported",
                    repairImageUrl: "",
                    verificationConfidence: null,
                    verificationReason: "",
                    fraudRisk: "",
                    resolvedAt: null,
                }),
            });

            const result = await response.json();
            if (!result.success) {
                alert("Failed to submit report.");
                return;
            }

            if (result.duplicate) {
                alert("This issue was already reported nearby. Your submission has been merged and increased the community priority!");
                setAnalysis(null);
                setImageUrl("");
            } else if (result.report) {
                setSubmittedReport(result.report);
                setAnalysis(null);
                setImageUrl("");
            } else {
                alert("Report submitted successfully!");
                setAnalysis(null);
                setImageUrl("");
            }

            const input = document.getElementById("file-upload") as HTMLInputElement;
            if (input) input.value = "";
        } catch (error) {
            console.error(error);
            alert("An error occurred while submitting.");
        } finally {
            setSubmitting(false);
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-xl font-semibold text-slate-700">Checking authentication…</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <main className="min-h-screen bg-slate-50 py-8 sm:py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-black">Report Community Issue</h1>
                    <p className="text-slate-600 mt-2 text-sm sm:text-base">
                        Upload a photo, let our AI analyze it, and pinpoint the location.
                    </p>
                </div>

                {/* Step 1: Upload Image */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 mb-6">
                    <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">1</span>
                        Upload Image
                    </h2>

                    {!imageUrl ? (
                        <div
                            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-colors ${dragOver
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-300 hover:border-blue-400"
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading}
                            />
                            <div className="pointer-events-none">
                                <svg
                                    className="mx-auto h-12 w-12 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <p className="mt-2 text-sm text-slate-600">
                                    {uploading ? "Uploading…" : "Click or drag & drop an image"}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP</p>
                            </div>
                        </div>
                    ) : (
                        // Image preview with remove button
                        <div className="relative">
                            <img
                                src={imageUrl}
                                alt="Uploaded"
                                className="w-full max-h-96 object-contain rounded-xl border border-slate-200"
                            />
                            <button
                                onClick={handleReset}
                                className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 shadow-md hover:bg-red-50 transition-colors border border-slate-200"
                                aria-label="Remove image"
                            >
                                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Step 2: AI Analysis Results */}
                {analysis && (
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 mb-6">
                        <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold">2</span>
                            AI Analysis
                        </h2>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                            <div className="flex items-start gap-3">
                                <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-black">{analysis.issueType}</p>
                                    <p className="text-sm text-slate-600 mt-1">{analysis.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-3">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            Severity: {analysis.severity}
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Confidence: {analysis.confidence ?? "N/A"}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Location Selection */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 mb-6">
                    <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600 text-white text-sm font-bold">3</span>
                        Select Location
                    </h2>

                    {locationError && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                            ⚠️ {locationError} You can still select a location on the map below.
                        </div>
                    )}

                    {location ? (
                        <div className="text-sm text-slate-500 mb-3">
                            📍 Current location: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                            <span className="ml-2 text-xs text-slate-400">(tap the map to adjust)</span>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" />
                            </svg>
                            Detecting your location…
                        </div>
                    )}

                    <LocationPicker
                        latitude={location?.latitude ?? 30.901}
                        longitude={location?.longitude ?? 75.8573}
                        onLocationChange={(lat, lng) => {
                            setLocation({ latitude: lat, longitude: lng });
                            setLocationError(null);
                        }}
                    />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                        onClick={submitReport}
                        disabled={!analysis || !location || submitting}
                        className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${!analysis || !location || submitting
                            ? "bg-slate-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/25"
                            }`}
                    >
                        {submitting ? (
                            <>
                                <svg className="inline animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" />
                                </svg>
                                Submitting…
                            </>
                        ) : (
                            "Submit Report"
                        )}
                    </button>
                    {analysis && (
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* ===== AUTOMATIC AUTHORITY ROUTING CONFIRMATION MODAL ===== */}
            {submittedReport && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-inner mb-4">
                                🏛️
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Automatically Dispatched
                            </span>
                            <h2 className="text-2xl font-bold text-slate-900 mt-2">
                                Report Assigned to Authority
                            </h2>
                            <p className="text-slate-600 text-sm mt-1">
                                Your issue was analyzed and immediately routed to the responsible municipal department.
                            </p>
                        </div>

                        <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-sm">
                            <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                                <span className="text-slate-500">Responsible Dept:</span>
                                <span className="font-bold text-slate-900 text-right">
                                    {submittedReport.departmentName || "Municipal Division"}
                                </span>
                            </div>

                            <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                                <span className="text-slate-500">Jurisdiction:</span>
                                <span className="font-semibold text-slate-800 text-right">
                                    {submittedReport.ward ? `${submittedReport.ward}, ` : ""}{submittedReport.zone || "Central"}
                                </span>
                            </div>

                            <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                                <span className="text-slate-500">Priority Level:</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                                    submittedReport.priorityLevel?.includes("Critical")
                                        ? "bg-red-100 text-red-700"
                                        : submittedReport.priorityLevel?.includes("High")
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-blue-100 text-blue-700"
                                }`}>
                                    {submittedReport.priorityLevel || "Standard"}
                                </span>
                            </div>

                            <div className="flex justify-between items-start">
                                <span className="text-slate-500">Resolution SLA:</span>
                                <span className="font-semibold text-cyan-700">
                                    {submittedReport.slaDeadline
                                        ? new Date(submittedReport.slaDeadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                                        : "Within standard timeframe"}
                                </span>
                            </div>
                        </div>

                        {submittedReport.routingReason && (
                            <p className="mt-3 text-xs text-slate-500 italic bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                                &ldquo;{submittedReport.routingReason}&rdquo;
                            </p>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-lg shadow-blue-500/20"
                            >
                                Track on Live Dashboard →
                            </button>
                            <button
                                onClick={() => setSubmittedReport(null)}
                                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition"
                            >
                                Report Another Issue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}