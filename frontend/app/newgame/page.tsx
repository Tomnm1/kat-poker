"use client";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Change to next/navigation for Client Components
import { useEffect, useState } from "react";
import { postData } from "../utils/http";

export default function SecondPage() {
    const [gameName, setGameName] = useState<string>(""); // State to hold the game name
    const [loading, setLoading] = useState<boolean>(false); // Loading state for the request
    const [error, setError] = useState<string>("");

    const router = useRouter(); // Hook to handle navigation with next/navigation
    // Function to handle POST request with the game name

    //remove user data from local storage when the component mounts
    useEffect(() => {
     
        const token = localStorage.getItem("token");
        localStorage.removeItem("hasShownJoinDialog");

        if (!token) {
            localStorage.removeItem("username");
        }
       
    }, []);
    const handleSubmit = async () => {
        if (!gameName) {
            setError("Game name cannot be empty.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Use the postData function to send a POST request to the server
            const response = await postData("/sessions", { name: gameName });

            console.log("Game created successfully:", response);
            // Optionally, you can redirect or display success message based on the response
            router.push(`/game/${response.id}`); // Navigate to the game page with ID
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center">
            <h1 className="text-4xl font-bold text-white">New Game</h1>
            <p className="mt-4 text-lg text-gray-400">Create a new game and invite your friends!</p>

            <input
                type="text"
                value={gameName}
                onChange={e => setGameName(e.target.value)}
                className="mt-6 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter game name"
            />

            {error && <p className="mt-2 text-red-500">{error}</p>}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : ""}`}
            >
                {loading ? "Creating Game..." : "Create Game"}
            </button>

            <Link
                href="/"
                className="mt-4 px-4 py-2 text-lg font-semibold text-white bg-gray-600 rounded hover:bg-gray-700 transition duration-200"
            >
                Back to Home
            </Link>
        </div>
    );
}
