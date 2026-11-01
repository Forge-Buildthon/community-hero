import Link from "next/link";

export default function Footer() {
    const technologies = [
        "Gemini AI",
        "Firebase",
        "Firestore",
        "Next.js",
        "TypeScript",
        "Tailwind CSS",
    ];

    return (
        <footer className="bg-white border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Left Column - Brand */}
                    <div>
                        <span className="text-sm font-semibold uppercase tracking-[0.35em] bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                            Community Hero
                        </span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
                            AI-Powered Civic Resolution Platform
                        </h2>
                        <p className="mt-4 text-slate-600 max-w-xl leading-relaxed">
                            Community Hero empowers citizens and municipal authorities to
                            collaboratively identify, validate and resolve civic issues using
                            Gemini AI, community participation and intelligent verification.
                        </p>
                    </div>

                    {/* Right Column - Tech & CTAs */}
                    <div>
                        <h3 className="text-slate-900 font-semibold text-xl mb-4">
                            Built With
                        </h3>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {technologies.map((tech) => (
                                <span
                                    key={tech}
                                    className="rounded-full bg-slate-50 border border-slate-200/20 px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-slate-600 font-medium hover:bg-slate-100 transition-colors"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
                            <Link
                                href="/report"
                                className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-5 sm:px-6 py-2.5 sm:py-3 font-semibold text-white shadow-lg shadow-blue-700/25 hover:shadow-blue-700/40 hover:scale-105 active:scale-95 transition-all"
                            >
                                Report Issue
                            </Link>
                            <Link
                                href="/dashboard"
                                className="rounded-xl border border-slate-300 px-5 sm:px-6 py-2.5 sm:py-3 font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all hover:scale-105 active:scale-95"
                            >
                                Citizen Dashboard
                            </Link>
                            <Link
                                href="/authority"
                                className="rounded-xl border-2 border-blue-600/30 text-blue-600 px-5 sm:px-6 py-2.5 sm:py-3 font-semibold hover:bg-blue-50 hover:border-blue-600/50 transition-all hover:scale-105 active:scale-95"
                            >
                                Authority Portal
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-3 text-sm text-slate-500">
                    <p>Built for the Google Community Hero Hackathon</p>
                    <p className="flex items-center gap-1">
                        Powered by <span className="font-medium text-slate-700">Gemini AI</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-700">Firebase</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-700">Next.js</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}