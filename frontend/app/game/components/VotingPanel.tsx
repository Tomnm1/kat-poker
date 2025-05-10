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

    return (
        <div className="flex flex-col items-center mt-4">
            {!submitted && <span className="text-lg mb-2">Choose your estimation!</span>}
            <div className="flex flex-wrap gap-4 justify-center mb-5">
                {storyPoints.map((num) => (
                    <Card
                        key={num}
                        number={num}
                        onClick={() => handleCardToggle(num)}
                        isSelected={selectedValue === num}
                        card_styles={`cursor-pointer transition-transform duration-200 ${
                            selectedValue === num ? "scale-110 border-4 border-yellow-400" : "hover:scale-105"
                        }`}
                    />
                ))}
            </div>

            {submitted && selectedValue !== null && !revealed && (
                <div className="mt-4">
                    <Card
                        number={selectedValue}
                        card_styles="border-4 border-blue-500"
                        text_styles="text-blue-400"
                        isSelected={true}
                    />
                </div>
            )}

            {revealed && (
                <div className="mt-4 mb-6 flex flex-wrap gap-4">
                    {Object.entries(usersChoices).map(([owner, number]) => (
                        <Card key={owner} number={number} isSelected={true} owner={owner} />
                    ))}
                </div>
            )}

           {!revealed &&(<div className="flex flex-col mt-4">
                {submitted  ? (
                    <div>
                        {!revealed && (
                            <button
                                onClick={rollbackChoice}
                                disabled={selectedValue === null}
                                className="mt-2 px-4 py-2 text-lg font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition duration-200"
                            >
                                Rollback your choice
                            </button>
                        )}
                      
                    </div>
                ) : (
                    <button
                        onClick={submitChoice}
                        disabled={selectedValue === null}
                        className="mt-2 px-4 py-2 text-lg font-semibold text-white bg-pink-600 rounded hover:bg-pink-700 transition duration-200"
                    >
                        Submit your choice
                    </button>
                )}
            </div>)} 
        </div>
    );
};

export default VotingPanel;
