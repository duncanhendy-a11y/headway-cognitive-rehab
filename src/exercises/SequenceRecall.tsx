import { useState, useEffect } from 'react';
import { Difficulty } from '../types';

interface SequenceRecallProps {
  difficulty: Difficulty;
  onComplete: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const getDifficultySettings = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return { length: 4, rounds: 5, showTime: 3000 };
    case 'medium': return { length: 6, rounds: 5, showTime: 4000 };
    case 'hard': return { length: 8, rounds: 5, showTime: 5000 };
  }
};

export function SequenceRecall({ difficulty, onComplete, onScoreUpdate }: SequenceRecallProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isShowing, setIsShowing] = useState(true);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Memorize the numbers...');

  const settings = getDifficultySettings(difficulty);

  useEffect(() => {
    startNewRound();
  }, [difficulty]);

  useEffect(() => {
    onScoreUpdate(score);
  }, [score]);

  const startNewRound = () => {
    const newSequence = Array.from({ length: settings.length }, () =>
      Math.floor(Math.random() * 10)
    );
    setSequence(newSequence);
    setUserInput('');
    setIsShowing(true);
    setMessage('Memorize the numbers...');

    setTimeout(() => {
      setIsShowing(false);
      setMessage('Enter the sequence:');
    }, settings.showTime);
  };

  const handleSubmit = () => {
    const userSequence = userInput.split('').map(Number);
    const isCorrect = userSequence.length === sequence.length &&
      userSequence.every((num, idx) => num === sequence[idx]);

    if (isCorrect) {
      const roundScore = 20;
      setScore(score + roundScore);
      setMessage('Correct! Great memory!');

      setTimeout(() => {
        if (round < settings.rounds) {
          setRound(round + 1);
          startNewRound();
        } else {
          onComplete(score + roundScore);
        }
      }, 1500);
    } else {
      setMessage(`Incorrect! The sequence was: ${sequence.join('')}`);
      setTimeout(() => {
        if (round < settings.rounds) {
          setRound(round + 1);
          startNewRound();
        } else {
          onComplete(score);
        }
      }, 2500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInput.length === sequence.length) {
      handleSubmit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">{message}</p>
        <p className="text-xl text-gray-600">
          Round: <strong className="text-blue-600">{round}/{settings.rounds}</strong>
        </p>
      </div>

      {isShowing ? (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-12 text-center shadow-xl">
          <p className="text-7xl font-bold text-white tracking-wider">
            {sequence.join(' ')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <input
            type="text"
            value={userInput}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= sequence.length) {
                setUserInput(value);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter the numbers..."
            className="w-full text-4xl text-center font-bold p-6 border-4 border-blue-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
            maxLength={sequence.length}
            autoFocus
          />

          <button
            onClick={handleSubmit}
            disabled={userInput.length !== sequence.length}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Submit
          </button>

          <p className="text-center text-gray-600 text-lg">
            {userInput.length}/{sequence.length} digits entered
          </p>
        </div>
      )}
    </div>
  );
}
