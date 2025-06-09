import React from 'react';

interface PlayersListProps {
  players: string[];
  votes?: { [playerName: string]: number };
  showVotes?: boolean;
  currentPlayer?: string;
}

const PlayersList: React.FC<PlayersListProps> = ({ 
  players, 
  votes = {}, 
  showVotes = false, 
  currentPlayer 
}) => {
  const parsePlayer = (playerString: string) => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const matches = playerString.match(emojiRegex);
    
    if (matches && matches.length > 0) {
      const avatar = matches[0];
      const name = playerString.replace(avatar, '').trim();
      return { name, avatar };
    }
    
    return { name: playerString, avatar: '👤' };
  };

  const getVoteStatus = (playerString: string) => {
    if (votes[playerString] !== undefined) {
      return showVotes ? votes[playerString] : '✅';
    }
    return '⏳';
  };

  if (players.length === 0) {
    return (
      <div className="overflow-y-auto max-h-80">
        <p className="text-gray-400 text-center italic">No players yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-80">
      <ul className="space-y-2">
        {players.map((playerString, index) => {
          const { name, avatar } = parsePlayer(playerString);
          const hasVoted = votes[playerString] !== undefined;
          const isCurrentPlayer = name === currentPlayer;
          
          return (
            <li 
              key={index} 
              className={`p-3 rounded-md break-words transition-all duration-200 ${
                isCurrentPlayer 
                  ? 'bg-blue-900/30 border border-blue-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{avatar}</span>
                  <span className={`font-medium ${
                    isCurrentPlayer ? 'text-blue-300' : 'text-white'
                  }`}>
                    {name}
                    {isCurrentPlayer && (
                      <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </span>
                </div>
                
                {Object.keys(votes).length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className={`text-center min-w-[40px] ${
                      hasVoted 
                        ? showVotes 
                          ? 'text-green-400 font-bold text-lg' 
                          : 'text-green-400'
                        : 'text-yellow-400'
                    }`}>
                      {getVoteStatus(playerString)}
                    </div>
                    
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"
                         title="Online"></div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      
      {Object.keys(votes).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <p className="text-sm text-gray-400">
            {Object.keys(votes).length} of {players.length} players have voted
          </p>
          {!showVotes && Object.keys(votes).length === players.length && (
            <p className="text-sm text-green-400 mt-1">
              All players have voted! Waiting for results...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayersList;