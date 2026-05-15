import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfessional } from '@/hooks/useProfessional';
import { supabase } from '@/lib/supabase';
import { sessionStore } from '@/lib/sessionStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft, ArrowRight, Check, Play,
  Cards, GridFour, ListNumbers, TextT, PuzzlePiece, Crosshair,
  SmileyWink, Smiley, Lightning,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Difficulty, ExerciseType } from '@/types';

const EXERCISE_ICONS: Record<string, React.ReactNode> = {
  memory:    <Cards weight="duotone" className="w-8 h-8" />,
  pattern:   <GridFour weight="duotone" className="w-8 h-8" />,
  sequence:  <ListNumbers weight="duotone" className="w-8 h-8" />,
  word:      <TextT weight="duotone" className="w-8 h-8" />,
  spatial:   <PuzzlePiece weight="duotone" className="w-8 h-8" />,
  attention: <Crosshair weight="duotone" className="w-8 h-8" />,
};

const EXERCISES: { id: ExerciseType; label: string; domain: string }[] = [
  { id: 'memory',    label: 'Memory Match',        domain: 'Short-term memory' },
  { id: 'pattern',   label: 'Pattern Recognition', domain: 'Sequential memory' },
  { id: 'sequence',  label: 'Sequence Recall',     domain: 'Working memory' },
  { id: 'word',      label: 'Word Games',           domain: 'Language' },
  { id: 'spatial',   label: 'Spatial Puzzle',       domain: 'Spatial reasoning' },
  { id: 'attention', label: 'Focus Challenge',      domain: 'Sustained attention' },
];

const DIFFICULTIES: { id: Difficulty; label: string; description: string; icon: React.ReactNode; colour: string }[] = [
  { id: 'easy',   label: 'Gentle',    description: 'Shorter sequences, more time, fewer items',     icon: <SmileyWink weight="duotone" className="w-6 h-6" />,  colour: '#22c55e' },
  { id: 'medium', label: 'Moderate',  description: 'Standard challenge suitable for most sessions', icon: <Smiley weight="duotone" className="w-6 h-6" />,      colour: '#f59e0b' },
  { id: 'hard',   label: 'Challenge', description: 'Longer sequences, more items, less time',       icon: <Lightning weight="duotone" className="w-6 h-6" />,   colour: '#ef4444' },
];

export function SessionSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientIdentifier } = (location.state ?? {}) as { clientId?: string; clientIdentifier?: string };
  const { professional, loading: profLoading } = useProfessional();

  const [step, setStep] = useState(1);
  const [selectedExercises, setSelectedExercises] = useState<ExerciseType[]>(EXERCISES.map(e => e.id));
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [creating, setCreating] = useState(false);

  if (!clientId || !clientIdentifier) {
    return (
      <div className="p-8">
        <p className="text-red-500 mb-4">No client selected. Please start a session from a client profile.</p>
        <Button onClick={() => navigate('/dashboard')} style={{ backgroundColor: '#003361', color: 'white' }}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const toggleExercise = (id: ExerciseType) => {
    setSelectedExercises(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleBeginSession = async () => {
    if (!professional) { toast.error('Profile not loaded. Please wait and try again.'); return; }
    if (selectedExercises.length === 0) { toast.error('Select at least one exercise.'); return; }

    setCreating(true);

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        professional_id: professional.id,
        client_id: clientId,
        difficulty,
        started_at: new Date().toISOString(),
        pending_sync: false,
      })
      .select()
      .single();

    setCreating(false);

    if (error || !data) {
      toast.error('Could not start session. Check your connection and try again.');
      return;
    }

    sessionStore.set({
      sessionId: data.id,
      clientId,
      clientIdentifier,
      professionalId: professional.id,
      difficulty,
      selectedExercises: [...selectedExercises],
    });

    navigate('/session/exercise');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button
        onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {step > 1 ? 'Back' : 'Cancel'}
      </button>

      {/* Progress header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
          style={{ backgroundColor: '#EEF3FA', color: '#003361' }}>
          {clientIdentifier}
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#003361', letterSpacing: '-0.02em' }}>
          Session setup
        </h1>
        <p className="text-sm text-slate-400">Step {step} of 3</p>
        <div className="flex gap-1.5 mt-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ backgroundColor: n <= step ? '#003361' : '#E2EAF4' }} />
          ))}
        </div>
      </div>

      {/* Step 1 — exercises */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#003361' }}>Choose exercises</h2>
          <p className="text-sm text-slate-400 mb-5">Select which exercises to include in this session.</p>
          <div className="grid grid-cols-2 gap-3">
            {EXERCISES.map(ex => {
              const selected = selectedExercises.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggleExercise(ex.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all ${
                    selected
                      ? 'border-headway-navy bg-blue-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  style={selected ? { borderColor: '#003361' } : {}}
                >
                  <div className="flex items-start gap-3">
                    <span style={{ color: selected ? '#003361' : '#94a3b8' }}>
                      {EXERCISE_ICONS[ex.id]}
                    </span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-semibold text-sm" style={{ color: '#003361' }}>{ex.label}</p>
                        {selected && (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#003361' }}>
                            <Check weight="bold" className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{ex.domain}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <Button
            className="w-full mt-6 font-semibold gap-2"
            style={{ backgroundColor: '#003361', color: 'white' }}
            disabled={selectedExercises.length === 0}
            onClick={() => setStep(2)}
          >
            Continue ({selectedExercises.length} selected) <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2 — difficulty */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#003361' }}>Set difficulty</h2>
          <p className="text-sm text-slate-400 mb-5">Choose the challenge level for today's session.</p>
          <div className="space-y-3">
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                  difficulty === d.id ? 'bg-blue-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                style={difficulty === d.id ? { borderColor: '#003361' } : {}}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${d.colour}18`, color: d.colour }}>
                      {d.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#003361' }}>{d.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{d.description}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    difficulty === d.id ? '' : 'border-slate-300'
                  }`}
                    style={difficulty === d.id ? { backgroundColor: '#003361', borderColor: '#003361' } : {}}>
                    {difficulty === d.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button
            className="w-full mt-6 font-semibold gap-2"
            style={{ backgroundColor: '#003361', color: 'white' }}
            onClick={() => setStep(3)}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 3 — review */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#003361' }}>Ready to begin</h2>
          <p className="text-sm text-slate-400 mb-5">Review the plan, then hand the device to your client.</p>

          <Card className="border-0 shadow-sm mb-5 rounded-2xl bg-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ backgroundColor: '#003361' }}>
                  {clientIdentifier.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#003361' }}>{clientIdentifier}</p>
                  <p className="text-xs text-slate-400">Client</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Exercises ({selectedExercises.length})</p>
                  <div className="space-y-1.5">
                    {selectedExercises.map(id => {
                      const ex = EXERCISES.find(e => e.id === id)!;
                      return (
                        <div key={id} className="flex items-center gap-2 text-xs text-slate-600">
                          <span style={{ color: '#6491C0' }}>{EXERCISE_ICONS[id]}</span>
                          {ex.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Difficulty</p>
                  {(() => {
                    const d = DIFFICULTIES.find(d => d.id === difficulty)!;
                    return (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${d.colour}18`, color: d.colour }}>
                          {d.icon}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: '#003361' }}>{d.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl p-4 mb-5 text-sm border"
            style={{ backgroundColor: '#FFF9E6', borderColor: '#FEDC00', color: '#7a6200' }}>
            <strong>Hand the device to your client</strong> after tapping Begin. The screen will switch to a simple view.
          </div>

          <Button
            className="w-full font-semibold text-base py-6 gap-2"
            style={{ backgroundColor: '#FEDC00', color: '#003361' }}
            disabled={creating || profLoading}
            onClick={handleBeginSession}
          >
            <Play weight="fill" className="w-5 h-5" />
            {creating ? 'Starting…' : 'Begin Session'}
          </Button>
        </div>
      )}
    </div>
  );
}
