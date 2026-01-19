import React from 'react';
import { GameMode } from '../../hooks/useGame';
import { Difficulty } from '../../ai/connectFourAI';
import { Player } from '../../utils/gameLogic';
import { cn } from '@/lib/utils';
import { Users, Bot, RotateCcw, Zap, Brain } from 'lucide-react';

interface GameControlsProps {
  mode: GameMode;
  difficulty: Difficulty;
  aiPlayer: Player;
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onAIPlayerChange: (player: Player) => void;
  onRestart: () => void;
  onResetScores: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  mode,
  difficulty,
  aiPlayer,
  onModeChange,
  onDifficultyChange,
  onAIPlayerChange,
  onRestart,
  onResetScores,
}) => {
  return (
    <div className="glass-card p-4 sm:p-6 space-y-6">
      {/* Game Mode */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Game Mode
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onModeChange('pvp')}
            className={cn(
              'flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300',
              mode === 'pvp'
                ? 'btn-game text-primary-foreground'
                : 'btn-secondary-game'
            )}
          >
            <Users className="w-4 h-4" />
            <span>2 Players</span>
          </button>
          <button
            onClick={() => onModeChange('pve')}
            className={cn(
              'flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300',
              mode === 'pve'
                ? 'btn-game text-primary-foreground'
                : 'btn-secondary-game'
            )}
          >
            <Bot className="w-4 h-4" />
            <span>vs AI</span>
          </button>
        </div>
      </div>

      {/* AI Settings */}
      {mode === 'pve' && (
        <>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              AI Difficulty
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onDifficultyChange('easy')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all duration-300',
                  difficulty === 'easy'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : 'btn-secondary-game'
                )}
              >
                <Zap className="w-4 h-4" />
                <span>Easy</span>
              </button>
              <button
                onClick={() => onDifficultyChange('hard')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all duration-300',
                  difficulty === 'hard'
                    ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                    : 'btn-secondary-game'
                )}
              >
                <Brain className="w-4 h-4" />
                <span>Hard</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              You Play As
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAIPlayerChange('yellow')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all duration-300',
                  aiPlayer === 'yellow'
                    ? 'bg-player-red/20 border border-player-red/50 text-player-red'
                    : 'btn-secondary-game'
                )}
              >
                <div className="w-4 h-4 rounded-full token-red" />
                <span>Red</span>
              </button>
              <button
                onClick={() => onAIPlayerChange('red')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all duration-300',
                  aiPlayer === 'red'
                    ? 'bg-player-yellow/20 border border-player-yellow/50 text-player-yellow'
                    : 'btn-secondary-game'
                )}
              >
                <div className="w-4 h-4 rounded-full token-yellow" />
                <span>Yellow</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold btn-game text-primary-foreground"
        >
          <RotateCcw className="w-4 h-4" />
          <span>New Game</span>
        </button>
        <button
          onClick={onResetScores}
          className="w-full py-2.5 px-4 rounded-xl font-medium btn-secondary-game text-muted-foreground hover:text-foreground"
        >
          Reset Scores
        </button>
      </div>
    </div>
  );
};
