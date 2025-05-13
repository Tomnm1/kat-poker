"use client";

import { deleteData } from "@/app/utils/api/delete";
import { getData, postData } from "@/app/utils/http";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import JoinGameDialog from "../components/JoinGameDialog";
import PlayersList from "../components/PlayersList";
import VotingPanel from "../components/VotingPanel";
import RoundHistory from "../components/RoundHistory";
// Modyfikacja page.tsx - dodajemy tylko nowe funkcjonalności związane z rundami

// Dodaj RoundSummary do importów
import RoundSummary from "../components/RoundSummary";
// W page.tsx, dodaj import:
import RoundIndicator from "../components/RoundIndicator";

interface Round {
  id: string;
  votes: Record<string, number>;
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
        
        let ws: WebSocket;
        
        if (gameId) {
            ws = new WebSocket(`ws://localhost:8080/sessions/${gameId}/ws`);
            
            ws.onopen = () => {
                console.log("WebSocket connection established");
            };
            
            ws.onerror = (error) => {
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
                const allVoted = Object.keys(response.currentRound.votes || {}).length === response.players.length;
                if (allVoted) {
                    setRevealed(true);
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
                setRevealed(false);
                setSubmitted(false);
                setSelectedValue(null);
                setPlayerVotes({});
                setShowHistory(false); // Przełącz widok na bieżącą rundę
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
        
        await fetchGameInfo();
      } catch (error: any) {
        console.error("Failed to start new round:", error);
        setError(error.message || "Something went wrong when trying to start a new round.");
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
                        <button
                          onClick={toggleHistoryView}
                          className={`px-3 py-2 text-sm font-semibold text-white rounded transition duration-200 ${
                            showHistory && !showSummary ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"
                          }`}
                        >
                          {showHistory && !showSummary ? "Current Round" : "History"}
                        </button>
                        
                        <button
                          onClick={toggleSummaryView}
                          className={`px-3 py-2 text-sm font-semibold text-white rounded transition duration-200 ${
                            showSummary ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-600 hover:bg-gray-700"
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
                        {playersList.length > 0 && username === playersList[0] && !revealed && (
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
                        <p className="text-lg">Start a new round to begin voting.</p>
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
            </div>
          </div>
          
          <div className="text-center mt-6">
            <button
              onClick={quitGame}
              disabled={loading}
              className={`px-4 py-2 text-lg font-semibold text-white bg-gray-600 rounded hover:bg-gray-700 transition duration-200 ${
                loading ? "bg-gray-400 cursor-not-allowed" : ""
              }`}
            >
              Quit Game
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
  </div>
);
};

export default GamePage;