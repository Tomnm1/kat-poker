"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { postData } from "../utils/http"; 
import Link from "next/link";

export default function LoginPage() {
    const [username, setUsername] = useState<string>(""); 
    const [password, setPassword] = useState<string>(""); 
    const [loading, setLoading] = useState<boolean>(false); 
    const [error, setError] = useState<string>("");

    const router = useRouter(); 

    const handleSubmit = async () => {
        if (!username || !password) {
            setError("Username and password are required.");
            return;
        }

        setLoading(true);
        setError("");

        try {
    
            const response = await postData("/login", { username, password }); 
            console.log("response",response);
            if (response && response.token) {

                localStorage.setItem("token", response.token);
                localStorage.setItem("username", username);
                router.push("/"); 
            } else {
                setError("Invalid username or password.");
            }
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center">
            <h1 className="text-4xl font-bold text-white">Login</h1>
            <p className="mt-4 text-lg text-gray-400">
                Please enter your credentials to log in.
            </p>

            <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="mt-6 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter Username"
            />
            <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-4 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter Password"
            />

            {error && <p className="mt-2 text-red-500">{error}</p>}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : ""}`}
            >
                {loading ? "Logging In..." : "Log In"}
            </button>
            <Link
                href="/register"
                className="mt-4 px-4 py-2 text-lg font-semibold text-white bg-gray-600 rounded hover:bg-gray-700 transition duration-200"
            >
                Don't have an account? Register
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
