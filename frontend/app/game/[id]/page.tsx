// app/game/[id]/page.tsx
"use client";

import { getData } from "@/app/utils/http";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import JoinGameDialog from "../components/JoinGameDialog";
import PlayersList from "../components/PlayersList";

const GamePage = () => {
    const { id } = useParams(); // Pobierz ID gry z URL
    const [joined, setJoined] = useState<boolean>(false); // Stan, który śledzi, czy użytkownik dołączył
    const [error, setError] = useState<string>(""); // Stan dla błędów, jeśli wystąpią
    const [gameId, setGameId] = useState<string | null>(null); // Stan do przechowywania ID gry
    const [gameName, setGameName] = useState<string>(""); // Stan do przechowywania nazwy gry
    const [username, setUsername] = useState<string | null>(null); // Stan do przechowywania nazwy użytkownika
    const [playersList, setPlayersList] = useState<string[]>([]); // Stan do przechowywania listy graczy

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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center">
            {gameId ? (
                <>
                    <h1 className="text-4xl font-bold text-white mb-6">Game name: {gameName}</h1>
                    <h1 className="text-xl font-bold text-white mb-6">
                        Game ID: {gameId} (Send to other players)
                    </h1>

                    {!joined ? (
                        <JoinGameDialog
                            gameId={gameId}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                    ) : (
                        <div className="mt-6 text-green-500">
                            <h2 className="text-2xl font-semibold">
                                Successfully joined the game!
                            </h2>
                        </div>
                    )}
                    <p className="mt-4 text-lg text-gray-400">Welcome to the game, {username}!</p>

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
