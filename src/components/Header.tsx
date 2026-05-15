import { Brain } from 'lucide-react';
import { Difficulty } from '../types';

interface HeaderProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStatsClick: () => void;
}

export function Header({ difficulty, onDifficultyChange, onStatsClick }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-10 h-10" />
            <h1 className="text-2xl sm:text-3xl font-bold">Cognitive Rehab</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="difficulty" className="text-lg font-medium">
                Level:
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
                className="px-4 py-2 rounded-lg bg-white text-blue-900 font-semibold text-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[120px]"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <button
              onClick={onStatsClick}
              className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 font-semibold text-lg"
              title="View Statistics"
            >
              Progress
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
