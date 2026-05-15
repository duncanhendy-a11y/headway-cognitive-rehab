import { useState, useEffect } from 'react';
import { Difficulty } from '../types';

interface SpatialPuzzleProps {
  difficulty: Difficulty;
  onComplete: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const getDifficultySettings = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return { size: 3 };
    case 'medium': return { size: 4 };
    case 'hard': return { size: 5 };
  }
};

export function SpatialPuzzle({ difficulty, onComplete, onScoreUpdate }: SpatialPuzzleProps) {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const size = getDifficultySettings(difficulty).size;
  const totalTiles = size * size;

  useEffect(() => {
    initPuzzle();
  }, [difficulty]);

  useEffect(() => {
    const currentScore = Math.max(100 - moves * 2, 0);
    setScore(currentScore);
    onScoreUpdate(currentScore);
  }, [moves]);

  const initPuzzle = () => {
    const solved = Array.from({ length: totalTiles }, (_, i) => i);
    const shuffled = [...solved];

    for (let i = 0; i < 100; i++) {
      const emptyIndex = shuffled.indexOf(0);
      const validMoves = getValidMoves(emptyIndex);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      [shuffled[emptyIndex], shuffled[randomMove]] = [shuffled[randomMove], shuffled[emptyIndex]];
    }

    setTiles(shuffled);
    setMoves(0);
  };

  const getValidMoves = (emptyIndex: number) => {
    const moves = [];
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;

    if (row > 0) moves.push(emptyIndex - size);
    if (row < size - 1) moves.push(emptyIndex + size);
    if (col > 0) moves.push(emptyIndex - 1);
    if (col < size - 1) moves.push(emptyIndex + 1);

    return moves;
  };

  const handleTileClick = (index: number) => {
    const emptyIndex = tiles.indexOf(0);
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(index)) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      setTiles(newTiles);
      setMoves(moves + 1);

      if (isSolved(newTiles)) {
        const score = Math.max(100 - moves, 10);
        setTimeout(() => onComplete(score), 500);
      }
    }
  };

  const isSolved = (currentTiles: number[]) => {
    return currentTiles.every((tile, index) => tile === index);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <p className="text-xl text-gray-700">
          Moves: <strong className="text-blue-600">{moves}</strong>
        </p>
        <p className="text-lg text-gray-600 mt-2">
          Arrange the tiles in order from 1 to {totalTiles - 1}
        </p>
      </div>

      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          maxWidth: `${size * 100}px`
        }}
      >
        {tiles.map((tile, index) => (
          <button
            key={index}
            onClick={() => handleTileClick(index)}
            disabled={tile === 0}
            className={`aspect-square rounded-xl text-3xl font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
              tile === 0
                ? 'bg-gray-200 cursor-default'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:scale-105'
            }`}
          >
            {tile !== 0 && tile}
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={initPuzzle}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300"
        >
          Shuffle Again
        </button>
      </div>
    </div>
  );
}
