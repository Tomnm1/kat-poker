"use client";

import React, { useEffect, useState } from "react";

interface Round {
    id: string;
    votes: Record<string, number>;
}

interface RoundSummaryProps {
    roundHistory: Round[];
    players: string[];
}

const RoundSummary: React.FC<RoundSummaryProps> = ({ roundHistory, players }) => {
    const [chartRendered, setChartRendered] = useState(false);

    useEffect(() => {
        // Trigger rerender after component mount to ensure chart renders properly
        setChartRendered(true);
    }, []);

    if (!roundHistory || roundHistory.length === 0) {
        return (
            <div className="p-6 bg-gray-800 rounded-lg text-white">
                <p>No round history available for summary.</p>
            </div>
        );
    }

    // Obliczanie średnich dla każdej rundy
    const roundAverages = roundHistory.map(round => {
        const votes = Object.values(round.votes);
        return votes.length > 0
            ? votes.reduce((a, b) => a + b, 0) / votes.length
            : 0;
    });

    const maxAverage = Math.max(...roundAverages, 1);

    const playerStats: Record<string, { total: number, count: number, rounds: number[] }> = {};

    players.forEach(player => {
        playerStats[player] = { total: 0, count: 0, rounds: [] };
    });

    roundHistory.forEach((round, roundIndex) => {
        Object.entries(round.votes).forEach(([player, vote]) => {
            if (!playerStats[player]) {
                playerStats[player] = { total: 0, count: 0, rounds: [] };
            }
            playerStats[player].total += vote;
            playerStats[player].count += 1;
            playerStats[player].rounds.push(roundIndex);
        });
    });

    const exportGameResults = () => {
        if (!roundHistory || roundHistory.length === 0) return;

        const playerNames = players;
        const roundNumbers = roundHistory.map((round, idx) => `Round ${idx+1}`);

        let csvContent = "data:text/csv;charset=utf-8,";

        csvContent += "Player," + roundNumbers.join(",") + ",Average\n";

        playerNames.forEach(player => {
            let row = player;
            let total = 0;
            let count = 0;

            roundHistory.forEach(round => {
                const vote = round.votes[player];
                row += `,${vote !== undefined ? vote : ""}`;
                if (vote !== undefined) {
                    total += vote;
                    count++;
                }
            });

            const average = count > 0 ? total / count : "";
            row += `,${average !== "" ? average.toFixed(1) : ""}`;

            csvContent += row + "\n";
        });

        let averagesRow = "Round Average";
        roundHistory.forEach(round => {
            const votes = Object.values(round.votes);
            const average = votes.length > 0
                ? votes.reduce((a, b) => a + b, 0) / votes.length
                : "";
            averagesRow += `,${average !== "" ? average.toFixed(1) : ""}`;
        });
        averagesRow += ",";
        csvContent += averagesRow + "\n";

        const encodedUri = encodeURI(csvContent);

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "game_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg text-white">
            <h2 className="text-xl font-bold mb-6 border-b border-gray-700 pb-2">Game Summary</h2>

            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Voting Trend</h3>

                <div className="relative h-64 bg-gray-700 rounded-lg p-4 mb-2">
                    {/* Linie siatki */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4">
                        {[0, 1, 2, 3, 4].map((_, i) => (
                            <div key={i} className="w-full h-px bg-gray-600 opacity-30"></div>
                        ))}
                    </div>

                    <div className="absolute left-2 top-0 h-full flex flex-col justify-between text-xs text-gray-400 p-4">
                        <div>{maxAverage.toFixed(0)}</div>
                        <div>{(maxAverage * 0.75).toFixed(0)}</div>
                        <div>{(maxAverage * 0.5).toFixed(0)}</div>
                        <div>{(maxAverage * 0.25).toFixed(0)}</div>
                        <div>0</div>
                    </div>

                    <div className="flex items-end justify-around h-full pt-6 pb-6 px-8">
                        {roundAverages.map((avg, idx) => {
                            const heightPercent = Math.max(5, (avg / maxAverage) * 100);

                            return (
                                <div key={idx} className="flex flex-col items-center z-10 h-full">
                                    <div className="text-xs text-white mb-1 relative bottom-6">
                                        {avg.toFixed(1)}
                                    </div>
                                    <div className="flex-grow flex items-end">
                                        <div
                                            className="w-12 bg-blue-500 hover:bg-blue-400 rounded-t transition-all duration-300"
                                            style={{ height: `${heightPercent}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs mt-2 text-gray-300">R{idx+1}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-xs text-gray-400 text-center">
                    Chart shows average story points per round
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Player Averages</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Object.entries(playerStats)
                        .filter(([_, stats]) => stats.count > 0)
                        .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
                        .map(([player, stats]) => {
                            const playerAvg = stats.count > 0 ? stats.total / stats.count : 0;
                            const maxPlayerAvg = Math.max(
                                ...Object.values(playerStats)
                                    .filter(s => s.count > 0)
                                    .map(s => s.total / s.count)
                            );
                            const percentOfMax = Math.max(10, (playerAvg / maxPlayerAvg) * 100);

                            return (
                                <div key={player} className="bg-gray-700 p-3 rounded">
                                    <div className="text-sm text-gray-300 mb-1 truncate" title={player}>
                                        {player}
                                    </div>
                                    <div className="text-xl font-bold mb-1">
                                        {playerAvg.toFixed(1)}
                                    </div>
                                    <div className="w-full bg-gray-600 h-1.5 rounded overflow-hidden mb-1">
                                        <div
                                            className="bg-green-500 h-full"
                                            style={{ width: `${percentOfMax}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {stats.count} of {roundHistory.length} rounds
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Team Consensus</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {roundHistory.map((round, idx) => {
                        const votes = Object.values(round.votes);
                        const consensus = calculateConsensus(votes);
                        const consensusClass = getConsensusClass(consensus);
                        const consensusPercent = getConsensusPercent(consensus);

                        return (
                            <div key={idx} className="bg-gray-700 p-3 rounded">
                                <div className="text-sm text-gray-300 mb-1">Round {idx + 1}</div>
                                <div className={`text-lg font-medium ${consensusClass} mb-1`}>
                                    {consensus}
                                </div>
                                <div className="w-full bg-gray-600 h-1.5 rounded overflow-hidden mb-1">
                                    <div
                                        className={`${getConsensusBarColor(consensus)} h-full`}
                                        style={{ width: `${consensusPercent}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {votes.length} votes
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={exportGameResults}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
                >
                    Export Results to CSV
                </button>
            </div>
        </div>
    );
};

const calculateConsensus = (votes: number[]): string => {
    if (votes.length < 2) return "N/A";

    const allSame = votes.every(v => v === votes[0]);
    if (allSame) return "Perfect";

    const avg = votes.reduce((sum, v) => sum + v, 0) / votes.length;
    const squaredDiffs = votes.map(v => Math.pow(v - avg, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / votes.length;
    const stdDev = Math.sqrt(variance);

    const maxPossibleDev = Math.max(...votes) - Math.min(...votes);
    const consensus = maxPossibleDev > 0 ? Math.max(0, 100 - (stdDev / maxPossibleDev) * 100) : 100;

    if (consensus > 80) return "High";
    if (consensus > 60) return "Medium";
    if (consensus > 40) return "Low";
    return "Very Low";
};

const getConsensusClass = (consensus: string): string => {
    switch (consensus) {
        case "Perfect": return "text-green-400";
        case "High": return "text-green-300";
        case "Medium": return "text-yellow-300";
        case "Low": return "text-orange-300";
        case "Very Low": return "text-red-300";
        default: return "text-gray-300";
    }
};

const getConsensusBarColor = (consensus: string): string => {
    switch (consensus) {
        case "Perfect": return "bg-green-400";
        case "High": return "bg-green-300";
        case "Medium": return "bg-yellow-300";
        case "Low": return "bg-orange-300";
        case "Very Low": return "bg-red-300";
        default: return "bg-gray-400";
    }
};

const getConsensusPercent = (consensus: string): number => {
    switch (consensus) {
        case "Perfect": return 100;
        case "High": return 85;
        case "Medium": return 65;
        case "Low": return 45;
        case "Very Low": return 25;
        default: return 0;
    }
};

export default RoundSummary;