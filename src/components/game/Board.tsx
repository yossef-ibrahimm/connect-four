import React, { useState, useMemo } from 'react';
import { GameState, ROWS, COLS, isColumnFull } from '../../utils/gameLogic';
import { Cell } from './Cell';
import { Token } from './Token';
import { cn } from '@/lib/utils';

interface BoardProps {
  gameState: GameState;
  droppingCol: number | null;
  isLocked: boolean;
  onColumnClick: (col: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  gameState,
  droppingCol,
  isLocked,
  onColumnClick,
}) => {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const winningPositions = useMemo(() => {
    return new Set(
      gameState.winningCells.map((cell) => `${cell.row}-${cell.col}`)
    );
  }, [gameState.winningCells]);

  const handleColumnClick = (col: number) => {
    if (isLocked || isColumnFull(gameState.board, col)) return;
    onColumnClick(col);
  };

  const handleColumnHover = (col: number | null) => {
    if (isLocked) {
      setHoveredCol(null);
      return;
    }
    setHoveredCol(col);
  };

  return (
    <div className="relative">
      {/* Token preview on hover */}
      <div className="absolute -top-12 sm:-top-14 left-0 right-0 h-10 sm:h-12 pointer-events-none">
        <div className="grid grid-cols-7 h-full px-2 sm:px-3">
          {Array.from({ length: COLS }, (_, col) => (
            <div
              key={col}
              className="flex items-center justify-center p-1"
            >
              {hoveredCol === col &&
                !isLocked &&
                !isColumnFull(gameState.board, col) && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 animate-float">
                    <Token player={gameState.currentPlayer} />
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Main board */}
      <div className="game-board rounded-2xl sm:rounded-3xl p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {Array.from({ length: COLS }, (_, col) => (
            <div
              key={col}
              className={cn(
                'cursor-pointer transition-opacity duration-200',
                isLocked && 'cursor-not-allowed',
                !isLocked &&
                  !isColumnFull(gameState.board, col) &&
                  'hover:opacity-90'
              )}
              onClick={() => handleColumnClick(col)}
              onMouseEnter={() => handleColumnHover(col)}
              onMouseLeave={() => handleColumnHover(null)}
            >
              {Array.from({ length: ROWS }, (_, row) => (
                <Cell
                  key={`${row}-${col}`}
                  state={gameState.board[row][col]}
                  isWinning={winningPositions.has(`${row}-${col}`)}
                  isDropping={
                    droppingCol === col &&
                    gameState.lastMove?.row === row &&
                    gameState.lastMove?.col === col
                  }
                  isHovered={hoveredCol === col}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
