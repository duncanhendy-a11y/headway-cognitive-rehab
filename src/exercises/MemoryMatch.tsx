import { useState, useEffect } from 'react';
import { Difficulty } from '../types';

interface MemoryMatchProps {
  difficulty: Difficulty;
  onComplete: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const emojis = ['🎨', '🎭', '🎪', '🎯', '🎸', '🎹', '🎺', '🎻', '🏀', '⚽', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸'];

const getDifficultySettings = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return { pairs: 6 };
    case 'medium': return { pairs: 8 };
    case 'hard': return { pairs: 12 };
  }
};

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryMatch({ difficulty, onComplete, onScoreUpdate }: MemoryMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [_score, setScore] = useState(0);

  const settings = getDifficultySettings(difficulty);
  const totalPairs = settings.pairs;

  useEffect(() => {
    initGame();
  }, [difficulty]);

  useEffect(() => {
    const currentScore = matches * 10;
    setScore(currentScore);
    onScoreUpdate(currentScore);
  }, [matches]);

  const initGame = () => {
    const selectedEmojis = emojis.slice(0, totalPairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    const shuffled = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
  };

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2) return;
    if (cards[id].isFlipped || cards[id].isMatched) return;
    if (flippedCards.includes(id)) return;

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    const newCards = cards.map(card =>
      card.id === id ? { ...card, isFlipped: true } : card
    );
    setCards(newCards);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;

      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === first || card.id === second
              ? { ...card, isMatched: true }
              : card
          ));
          setFlippedCards([]);
          const newMatches = matches + 1;
          setMatches(newMatches);

          if (newMatches === totalPairs) {
            const finalScore = newMatches * 10;
            setTimeout(() => onComplete(finalScore), 500);
          }
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === first || card.id === second
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xl text-gray-700">
          Moves: <strong className="text-blue-600">{moves}</strong> |
          Matches: <strong className="text-green-600">{matches}/{totalPairs}</strong>
        </p>
      </div>

      <div className={`grid gap-4 ${totalPairs <= 6 ? 'grid-cols-3 sm:grid-cols-4' : totalPairs <= 8 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-6'}`}>
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched || card.isFlipped}
            className={`aspect-square rounded-xl text-5xl font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
              card.isFlipped || card.isMatched
                ? 'bg-white shadow-lg'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md'
            } ${card.isMatched ? 'opacity-50' : ''}`}
          >
            {(card.isFlipped || card.isMatched) ? card.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}
