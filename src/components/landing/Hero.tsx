import Link from "next/link";
import HeroPreview from "./HeroPreview";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-indigo-700 to-cyan-600">
            {/* Floating decorative orbs — matched to new gradient */}
            <div className="absolute top-0 -left-40 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute bottom-0 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-indigo-400/20 blur-3xl" />

            {/* Subtle grid overlay for texture */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <div>
                        <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white font-medium shadow-lg">
                            🚀 Powered by Gemini AI + Firebase
                        </div>

                        <h1 className="mt-6 sm:mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white">
                            AI-Powered
                            <span className="block text-cyan-200 drop-shadow-lg">
                                Community Issue Resolution
                            </span>
                        </h1>

                        <p className="mt-6 sm:mt-8 text-base sm:text-lg text-white/90 leading-relaxed max-w-2xl drop-shadow-md">
                            Community Hero helps citizens report civic issues in seconds
                            using AI. From intelligent issue detection to duplicate
                            merging, community validation, and AI-powered repair
                            verification, every step is designed to improve transparency
                            and accelerate resolution.
                        </p>

                        <div className="mt-8 sm:mt-10 flex flex-wrap gap-3 sm:gap-4">
                            {/* Primary CTA — solid white */}
                            <Link
                                href="/report"
                                className="rounded-xl bg-white text-blue-700 px-6 py-3 font-semibold hover:bg-blue-50 transition shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                            >
                                Report an Issue
                            </Link>

                            {/* Secondary CTA — solid blue */}
                            <Link
                                href="/dashboard"
                                className="rounded-xl bg-blue-500 text-white px-6 py-3 font-semibold hover:bg-blue-600 transition shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                            >
                                Citizen Dashboard
                            </Link>

                            {/* Secondary CTA — solid purple (still works with indigo) */}
                            <Link
                                href="/authority"
                                className="rounded-xl bg-purple-500 text-white px-6 py-3 font-semibold hover:bg-purple-600 transition shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
                            >
                                Authority Dashboard
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="mt-12 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div>
                                <p className="text-2xl sm:text-3xl font-bold text-cyan-200">AI</p>
                                <p className="text-white/80 text-sm mt-1">Automatic Classification</p>
                            </div>
                            <div>
                                <p className="text-2xl sm:text-3xl font-bold text-green-300">500m</p>
                                <p className="text-white/80 text-sm mt-1">Duplicate Detection</p>
                            </div>
                            <div>
                                <p className="text-2xl sm:text-3xl font-bold text-yellow-300">Live</p>
                                <p className="text-white/80 text-sm mt-1">Community Validation</p>
                            </div>
                            <div>
                                <p className="text-2xl sm:text-3xl font-bold text-purple-300">AI</p>
                                <p className="text-white/80 text-sm mt-1">Repair Verification</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Preview */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="w-full max-w-md lg:max-w-lg transform hover:scale-105 transition-transform duration-500">
                            <HeroPreview />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}