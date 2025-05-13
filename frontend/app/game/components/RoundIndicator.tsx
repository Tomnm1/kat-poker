import React from 'react';

interface RoundIndicatorProps {
  currentRoundId?: string;
  roundHistoryCount: number;
}

const RoundIndicator: React.FC<RoundIndicatorProps> = ({ 
  currentRoundId, 
  roundHistoryCount 
}) => {
  const currentRoundNumber = currentRoundId 
    ? parseInt(currentRoundId.replace('round-', '')) 
    : 0;
  
  const totalRounds = roundHistoryCount + (currentRoundId ? 1 : 0);

  return (
    <div className="bg-gray-700 px-3 py-2 rounded inline-flex flex-col items-center min-w-[100px]">
      <div className="text-sm text-gray-300 mb-1 whitespace-nowrap">
        {currentRoundId ? `Round #${currentRoundNumber}` : "No active round"}
      </div>
      
      {totalRounds > 0 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: totalRounds }).map((_, idx) => (
            <div 
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === currentRoundNumber - 1 ? "bg-green-500" : "bg-gray-500"
              }`}
              title={`Round ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoundIndicator;