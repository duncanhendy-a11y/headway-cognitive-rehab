import { useState, useEffect, useRef } from 'react';
import { Difficulty } from '../types';
import type { RoundTelemetry } from '../types';

interface WordGamesProps {
  difficulty: Difficulty;
  onComplete: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onRoundComplete?: (telemetry: RoundTelemetry) => void;
}

const categories = {
  Animals: ['Dog', 'Cat', 'Elephant', 'Lion', 'Tiger', 'Bear', 'Rabbit', 'Fox', 'Wolf', 'Deer'],
  Fruits: ['Apple', 'Banana', 'Orange', 'Grape', 'Mango', 'Peach', 'Pear', 'Cherry', 'Plum', 'Kiwi'],
  Colors: ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White'],
  Countries: ['USA', 'Canada', 'Mexico', 'Brazil', 'France', 'Germany', 'Italy', 'Spain', 'Japan', 'China'],
};

const getDifficultySettings = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return { words: 4, showTime: 5000, rounds: 5 };
    case 'medium': return { words: 6, showTime: 6000, rounds: 5 };
    case 'hard': return { words: 8, showTime: 7000, rounds: 5 };
  }
};

export function WordGames({ difficulty, onComplete, onScoreUpdate, onRoundComplete }: WordGamesProps) {
  const [category, setCategory] = useState('');
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isShowing, setIsShowing] = useState(true);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Memorize these words...');
  const inputStartRef = useRef<string>(new Date().toISOString());

  const settings = getDifficultySettings(difficulty);

  useEffect(() => { startNewRound(); }, [difficulty]);
  useEffect(() => { onScoreUpdate(score); }, [score]);

  const startNewRound = () => {
    const categoryName = Object.keys(categories)[Math.floor(Math.random() * Object.keys(categories).length)] as keyof typeof categories;
    const categoryWords = categories[categoryName];
    const shuffled = [...categoryWords].sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, settings.words);
    const distractors = shuffled.slice(settings.words, settings.words * 2);
    const all = [...targets, ...distractors].sort(() => Math.random() - 0.5);

    setCategory(categoryName);
    setTargetWords(targets);
    setAllWords(all);
    setSelectedWords([]);
    setIsShowing(true);
    setMessage(`Memorize these ${categoryName.toLowerCase()}...`);

    setTimeout(() => {
      setIsShowing(false);
      setMessage(`Select the ${categoryName.toLowerCase()} you saw:`);
      inputStartRef.current = new Date().toISOString();
    }, settings.showTime);
  };

  const handleWordClick = (word: string) => {
    if (isShowing) return;
    setSelectedWords(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const handleSubmit = () => {
    const correct = selectedWords.filter(w => targetWords.includes(w)).length;
    const incorrect = selectedWords.filter(w => !targetWords.includes(w)).length;
    const roundScore = Math.max((correct * 10) - (incorrect * 5), 0);

    onRoundComplete?.({
      round_number: round,
      score: roundScore,
      errors: incorrect,
      response_time_ms: null,
      started_at: inputStartRef.current,
      completed_at: new Date().toISOString(),
      metadata: { category, target_count: targetWords.length, correct, incorrect },
    });

    setScore(score + roundScore);
    setMessage(`You got ${correct}/${targetWords.length} correct!`);

    setTimeout(() => {
      if (round < settings.rounds) { setRound(round + 1); startNewRound(); }
      else { onComplete(score + roundScore); }
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">{message}</p>
        <p className="text-xl text-gray-600">
          Round: <strong className="text-blue-600">{round}/{settings.rounds}</strong>
        </p>
      </div>

      {isShowing ? (
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 shadow-xl">
          <h3 className="text-3xl font-bold text-white text-center mb-6">{category}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {targetWords.map((word, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center text-2xl font-bold text-purple-900">
                {word}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allWords.map((word, index) => (
              <button
                key={index}
                onClick={() => handleWordClick(word)}
                className={`p-6 rounded-xl text-xl font-bold transition-all duration-200 focus:outline-none focus:ring-4 ${
                  selectedWords.includes(word)
                    ? 'bg-blue-600 text-white ring-4 ring-blue-300 scale-105'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            Submit ({selectedWords.length} selected)
          </button>
        </div>
      )}
    </div>
  );
}
