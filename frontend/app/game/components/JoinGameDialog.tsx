// components/JoinGameDialog.tsx
"use client";

import { postData } from "@/app/utils/http";
import { useState } from "react";

interface JoinGameDialogProps {
    gameId: string;
    onSuccess: () => void;
    onError: (errorMessage: string) => void;
}

const JoinGameDialog: React.FC<JoinGameDialogProps> = ({ gameId, onSuccess, onError }) => {
    const [username, setUsername] = useState<string>(""); // Stan dla nazwy użytkownika
    const [loading, setLoading] = useState<boolean>(false); // Stan dla ładowania
    const [error, setError] = useState<string>(""); // Stan dla błędów

    const handleJoinGame = async () => {
        if (!username) {
            setError("Username cannot be empty.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 	r.HandleFunc("/sessions/{id}/join", joinSession).Methods("POST")
            const response = await postData(`/sessions/${gameId}/join`, { PlayerName: username });
            console.log("Joined game successfully:", response);
            onSuccess(); // Call onSuccess without passing username
            localStorage.setItem("username", username); // Zapisz nazwę użytkownika w localStorage
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
            onError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center   bg-opacity-50 z-50">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h2 className="text-2xl font-semibold  mb-4">
                    Enter your username to join the game
                </h2>

                <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full p-2 mb-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Enter your username"
                />

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <button
                    onClick={handleJoinGame}
                    disabled={loading}
                    className={`w-full px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : ""}`}
                >
                    {loading ? "Joining..." : "Join Game"}
                </button>
            </div>
        </div>
    );
};

export default JoinGameDialog;
