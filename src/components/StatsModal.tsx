import { X } from 'lucide-react';
import { Stats } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  stats: Stats;
  onClose: () => void;
}

const exerciseNames: Record<string, string> = {
  memory: 'Memory Match',
  pattern: 'Pattern Recognition',
  sequence: 'Sequence Recall',
  word: 'Word Games',
  spatial: 'Spatial Puzzle',
  attention: 'Focus Challenge',
};

export function StatsModal({ isOpen, stats, onClose }: StatsModalProps) {
  if (!isOpen) return null;

  const hasStats = Object.keys(stats).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">📊 Your Progress</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
          {!hasStats ? (
            <p className="text-center text-gray-600 text-xl py-8">
              No exercises completed yet. Start practicing to see your progress!
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats).map(([exercise, data]) => (
                <div key={exercise} className="bg-gray-50 rounded-xl p-6 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {exerciseNames[exercise] || exercise}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-lg">Completed</p>
                      <p className="text-3xl font-bold text-blue-600">{data.completed}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-lg">Best Score</p>
                      <p className="text-3xl font-bold text-green-600">{data.bestScore}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-lg">Average Score</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {data.averageScore.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-lg">Total Score</p>
                      <p className="text-3xl font-bold text-orange-600">{data.totalScore}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
