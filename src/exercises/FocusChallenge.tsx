import { useState, useEffect, useRef } from 'react';
import { Difficulty } from '../types';
import type { RoundTelemetry } from '../types';

interface FocusChallengeProps {
  difficulty: Difficulty;
  onComplete: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onRoundComplete?: (telemetry: RoundTelemetry) => void;
}

const shapes = ['⭐', '❤️', '🔷', '🔶', '⬛', '⬜', '🟢', '🔴'];

const getDifficultySettings = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return { gridSize: 4, targets: 3, rounds: 5 };
    case 'medium': return { gridSize: 5, targets: 4, rounds: 5 };
    case 'hard': return { gridSize: 6, targets: 5, rounds: 5 };
  }
};

export function FocusChallenge({ difficulty, onComplete, onScoreUpdate, onRoundComplete }: FocusChallengeProps) {
  const [grid, setGrid] = useState<string[]>([]);
  const [target, setTarget] = useState('');
  const [found, setFound] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [wrongClicks, setWrongClicks] = useState(0);
  const roundStartRef = useRef<string>(new Date().toISOString());

  const settings = getDifficultySettings(difficulty);
  const totalCells = settings.gridSize * settings.gridSize;

  useEffect(() => { startNewRound(); }, [difficulty]);
  useEffect(() => { onScoreUpdate(score); }, [score]);

  const startNewRound = () => {
    const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
    const newGrid: string[] = [];
    const targetPositions = new Set<number>();

    while (targetPositions.size < settings.targets) {
      targetPositions.add(Math.floor(Math.random() * totalCells));
    }

    for (let i = 0; i < totalCells; i++) {
      if (targetPositions.has(i)) {
        newGrid.push(targetShape);
      } else {
        const distractorShapes = shapes.filter(s => s !== targetShape);
        newGrid.push(distractorShapes[Math.floor(Math.random() * distractorShapes.length)]);
      }
    }

    setGrid(newGrid);
    setTarget(targetShape);
    setFound([]);
    setWrongClicks(0);
    const now = Date.now();
    setStartTime(now);
    roundStartRef.current = new Date(now).toISOString();
  };

  const handleCellClick = (index: number) => {
    if (found.includes(index)) return;

    if (grid[index] === target) {
      const newFound = [...found, index];
      setFound(newFound);

      if (newFound.length === settings.targets) {
        const timeBonus = Math.max(50 - Math.floor((Date.now() - startTime) / 1000) * 2, 10);
        const roundScore = 30 + timeBonus;
        const completedAt = new Date().toISOString();
        onRoundComplete?.({
          round_number: round,
          score: roundScore,
          errors: wrongClicks,
          response_time_ms: Date.now() - startTime,
          started_at: roundStartRef.current,
          completed_at: completedAt,
          metadata: { grid_size: settings.gridSize, targets: settings.targets },
        });
        setScore(score + roundScore);
        setTimeout(() => {
          if (round < settings.rounds) { setRound(round + 1); startNewRound(); }
          else { onComplete(score + roundScore); }
        }, 1000);
      }
    } else {
      setWrongClicks(prev => prev + 1);
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">
          Find all <span className="text-4xl">{target}</span>
        </p>
        <p className="text-xl text-gray-600">
          Found: <strong className="text-green-600">{found.length}/{settings.targets}</strong> |
          Round: <strong className="text-blue-600">{round}/{settings.rounds}</strong>
        </p>
      </div>

      <div
        className="grid gap-3 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${settings.gridSize}, 1fr)`,
          maxWidth: `${settings.gridSize * 90}px`,
        }}
      >
        {grid.map((shape, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            className={`aspect-square rounded-xl text-4xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
              found.includes(index)
                ? 'bg-green-500 scale-110 shadow-xl'
                : 'bg-white hover:bg-gray-100 shadow-md hover:scale-105'
            }`}
          >
            {shape}
          </button>
        ))}
      </div>
    </div>
  );
}
