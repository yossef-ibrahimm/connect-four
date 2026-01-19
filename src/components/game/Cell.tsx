import React from 'react';
import { CellState } from '../../utils/gameLogic';
import { Token } from './Token';
import { cn } from '@/lib/utils';

interface CellProps {
  state: CellState;
  isWinning: boolean;
  isDropping: boolean;
  isHovered: boolean;
}

export const Cell: React.FC<CellProps> = ({
  state,
  isWinning,
  isDropping,
  isHovered,
}) => {
  return (
    <div
      className={cn(
        'aspect-square p-1 sm:p-1.5 transition-all duration-200',
        isHovered && !state && 'scale-105'
      )}
    >
      <div
        className={cn(
          'w-full h-full rounded-full transition-all duration-300',
          !state && 'cell-empty',
          isHovered && !state && 'bg-cell-hover'
        )}
      >
        {state && (
          <Token
            player={state}
            isWinning={isWinning}
            isDropping={isDropping}
          />
        )}
      </div>
    </div>
  );
};
