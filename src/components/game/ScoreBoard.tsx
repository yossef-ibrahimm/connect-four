import React from 'react';
import { cn } from '@/lib/utils';

interface ScoreBoardProps {
  scores: {
    red: number;
    yellow: number;
    draws: number;
  };
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ scores }) => {
  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
        Score Board
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto rounded-full token-red mb-2" />
          <div className="text-2xl sm:text-3xl font-bold text-player-red">
            {scores.red}
          </div>
          <div className="text-xs text-muted-foreground">Red</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto rounded-full bg-muted mb-2 flex items-center justify-center">
            <span className="text-sm">🤝</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">
            {scores.draws}
          </div>
          <div className="text-xs text-muted-foreground">Draws</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto rounded-full token-yellow mb-2" />
          <div className="text-2xl sm:text-3xl font-bold text-player-yellow">
            {scores.yellow}
          </div>
          <div className="text-xs text-muted-foreground">Yellow</div>
        </div>
      </div>
    </div>
  );
};
