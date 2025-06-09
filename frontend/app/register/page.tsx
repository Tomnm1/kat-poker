"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postData } from "../utils/http"; // Assuming postData sends POST requests to your backend
import Link from "next/link";
import {ConsentCheckbox} from "@/app/register/consent-checkbox";

export default function RegistrationPage() {
    const [username, setUsername] = useState<string>(""); // Stores the username entered by the user
    const [password, setPassword] = useState<string>(""); // Stores the password entered by the user
    const [confirmPassword, setConfirmPassword] = useState<string>(""); // Confirms password
    const [loading, setLoading] = useState<boolean>(false); // Loading state for the request
    const [error, setError] = useState<string>("");
    const [privacyConsent, setPrivacyConsent] = useState<boolean>(false);


    const router = useRouter(); // Hook to handle navigation

    // Function that handles form submission
    const handleSubmit = async () => {
        if (!username || !password || !confirmPassword) {
            setError("All fields are required.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Sending a POST request to the backend to create a new user
            const response = await postData("/register", { username, password });

            // If registration is successful, redirect to login page
            if (response && response.id) {
                router.push("/login"); // Redirect to login page after successful registration
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
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center">
            <h1 className="text-4xl font-bold text-white">Register</h1>
            <p className="mt-4 text-lg text-gray-400">
                Create an account to join the game!
            </p>

            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-6 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter Username"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-4 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter Password"
            />
            <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-4 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Confirm Password"
            />
            <ConsentCheckbox
                checked={privacyConsent}
                onChangeAction={setPrivacyConsent}
                required={true}
            />


            {error && <p className="mt-2 text-red-500">{error}</p>}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : ""}`}
            >
                {loading ? "Registering..." : "Register"}
            </button>

            <Link
                href="/login"
                className="mt-4 px-4 py-2 text-lg font-semibold text-white bg-gray-600 rounded hover:bg-gray-700 transition duration-200"
            >
                Already have an account? Log in
            </Link>
             <Link
                href="/"
                className="mt-4 px-4 py-2 text-lg font-semibold text-white bg-gray-600 rounded hover:bg-gray-700 transition duration-200"
            >
                Play KAT Poker without an account
            </Link>
        </div>
    );
}
