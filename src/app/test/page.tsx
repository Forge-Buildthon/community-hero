"use client";

import { useAuth } from "@/providers/AuthProvider";

export default function TestPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return <h1>Loading...</h1>;
    }

    return (
        <div className="p-10">
            <h1>
                {user
                    ? `Logged in as ${user.email}`
                    : "Not Logged In"}
            </h1>
        </div>
    );
}