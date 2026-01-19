import React from 'react';
import { Player } from '../../utils/gameLogic';
import { cn } from '@/lib/utils';

interface TokenProps {
  player: Player;
  isWinning?: boolean;
  isDropping?: boolean;
  className?: string;
}

export const Token: React.FC<TokenProps> = ({
  player,
  isWinning = false,
  isDropping = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full h-full rounded-full transition-all duration-200',
        player === 'red' ? 'token-red' : 'token-yellow',
        isWinning && 'winning',
        isDropping && 'animate-drop',
        className
      )}
    />
  );
};
