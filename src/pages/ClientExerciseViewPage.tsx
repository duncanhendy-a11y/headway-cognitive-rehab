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
import {
  HandWaving, CheckCircle, Star, ArrowRight,
  Cards, GridFour, ListNumbers, TextT, PuzzlePiece, Crosshair,
} from '@phosphor-icons/react';
import type { ExerciseType, RoundTelemetry } from '@/types';

const EXERCISE_META: Record<ExerciseType, { label: string; icon: React.ReactNode }> = {
  memory:    { label: 'Memory Match',        icon: <Cards weight="duotone" className="w-5 h-5" /> },
  pattern:   { label: 'Pattern Recognition', icon: <GridFour weight="duotone" className="w-5 h-5" /> },
  sequence:  { label: 'Sequence Recall',     icon: <ListNumbers weight="duotone" className="w-5 h-5" /> },
  word:      { label: 'Word Games',          icon: <TextT weight="duotone" className="w-5 h-5" /> },
  spatial:   { label: 'Spatial Puzzle',      icon: <PuzzlePiece weight="duotone" className="w-5 h-5" /> },
  attention: { label: 'Focus Challenge',     icon: <Crosshair weight="duotone" className="w-5 h-5" /> },
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
  const activeTypeRef = useRef<ExerciseType | null>(null);
  const currentIndexRef = useRef<number>(0);

  const [displayType, setDisplayType] = useState<ExerciseType | null>(null);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [_currentScore, setCurrentScore] = useState(0);

  const exerciseStartRef = useRef<number>(Date.now());
  const roundsRef = useRef<RoundTelemetry[]>([]);
  const sessionExerciseIdRef = useRef<string | null>(null);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F7FF' }}>
        <div className="text-center p-8">
          <p className="text-xl font-semibold mb-4" style={{ color: '#003361' }}>No active session.</p>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm underline" style={{ color: '#6491C0' }}>
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
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#F0F7FF' }}>
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{ backgroundColor: '#003361' }}>
            <HandWaving weight="fill" className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: '#003361', letterSpacing: '-0.02em' }}>
            Hello, {clientIdentifier}
          </h1>
          <p className="text-slate-500 text-lg mb-2 leading-relaxed">
            Your therapist has set up {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} for you today.
          </p>
          <p className="text-slate-400 mb-10">Take your time. There is no rush at all.</p>
          <button
            onClick={handleStart}
            className="w-full py-5 rounded-2xl text-lg font-semibold transition-transform active:scale-95 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#003361', color: 'white' }}
          >
            Let's begin <ArrowRight weight="bold" className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Exercise ─────────────────────────────────────────────────────────────────
  if (phase === 'exercise' && displayType) {
    const meta = EXERCISE_META[displayType];
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F0F7FF' }}>
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#003361' }}>
            <span style={{ color: '#6491C0' }}>{meta.icon}</span>
            {meta.label}
          </div>
          <div className="flex gap-1.5">
            {selectedExercises.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i < currentIndex ? '#22c55e' : i === currentIndex ? '#003361' : '#C8D9EC',
                }} />
            ))}
          </div>
        </div>
        <div className="flex-1 px-4 pb-6 overflow-auto">
          <div className="bg-white rounded-3xl shadow-sm p-6 min-h-[calc(100vh-100px)]">
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
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#F0F7FF' }}>
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{ backgroundColor: '#FEDC00' }}>
            <CheckCircle weight="fill" className="w-10 h-10" style={{ color: '#003361' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: '#003361', letterSpacing: '-0.02em' }}>
            Well done!
          </h2>
          {done && (
            <p className="text-slate-500 text-base mb-8">
              {EXERCISE_META[done.exerciseType].label} complete
            </p>
          )}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-8">
            <p className="text-5xl font-bold mb-1 tracking-tight" style={{ color: '#003361', letterSpacing: '-0.02em' }}>
              {done?.finalScore ?? 0}
            </p>
            <p className="text-sm text-slate-400">points this round</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-8">
            <span>Next up:</span>
            <span style={{ color: '#6491C0' }}>{nextMeta.icon}</span>
            <span className="font-medium" style={{ color: '#003361' }}>{nextMeta.label}</span>
          </div>
          <button
            onClick={handleContinue}
            className="w-full py-5 rounded-2xl text-lg font-semibold transition-transform active:scale-95 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#003361', color: 'white' }}
          >
            Continue <ArrowRight weight="bold" className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const totalScore = completedExercises.reduce((sum, ex) => sum + ex.finalScore, 0);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#F0F7FF' }}>
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{ backgroundColor: '#FEDC00' }}>
            <Star weight="fill" className="w-10 h-10" style={{ color: '#003361' }} />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: '#003361', letterSpacing: '-0.02em' }}>
            Brilliant work!
          </h2>
          <p className="text-slate-500 text-lg mb-2 leading-relaxed">
            You completed all {selectedExercises.length} exercises today.
          </p>
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <p className="text-5xl font-bold mb-1 tracking-tight" style={{ color: '#003361', letterSpacing: '-0.02em' }}>
              {totalScore}
            </p>
            <p className="text-sm text-slate-400 mb-5">total points</p>
            <div className="space-y-3 text-left border-t border-slate-100 pt-4">
              {completedExercises.map((ex, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span style={{ color: '#6491C0' }}>{EXERCISE_META[ex.exerciseType].icon}</span>
                    {EXERCISE_META[ex.exerciseType].label}
                  </div>
                  <span className="font-semibold" style={{ color: '#003361' }}>{ex.finalScore} pts</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Please hand the device back to your therapist.
          </p>
          <button
            onClick={handleFinish}
            className="w-full py-5 rounded-2xl text-lg font-semibold transition-transform active:scale-95"
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
