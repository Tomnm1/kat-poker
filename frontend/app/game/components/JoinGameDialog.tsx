"use client";

import { getData, postData } from "@/app/utils/http";
import { useEffect, useState } from "react";

interface JoinGameDialogProps {
    gameId: string;
    onSuccess: () => void;
    onError: (errorMessage: string) => void;
}

const JoinGameDialog: React.FC<JoinGameDialogProps> = ({ gameId, onSuccess, onError }) => {
    const [username, setUsername] = useState<string>(""); // State for username
    const [loading, setLoading] = useState<boolean>(false); // State for loading
    const [error, setError] = useState<string>(""); // State for error messages
    const [message, setMessage] = useState<string>(""); // State for success/failure message
    const storedUsername = localStorage.getItem("username"); // Get username from localStorage

    // Load the username from localStorage if it exists
    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    const fetchRoundStarted = async () => {
        const response = await getData(`/sessions/${gameId}/round-started`);
        const round_started = response.roundStarted;
        localStorage.setItem("round_started", round_started);
    };

    const handleJoinGame = async () => {
        if (!username) {
            setError("Username cannot be empty.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Make a POST request to join the game
            const response = await postData(`/sessions/${gameId}/join`, { PlayerName: username });
            onSuccess(); // Call onSuccess without passing username
            localStorage.setItem("username", username); // Save username in localStorage
            fetchRoundStarted();
            setMessage("Username saved successfully!"); // Show success message after joining
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
            onError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-sm z-50">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h2 className="text-2xl font-semibold mb-4">
                    {storedUsername ? `Join as ${username}` : "Enter your username to join the game"}
                </h2>

                {!storedUsername && (
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 mb-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                        placeholder="Enter your username"
                    />
                )}

                {error && <p className="text-red-500 mb-4">{error}</p>}
                {message && <p className="text-green-500 mb-4">{message}</p>}

                <button
                    onClick={handleJoinGame}
                    disabled={loading}
                    className={`w-full px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200 cursor-pointer ${loading ? "bg-gray-400 cursor-not-allowed" : ""}`}
                >
                    {loading ? "Joining..." : "Join Game"}
                </button>
            </div>
        </div>
    );
};

export default JoinGameDialog;
