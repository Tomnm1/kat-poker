"use client";

import { getData, postData } from "@/app/utils/http";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import PlayersList from "../../components/PlayersList";
import JoinGameDialog from "../../components/JoinGameDialog";
import Card from "../../components/Card";

const RoundPage = () => {
    const { id } = useParams(); // Pobierz ID gry z URL
    const [joined, setJoined] = useState<boolean>(false); // Stan, który śledzi, czy użytkownik dołączył
    const [error, setError] = useState<string>("");     
    const [gameId, setGameId] = useState<string | null>(null);
    const [gameName, setGameName] = useState<string>("");
    const [username, setUsername] = useState<string | null>(null);
    const [playersList, setPlayersList] = useState<string[]>([]);
    const [selectedValue, setSelectedValue] = useState<number | null>(null);
    const [usersChoices, setUsersChoices] = useState<{ [username: string]: number }>({});
    const [submitted, setSubmitted] = useState(false);
    const storyPoints = [1, 2, 3, 5, 8, 13, 20, 40];

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

    const unsubmitChoice = async () => {
        if (!gameId || selectedValue === null || !username) return;
    
        setSelectedValue(selectedValue);
        setUsersChoices(prev => ({
            ...prev,
            [username]: selectedValue,
        }));
    
        setSubmitted(false);
    
        const response = await postData(`/sessions/${gameId}/vote`, 
            { PlayerName: username, vote: selectedValue }
        );
    };
    

    const revealChoices = async () => {
        if (!gameId) return;
        
        const response = await getData(`/sessions/${gameId}/results`);
        
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-20 text-center">
            {gameId ? (
                <>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Game name: <span className="text-red-500">{gameName}</span>
                    </h1>

                    <h1 className="text-2xl font-bold text-white mb-5">
                        Game ID:
                        <span className="text-red-300"> {gameId}</span>
                        <br/>
                    </h1>
                    <br/>
                    <h4 className="text-2xl font-bold text-violet-500 mb-2">
                        {username}
                    </h4>

                    {!submitted && (<span className="text-lg mb-2">Choose your estimation!</span>)}
                    <br/>
                    {submitted === false && (<div className="flex flex-wrap gap-4 justify-center mb-5">
                        {storyPoints.map((num, idx) => (
                            <Card key={idx} number={num} onClick={handleCardToggle} isSelected={selectedValue === num} />
                        ))}
                    </div>)}
                    {selectedValue !== null && (
                        <div className="mt-4">
                            <Card 
                                number={selectedValue} 
                                card_styles={`border-3 ${submitted ? 'border-blue-500' : 'border-green-300'}`}
                                text_styles={`${submitted ? 'text-blue-400' : 'text-green-500'}`}
                                isSelected={true}
                            />
                        </div>
                    )}

                    {selectedValue && (<div className="flex flex-col">
                        {submitted ? (<button
                            onClick={unsubmitChoice}
                            disabled={selectedValue === null}
                            className={`mt-10 px-4 py-2 text-lg font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition duration-200 cursos-pointer`}
                        >
                            Rollback your choice
                        </button>)
                        : (<button
                            onClick={submitChoice}
                            disabled={selectedValue === null}
                            className={`mt-10 px-4 py-2 text-lg font-semibold text-white bg-pink-600 rounded hover:bg-pink-700 transition duration-200 cursos-pointer`}
                        >
                            Submit your choice
                        </button>)}
                        <button
                            onClick={revealChoices}
                            className={`mt-4 px-4 py-2 text-lg font-semibold text-white bg-violet-600 rounded hover:bg-violet-700 transition duration-200 cursos-pointer`}
                        >
                            Reveal your mates' choices
                        </button>
                    </div>)}
                    <Link
                        href="/"
                        className="mt-10 px-4 py-2 text-lg font-semibold text-white bg-gray-600 rounded hover:bg-gray-700 transition duration-200"
                    >
                        Quit the game
                    </Link>

                    <PlayersList players={playersList} />
                </>
            ) : (
                <p className="text-red-500">Something went wrong, game ID is missing.</p>
            )}

            {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
    );
};

export default RoundPage;