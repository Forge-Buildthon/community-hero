"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
    const { user } = useAuth();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
        setIsMenuOpen(false);
    };

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/report", label: "Report Issue" },
        { href: "/authority", label: "Authority" },
    ];

    return (
        <>
            {/* ===== DESKTOP / TABLET NAVBAR ===== */}
            <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/50 dark:bg-slate-950/90 dark:border-white/5 transition-colors">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 md:py-4">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 group"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {/* Generic safe icon — shield/badge */}
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 2L3 7l9 5 9-5-9-5z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 12l9 5 9-5"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 17l9 5 9-5"
                                />
                            </svg>
                        </span>
                        <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                            Community Hero
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400
                           after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
                            >
                                {link.label}
                            </Link>
                        ))}

                        {user ? (
                            <div className="flex items-center gap-4 pl-4 border-l border-slate-200 dark:border-white/10">
                                <span className="max-w-[120px] truncate text-sm text-slate-500 dark:text-slate-400">
                                    {user.email}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-red-500 transition-colors hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/auth"
                                className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-blue-500/40 active:scale-95"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile Hamburger Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </nav>

            {/* ===== MOBILE OVERLAY MENU ===== */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 flex flex-col bg-white/95 backdrop-blur-md dark:bg-slate-950/95 md:hidden px-6 pt-6 pb-8 overflow-y-auto animate-in fade-in duration-200">
                    {/* User info at top (if logged in) */}
                    {user && (
                        <div className="mb-6 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Signed in as</p>
                            <p className="font-medium text-slate-800 dark:text-white truncate">
                                {user.email}
                            </p>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <div className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="rounded-xl px-4 py-3 text-lg font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-blue-400 active:scale-95"
                            >
                                {link.label}
                            </Link>
                        ))}

                        {!user && (
                            <Link
                                href="/auth"
                                onClick={() => setIsMenuOpen(false)}
                                className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-center text-lg font-medium text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                            >
                                Login
                            </Link>
                        )}

                        {user && (
                            <button
                                onClick={handleLogout}
                                className="mt-4 rounded-xl border border-red-200 px-4 py-3 text-lg font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-950/30 active:scale-95"
                            >
                                Logout
                            </button>
                        )}
                    </div>

                    {/* Spacer + subtle close hint */}
                    <div className="mt-auto text-center text-sm text-slate-400 dark:text-slate-500">
                        Tap outside to close
                    </div>
                </div>
            )}
        </>
    );
}