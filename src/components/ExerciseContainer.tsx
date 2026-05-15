import { ArrowLeft } from 'lucide-react';
import { ExerciseType } from '../types';

interface ExerciseContainerProps {
  title: string;
  score: number;
  onBack: () => void;
  children: React.ReactNode;
}

export function ExerciseContainer({ title, score, onBack, children }: ExerciseContainerProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>

          <h2 className="text-3xl font-bold text-gray-800">{title}</h2>

          <div className="text-right">
            <span className="text-lg text-gray-600">Score: </span>
            <strong className="text-3xl font-bold text-blue-600">{score}</strong>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {children}
      </div>
    </div>
  );
}
