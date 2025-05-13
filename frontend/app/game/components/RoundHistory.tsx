"use client";

import React, { useState } from "react";

interface Round {
    id: string;
    votes: Record<string, number>;
}

interface RoundHistoryProps {
    roundHistory: Round[];
    players: string[];
}

const RoundHistory: React.FC<RoundHistoryProps> = ({ roundHistory, players }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!roundHistory || roundHistory.length === 0) {
        return (
            <div className="p-6 bg-gray-800 rounded-lg text-white">
                <p>No round history available yet.</p>
            </div>
        );
    }

    const currentRound = roundHistory[currentIndex];
    const votes = Object.entries(currentRound.votes);

    const voteValues = Object.values(currentRound.votes);
    const average = voteValues.length > 0
        ? voteValues.reduce((a, b) => a + b, 0) / voteValues.length
        : 0;
    const min = voteValues.length > 0 ? Math.min(...voteValues) : 0;
    const max = voteValues.length > 0 ? Math.max(...voteValues) : 0;
    const roundNumber = parseInt(currentRound.id.replace("round-", ""));

    const nonVoters = players.filter(player => !Object.keys(currentRound.votes).includes(player));

    return (
      <div className="p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Round History</h2>
          <div className="text-sm bg-gray-700 px-3 py-1 rounded">
            Round {roundNumber} of {roundHistory.length}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 bg-gray-700 p-2 rounded">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-3 py-1 bg-blue-600 rounded disabled:bg-gray-600 disabled:opacity-50"
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {roundHistory.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full ${
                  idx === currentIndex ? "bg-blue-500" : "bg-gray-500"
                }`}
                aria-label={`Go to round ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex(prev => Math.min(roundHistory.length - 1, prev + 1))}
            disabled={currentIndex === roundHistory.length - 1}
            className="px-3 py-1 bg-blue-600 rounded disabled:bg-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Round Votes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {votes.map(([player, vote]) => (
              <div key={player} className="bg-gray-700 p-3 rounded flex flex-col items-center">
                <div className="text-xl font-bold mb-1">{vote}</div>
                <div className="text-sm text-gray-300">{player}</div>
              </div>
            ))}

            {nonVoters.map(player => (
              <div key={player} className="bg-gray-700 p-3 rounded opacity-50 flex flex-col items-center">
                <div className="text-sm italic mb-1">Did not vote</div>
                <div className="text-sm text-gray-300">{player}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2 text-center">Round Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-300">Average</div>
              <div className="text-xl font-bold">{average.toFixed(1)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-300">Min</div>
              <div className="text-xl font-bold">{min}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-300">Max</div>
              <div className="text-xl font-bold">{max}</div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default RoundHistory;