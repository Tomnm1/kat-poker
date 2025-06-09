"use client";

import Link from "next/link";
import { useRouter } from "next/navigation"; // Hook do nawigacji
import { useEffect, useState } from "react";
import { getData } from "../utils/http";

export default function JoinGamePage() {
    const [gameId, setGameId] = useState<string>(""); // Przechowuje ID gry
    const [loading, setLoading] = useState<boolean>(false); // Stan ładowania dla zapytania
    const [error, setError] = useState<string>("");

    const router = useRouter(); // Hook do obsługi nawigacji

    const fetchRoundStarted = async () => {
        const response = await getData(`/sessions/${gameId}/round-started`);
        const round_started = response.roundStarted;
        localStorage.setItem("round_started", round_started);
        console.log("przekazane 1: ", round_started);
    }
    //remove user data from local storage when the component mounts
    useEffect(() => {
  
        const token = localStorage.getItem("token");

        if (!token) {
            localStorage.removeItem("username");
        }
       
    }, []);

    // Funkcja obsługująca wysyłanie zapytania o grę
    const handleSubmit = async () => {
        if (!gameId) {
            setError("Game ID cannot be empty.");
            return;
        }
        // localStorage.removeItem("round_started");

        setLoading(true);
        setError("");

        try {
            // Wysyłamy zapytanie, aby sprawdzić, czy gra o danym ID istnieje
            const response = await getData(`/sessions/${gameId}`); // Zakładając, że zapytanie do API zwraca odpowiedź o istnieniu gry
            fetchRoundStarted();

            if (response && response.id) {
                // Jeśli gra istnieje, przekieruj do strony gry
                router.push(`/game/${gameId}`);
            } else {
                setError("Game with the provided ID does not exist.");
            }
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center">
            <h1 className="text-4xl font-bold text-white">Join an Existing Game</h1>
            <p className="mt-4 text-lg text-gray-400">
                Enter the Game ID to join an existing game!
            </p>

            <input
                type="text"
                value={gameId}
                onChange={e => setGameId(e.target.value)}
                className="mt-6 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter Game ID"
            />

            {error && <p className="mt-2 text-red-500">{error}</p>}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : ""}`}
            >
                {loading ? "Joining Game..." : "Join Game"}
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
