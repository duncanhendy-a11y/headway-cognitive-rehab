import { Trophy } from 'lucide-react';

interface CompletionModalProps {
  isOpen: boolean;
  message: string;
  score: number;
  onTryAgain: () => void;
  onBackToMenu: () => void;
}

export function CompletionModal({
  isOpen,
  message,
  score,
  onTryAgain,
  onBackToMenu
}: CompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Great Job!</h2>
        </div>

        <p className="text-2xl text-gray-700 mb-4">{message}</p>
        <p className="text-3xl font-bold text-blue-600 mb-8">Score: {score}</p>

        <div className="flex gap-4">
          <button
            onClick={onTryAgain}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Try Again
          </button>
          <button
            onClick={onBackToMenu}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
