export default function HeroPreview() {
    return (
        <div className="relative">
            <div className="rounded-3xl border border-slate-200/10 bg-white/95 backdrop-blur-sm p-6 shadow-xl shadow-blue-500/5">                <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Live Community Dashboard</h3>
                    <p className="text-sm text-slate-500">AI-powered civic monitoring</p>
                </div>
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-600 font-semibold flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live
                </span>
            </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 hover:border-blue-300 transition-colors">
                        <p className="text-3xl font-bold text-blue-600">128</p>
                        <p className="text-sm text-slate-500">Reports</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 hover:border-green-300 transition-colors">
                        <p className="text-3xl font-bold text-green-600">93</p>
                        <p className="text-sm text-slate-500">Resolved</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 hover:border-yellow-300 transition-colors">
                        <p className="text-3xl font-bold text-yellow-600">47</p>
                        <p className="text-sm text-slate-500">Citizens</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 hover:border-purple-300 transition-colors">
                        <p className="text-3xl font-bold text-purple-600">98%</p>
                        <p className="text-sm text-slate-500">AI Accuracy</p>
                    </div>
                </div>

                {/* AI Workflow */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
                    <h4 className="font-semibold text-slate-900 mb-4">AI Resolution Pipeline</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">📷 Image Uploaded</span>
                            <span className="text-green-600 font-medium">✓</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">🤖 Gemini Analysis</span>
                            <span className="text-green-600 font-medium">✓</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">📍 Duplicate Detection</span>
                            <span className="text-green-600 font-medium">✓</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">👥 Community Validation</span>
                            <span className="text-yellow-600 font-medium">In Progress</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">✅ AI Repair Verification</span>
                            <span className="text-slate-400 font-medium">Pending</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}