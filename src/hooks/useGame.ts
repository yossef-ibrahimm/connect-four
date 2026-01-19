import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  createInitialState,
  makeMove,
  Player,
} from '../utils/gameLogic';
import { getAIMove, Difficulty } from '../ai/connectFourAI';

export type GameMode = 'pvp' | 'pve';

interface UseGameOptions {
  mode: GameMode;
  difficulty: Difficulty;
  aiPlayer: Player;
}

export const useGame = (options: UseGameOptions) => {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [droppingCol, setDroppingCol] = useState<number | null>(null);
  const [scores, setScores] = useState({ red: 0, yellow: 0, draws: 0 });
  
  const aiTimeoutRef = useRef<number | null>(null);

  const { mode, difficulty, aiPlayer } = options;

  // Handle AI moves
  useEffect(() => {
    if (
      mode !== 'pve' ||
      gameState.status !== 'playing' ||
      gameState.currentPlayer !== aiPlayer ||
      isAIThinking
    ) {
      return;
    }

    setIsAIThinking(true);

    // Add a small delay to make it feel more natural
    aiTimeoutRef.current = window.setTimeout(() => {
      const col = getAIMove(gameState.board, aiPlayer, difficulty);
      handleMove(col, true);
      setIsAIThinking(false);
    }, difficulty === 'hard' ? 800 : 400);

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [gameState.currentPlayer, gameState.status, mode, aiPlayer, difficulty]);

  // Update scores when game ends
  useEffect(() => {
    if (gameState.status === 'won' && gameState.winner) {
      setScores((prev) => ({
        ...prev,
        [gameState.winner!]: prev[gameState.winner!] + 1,
      }));
    } else if (gameState.status === 'draw') {
      setScores((prev) => ({
        ...prev,
        draws: prev.draws + 1,
      }));
    }
  }, [gameState.status, gameState.winner]);

  const handleMove = useCallback((col: number, isAI = false) => {
    if (gameState.status !== 'playing') return;
    
    // Prevent player moves when AI is thinking
    if (!isAI && mode === 'pve' && gameState.currentPlayer === aiPlayer) {
      return;
    }

    const newState = makeMove(gameState, col);
    if (newState) {
      setDroppingCol(col);
      setGameState(newState);
      
      // Clear dropping animation after it completes
      setTimeout(() => {
        setDroppingCol(null);
      }, 600);
    }
  }, [gameState, mode, aiPlayer]);

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    setIsAIThinking(false);
    setDroppingCol(null);
    setGameState(createInitialState());
  }, []);

  const resetScores = useCallback(() => {
    setScores({ red: 0, yellow: 0, draws: 0 });
  }, []);

  return {
    gameState,
    isAIThinking,
    droppingCol,
    scores,
    handleMove,
    resetGame,
    resetScores,
  };
};
