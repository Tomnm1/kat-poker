import React from 'react';

interface PlayersListProps {
  players: string[];
}

const PlayersList: React.FC<PlayersListProps> = ({ players }) => {
  return (
    <div className="overflow-y-auto max-h-80">
      {players.length === 0 ? (
        <p className="text-gray-400 text-center italic">No players yet</p>
      ) : (
        <ul className="space-y-2">
          {players.map((player, index) => (
            <li 
              key={index} 
              className="p-2 bg-gray-700 rounded-md text-white break-words"
            >
              {player}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlayersList;