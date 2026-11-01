const steps = [
    {
        icon: "📷",
        title: "Upload Photo",
        description:
            "Citizens capture a photo of a civic issue using their phone.",
    },
    {
        icon: "🤖",
        title: "Gemini AI Analysis",
        description:
            "Gemini automatically identifies the issue, severity and generates a structured report.",
    },
    {
        icon: "📍",
        title: "Duplicate Detection",
        description:
            "Nearby reports are merged intelligently to prevent duplicate complaints.",
    },
    {
        icon: "👥",
        title: "Community Validation",
        description:
            "Citizens confirm issues, increasing confidence and helping authorities prioritize.",
    },
    {
        icon: "🏛️",
        title: "Authority Resolution",
        description:
            "Authorities review, update progress and upload repair evidence.",
    },
    {
        icon: "✅",
        title: "AI Repair Verification",
        description:
            "Gemini compares before and after images to verify the repair and detect fraud.",
    },
];

export default function HowItWorks() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/80 py-16 sm:py-20 lg:py-24">
            {/* Floating decorative orbs – light version */}
            <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-400/20 blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <span className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                        Workflow
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">
                        How Community Hero Works
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Community Hero combines AI, community participation and
                        authority collaboration into one seamless workflow that
                        transforms reporting into verified resolution.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {steps.map((step, index) => (
                        <div
                            key={step.title}
                            className="relative group rounded-2xl bg-white border border-slate-200/20 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 p-6 sm:p-8 hover:border-blue-400/50 hover:shadow-blue-500/20"
                        >
                            {/* Step number badge */}
                            <div className="absolute -top-3 left-6 h-8 w-8 rounded-full bg-gradient-to-r from-blue-700 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-blue-600/25">
                                {index + 1}
                            </div>

                            {/* Icon */}
                            <div className="text-5xl mb-4 drop-shadow-md">
                                {step.icon}
                            </div>

                            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">
                                {step.title}
                            </h3>
                            <p className="mt-2 text-slate-600 leading-relaxed text-sm sm:text-base">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}