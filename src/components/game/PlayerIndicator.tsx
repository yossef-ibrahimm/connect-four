import React from 'react';
import { Player, GameStatus } from '../../utils/gameLogic';
import { Token } from './Token';
import { cn } from '@/lib/utils';
import { Trophy, Handshake, Loader2 } from 'lucide-react';

interface PlayerIndicatorProps {
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  isAIThinking: boolean;
  isAITurn: boolean;
}

export const PlayerIndicator: React.FC<PlayerIndicatorProps> = ({
  currentPlayer,
  status,
  winner,
  isAIThinking,
  isAITurn,
}) => {
  if (status === 'won' && winner) {
    return (
      <div className="flex items-center justify-center gap-3 animate-scale-in">
        <div className="w-10 h-10 sm:w-12 sm:h-12">
          <Token player={winner} isWinning />
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          <span className="text-xl sm:text-2xl font-bold">
            <span
              className={cn(
                winner === 'red' ? 'text-player-red' : 'text-player-yellow'
              )}
            >
              {winner === 'red' ? 'Red' : 'Yellow'}
            </span>{' '}
            Wins!
          </span>
        </div>
      </div>
    );
  }

  if (status === 'draw') {
    return (
      <div className="flex items-center justify-center gap-3 animate-scale-in">
        <Handshake className="w-8 h-8 text-muted-foreground" />
        <span className="text-xl sm:text-2xl font-bold text-muted-foreground">
          It's a Draw!
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <div className={cn(
        'w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300',
        isAIThinking && 'animate-pulse'
      )}>
        <Token player={currentPlayer} />
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Current Turn</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-lg sm:text-xl font-bold',
              currentPlayer === 'red' ? 'text-player-red' : 'text-player-yellow'
            )}
          >
            {currentPlayer === 'red' ? 'Red' : 'Yellow'}
            {isAITurn && ' (AI)'}
          </span>
          {isAIThinking && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
};
