import { ExerciseType, Exercise } from '../types';

interface ExerciseMenuProps {
  onSelectExercise: (exercise: ExerciseType) => void;
}

const exercises: Exercise[] = [
  { id: 'memory', icon: '🧩', title: 'Memory Match', description: 'Match pairs of cards' },
  { id: 'pattern', icon: '🎯', title: 'Pattern Recognition', description: 'Remember and repeat patterns' },
  { id: 'sequence', icon: '🔢', title: 'Sequence Recall', description: 'Remember number sequences' },
  { id: 'word', icon: '📝', title: 'Word Games', description: 'Word matching & recall' },
  { id: 'spatial', icon: '🎲', title: 'Spatial Puzzle', description: 'Arrange pieces correctly' },
  { id: 'attention', icon: '👁️', title: 'Focus Challenge', description: 'Find the target quickly' },
];

export function ExerciseMenu({ onSelectExercise }: ExerciseMenuProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Choose an Exercise</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onSelectExercise(exercise.id)}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-8 text-center focus:outline-none focus:ring-4 focus:ring-blue-300 min-h-[200px] flex flex-col items-center justify-center"
          >
            <div className="text-6xl mb-4">{exercise.icon}</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{exercise.title}</h3>
            <p className="text-lg text-gray-600">{exercise.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
