import { useState } from 'react';
import { Header } from './components/Header';
import { ExerciseMenu } from './components/ExerciseMenu';
import { ExerciseContainer } from './components/ExerciseContainer';
import { StatsModal } from './components/StatsModal';
import { CompletionModal } from './components/CompletionModal';
import { MemoryMatch } from './exercises/MemoryMatch';
import { PatternRecognition } from './exercises/PatternRecognition';
import { SequenceRecall } from './exercises/SequenceRecall';
import { WordGames } from './exercises/WordGames';
import { SpatialPuzzle } from './exercises/SpatialPuzzle';
import { FocusChallenge } from './exercises/FocusChallenge';
import { Difficulty, ExerciseType } from './types';
import { getStats, updateStats } from './utils/storage';

const exerciseTitles: Record<ExerciseType, string> = {
  memory: 'Memory Match',
  pattern: 'Pattern Recognition',
  sequence: 'Sequence Recall',
  word: 'Word Games',
  spatial: 'Spatial Puzzle',
  attention: 'Focus Challenge',
};

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentExercise, setCurrentExercise] = useState<ExerciseType | null>(null);
  const [score, setScore] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionScore, setCompletionScore] = useState(0);

  const handleSelectExercise = (exercise: ExerciseType) => {
    setCurrentExercise(exercise);
    setScore(0);
  };

  const handleBackToMenu = () => {
    setCurrentExercise(null);
    setScore(0);
  };

  const handleComplete = (finalScore: number) => {
    if (currentExercise) {
      updateStats(currentExercise, finalScore);
    }
    setCompletionScore(finalScore);
    setShowCompletion(true);
  };

  const handleTryAgain = () => {
    setShowCompletion(false);
    setScore(0);
  };

  const handleCompletionBackToMenu = () => {
    setShowCompletion(false);
    setCurrentExercise(null);
    setScore(0);
  };

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };

  const renderExercise = () => {
    if (!currentExercise) return null;

    const props = {
      difficulty,
      onComplete: handleComplete,
      onScoreUpdate: handleScoreUpdate,
    };

    switch (currentExercise) {
      case 'memory':
        return <MemoryMatch {...props} />;
      case 'pattern':
        return <PatternRecognition {...props} />;
      case 'sequence':
        return <SequenceRecall {...props} />;
      case 'word':
        return <WordGames {...props} />;
      case 'spatial':
        return <SpatialPuzzle {...props} />;
      case 'attention':
        return <FocusChallenge {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onStatsClick={() => setShowStats(true)}
      />

      {currentExercise ? (
        <ExerciseContainer
          title={exerciseTitles[currentExercise]}
          score={score}
          onBack={handleBackToMenu}
        >
          {renderExercise()}
        </ExerciseContainer>
      ) : (
        <ExerciseMenu onSelectExercise={handleSelectExercise} />
      )}

      <StatsModal
        isOpen={showStats}
        stats={getStats()}
        onClose={() => setShowStats(false)}
      />

      <CompletionModal
        isOpen={showCompletion}
        message="You completed the exercise!"
        score={completionScore}
        onTryAgain={handleTryAgain}
        onBackToMenu={handleCompletionBackToMenu}
      />
    </div>
  );
}

export default App;
