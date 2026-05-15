import { useState, useEffect, useRef } from 'react';
import { Difficulty } from '../types';
import type { RoundTelemetry } from '../types';

interface PatternRecognitionProps {
  difficulty: Difficulty;
  onComplete: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onRoundComplete?: (telemetry: RoundTelemetry) => void;
}

const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

const getDifficultySettings = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return { length: 4, rounds: 5 };
    case 'medium': return { length: 6, rounds: 5 };
    case 'hard': return { length: 8, rounds: 5 };
  }
};

export function PatternRecognition({ difficulty, onComplete, onScoreUpdate, onRoundComplete }: PatternRecognitionProps) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Watch the pattern...');
  const roundStartRef = useRef<string>(new Date().toISOString());

  const settings = getDifficultySettings(difficulty);

  useEffect(() => { startNewRound(); }, [difficulty]);
  useEffect(() => { onScoreUpdate(score); }, [score]);

  const startNewRound = () => {
    const newPattern = Array.from({ length: settings.length }, () =>
      Math.floor(Math.random() * colors.length)
    );
    setPattern(newPattern);
    setUserPattern([]);
    setIsShowing(true);
    setCurrentIndex(-1);
    setMessage('Watch the pattern...');
    roundStartRef.current = new Date().toISOString();
    showPattern(newPattern);
  };

  const showPattern = async (patternToShow: number[]) => {
    for (let i = 0; i < patternToShow.length; i++) {
      setCurrentIndex(i);
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentIndex(-1);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    setIsShowing(false);
    setMessage('Now repeat the pattern!');
  };

  const handleColorClick = (colorIndex: number) => {
    if (isShowing) return;

    const newUserPattern = [...userPattern, colorIndex];
    setUserPattern(newUserPattern);

    if (newUserPattern[newUserPattern.length - 1] !== pattern[newUserPattern.length - 1]) {
      onRoundComplete?.({
        round_number: round, score: 0, errors: 1, response_time_ms: null,
        started_at: roundStartRef.current, completed_at: new Date().toISOString(),
        metadata: { pattern_length: settings.length },
      });
      setMessage('Incorrect! Try the next round.');
      setTimeout(() => {
        if (round < settings.rounds) { setRound(round + 1); startNewRound(); }
        else { onComplete(score); }
      }, 1500);
      return;
    }

    if (newUserPattern.length === pattern.length) {
      const roundScore = 20;
      onRoundComplete?.({
        round_number: round, score: roundScore, errors: 0, response_time_ms: null,
        started_at: roundStartRef.current, completed_at: new Date().toISOString(),
        metadata: { pattern_length: settings.length },
      });
      setScore(score + roundScore);
      setMessage('Correct! Well done!');
      setTimeout(() => {
        if (round < settings.rounds) { setRound(round + 1); startNewRound(); }
        else { onComplete(score + roundScore); }
      }, 1500);
    }
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">{message}</p>
        <p className="text-xl text-gray-600">
          Round: <strong className="text-blue-600">{round}/{settings.rounds}</strong>
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-8">
        {pattern.map((colorIndex, index) => (
          <div
            key={index}
            className={`aspect-square rounded-xl ${colors[colorIndex]} ${
              currentIndex === index ? 'ring-4 ring-white shadow-2xl scale-110' : 'opacity-30'
            } ${isShowing ? '' : 'opacity-100'} transition-all duration-300`}
          />
        ))}
      </div>

      {!isShowing && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {colors.map((color, index) => (
            <button
              key={index}
              onClick={() => handleColorClick(index)}
              className={`aspect-square rounded-xl ${color} hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white shadow-lg`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
