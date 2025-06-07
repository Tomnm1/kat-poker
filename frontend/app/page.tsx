"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { postData } from "./utils/http";

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState<string>("");

    // Check localStorage for username and token
    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        const token = localStorage.getItem("token");

        if (storedUsername && token) {
            setUsername(storedUsername);
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogout = async () => {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                await postData("/logout", { token }, token);

                // Clear localStorage after successful logout
                localStorage.removeItem("username");
                localStorage.removeItem("token");
                localStorage.removeItem("hasShownJoinDialog");

                setIsLoggedIn(false);
                setUsername("");
            } catch (error: any) {
                console.error("Logout failed:", error.message);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center">
            {/* Login/Logout info at the top-right */}
            <div className="absolute top-6 right-6 text-white">
                {isLoggedIn ? (
                    <div className="mt-6 text-lg">
                        <p>Logged in as {username}</p>
                        <button
                            onClick={handleLogout}
                            className="mt-2 px-4 py-2 text-lg font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition duration-200"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="mt-6 px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200"
                    >
                        Login
                    </Link>
                )}
            </div>

            {/* Main Content */}
            <h1 className="text-4xl font-bold text-white">KAT Poker</h1>
            <p className="mt-4 text-lg text-gray-400">Welcome to KAT Poker!</p>

            <Link
                href="/newgame"
                className="mt-6 px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200"
            >
                Start a New Game
            </Link>
            <Link
                href="/joinGame"
                className="mt-4 px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200"
            >
                Join an Existing Game
            </Link>
        </div>
    );
}
