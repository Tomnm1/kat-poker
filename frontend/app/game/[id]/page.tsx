// app/game/[id]/page.tsx
"use client";

import { getData, postData } from "@/app/utils/http";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import JoinGameDialog from "../components/JoinGameDialog";
import PlayersList from "../components/PlayersList";
import Link from "next/link";
import { deleteData } from "@/app/utils/api/delete";

const GamePage = () => {
    const { id } = useParams(); // Pobierz ID gry z URL
    const [joined, setJoined] = useState<boolean>(false); // Stan, który śledzi, czy użytkownik dołączył
    const [error, setError] = useState<string>(""); // Stan dla błędów, jeśli wystąpią
    const [gameId, setGameId] = useState<string | null>(null); // Stan do przechowywania ID gry
    const [gameName, setGameName] = useState<string>(""); // Stan do przechowywania nazwy gry
    const [username, setUsername] = useState<string | null>(null); // Stan do przechowywania nazwy użytkownika
    const [playersList, setPlayersList] = useState<string[]>([]); // Stan do przechowywania listy graczy
    const [loading, setLoading] = useState<boolean>(false); // Stan ładowania dla zapytania

    const router = useRouter(); // Hook do obsługi nawigacji

    // Używamy useEffect, aby upewnić się, że id jest dostępne
    useEffect(() => {
        if (id) {
            setGameId(typeof id === "string" ? id : null);
        } else {
            setError("Something went wrong, game ID is missing.");
        }

        // Sprawdź, czy nazwa użytkownika jest zapisana w localStorage
        const savedUsername = localStorage.getItem("username");
        if (savedUsername) {
            setUsername(savedUsername);
            setJoined(true); // Jeśli nazwa użytkownika jest zapisana, uznaj, że użytkownik dołączył
        }

        // Wysyłanie zapytania po liście graczy po załadowaniu strony
        if (gameId && joined) {
            fetchGameInfo();
        }
    }, [id, joined, gameId]);
    //function to fetch game info and players list after joining the game or refreshing the page

    const fetchGameInfo = async () => {
        if (!gameId) return;

        try {
            const response = await getData(`/sessions/${gameId}`);
            setPlayersList(response.players || []);
            setGameName(response.name || ""); // Ustaw nazwę gry
        } catch (error: any) {
            setError(error.message || "Failed to load players list.");
        }
    };

    const handleSuccess = () => {
        setJoined(true);
        fetchGameInfo(); // Po sukcesie załaduj listę graczy
    };

    const handleError = (errorMessage: string) => {
        setError(errorMessage);
    };

    const quitGame = async () => {
        if (!gameId) return;

        setLoading(true);
        setError("");

        try {
            await deleteData(`/sessions/${gameId}/players/${username}`);
            router.push(`/`);
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const startRound = async () => {
        if (!gameId) return;
        try {
            const response = await postData(`/sessions/${gameId}/start`, {});
            router.push(`/game/${gameId}/play`);
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center">
            {gameId ? (
                <>
                    {!joined ? (
                            <JoinGameDialog
                                gameId={gameId}
                                onSuccess={handleSuccess}
                                onError={handleError}
                            />
                        ) : (
                            <div className="mt-6 text-green-500">
                                <h2 className="text-lg font-semibold">
                                    You successfully joined the game 
                                    <span className="text-green-200"> {username}</span>
                                    !
                                </h2>
                                <br/>
                            </div>
                        )}
                    <br></br>
                    <h1 className="text-4xl font-bold text-white mb-6">
                        Game name: <span className="text-red-500">{gameName}</span>
                    </h1>

                    <h1 className="text-2xl font-bold text-white mb-6">
                        Game ID:
                        <span className="text-red-300"> {gameId}</span>
                        <br/>
                        <span className="text-sm text-gray-500 font-normal">Copy and share it with other players.</span>
                    </h1>                    

                    <button
                        onClick={startRound}
                        className="mt-4 px-4 py-2 text-lg font-semibold text-white bg-pink-600 rounded hover:bg-pink-700 transition duration-200"
                    >
                        Start the game
                    </button>

                    <button
                        onClick={quitGame}
                        disabled={loading}
                        className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-gray-600 rounded hover:bg-gray-700 transition duration-200 cursos-pointer ${loading ? "bg-gray-400 cursor-not-allowed" : ""}`}
                    >
                        Quit the game
                    </button>

                    {/* Wyświetlanie listy graczy */}
                    <PlayersList players={playersList} />
                </>
            ) : (
                <p className="text-red-500">Something went wrong, game ID is missing.</p>
            )}

            {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
    );
};

export default GamePage;
