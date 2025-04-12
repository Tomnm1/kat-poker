"use client";

interface PlayersListProps {
    players: string[];
}

const PlayersList: React.FC<PlayersListProps> = ({ players }) => {
    return (
        <div className="absolute top-4 right-4 bg-white p-4 rounded shadow-lg max-w-xs">
            <h3 className="text-lg font-semibold text-gray-700">Players List</h3>
            <ul className="mt-2">
                {players.length > 0 ? (
                    players.map((player, index) => (
                        <li key={index} className="text-gray-600">
                            {player}
                        </li>
                    ))
                ) : (
                    <li className="text-gray-600">No players yet.</li>
                )}
            </ul>
        </div>
    );
};

export default PlayersList;
