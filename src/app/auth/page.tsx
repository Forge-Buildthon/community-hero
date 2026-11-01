"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit() {
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            router.push("/");
        } catch (err: any) {
            // Friendly error messages
            if (err.code === "auth/user-not-found") {
                setError("No account found with this email.");
            } else if (err.code === "auth/wrong-password") {
                setError("Incorrect password. Please try again.");
            } else if (err.code === "auth/email-already-in-use") {
                setError("This email is already registered.");
            } else if (err.code === "auth/weak-password") {
                setError("Password should be at least 6 characters.");
            } else {
                setError(err.message || "Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4 relative overflow-hidden">
            {/* Decorative orbs */}
            <div className="absolute top-0 -left-40 h-[500px] w-[500px] rounded-full bg-blue-400/30 blur-3xl" />
            <div className="absolute bottom-0 -right-40 h-[500px] w-[500px] rounded-full bg-pink-400/30 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-purple-400/20 blur-3xl" />

            {/* Auth Card */}
            <div className="relative w-full max-w-md bg-white/90 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 sm:p-10 transition-all duration-300">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-3">
                        <span className="text-3xl">🛡️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {isLogin ? "Welcome Back" : "Join Community Hero"}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isLogin
                            ? "Sign in to your account"
                            : "Create an account to get started"}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-slate-900 placeholder-slate-400"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-slate-900 placeholder-slate-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {isLogin ? "Signing in..." : "Creating account..."}
                            </>
                        ) : (
                            <>{isLogin ? "Sign In" : "Create Account"}</>
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setEmail("");
                                setPassword("");
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all"
                            disabled={isLoading}
                        >
                            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white/90 px-2 text-slate-400">Secure & encrypted</span>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-slate-400 mt-4">
                    By continuing, you agree to our Terms of Service
                </p>
            </div>
        </main>
    );
}