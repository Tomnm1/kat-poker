// app/game/[id]/page.tsx
"use client";

import { getData, postData } from "@/app/utils/http";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import JoinGameDialog from "../components/JoinGameDialog";
import PlayersList from "../components/PlayersList";
import { deleteData } from "@/app/utils/api/delete";
import Card from "../components/Card";

const GamePage = () => {
    const { id } = useParams(); // Pobierz ID gry z URL
    const [joined, setJoined] = useState<boolean>(false); // Stan, który śledzi, czy użytkownik dołączył
    const [error, setError] = useState<string>(""); // Stan dla błędów, jeśli wystąpią
    const [gameId, setGameId] = useState<string | null>(null); // Stan do przechowywania ID gry
    const [gameName, setGameName] = useState<string>(""); // Stan do przechowywania nazwy gry
    const [username, setUsername] = useState<string | null>(null); // Stan do przechowywania nazwy użytkownika
    const [playersList, setPlayersList] = useState<string[]>([]); // Stan do przechowywania listy graczy
    const [loading, setLoading] = useState<boolean>(false); // Stan ładowania dla zapytania
    const [roundStarted, setRoundStarted] = useState<boolean>(false);
    const [selectedValue, setSelectedValue] = useState<number | null>(null);
    const [usersChoices, setUsersChoices] = useState<{ [username: string]: number }>({});
    const [submitted, setSubmitted] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const storyPoints = [1, 2, 3, 5, 8, 13, 20, 40];

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

        const round_started = localStorage.getItem("round_started");
        setRoundStarted(round_started == "true");
        console.log("odebrane: ", round_started);

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
        
    }

    const handleCardToggle = (value: number) => {
        if (selectedValue === value) {
            setSelectedValue(null);
        } else {
            setSelectedValue(value);
        }
    };

    const submitChoice = async () => {
        if (!gameId || selectedValue === null || !username) return;
    
        setSelectedValue(selectedValue);
        setUsersChoices(prev => ({
            ...prev,
            [username]: selectedValue,
        }));
    
        setSubmitted(true);
    
        const response = await postData(`/sessions/${gameId}/vote`, 
            { PlayerName: username, vote: selectedValue }
        );
    };

    const rollbackChoice = async () => {
        if (!gameId || selectedValue === null || !username) return;
    
        try {
            await postData(`/sessions/${gameId}/rollback-vote`, 
                { PlayerName: username }
            );
            setSubmitted(false);
            setSelectedValue(null);
            setUsersChoices(prev => {
                const updated = { ...prev };
                delete updated[username];
                return updated;
            });
            console.log(usersChoices);
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        }
    };
    useEffect(() => {
        console.log("usersChoices updated:", usersChoices);
    }, [usersChoices]);

    const revealChoices = async () => {
        if (!gameId) return;
        setRevealed(true);
        
        const response = await getData(`/sessions/${gameId}/results`);
        setUsersChoices(response["votes"]);
    }

    const hideChoices = async () => {
        if (!gameId) return;
        setRevealed(false);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-24 text-center">
            {gameId ? (
                <>
                    {!joined && (
                        <JoinGameDialog
                            gameId={gameId}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                    )}
                    {!roundStarted && (<h2 className="text-lg font-normal">
                        Welcome to KAT poker
                        <span className="text-violet-500 font-semibold"> {username}</span>
                        !
                    </h2>)}
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
                    <br/>
                    {roundStarted &&(<h4 className="text-2xl font-bold text-violet-500 mb-2">
                        {username}
                    </h4>)}

                    {!roundStarted ? <button
                        onClick={startRound}
                        className={`mt-5 px-4 py-2 text-lg font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition duration-200 cursos-pointer`}
                    >
                        Start a round
                    </button>
                    : (<>
                        {!submitted && (<span className="text-lg mb-2">Choose your estimation!</span>)}
                        <br/>
                        {submitted === false && (<div className="flex flex-wrap gap-4 justify-center mb-5">
                            {storyPoints.map((num, idx) => (
                                <Card key={idx} number={num} onClick={handleCardToggle} isSelected={selectedValue === num} />
                            ))}
                        </div>)}
                        {selectedValue !== null && !revealed && (
                            <div className="mt-4">
                                <Card 
                                    number={selectedValue} 
                                    card_styles={`border-3 ${submitted ? 'border-blue-500' : 'border-green-300'}`}
                                    text_styles={`${submitted ? 'text-blue-400' : 'text-green-500'}`}
                                    isSelected={true}
                                />
                            </div>
                        )}

                        {revealed && (
                            <div className="mt-4 mb-6 flex flex-wrap gap-4">
                                {Object.entries(usersChoices).map(([owner, number]) => (
                                    <Card 
                                        key={owner}
                                        number={number}
                                        isSelected={true}
                                        owner={owner}
                                    />
                                ))}
                            </div>
                        )}


                        {selectedValue && (<div className="flex flex-col">
                            {submitted ? (<div>
                                {!revealed && <button
                                    onClick={rollbackChoice}
                                    disabled={selectedValue === null}
                                    className={`mt-10 mr-5 px-4 py-2 text-lg font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition duration-200 cursos-pointer`}
                                >
                                    Rollback your choice
                                </button>}
                                {(!revealed ? <button
                                    onClick={revealChoices}
                                    className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-violet-600 rounded hover:bg-violet-700 transition duration-200 cursos-pointer`}
                                >
                                    Reveal your mates' choices
                                </button>
                                : <button
                                    onClick={hideChoices}
                                    className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-violet-600 rounded hover:bg-violet-700 transition duration-200 cursos-pointer`}
                                >
                                    Hide your mates' choices
                                </button>)}
                            </div>
                            )
                            : (<button
                                onClick={submitChoice}
                                disabled={selectedValue === null}
                                className={`mt-10 px-4 py-2 text-lg font-semibold text-white bg-pink-600 rounded hover:bg-pink-700 transition duration-200 cursos-pointer`}
                            >
                                Submit your choice
                            </button>)}
                        </div>)}
                    </>)}
                    <button
                        onClick={quitGame}
                        disabled={loading}
                        className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-gray-600 rounded hover:bg-gray-700 transition duration-200 cursos-pointer ${loading ? "bg-gray-400 cursor-not-allowed" : ""}`}
                    >
                        Quit the game
                    </button>

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
