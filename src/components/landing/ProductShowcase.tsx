import Image from "next/image";
import Link from "next/link";

const showcases = [
    {
        title: "Citizen Dashboard",
        description:
            "Monitor live civic issues, explore the interactive incident map and track community reports in real time.",
        image: "/screenshots/citizen-dashboard.png",
        href: "/dashboard",
        badge: "Citizen Portal",
    },
    {
        title: "Authority Dashboard",
        description:
            "Prioritize incidents using AI-powered operational insights, live statistics and resolution workflows.",
        image: "/screenshots/authority-dashboard.png",
        href: "/authority",
        badge: "Authority Portal",
    },
    {
        title: "AI Review Workflow",
        description:
            "Review reports, validate evidence and verify repairs with Gemini-assisted decision making.",
        image: "/screenshots/authority-review.png",
        href: "/authority",
        badge: "Gemini AI",
    },
];

export default function ProductShowcase() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/80 py-16 sm:py-20 lg:py-24">
            {/* Decorative orbs */}
            <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-400/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <span className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                        Product Showcase
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">
                        See Community Hero in Action
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Community Hero combines AI, community participation and
                        municipal collaboration into one seamless platform for
                        reporting, tracking and resolving civic issues.
                    </p>
                </div>

                <div className="space-y-16 sm:space-y-20">
                    {showcases.map((item, index) => (
                        <div
                            key={item.title}
                            className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                                }`}
                        >
                            <div>
                                <span className="inline-block rounded-full bg-gradient-to-r from-blue-700 to-cyan-500 text-white px-4 py-1.5 text-sm font-semibold shadow-lg shadow-blue-700/25">
                                    {item.badge}
                                </span>
                                <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900">
                                    {item.title}
                                </h3>
                                <p className="mt-4 text-slate-600 leading-relaxed text-base sm:text-lg">
                                    {item.description}
                                </p>
                                <Link
                                    href={item.href}
                                    className="inline-flex mt-6 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-700/25 hover:shadow-blue-700/40 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Open Page →
                                </Link>
                            </div>

                            <div className="group rounded-2xl overflow-hidden border border-slate-200/20 bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    width={1600}
                                    height={900}
                                    className="w-full group-hover:scale-[1.02] transition-transform duration-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}