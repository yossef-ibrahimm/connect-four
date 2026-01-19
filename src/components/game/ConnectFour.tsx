import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Trophy, RotateCcw, Users, Cpu, Zap, Brain, Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
const ROWS = 6;
const COLS = 7;
const PLAYER_ONE = 1;
const PLAYER_TWO = 2;
const EMPTY = 0;

type PlayerType = typeof PLAYER_ONE | typeof PLAYER_TWO;
type CellType = PlayerType | typeof EMPTY;
type BoardType = CellType[][];

const GAME_MODES = {
  PVP: 'pvp',
  AI_EASY: 'ai_easy',
  AI_HARD: 'ai_hard'
} as const;

type GameModeType = typeof GAME_MODES[keyof typeof GAME_MODES];

interface PlayerConfig {
  name: string;
  color: string;
  tokenClass: string;
  previewClass: string;
  glowColor: string;
}

const PLAYERS: Record<PlayerType, PlayerConfig> = {
  [PLAYER_ONE]: {
    name: 'Player 1',
    color: 'red',
    tokenClass: 'token-red',
    previewClass: 'token-preview-red',
    glowColor: 'hsl(0 100% 60%)'
  },
  [PLAYER_TWO]: {
    name: 'Player 2',
    color: 'yellow',
    tokenClass: 'token-yellow',
    previewClass: 'token-preview-yellow',
    glowColor: 'hsl(45 100% 60%)'
  }
};

interface WinningCell {
  row: number;
  col: number;
}

interface LastMove {
  row: number;
  col: number;
}

interface DroppingToken {
  col: number;
  row: number;
  player: PlayerType;
}

// ============================================================================
// GAME LOGIC UTILITIES
// ============================================================================

const createEmptyBoard = (): BoardType =>
  Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));

const getNextRow = (board: BoardType, col: number): number => {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === EMPTY) return row;
  }
  return -1;
};

const isColumnFull = (board: BoardType, col: number): boolean =>
  board[0][col] !== EMPTY;

const makeMove = (board: BoardType, col: number, player: PlayerType) => {
  const row = getNextRow(board, col);
  if (row === -1) return null;

  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = player;
  return { board: newBoard, row, col };
};

const checkWinFromPosition = (board: BoardType, row: number, col: number, player: PlayerType): WinningCell[] | null => {
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];

  for (const { dr, dc } of directions) {
    let count = 1;
    const line: WinningCell[] = [{ row, col }];

    for (let i = 1; i < 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      count++;
      line.push({ row: r, col: c });
    }

    for (let i = 1; i < 4; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      count++;
      line.unshift({ row: r, col: c });
    }

    if (count >= 4) return line;
  }
  return null;
};

const isBoardFull = (board: BoardType): boolean =>
  board[0].every(cell => cell !== EMPTY);

const getValidMoves = (board: BoardType): number[] => {
  const moves: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (!isColumnFull(board, col)) moves.push(col);
  }
  return moves;
};

// ============================================================================
// AI LOGIC
// ============================================================================

const getEasyAIMove = (board: BoardType): number => {
  const validMoves = getValidMoves(board);

  // Check for winning move first
  for (const col of validMoves) {
    const result = makeMove(board, col, PLAYER_TWO);
    if (result && checkWinFromPosition(result.board, result.row, col, PLAYER_TWO)) {
      return col;
    }
  }

  // Block opponent winning move
  for (const col of validMoves) {
    const result = makeMove(board, col, PLAYER_ONE);
    if (result && checkWinFromPosition(result.board, result.row, col, PLAYER_ONE)) {
      return col;
    }
  }

  // Prefer center
  if (Math.random() < 0.7) {
    const centerMoves = validMoves.filter(col => col >= 2 && col <= 4);
    if (centerMoves.length > 0) {
      return centerMoves[Math.floor(Math.random() * centerMoves.length)];
    }
  }

  return validMoves[Math.floor(Math.random() * validMoves.length)];
};

const evaluatePosition = (board: BoardType, player: PlayerType): number => {
  const opponent = player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
  let score = 0;

  const evaluateWindow = (window: CellType[]) => {
    const playerCount = window.filter(cell => cell === player).length;
    const emptyCount = window.filter(cell => cell === EMPTY).length;
    const opponentCount = window.filter(cell => cell === opponent).length;

    if (playerCount === 4) return 100;
    if (playerCount === 3 && emptyCount === 1) return 5;
    if (playerCount === 2 && emptyCount === 2) return 2;
    if (opponentCount === 3 && emptyCount === 1) return -4;
    return 0;
  };

  // Horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      score += evaluateWindow([board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]]);
    }
  }

  // Vertical
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS - 3; row++) {
      score += evaluateWindow([board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]]);
    }
  }

  // Diagonals
  for (let row = 0; row < ROWS - 3; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      score += evaluateWindow([board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]]);
    }
  }
  for (let row = 3; row < ROWS; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      score += evaluateWindow([board[row][col], board[row - 1][col + 1], board[row - 2][col + 2], board[row - 3][col + 3]]);
    }
  }

  // Center preference
  const centerCol = Math.floor(COLS / 2);
  score += board.map(row => row[centerCol]).filter(cell => cell === player).length * 3;

  return score;
};

const minimax = (
  board: BoardType,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  player: PlayerType
): { score: number; col: number | null } => {
  const opponent = player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
  const validMoves = getValidMoves(board);

  if (depth === 0 || validMoves.length === 0) {
    return { score: evaluatePosition(board, player), col: null };
  }

  if (maximizingPlayer) {
    let maxScore = -Infinity;
    let bestCol = validMoves[0];

    for (const col of validMoves) {
      const result = makeMove(board, col, player);
      if (!result) continue;

      if (checkWinFromPosition(result.board, result.row, col, player)) {
        return { score: 1000000, col };
      }

      const { score } = minimax(result.board, depth - 1, alpha, beta, false, player);
      if (score > maxScore) {
        maxScore = score;
        bestCol = col;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return { score: maxScore, col: bestCol };
  } else {
    let minScore = Infinity;
    let bestCol = validMoves[0];

    for (const col of validMoves) {
      const result = makeMove(board, col, opponent);
      if (!result) continue;

      if (checkWinFromPosition(result.board, result.row, col, opponent)) {
        return { score: -1000000, col };
      }

      const { score } = minimax(result.board, depth - 1, alpha, beta, true, player);
      if (score < minScore) {
        minScore = score;
        bestCol = col;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return { score: minScore, col: bestCol };
  }
};

const getHardAIMove = (board: BoardType, player: PlayerType): number => {
  const validMoves = getValidMoves(board);
  const opponent = player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;

  // Immediate win
  for (const col of validMoves) {
    const result = makeMove(board, col, player);
    if (result && checkWinFromPosition(result.board, result.row, col, player)) {
      return col;
    }
  }

  // Block opponent
  for (const col of validMoves) {
    const result = makeMove(board, col, opponent);
    if (result && checkWinFromPosition(result.board, result.row, col, opponent)) {
      return col;
    }
  }

  const { col } = minimax(board, 5, -Infinity, Infinity, true, player);
  return col !== null ? col : validMoves[0];
};

// ============================================================================
// COMPONENTS
// ============================================================================

const Confetti: React.FC<{ winner: PlayerType }> = ({ winner }) => {
  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      color: winner === PLAYER_ONE
        ? `hsl(${Math.random() * 30} 90% ${55 + Math.random() * 20}%)`
        : `hsl(${40 + Math.random() * 20} 95% ${55 + Math.random() * 20}%)`
    })), [winner]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </div>
  );
};

interface GameModeSelectorProps {
  onSelectMode: (mode: GameModeType) => void;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelectMode }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    {/* Background effects */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px]" />
    </div>

    <div className="relative text-center mb-12 animate-slide-up">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl mb-6 shadow-2xl shadow-primary/30 animate-float">
        <Trophy className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-5xl sm:text-6xl font-extrabold text-gradient-primary mb-3">
        Connect Four
      </h1>
      <p className="text-muted-foreground text-lg">Choose your game mode</p>
    </div>

    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
      {[
        { mode: GAME_MODES.PVP, icon: Users, title: 'Player vs Player', desc: 'Challenge a friend locally', color: 'primary', delay: '0ms' },
        { mode: GAME_MODES.AI_EASY, icon: Zap, title: 'Easy AI', desc: 'Perfect for beginners', color: 'emerald', delay: '100ms' },
        { mode: GAME_MODES.AI_HARD, icon: Brain, title: 'Hard AI', desc: 'Ultimate challenge', color: 'rose', delay: '200ms' }
      ].map(({ mode, icon: Icon, title, desc, color, delay }) => (
        <button
          key={mode}
          onClick={() => onSelectMode(mode)}
          className="mode-card group p-8 animate-slide-up"
          style={{ animationDelay: delay }}
        >
          <div className={cn(
            "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            color === 'primary' && "bg-gradient-to-br from-primary/20 to-transparent",
            color === 'emerald' && "bg-gradient-to-br from-emerald-500/20 to-transparent",
            color === 'rose' && "bg-gradient-to-br from-rose-500/20 to-transparent"
          )} />
          <Icon className={cn(
            "w-14 h-14 mb-5 mx-auto transition-transform duration-300 group-hover:scale-110",
            color === 'primary' && "text-primary",
            color === 'emerald' && "text-emerald-400",
            color === 'rose' && "text-rose-400"
          )} />
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{desc}</p>
        </button>
      ))}
    </div>
  </div>
);

interface CellProps {
  value: CellType;
  isWinning: boolean;
  isDropping: boolean;
  row: number;
}

const Cell: React.FC<CellProps> = ({ value, isWinning, isDropping, row }) => {
  const player = value !== EMPTY ? PLAYERS[value as PlayerType] : null;

  return (
    <div className="relative aspect-square p-1 sm:p-1.5">
      <div className="cell-hole w-full h-full rounded-full">
        {player && (
          <div
            className={cn(
              'token',
              player.tokenClass,
              isWinning && 'winning',
              isDropping && `animate-token-drop drop-delay-${row}`
            )}
          />
        )}
      </div>
    </div>
  );
};

interface BoardProps {
  board: BoardType;
  currentPlayer: PlayerType;
  winningLine: WinningCell[];
  droppingToken: DroppingToken | null;
  isLocked: boolean;
  onColumnClick: (col: number) => void;
}

const Board: React.FC<BoardProps> = ({
  board,
  currentPlayer,
  winningLine,
  droppingToken,
  isLocked,
  onColumnClick
}) => {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const winningPositions = useMemo(() =>
    new Set(winningLine.map(cell => `${cell.row}-${cell.col}`)),
    [winningLine]
  );

  const handleColumnClick = (col: number) => {
    if (isLocked || isColumnFull(board, col)) return;
    onColumnClick(col);
  };

  return (
    <div className="relative animate-scale-in">
      {/* Preview token above board */}
      <div className="absolute -top-16 sm:-top-20 left-0 right-0 h-14 sm:h-16 pointer-events-none">
        <div className="grid grid-cols-7 h-full px-3 sm:px-4">
          {Array.from({ length: COLS }, (_, col) => (
            <div key={col} className="flex items-center justify-center">
              {hoveredCol === col && !isLocked && !isColumnFull(board, col) && (
                <div
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 token-preview animate-preview-bounce",
                    PLAYERS[currentPlayer].previewClass
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main board */}
      <div className="game-board rounded-2xl sm:rounded-3xl p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: COLS }, (_, col) => (
            <div
              key={col}
              className={cn(
                "column-hover-glow rounded-xl cursor-pointer transition-all duration-200",
                isLocked && "cursor-not-allowed pointer-events-none",
                isColumnFull(board, col) && "opacity-80"
              )}
              onClick={() => handleColumnClick(col)}
              onMouseEnter={() => !isLocked && setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
            >
              {Array.from({ length: ROWS }, (_, row) => {
                const isDropping = droppingToken?.col === col && droppingToken?.row === row;
                const displayValue = isDropping ? droppingToken.player : board[row][col];

                return (
                  <Cell
                    key={`${row}-${col}`}
                    value={displayValue}
                    isWinning={winningPositions.has(`${row}-${col}`)}
                    isDropping={isDropping}
                    row={row}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface GameHeaderProps {
  currentPlayer: PlayerType;
  winner: PlayerType | null;
  isDraw: boolean;
  gameMode: GameModeType;
  scores: { [PLAYER_ONE]: number; [PLAYER_TWO]: number; draws: number };
  isThinking: boolean;
  onReset: () => void;
  onChangeMode: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  currentPlayer,
  winner,
  isDraw,
  gameMode,
  scores,
  isThinking,
  onReset,
  onChangeMode
}) => {
  const player = PLAYERS[currentPlayer];
  const isAI = gameMode !== GAME_MODES.PVP;

  return (
    <div className="mb-8 animate-slide-up">
      {/* Score Board */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 mb-6">
        <div className="glass-card px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full token-red" style={{ position: 'relative' }}>
            <div className="token-red absolute inset-0 rounded-full" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Player 1</p>
            <p className="text-xl sm:text-2xl font-bold text-player-red">{scores[PLAYER_ONE]}</p>
          </div>
        </div>

        <div className="glass-card px-3 py-2">
          <p className="text-xs text-muted-foreground text-center">Draws</p>
          <p className="text-lg font-bold text-muted-foreground text-center">{scores.draws}</p>
        </div>

        <div className="glass-card px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full token-yellow" style={{ position: 'relative' }}>
            <div className="token-yellow absolute inset-0 rounded-full" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{isAI ? 'AI' : 'Player 2'}</p>
            <p className="text-xl sm:text-2xl font-bold text-player-yellow">{scores[PLAYER_TWO]}</p>
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className="text-center mb-6">
        {winner ? (
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-2xl shadow-2xl shadow-primary/30 animate-scale-in">
            <Sparkles className="w-6 h-6 animate-sparkle" />
            <span className="text-xl sm:text-2xl font-bold">
              {PLAYERS[winner].name} Wins!
            </span>
            <Sparkles className="w-6 h-6 animate-sparkle" style={{ animationDelay: '0.3s' }} />
          </div>
        ) : isDraw ? (
          <div className="inline-flex items-center gap-3 glass-card text-foreground px-8 py-4 animate-scale-in">
            <span className="text-xl sm:text-2xl font-bold">It's a Draw!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-3 glass-card px-6 py-4">
            <div className={cn(
              "w-8 h-8 rounded-full",
              player.tokenClass,
              isThinking && "animate-pulse"
            )} style={{ position: 'relative' }}>
              <div className={cn("absolute inset-0 rounded-full", player.tokenClass)} />
            </div>
            <span className="text-lg sm:text-xl font-semibold">
              {isThinking ? 'AI is thinking...' : `${player.name}'s Turn`}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-white"
        >
          <RotateCcw className="w-5 h-5" />
          New Game
        </button>
        <button
          onClick={onChangeMode}
          className="btn-secondary flex items-center gap-2 px-6 py-3 rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          Change Mode
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

export const ConnectFour: React.FC = () => {
  const [board, setBoard] = useState<BoardType>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>(PLAYER_ONE);
  const [gameMode, setGameMode] = useState<GameModeType | null>(null);
  const [winner, setWinner] = useState<PlayerType | null>(null);
  const [winningLine, setWinningLine] = useState<WinningCell[]>([]);
  const [isDraw, setIsDraw] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [scores, setScores] = useState({ [PLAYER_ONE]: 0, [PLAYER_TWO]: 0, draws: 0 });
  const [droppingToken, setDroppingToken] = useState<DroppingToken | null>(null);

  const aiTimeoutRef = useRef<number | null>(null);

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setBoard(createEmptyBoard());
    setCurrentPlayer(PLAYER_ONE);
    setWinner(null);
    setWinningLine([]);
    setIsDraw(false);
    setIsAnimating(false);
    setIsThinking(false);
    setDroppingToken(null);
  }, []);

  const handleMove = useCallback((col: number) => {
    if (winner || isDraw || isAnimating || isColumnFull(board, col)) return;

    const row = getNextRow(board, col);
    if (row === -1) return;

    // Start drop animation
    setIsAnimating(true);
    setDroppingToken({ col, row, player: currentPlayer });

    // After animation, update board
    const dropDuration = 500 + row * 50; // Longer drop for lower rows
    setTimeout(() => {
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = currentPlayer;
      setBoard(newBoard);
      setDroppingToken(null);

      // Check win
      const winLine = checkWinFromPosition(newBoard, row, col, currentPlayer);
      if (winLine) {
        setWinner(currentPlayer);
        setWinningLine(winLine);
        setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
        setIsAnimating(false);
      } else if (isBoardFull(newBoard)) {
        setIsDraw(true);
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        setIsAnimating(false);
      } else {
        setCurrentPlayer(currentPlayer === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE);
        setIsAnimating(false);
      }
    }, dropDuration);
  }, [board, currentPlayer, winner, isDraw, isAnimating]);

  // AI Move Effect
  useEffect(() => {
    if (!gameMode || winner || isDraw || isAnimating) return;

    const isAITurn = currentPlayer === PLAYER_TWO && gameMode !== GAME_MODES.PVP;

    if (isAITurn) {
      setIsThinking(true);
      aiTimeoutRef.current = window.setTimeout(() => {
        const col = gameMode === GAME_MODES.AI_EASY
          ? getEasyAIMove(board)
          : getHardAIMove(board, PLAYER_TWO);

        setIsThinking(false);
        handleMove(col);
      }, 800);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [currentPlayer, gameMode, winner, isDraw, isAnimating, board, handleMove]);

  if (!gameMode) {
    return <GameModeSelector onSelectMode={setGameMode} />;
  }

  const isLocked = winner !== null || isDraw || isAnimating ||
    (currentPlayer === PLAYER_TWO && gameMode !== GAME_MODES.PVP);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      {/* Win confetti */}
      {winner && <Confetti winner={winner} />}

      <div className="relative w-full max-w-lg">
        <GameHeader
          currentPlayer={currentPlayer}
          winner={winner}
          isDraw={isDraw}
          gameMode={gameMode}
          scores={scores}
          isThinking={isThinking}
          onReset={resetGame}
          onChangeMode={() => setGameMode(null)}
        />

        <div className="pt-8 sm:pt-12">
          <Board
            board={board}
            currentPlayer={currentPlayer}
            winningLine={winningLine}
            droppingToken={droppingToken}
            isLocked={isLocked}
            onColumnClick={handleMove}
          />
        </div>

        {/* Footer */}

      </div>
    </div>
  );
};

export default ConnectFour;
