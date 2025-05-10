"use client";

import { deleteData } from "@/app/utils/api/delete";
import { getData, postData } from "@/app/utils/http";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import JoinGameDialog from "../components/JoinGameDialog";
import PlayersList from "../components/PlayersList";
import VotingPanel from "../components/VotingPanel";

const GamePage = () => {
    const { id } = useParams();
    const router = useRouter();

    const searchParams = useSearchParams();
    const isInvite = searchParams.get("invite") === "true";

    const [joined, setJoined] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [gameId, setGameId] = useState<string | null>(null);
    const [gameName, setGameName] = useState<string>("");
    const [username, setUsername] = useState<string | null>(null);
    const [playersList, setPlayersList] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [roundStarted, setRoundStarted] = useState<boolean>(false);
    const [selectedValue, setSelectedValue] = useState<number | null>(null);
    const [usersChoices, setUsersChoices] = useState<{ [username: string]: number }>({});
    const [submitted, setSubmitted] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [playerVotes, setPlayerVotes] = useState<{ [username: string]: boolean }>({});

    const storyPoints = [1, 2, 3, 5, 8, 13, 20, 40];

    useEffect(() => {
        if (id) {
            setGameId(typeof id === "string" ? id : null);
        } else {
            setError("Something went wrong, game ID is missing.");
        }

        const savedUsername = localStorage.getItem("username");
        if (savedUsername) {
            setUsername(savedUsername);
            setJoined(true);
        }
        if (gameId && joined) {
            fetchGameInfo();
        }

        const invite = searchParams.get("invite");
        if (invite === "true" && !joined) {
            setJoined(false);
        }
        const ws = new WebSocket(`ws://localhost:8080/sessions/${id}/ws`);
        ws.onmessage = event => {
            const message = event.data;
            if (message === "/starting") {
                setRoundStarted(true);
            }
            if (message == "/player-joined" || message == "/player-left") {
                // Fetch the game info again to update the players list
                fetchGameInfo();
            }
            if (message.startsWith("/player-voted:")) {
                const votedPlayer = message.split(":")[1];
                setPlayerVotes(prev => ({
                    ...prev,
                    [votedPlayer]: true,
                }));
            }
        };

        const round_started = localStorage.getItem("round_started");
        setRoundStarted(round_started === "true");
    }, [id, joined, gameId]);

    const fetchGameInfo = async () => {
        if (!gameId) return;
        try {
            const response = await getData(`/sessions/${gameId}`);
            setPlayersList(response.players || []);
            setGameName(response.name || "");
        } catch (error: any) {
            setError(error.message || "Failed to load players list.");
        }
    };

    const handleSuccess = () => {
        setJoined(true);
        fetchGameInfo();
    };

    const quitGame = async () => {
        if (!gameId || !username) return;
        setLoading(true);
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
        if (!roundStarted) {
            try {
                await postData(`/sessions/${gameId}/start`, {});
                setRoundStarted(true);
            } catch (error: any) {
                setError(error.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        }
    };

    const copyInviteLink = () => {
        if (!gameId) return;
        const inviteLink = `${window.location.origin}/game/${gameId}?invite=true`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert("Invite link copied to clipboard!");
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center">
            {gameId ? (
                <>
                    {!joined && (
                        <JoinGameDialog
                            gameId={gameId}
                            onSuccess={handleSuccess}
                            onError={setError}
                        />
                    )}

                    <h1 className="text-4xl font-bold text-white mb-6">
                        Game name: <span className="text-red-500">{gameName}</span>
                    </h1>

                    <h1 className="text-2xl font-bold text-white mb-6">
                        Game ID: <span className="text-red-300">{gameId}</span>
                        <br />
                        <span className="text-sm text-gray-500 font-normal">
                            Copy and share it with other players.
                        </span>
                    </h1>

                    <PlayersList
                        players={playersList.map(player =>
                            playerVotes[player] ? `${player} - Voted` : player,
                        )}
                    />
                    <button
                        onClick={copyInviteLink}
                        className="mt-3 px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200"
                    >
                        Copy Invite Link
                    </button>

                    {!roundStarted ? (
                        <button
                            onClick={startRound}
                            className="mt-5 px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200"
                        >
                            Start a round
                        </button>
                    ) : (
                        <VotingPanel
                            gameId={gameId}
                            username={username}
                            storyPoints={storyPoints}
                            selectedValue={selectedValue}
                            setSelectedValue={setSelectedValue}
                            usersChoices={usersChoices}
                            setUsersChoices={setUsersChoices}
                            submitted={submitted}
                            setSubmitted={setSubmitted}
                            revealed={revealed}
                            setRevealed={setRevealed}
                            setError={setError}
                        />
                    )}

                    <button
                        onClick={quitGame}
                        disabled={loading}
                        className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-gray-600 rounded hover:bg-gray-700 transition duration-200 ${
                            loading ? "bg-gray-400 cursor-not-allowed" : ""
                        }`}
                    >
                        Quit the game
                    </button>
                </>
            ) : (
                <p className="text-red-500">Something went wrong, game ID is missing.</p>
            )}

            {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
    );
};

export default GamePage;
