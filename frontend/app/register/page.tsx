"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postData } from "../utils/http";
import Link from "next/link";
import { ConsentCheckbox } from "@/app/register/consent-checkbox";
import { AvatarSelector } from "@/components/avatar-selector";

export default function RegistrationPage() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [avatar, setAvatar] = useState<string>("🎭");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [privacyConsent, setPrivacyConsent] = useState<boolean>(false);

    const router = useRouter();

    const handleSubmit = async () => {
        if (!username || !password || !confirmPassword) {
            setError("All fields are required.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!privacyConsent) {
            setError("You must accept the privacy policy to register.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Sending registration data including avatar
            const response = await postData("/register", { 
                username, 
                password, 
                avatar 
            });

            if (response && response.id) {
                router.push("/login");
            } else {
                setError("An error occurred during registration.");
            }
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
                <h1 className="text-4xl font-bold text-white mb-2">Register</h1>
                <p className="text-lg text-gray-400 mb-8">
                    Create an account to join the game!
                </p>

                <div className="space-y-6">
                    {/* Avatar Selector */}
                    <AvatarSelector
                        selected={avatar}
                        onSelect={setAvatar}
                        disabled={loading}
                    />

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 text-left">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your username"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 text-left">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your password"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 text-left">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
                            placeholder="Confirm your password"
                        />
                    </div>

                    {/* Privacy Consent */}
                    <ConsentCheckbox
                        checked={privacyConsent}
                        onChangeAction={setPrivacyConsent}
                        required={true}
                    />

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Register Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !privacyConsent}
                        className={`w-full py-3 text-lg font-semibold rounded-lg transition-all duration-200 transform ${
                            loading || !privacyConsent
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-lg hover:shadow-xl"
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                                Registering...
                            </span>
                        ) : (
                            "Register"
                        )}
                    </button>
                </div>

                <div className="mt-8 space-y-3">
                    <Link
                        href="/login"
                        className="block w-full py-2 text-center text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    >
                        Already have an account? Log in
                    </Link>
                    <Link
                        href="/"
                        className="block w-full py-2 text-center text-gray-400 hover:text-white transition-colors duration-200"
                    >
                        Play without an account
                    </Link>
                </div>
            </div>
        </div>
    );
}