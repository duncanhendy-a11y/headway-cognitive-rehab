import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionStore } from '@/lib/sessionStore';
import { supabase } from '@/lib/supabase';
import { MemoryMatch } from '@/exercises/MemoryMatch';
import { PatternRecognition } from '@/exercises/PatternRecognition';
import { SequenceRecall } from '@/exercises/SequenceRecall';
import { WordGames } from '@/exercises/WordGames';
import { SpatialPuzzle } from '@/exercises/SpatialPuzzle';
import { FocusChallenge } from '@/exercises/FocusChallenge';
import type { ExerciseType, RoundTelemetry } from '@/types';

const EXERCISE_META: Record<ExerciseType, { label: string; icon: string }> = {
  memory:    { label: 'Memory Match',        icon: '🃏' },
  pattern:   { label: 'Pattern Recognition', icon: '🎨' },
  sequence:  { label: 'Sequence Recall',     icon: '🔢' },
  word:      { label: 'Word Games',          icon: '📝' },
  spatial:   { label: 'Spatial Puzzle',      icon: '🧩' },
  attention: { label: 'Focus Challenge',     icon: '🔍' },
};

interface CompletedExercise {
  exerciseType: ExerciseType;
  finalScore: number;
  durationSeconds: number;
  rounds: RoundTelemetry[];
}

type Phase = 'welcome' | 'exercise' | 'between' | 'done';

export function ClientExerciseViewPage() {
  const navigate = useNavigate();
  const session = sessionStore.get();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [currentIndex, setCurrentIndex] = useState(0);
  // Track active exercise type in a ref to avoid stale closure in callbacks
  const activeTypeRef = useRef<ExerciseType | null>(null);
  const currentIndexRef = useRef<number>(0);

  // Display state for the exercise screen
  const [displayType, setDisplayType] = useState<ExerciseType | null>(null);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [_currentScore, setCurrentScore] = useState(0);

  // Telemetry accumulator
  const exerciseStartRef = useRef<number>(Date.now());
  const roundsRef = useRef<RoundTelemetry[]>([]);
  const sessionExerciseIdRef = useRef<string | null>(null);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F9FF' }}>
        <div className="text-center p-8">
          <p className="text-2xl font-bold mb-4" style={{ color: '#003361' }}>No active session.</p>
          <button onClick={() => navigate('/dashboard')} className="underline text-blue-600">
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  const { selectedExercises, difficulty, clientIdentifier, sessionId } = session;

  const handleRoundComplete = useCallback((telemetry: RoundTelemetry) => {
    roundsRef.current = [...roundsRef.current, telemetry];
  }, []);

  const handleExerciseComplete = useCallback(async (score: number) => {
    const exType = activeTypeRef.current;
    const idx = currentIndexRef.current;
    const durationSeconds = Math.round((Date.now() - exerciseStartRef.current) / 1000);
    const rounds = [...roundsRef.current];
    const seId = sessionExerciseIdRef.current;

    if (seId) {
      await supabase
        .from('session_exercises')
        .update({ final_score: score, duration_seconds: durationSeconds, completed: true })
        .eq('id', seId);

      if (rounds.length > 0) {
        await supabase.from('exercise_telemetry').insert(
          rounds.map(r => ({
            session_exercise_id: seId,
            round_number: r.round_number,
            score: r.score,
            errors: r.errors,
            response_time_ms: r.response_time_ms,
            started_at: r.started_at,
            completed_at: r.completed_at,
            metadata: r.metadata ?? null,
          }))
        );
      }
    }

    setCompletedExercises(prev => [
      ...prev,
      { exerciseType: exType!, finalScore: score, durationSeconds, rounds },
    ]);
    setCurrentScore(0);
    roundsRef.current = [];

    setPhase(idx === selectedExercises.length - 1 ? 'done' : 'between');
  }, [selectedExercises.length]);

  const beginExercise = useCallback(async (type: ExerciseType, index: number) => {
    const { data } = await supabase
      .from('session_exercises')
      .insert({
        session_id: sessionId,
        exercise_type: type,
        difficulty,
        sequence_order: index + 1,
        final_score: 0,
        completed: false,
      })
      .select('id')
      .single();

    sessionExerciseIdRef.current = data?.id ?? null;
    exerciseStartRef.current = Date.now();
    roundsRef.current = [];
    activeTypeRef.current = type;
    currentIndexRef.current = index;
    setCurrentIndex(index);
    setDisplayType(type);
    setCurrentScore(0);
    setPhase('exercise');
  }, [sessionId, difficulty]);

  const handleStart = () => beginExercise(selectedExercises[0], 0);
  const handleContinue = () => beginExercise(selectedExercises[currentIndex + 1], currentIndex + 1);
  const handleFinish = () => navigate('/session/notes');

  const renderExercise = () => {
    if (!displayType) return null;
    const props = { difficulty, onComplete: handleExerciseComplete, onScoreUpdate: setCurrentScore, onRoundComplete: handleRoundComplete };
    switch (displayType) {
      case 'memory':    return <MemoryMatch    {...props} />;
      case 'pattern':   return <PatternRecognition {...props} />;
      case 'sequence':  return <SequenceRecall {...props} />;
      case 'word':      return <WordGames      {...props} />;
      case 'spatial':   return <SpatialPuzzle  {...props} />;
      case 'attention': return <FocusChallenge {...props} />;
    }
  };

  // ── Welcome ──────────────────────────────────────────────────────────────────
  if (phase === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#F5F9FF' }}>
        <div className="text-center max-w-sm w-full">
          <div className="text-6xl mb-6">👋</div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: '#003361' }}>
            Hello, {clientIdentifier}
          </h1>
          <p className="text-gray-500 text-lg mb-2">
            Your therapist has prepared {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} for you today.
          </p>
          <p className="text-gray-400 mb-10">Take your time — there is no rush.</p>
          <button
            onClick={handleStart}
            className="w-full py-5 rounded-2xl text-xl font-bold transition-transform active:scale-95"
            style={{ backgroundColor: '#003361', color: 'white' }}
          >
            Let's start
          </button>
        </div>
      </div>
    );
  }

  // ── Exercise ─────────────────────────────────────────────────────────────────
  if (phase === 'exercise' && displayType) {
    const meta = EXERCISE_META[displayType];
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F9FF' }}>
        <div className="px-6 pt-6 pb-3 flex items-center justify-between">
          <p className="text-sm text-gray-400 font-medium">{meta.icon} {meta.label}</p>
          <div className="flex gap-2">
            {selectedExercises.map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i < currentIndex ? '#4CAF50' : i === currentIndex ? '#003361' : '#D1DCE8',
                }} />
            ))}
          </div>
        </div>
        <div className="flex-1 px-4 pb-6 overflow-auto">
          <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[calc(100vh-120px)]">
            {renderExercise()}
          </div>
        </div>
      </div>
    );
  }

  // ── Between exercises ─────────────────────────────────────────────────────────
  if (phase === 'between') {
    const done = completedExercises[completedExercises.length - 1];
    const nextMeta = EXERCISE_META[selectedExercises[currentIndex + 1]];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#F5F9FF' }}>
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
            style={{ backgroundColor: '#E8F5E9' }}>
            ✓
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#003361' }}>Well done!</h2>
          {done && (
            <p className="text-gray-500 text-lg mb-8">
              {EXERCISE_META[done.exerciseType].label} complete
            </p>
          )}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-8">
            <p className="text-4xl font-bold mb-1" style={{ color: '#003361' }}>
              {done?.finalScore ?? 0}
            </p>
            <p className="text-sm text-gray-400">points scored</p>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Next: {nextMeta.icon} {nextMeta.label}
          </p>
          <button
            onClick={handleContinue}
            className="w-full py-5 rounded-2xl text-xl font-bold transition-transform active:scale-95"
            style={{ backgroundColor: '#003361', color: 'white' }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const totalScore = completedExercises.reduce((sum, ex) => sum + ex.finalScore, 0);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#F5F9FF' }}>
        <div className="text-center max-w-sm w-full">
          <div className="text-6xl mb-6">🌟</div>
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#003361' }}>Brilliant work!</h2>
          <p className="text-gray-500 text-lg mb-2">
            You completed all {selectedExercises.length} exercises.
          </p>
          <p className="text-gray-400 mb-8">
            Total score: <strong style={{ color: '#003361' }}>{totalScore} points</strong>
          </p>
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-8 text-left space-y-3">
            {completedExercises.map((ex, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {EXERCISE_META[ex.exerciseType].icon} {EXERCISE_META[ex.exerciseType].label}
                </span>
                <span className="font-bold" style={{ color: '#003361' }}>{ex.finalScore} pts</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
            Please hand the device back to your therapist.
          </div>
          <button
            onClick={handleFinish}
            className="w-full py-5 rounded-2xl text-xl font-bold transition-transform active:scale-95"
            style={{ backgroundColor: '#003361', color: 'white' }}
          >
            Finish
          </button>
        </div>
      </div>
    );
  }

  return null;
}
