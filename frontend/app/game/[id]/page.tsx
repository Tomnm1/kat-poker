"use client";

import { getData, postData } from "@/app/utils/http";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import JoinGameDialog from "../components/JoinGameDialog";
import PlayersList from "../components/PlayersList";
import RoundHistory from "../components/RoundHistory";
import VotingPanel from "../components/VotingPanel";
// Modyfikacja page.tsx - dodajemy tylko nowe funkcjonalności związane z rundami
// Dodaj RoundSummary do importów
import RoundSummary from "../components/RoundSummary";
// W page.tsx, dodaj import:
import RoundIndicator from "../components/RoundIndicator";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation";
import {deleteData} from "@/app/utils/api/delete";

interface Round {
    id: string;
    votes: Record<string, number>;
    user_stories?: string[];
    tasks?: Record<number, string>;
}

interface Session {
    id: string;
    name: string;
    players: string[];
    currentRound?: Round;
    roundHistory?: Round[];
}

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
    // Nowe stany dla obsługi historii rund
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [roundHistory, setRoundHistory] = useState<Round[]>([]);
    const [session, setSession] = useState<Session | null>(null);

    // W komponencie GamePage dodaj nowy stan:
    const [showSummary, setShowSummary] = useState<boolean>(false);

    const storyPoints = [1, 2, 3, 5, 8, 13, 20, 40];

    const [newStory, setNewStory] = useState<string>("");
    const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);
    const [tasksState, setTasksState] = useState<{ [idx: number]: string[] }>({});
    const [taskInput, setTaskInput] = useState<string>("");

    // Delete confirmation hooks
    const storyDeleteConfirmation = useDeleteConfirmation({
        onSuccess: () => {
            console.log('User story deleted successfully');
            fetchGameInfo();
        },
        onError: (error) => {
            console.error('Error deleting user story:', error);
            setError('Failed to delete user story. Please try again.');
        }
    });

    const gameQuitConfirmation = useDeleteConfirmation({
        confirmMessage: `Are you sure you want to quit "${gameName}"?`,
        onSuccess: () => {
            if (username && !localStorage.getItem("token")) {
                localStorage.removeItem("username");
                localStorage.removeItem("token");
            }
            localStorage.removeItem("round_started");
            localStorage.removeItem("hasShownJoinDialog");
            setJoined(false);
            router.push(`/`);
        },
        onError: (error) => {
            console.error('Error quitting game:', error);
            setError('Failed to quit game. Please try again.');
        }
    });

    useEffect(() => {
        if (id) {
            setGameId(typeof id === "string" ? id : null);
        } else {
            setError("Something went wrong, game ID is missing.");
        }

        const savedUsername = localStorage.getItem("username");

        const savedToken = localStorage.getItem("token");
        const hasShownJoinDialog = localStorage.getItem("hasShownJoinDialog");

        if (!hasShownJoinDialog && savedUsername && savedToken) {
            console.log("tu");
            setJoined(false);
            localStorage.setItem("hasShownJoinDialog", "true");
            setUsername(savedUsername);
        }    

        if (savedUsername && !savedToken) {
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

        let ws: WebSocket;
        const url = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (gameId) {
            ws = new WebSocket(`wss://kat-poker-8.onrender.com/sessions/${gameId}/ws`);

            ws.onopen = () => {
                console.log("WebSocket connection established");
            };

            ws.onerror = error => {
                console.error("WebSocket error:", error);
                setError("WebSocket connection error");
            };

            ws.onmessage = event => {
                console.log("WebSocket message received:", event.data);
                const message = event.data;

                if (message === "/starting") {
                    console.log("Round started");
                    setRoundStarted(true);
                    setRevealed(false);
                    setSubmitted(false);
                    setSelectedValue(null);
                    setPlayerVotes({});
                    setShowHistory(false);
                    fetchGameInfo();
                }

                if (message === "/player-joined" || message === "/player-left") {
                    console.log("Player joined/left");
                    fetchGameInfo();
                }

                if (message.startsWith("/player-voted:")) {
                    console.log("Player voted");
                    const votedPlayer = message.split(":")[1];
                    setPlayerVotes(prev => ({
                        ...prev,
                        [votedPlayer]: true,
                    }));
                    fetchGameInfo();
                }

                if (message === "/all-voted") {
                    console.log("All players voted");
                    setRevealed(true);
                    fetchGameInfo();
                }

                if (message === "/reveals") {
                    console.log("Revealing votes");
                    setRevealed(true);
                    fetchGameInfo();
                }

                if (message === "/story-added") {
                    console.log("Adding user-story");
                    fetchGameInfo();
                }

                if (message === "/story-removed") {
                    console.log("Removing user-story");
                    fetchGameInfo();
                }

                if (message === "/task-added") {
                    console.log("Adding a user-story task");
                    fetchGameInfo();
                }
            };
        }

        const round_started = localStorage.getItem("round_started");
        setRoundStarted(round_started === "true");

        return () => {
            if (ws) {
                console.log("Closing WebSocket connection");
                ws.close();
            }
        };
    }, [id, joined, gameId]);

    const fetchGameInfo = async () => {
        if (!gameId) return;
        console.log("Fetching game info for game:", gameId);
        try {
            const response = await getData(`/sessions/${gameId}`);
            console.log("Game info received:", response);

            setSession(response);
            setPlayersList(response.players || []);
            setGameName(response.name || "");

            if (response.roundHistory) {
                setRoundHistory(response.roundHistory);
            }

            if (response.currentRound) {
                setRoundStarted(true);
                setUsersChoices(response.currentRound.votes || {});

                // Ustawienie stanu głosowania graczy
                const votes: { [username: string]: boolean } = {};
                Object.keys(response.currentRound.votes || {}).forEach(player => {
                    votes[player] = true;
                });
                setPlayerVotes(votes);

                // Sprawdzenie czy wszystkie głosy zostały oddane
                const allVoted =
                    Object.keys(response.currentRound.votes || {}).length ===
                    response.players.length;
                if (allVoted) {
                    setRevealed(true);
                }
                if (response.currentRound?.tasks) {
                    const localTasks: { [idx: number]: string[] } = {};
                    for (const [key, value] of Object.entries(response.currentRound.tasks)) {
                        const idx = Number(key);
                        localTasks[idx] = [value as string];
                    }
                    setTasksState(localTasks);
                }
            } else {
                setRoundStarted(false);
            }
        } catch (error: any) {
            console.error("Failed to fetch game info:", error);
            setError(error.message || "Failed to load game information.");
        }
    };

    const handleSuccess = () => {
        setJoined(true);
        fetchGameInfo();
    };

    const revealChoices = async () => {
        if (!gameId) return;
        try {
            await postData(`/sessions/${gameId}/reveal`, {});
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        }
    };

    const quitGame = async () => {
        if (!gameId || !username) return;
        setLoading(true);
        try {
            gameQuitConfirmation.requestDelete(`/sessions/${gameId}/players/${username}`);
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
                setRevealed(false);
                setSubmitted(false);
                setSelectedValue(null);
                setPlayerVotes({});
                setShowHistory(false);
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

    const toggleHistoryView = () => {
        setShowHistory(!showHistory);
        setShowSummary(false);
    };

    const toggleSummaryView = () => {
        setShowSummary(!showSummary);
        if (!showSummary) {
            setShowHistory(true);
        }
    };

    const finishAndStartNewRound = async () => {
        if (!gameId || !roundStarted) return;

        try {
            console.log("Starting new round");
            const result = await postData(`/sessions/${gameId}/start`, {});
            console.log("New round started:", result);

            // Resetowanie stanów dla nowej rundy
            setRoundStarted(true);
            setRevealed(false);
            setSubmitted(false);
            setSelectedValue(null);
            setPlayerVotes({});
            setShowHistory(false);
            setShowSummary(false);
            setTasksState({});
            setNewStory("");

            if (session?.currentRound?.user_stories) {
                for (let i = 0; i < session.currentRound.user_stories.length; i++) {
                    await deleteData(`/sessions/${gameId}/stories/${i}`);
                }
            }

            await fetchGameInfo();
        } catch (error: any) {
            console.error("Failed to start new round:", error);
            setError(error.message || "Something went wrong when trying to start a new round.");
        }
    };

    const handleAddStory = async () => {
        if (!gameId || !newStory.trim()) return;
        try {
            await postData(`/sessions/${gameId}/stories`, { story: newStory.trim() });
            setNewStory("");
            fetchGameInfo();
        } catch (err: any) {
            setError(err.message || "Failed to add story");
        }
    };

    const handleDeleteStory = async (index: number, storyContent: string) => {
        if (!gameId) return;
        
        const confirmMessage = `Are you sure you want to delete this user story?\n\n"${storyContent}"\n\nThis will also remove all associated tasks and cannot be undone!`;
        
        // Set custom message and request deletion
        storyDeleteConfirmation.confirmMessage = confirmMessage;
        storyDeleteConfirmation.requestDelete(`/sessions/${gameId}/stories/${index}`);
    };


    const handleAddTask = async (index: number) => {
        if (!gameId || !taskInput.trim()) return;
        try {
            var response = await postData(`/sessions/${gameId}/stories/${index}`, {
                task: taskInput.trim(),
            });
            setTaskInput("");
            const entries = Object.entries(response);
            const [keyStr, valueRaw] = entries[0];
            const key = Number(keyStr);
            const value = valueRaw as string;
            setTasksState(prev => ({
                ...prev,
                [key]: [...(prev[key] || []), value],
            }));
            fetchGameInfo();
        } catch (err: any) {
            setError(err.message || "Failed to add a task");
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4 md:p-6 lg:p-8 bg-gray-900">
            {gameId ? (
                <>
                    {!joined && (
                        <JoinGameDialog
                            gameId={gameId}
                            onSuccess={handleSuccess}
                            onError={setError}
                        />
                    )}

                    <div className="w-full max-w-7xl mx-auto">
                        <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                    <span className="text-gray-400 mr-2">Game:</span>
                                    <span className="text-red-500">{gameName}</span>
                                </h1>

                                <RoundIndicator
                                    currentRoundId={session?.currentRound?.id}
                                    roundHistoryCount={roundHistory.length}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-center">
                                <h2 className="text-lg font-bold text-white mb-2 sm:mb-0">
                                    <span className="text-gray-400 mr-2">ID:</span>
                                    <span className="text-red-300">{gameId}</span>
                                </h2>

                                <button
                                    onClick={copyInviteLink}
                                    className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200 w-auto"
                                >
                                    Copy Invite Link
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="lg:col-span-1">
                                <div className="bg-gray-800 rounded-lg p-4 shadow-lg h-full">
                                    <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                                        Players
                                    </h3>
                                    <PlayersList
                                        players={playersList.map(player =>
                                            playerVotes[player] ? `${player} - Voted` : player,
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-3">
                                <div className="bg-gray-800 rounded-lg p-4 mb-4 shadow-lg">
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <div>
                                            {roundStarted ? (
                                                <>
                                                    {revealed && (
                                                        <button
                                                            onClick={finishAndStartNewRound}
                                                            className="px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200"
                                                        >
                                                            Start New Round
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <button
                                                    onClick={startRound}
                                                    className="px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200"
                                                >
                                                    Start Round
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {roundHistory.length > 0 && (
                                                <>
                                                    {showHistory && !showSummary ? (
                                                        <button
                                                            onClick={toggleHistoryView}
                                                            className={`px-3 py-2 text-sm font-semibold text-white rounded transition duration-200 ${
                                                                showHistory && !showSummary
                                                                    ? "bg-blue-600 hover:bg-blue-700"
                                                                    : "bg-gray-600 hover:bg-gray-700"
                                                            }`}
                                                        >
                                                            Current Round
                                                        </button>
                                                    ) : <></>}
                                                    {!showHistory ? (
                                                        <button
                                                            onClick={toggleHistoryView}
                                                            className={`px-3 py-2 text-sm font-semibold text-white rounded transition duration-200 ${
                                                                showHistory && !showSummary
                                                                    ? "bg-blue-600 hover:bg-blue-700"
                                                                    : "bg-gray-600 hover:bg-gray-700"
                                                            }`}
                                                        >
                                                            History
                                                        </button>
                                                    ) : <></>}

                                                    <button
                                                        onClick={toggleSummaryView}
                                                        className={`px-3 py-2 text-sm font-semibold text-white rounded transition duration-200 ${
                                                            showSummary
                                                                ? "bg-purple-600 hover:bg-purple-700"
                                                                : "bg-gray-600 hover:bg-gray-700"
                                                        }`}
                                                    >
                                                        {showSummary ? "Hide Summary" : "Summary"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800 rounded-lg shadow-lg p-4">
                                    {!showHistory ? (
                                        <>
                                            {roundStarted ? (
                                                <>
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
                                                        players={playersList}
                                                    />
                                                    {playersList.length > 0 &&
                                                        username === playersList[0] &&
                                                        !revealed && (
                                                            <button
                                                                onClick={revealChoices}
                                                                className="mt-4 px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200"
                                                            >
                                                                Reveal Choices
                                                            </button>
                                                        )}
                                                </>
                                            ) : (
                                                <div className="text-white">
                                                    <p className="text-lg">
                                                        Start a new round to begin voting.
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {showSummary ? (
                                                <RoundSummary
                                                    roundHistory={roundHistory}
                                                    players={playersList}
                                                />
                                            ) : (
                                                <RoundHistory
                                                    roundHistory={roundHistory}
                                                    players={playersList}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                                {roundStarted && !showHistory ? (
                                    <div className="bg-gray-800 rounded-lg p-4 shadow-lg mt-6">
                                        <h3 className="text-xl font-bold text-white mb-4">
                                            User Stories
                                        </h3>
                                        <ul className="mb-4">
                                            {session?.currentRound?.user_stories?.map((story, idx) => (
                                                <li key={idx} className="text-white mb-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="flex-1 mr-4">{story}</span>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <button
                                                                className="text-blue-400 hover:text-blue-300 hover:underline text-sm px-2 py-1 rounded transition-colors"
                                                                onClick={() => {
                                                                    setActiveTaskIndex(idx);
                                                                    setTaskInput("");
                                                                }}
                                                            >
                                                                Add task
                                                            </button>
                                                            <button
                                                                className="text-red-400 hover:text-red-300 hover:underline text-sm px-2 py-1 rounded transition-colors flex items-center gap-1"
                                                                onClick={() => handleDeleteStory(idx, story)}
                                                                disabled={storyDeleteConfirmation.isDeleting}
                                                            >
                                                                {storyDeleteConfirmation.isDeleting && 
                                                                storyDeleteConfirmation.pendingPath?.includes(`stories/${idx}`) ? (
                                                                    <>
                                                                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Deleting...
                                                                    </>
                                                                ) : (
                                                                    <>🗑️ Delete</>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {tasksState[idx] && tasksState[idx].length > 0 && (
                                                        <ul className="mt-2 ml-2 pl-2 border-l-4 border-green-500 text-sm text-green-300 list-disc list-inside">
                                                            {tasksState[idx].map((task, taskIdx) => (
                                                                <li key={taskIdx}>{task}</li>
                                                            ))}
                                                        </ul>
                                                    )}

                                                    {activeTaskIndex === idx && (
                                                        <div className="mt-2 flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={taskInput}
                                                                onChange={e =>
                                                                    setTaskInput(e.target.value)
                                                                }
                                                                placeholder="Enter task"
                                                                className="flex-grow px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                                                            />
                                                            <button
                                                                onClick={async () => {
                                                                    await handleAddTask(idx);
                                                                    setActiveTaskIndex(null);
                                                                }}
                                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                            >
                                                                Submit
                                                            </button>
                                                            <button
                                                                onClick={() => setActiveTaskIndex(null)}
                                                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newStory}
                                                onChange={e => setNewStory(e.target.value)}
                                                placeholder="Add new story"
                                                className="flex-grow px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                                            />
                                            <button
                                                onClick={handleAddStory}
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                ) : <></>}
                            </div>
                        </div>

                        <div className="text-center mt-6">
                            <button
                                onClick={quitGame}
                                disabled={loading || gameQuitConfirmation.isDeleting}
                                className={`px-4 py-2 text-lg font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition duration-200 flex items-center justify-center mx-auto gap-2 ${
                                    loading || gameQuitConfirmation.isDeleting ? "bg-red-400 cursor-not-allowed" : ""
                                }`}
                            >
                                {gameQuitConfirmation.isDeleting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Quitting Game...
                                    </>
                                ) : (
                                    <>🚪 Quit Game</>
                                )}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-red-500">Something went wrong, game ID is missing.</p>
            )}

            {error && (
                <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-md bg-red-800 text-white px-4 py-2 rounded-lg shadow-lg">
                    <p className="text-center">{error}</p>
                </div>
            )}

            {/* Delete Confirmation Modals */}
            <DeleteConfirmationModal
                isOpen={storyDeleteConfirmation.isConfirmOpen}
                isDeleting={storyDeleteConfirmation.isDeleting}
                message={storyDeleteConfirmation.confirmMessage}
                onConfirm={storyDeleteConfirmation.confirmDelete}
                onCancel={storyDeleteConfirmation.cancelDelete}
                title="🗑️ DELETE USER STORY"
            />

            <DeleteConfirmationModal
                isOpen={gameQuitConfirmation.isConfirmOpen}
                isDeleting={gameQuitConfirmation.isDeleting}
                message={gameQuitConfirmation.confirmMessage}
                onConfirm={gameQuitConfirmation.confirmDelete}
                onCancel={gameQuitConfirmation.cancelDelete}
                title="🚪 QUIT GAME CONFIRMATION"
            />


        </div>
    );
};

export default GamePage;
