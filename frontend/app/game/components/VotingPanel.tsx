import React, { useEffect } from "react";
import { getData, postData } from "@/app/utils/http";
import Card from "./Card";

interface VotingPanelProps {
    gameId: string;
    username: string | null;
    storyPoints: number[];
    selectedValue: number | null;
    setSelectedValue: React.Dispatch<React.SetStateAction<number | null>>;
    usersChoices: { [username: string]: number };
    setUsersChoices: React.Dispatch<React.SetStateAction<{ [username: string]: number }>>;
    submitted: boolean;
    setSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
    revealed: boolean;
    setRevealed: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string>>;
    players: string[];
}

const VotingPanel: React.FC<VotingPanelProps> = ({
    gameId,
    username,
    storyPoints,
    selectedValue,
    setSelectedValue,
    usersChoices,
    setUsersChoices,
    submitted,
    setSubmitted,
    revealed,
    setRevealed,
    setError,
    players,
}) => {
    const handleCardToggle = (value: number) => {
        setSelectedValue((prev) => (prev === value ? null : value));
    };

    const submitChoice = async () => {
        if (!gameId || selectedValue === null || !username) return;

        try {
            await postData(`/sessions/${gameId}/vote`, {
                PlayerName: username,
                vote: selectedValue,
            });

            setUsersChoices((prev) => ({
                ...prev,
                [username]: selectedValue,
            }));
            setSubmitted(true);
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        }
    };

    const rollbackChoice = async () => {
        if (!gameId || !username) return;

        try {
            await postData(`/sessions/${gameId}/rollback-vote`, {
                PlayerName: username,
            });

            setSubmitted(false);
            setSelectedValue(null);
            setUsersChoices((prev) => {
                const updated = { ...prev };
                delete updated[username];
                return updated;
            });
        } catch (error: any) {
            setError(error.message || "Something went wrong.");
        }
    };

    const revealChoices = async () => {
        if (!gameId) return;

        try {
            const response = await getData(`/sessions/${gameId}/results`);
            setUsersChoices(response.votes || {});
            setRevealed(true);
        } catch (error: any) {
            setError(error.message || "Failed to reveal choices.");
        }
    };

     useEffect(() => {
        if (revealed) {
            revealChoices();
        }
    }, [revealed]);

    const hideChoices = () => {
        setRevealed(false);
    };

    useEffect(() => {
        console.log("Users' choices updated:", usersChoices);
    }, [usersChoices]);

const rollbackVote = async () => {
  if (!gameId || !username) return;
  
  try {
    await postData(`/sessions/${gameId}/rollback-vote`, {
      playerName: username
    });
    setSubmitted(false);
    const newChoices = { ...usersChoices };
    delete newChoices[username];
    setUsersChoices(newChoices);
  } catch (error: any) {
    setError(error.message || "Unable to rollback your vote.");
  }
};

    const votedCount = Object.keys(usersChoices).length;
    const totalPlayers = players.length;
    const percentVoted = totalPlayers > 0 ? (votedCount / totalPlayers) * 100 : 0;

return (
  <div className="flex flex-col items-center">
    {!submitted && !revealed && (
      <span className="text-lg mb-4 text-white font-semibold">Choose your estimation:</span>
    )}
    
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
      {storyPoints.map((num) => (
        <div key={num} className="flex justify-center">
          <Card
            number={num}
            onClick={() => handleCardToggle(num)}
            isSelected={selectedValue === num}
            disabled={submitted || revealed}
            card_styles={`transition-transform duration-200 ${
              selectedValue === num ? "scale-110 border-4 border-yellow-400" : "hover:scale-105"
            }`}
          />
        </div>
      ))}
    </div>
    
    <div className="mt-2 mb-4 w-full">
      <div className="flex justify-between text-sm text-gray-300 mb-1">
        <span>Votes: {votedCount}/{totalPlayers}</span>
        <span>{percentVoted.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${percentVoted}%` }}
        ></div>
      </div>
    </div>

    {submitted && selectedValue !== null && !revealed && (
      <div className="mt-4 mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Your vote:</h3>
        <Card
          number={selectedValue}
          card_styles="border-4 border-blue-500 mx-auto"
          text_styles="text-blue-400"
          isSelected={true}
        />
      </div>
    )}

    {revealed && (
      <div className="mt-4 mb-4 w-full">
        <h3 className="text-lg font-semibold text-white mb-4">Voting results:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Object.entries(usersChoices).map(([owner, number]) => (
            <div key={owner} className="flex flex-col items-center">
              <Card 
                number={number} 
                isSelected={true} 
                card_styles="mx-auto"
              />
              <div className="mt-1 text-sm text-gray-300 truncate max-w-full">{owner}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    {!revealed && (
      <div className="flex gap-4 mt-2">
        {submitted ? (
          <button
            onClick={rollbackVote}
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition duration-200"
          >
            Cancel Vote
          </button>
        ) : (
          <button
            onClick={submitChoice}
            disabled={selectedValue === null}
            className={`px-4 py-2 text-white bg-pink-600 rounded hover:bg-pink-700 transition duration-200 ${
              selectedValue === null ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Submit Vote
          </button>
        )}
      </div>
    )}
  </div>
);
};

export default VotingPanel;