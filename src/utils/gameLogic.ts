// Game constants
export const ROWS = 6;
export const COLS = 7;
export const WINNING_LENGTH = 4;

// Player types
export type Player = 'red' | 'yellow';
export type CellState = Player | null;
export type BoardState = CellState[][];

// Game status
export type GameStatus = 'playing' | 'won' | 'draw';

export interface WinningCell {
  row: number;
  col: number;
}

export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningCells: WinningCell[];
  lastMove: { row: number; col: number } | null;
}

/**
 * Creates an empty game board
 */
export const createEmptyBoard = (): BoardState => {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(null));
};

/**
 * Creates initial game state
 */
export const createInitialState = (): GameState => ({
  board: createEmptyBoard(),
  currentPlayer: 'red',
  status: 'playing',
  winner: null,
  winningCells: [],
  lastMove: null,
});

/**
 * Checks if a column is full
 */
export const isColumnFull = (board: BoardState, col: number): boolean => {
  return board[0][col] !== null;
};

/**
 * Gets the next available row in a column
 * Returns -1 if column is full
 */
export const getAvailableRow = (board: BoardState, col: number): number => {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      return row;
    }
  }
  return -1;
};

/**
 * Drops a token in the specified column
 * Returns new board state or null if move is invalid
 */
export const dropToken = (
  board: BoardState,
  col: number,
  player: Player
): { newBoard: BoardState; row: number } | null => {
  if (col < 0 || col >= COLS || isColumnFull(board, col)) {
    return null;
  }

  const row = getAvailableRow(board, col);
  if (row === -1) return null;

  // Create new board with the token placed
  const newBoard = board.map((r, rowIndex) =>
    r.map((cell, colIndex) =>
      rowIndex === row && colIndex === col ? player : cell
    )
  );

  return { newBoard, row };
};

/**
 * Check for a win starting from a position in a direction
 */
const checkDirection = (
  board: BoardState,
  startRow: number,
  startCol: number,
  deltaRow: number,
  deltaCol: number,
  player: Player
): WinningCell[] | null => {
  const cells: WinningCell[] = [];

  for (let i = 0; i < WINNING_LENGTH; i++) {
    const row = startRow + i * deltaRow;
    const col = startCol + i * deltaCol;

    if (
      row < 0 ||
      row >= ROWS ||
      col < 0 ||
      col >= COLS ||
      board[row][col] !== player
    ) {
      return null;
    }

    cells.push({ row, col });
  }

  return cells;
};

/**
 * Checks if the specified player has won
 * Returns winning cells if won, null otherwise
 */
export const checkWin = (
  board: BoardState,
  player: Player
): WinningCell[] | null => {
  // All possible directions: horizontal, vertical, diagonal down-right, diagonal up-right
  const directions = [
    { deltaRow: 0, deltaCol: 1 },   // Horizontal
    { deltaRow: 1, deltaCol: 0 },   // Vertical
    { deltaRow: 1, deltaCol: 1 },   // Diagonal down-right
    { deltaRow: 1, deltaCol: -1 },  // Diagonal down-left
  ];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const { deltaRow, deltaCol } of directions) {
        const winningCells = checkDirection(
          board,
          row,
          col,
          deltaRow,
          deltaCol,
          player
        );
        if (winningCells) {
          return winningCells;
        }
      }
    }
  }

  return null;
};

/**
 * Checks if the board is full (draw)
 */
export const checkDraw = (board: BoardState): boolean => {
  return board[0].every((cell) => cell !== null);
};

/**
 * Gets all valid columns for moves
 */
export const getValidColumns = (board: BoardState): number[] => {
  return Array.from({ length: COLS }, (_, i) => i).filter(
    (col) => !isColumnFull(board, col)
  );
};

/**
 * Switches the current player
 */
export const getNextPlayer = (player: Player): Player => {
  return player === 'red' ? 'yellow' : 'red';
};

/**
 * Makes a move and returns the new game state
 */
export const makeMove = (state: GameState, col: number): GameState | null => {
  if (state.status !== 'playing') return null;

  const result = dropToken(state.board, col, state.currentPlayer);
  if (!result) return null;

  const { newBoard, row } = result;

  // Check for win
  const winningCells = checkWin(newBoard, state.currentPlayer);
  if (winningCells) {
    return {
      ...state,
      board: newBoard,
      status: 'won',
      winner: state.currentPlayer,
      winningCells,
      lastMove: { row, col },
    };
  }

  // Check for draw
  if (checkDraw(newBoard)) {
    return {
      ...state,
      board: newBoard,
      status: 'draw',
      lastMove: { row, col },
    };
  }

  // Continue game
  return {
    ...state,
    board: newBoard,
    currentPlayer: getNextPlayer(state.currentPlayer),
    lastMove: { row, col },
  };
};
