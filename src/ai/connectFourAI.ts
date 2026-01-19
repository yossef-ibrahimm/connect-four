import {
  BoardState,
  Player,
  ROWS,
  COLS,
  WINNING_LENGTH,
  getValidColumns,
  dropToken,
  checkWin,
  checkDraw,
  getNextPlayer,
} from '../utils/gameLogic';

export type Difficulty = 'easy' | 'hard';

// Scoring constants for position evaluation
const SCORE_WIN = 100000;
const SCORE_THREE = 100;
const SCORE_TWO = 10;
const SCORE_CENTER = 3;

/**
 * Evaluates a window of 4 cells for scoring
 */
const evaluateWindow = (window: (Player | null)[], player: Player): number => {
  const opponent = getNextPlayer(player);
  
  const playerCount = window.filter((cell) => cell === player).length;
  const opponentCount = window.filter((cell) => cell === opponent).length;
  const emptyCount = window.filter((cell) => cell === null).length;

  // Winning position
  if (playerCount === 4) return SCORE_WIN;
  
  // Opponent winning - block urgently
  if (opponentCount === 4) return -SCORE_WIN;

  // Three in a row with one empty
  if (playerCount === 3 && emptyCount === 1) return SCORE_THREE;
  if (opponentCount === 3 && emptyCount === 1) return -SCORE_THREE * 1.5; // Prioritize blocking

  // Two in a row with two empty
  if (playerCount === 2 && emptyCount === 2) return SCORE_TWO;
  if (opponentCount === 2 && emptyCount === 2) return -SCORE_TWO;

  return 0;
};

/**
 * Scores the entire board for a player
 */
const scorePosition = (board: BoardState, player: Player): number => {
  let score = 0;

  // Prefer center column
  const centerCol = Math.floor(COLS / 2);
  const centerCount = board.filter((row) => row[centerCol] === player).length;
  score += centerCount * SCORE_CENTER;

  // Score horizontal windows
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
      const window = board[row].slice(col, col + WINNING_LENGTH);
      score += evaluateWindow(window, player);
    }
  }

  // Score vertical windows
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row <= ROWS - WINNING_LENGTH; row++) {
      const window = Array.from(
        { length: WINNING_LENGTH },
        (_, i) => board[row + i][col]
      );
      score += evaluateWindow(window, player);
    }
  }

  // Score diagonal windows (positive slope)
  for (let row = 0; row <= ROWS - WINNING_LENGTH; row++) {
    for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
      const window = Array.from(
        { length: WINNING_LENGTH },
        (_, i) => board[row + i][col + i]
      );
      score += evaluateWindow(window, player);
    }
  }

  // Score diagonal windows (negative slope)
  for (let row = WINNING_LENGTH - 1; row < ROWS; row++) {
    for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
      const window = Array.from(
        { length: WINNING_LENGTH },
        (_, i) => board[row - i][col + i]
      );
      score += evaluateWindow(window, player);
    }
  }

  return score;
};

/**
 * Checks if the game is over
 */
const isTerminal = (board: BoardState): boolean => {
  return (
    checkWin(board, 'red') !== null ||
    checkWin(board, 'yellow') !== null ||
    checkDraw(board)
  );
};

/**
 * Minimax algorithm with alpha-beta pruning
 */
const minimax = (
  board: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player
): number => {
  const validCols = getValidColumns(board);
  const terminal = isTerminal(board);

  // Base cases
  if (depth === 0 || terminal) {
    if (terminal) {
      if (checkWin(board, aiPlayer)) return SCORE_WIN * (depth + 1);
      if (checkWin(board, getNextPlayer(aiPlayer))) return -SCORE_WIN * (depth + 1);
      return 0; // Draw
    }
    return scorePosition(board, aiPlayer);
  }

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const col of validCols) {
      const result = dropToken(board, col, aiPlayer);
      if (!result) continue;
      
      const score = minimax(
        result.newBoard,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer
      );
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Pruning
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    const opponent = getNextPlayer(aiPlayer);
    for (const col of validCols) {
      const result = dropToken(board, col, opponent);
      if (!result) continue;
      
      const score = minimax(
        result.newBoard,
        depth - 1,
        alpha,
        beta,
        true,
        aiPlayer
      );
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // Pruning
    }
    return minScore;
  }
};

/**
 * Easy AI - random move with basic win/block detection
 */
const getEasyMove = (board: BoardState, aiPlayer: Player): number => {
  const validCols = getValidColumns(board);
  const opponent = getNextPlayer(aiPlayer);

  // Check for winning move
  for (const col of validCols) {
    const result = dropToken(board, col, aiPlayer);
    if (result && checkWin(result.newBoard, aiPlayer)) {
      return col;
    }
  }

  // Check for blocking move
  for (const col of validCols) {
    const result = dropToken(board, col, opponent);
    if (result && checkWin(result.newBoard, opponent)) {
      return col;
    }
  }

  // Prefer center column
  const centerCol = Math.floor(COLS / 2);
  if (validCols.includes(centerCol)) {
    return centerCol;
  }

  // Random valid move
  return validCols[Math.floor(Math.random() * validCols.length)];
};

/**
 * Hard AI - uses minimax with alpha-beta pruning
 */
const getHardMove = (board: BoardState, aiPlayer: Player): number => {
  const validCols = getValidColumns(board);
  const depth = 6; // Look ahead 6 moves

  let bestScore = -Infinity;
  let bestCol = validCols[Math.floor(validCols.length / 2)]; // Default to center-ish

  // Check immediate winning moves first
  for (const col of validCols) {
    const result = dropToken(board, col, aiPlayer);
    if (result && checkWin(result.newBoard, aiPlayer)) {
      return col;
    }
  }

  // Check immediate blocking moves
  const opponent = getNextPlayer(aiPlayer);
  for (const col of validCols) {
    const result = dropToken(board, col, opponent);
    if (result && checkWin(result.newBoard, opponent)) {
      return col;
    }
  }

  // Use minimax for best strategic move
  // Prioritize center columns in search order
  const orderedCols = [...validCols].sort(
    (a, b) => Math.abs(a - 3) - Math.abs(b - 3)
  );

  for (const col of orderedCols) {
    const result = dropToken(board, col, aiPlayer);
    if (!result) continue;

    const score = minimax(
      result.newBoard,
      depth - 1,
      -Infinity,
      Infinity,
      false,
      aiPlayer
    );

    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
};

/**
 * Main AI function - returns the best column to play
 */
export const getAIMove = (
  board: BoardState,
  aiPlayer: Player,
  difficulty: Difficulty
): number => {
  const validCols = getValidColumns(board);
  
  if (validCols.length === 0) {
    throw new Error('No valid moves available');
  }

  if (difficulty === 'easy') {
    return getEasyMove(board, aiPlayer);
  }

  return getHardMove(board, aiPlayer);
};
