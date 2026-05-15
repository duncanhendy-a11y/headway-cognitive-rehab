import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfessional } from '@/hooks/useProfessional';
import { supabase } from '@/lib/supabase';
import { sessionStore } from '@/lib/sessionStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Difficulty, ExerciseType } from '@/types';

const EXERCISES: { id: ExerciseType; label: string; description: string; icon: string }[] = [
  { id: 'memory',    label: 'Memory Match',        description: 'Flip cards to find matching pairs',           icon: '🃏' },
  { id: 'pattern',   label: 'Pattern Recognition', description: 'Watch and repeat colour sequences',           icon: '🎨' },
  { id: 'sequence',  label: 'Sequence Recall',     description: 'Memorise and enter number sequences',         icon: '🔢' },
  { id: 'word',      label: 'Word Games',           description: 'Remember and identify words from categories', icon: '📝' },
  { id: 'spatial',   label: 'Spatial Puzzle',       description: 'Arrange sliding tiles in order',             icon: '🧩' },
  { id: 'attention', label: 'Focus Challenge',      description: 'Spot target shapes in a busy grid',          icon: '🔍' },
];

const DIFFICULTIES: { id: Difficulty; label: string; description: string; colour: string }[] = [
  { id: 'easy',   label: 'Gentle',    description: 'Shorter sequences, more time, fewer items',      colour: '#4CAF50' },
  { id: 'medium', label: 'Moderate',  description: 'Standard challenge suitable for most sessions',  colour: '#FF9800' },
  { id: 'hard',   label: 'Challenge', description: 'Longer sequences, more items, less time',        colour: '#F44336' },
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
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-headway-navy mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {step > 1 ? 'Back' : 'Cancel'}
      </button>

      <div className="mb-8">
        <Badge style={{ backgroundColor: '#E8F0F8', color: '#003361', border: 'none' }} className="text-xs mb-2">
          {clientIdentifier}
        </Badge>
        <h1 className="text-2xl font-bold text-headway-navy">Session setup</h1>
        <p className="text-sm text-gray-400 mt-1">Step {step} of 3</p>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ backgroundColor: n <= step ? '#003361' : '#E2EAF4' }} />
          ))}
        </div>
      </div>

      {/* Step 1 — exercises */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-headway-navy mb-1">Choose exercises</h2>
          <p className="text-sm text-gray-400 mb-5">Select which exercises to include in this session.</p>
          <div className="grid grid-cols-2 gap-3">
            {EXERCISES.map(ex => {
              const selected = selectedExercises.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggleExercise(ex.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selected ? 'border-headway-navy bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ex.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-semibold text-headway-navy text-sm">{ex.label}</p>
                        {selected && <Check className="w-4 h-4 text-headway-navy flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{ex.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <Button
            className="w-full mt-6 font-bold"
            style={{ backgroundColor: '#003361', color: 'white' }}
            disabled={selectedExercises.length === 0}
            onClick={() => setStep(2)}
          >
            Continue ({selectedExercises.length} selected) <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2 — difficulty */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold text-headway-navy mb-1">Set difficulty</h2>
          <p className="text-sm text-gray-400 mb-5">Choose the challenge level for today's session.</p>
          <div className="space-y-3">
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                  difficulty === d.id ? 'border-headway-navy bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.colour }} />
                    <div>
                      <p className="font-bold text-headway-navy">{d.label}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{d.description}</p>
                    </div>
                  </div>
                  {difficulty === d.id && <Check className="w-5 h-5 text-headway-navy" />}
                </div>
              </button>
            ))}
          </div>
          <Button
            className="w-full mt-6 font-bold"
            style={{ backgroundColor: '#003361', color: 'white' }}
            onClick={() => setStep(3)}
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 3 — review */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-bold text-headway-navy mb-1">Ready to begin</h2>
          <p className="text-sm text-gray-400 mb-5">Review the plan, then hand the device to your client.</p>

          <Card className="border-0 shadow-sm mb-5">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ backgroundColor: '#6491C0' }}>
                  {clientIdentifier.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-headway-navy">{clientIdentifier}</p>
                  <p className="text-xs text-gray-400">Client</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Exercises ({selectedExercises.length})</p>
                  <div className="space-y-1">
                    {selectedExercises.map(id => {
                      const ex = EXERCISES.find(e => e.id === id)!;
                      return (
                        <div key={id} className="flex items-center gap-1.5 text-sm text-gray-600">
                          <span>{ex.icon}</span> {ex.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Difficulty</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: DIFFICULTIES.find(d => d.id === difficulty)!.colour }} />
                    <span className="font-semibold text-headway-navy capitalize">
                      {DIFFICULTIES.find(d => d.id === difficulty)!.label}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
            <strong>Hand the device to your client</strong> after tapping Begin. The screen will switch to a simple view.
          </div>

          <Button
            className="w-full font-bold text-base py-6"
            style={{ backgroundColor: '#FEDC00', color: '#003361' }}
            disabled={creating || profLoading}
            onClick={handleBeginSession}
          >
            {creating ? 'Starting…' : '▶  Begin Session'}
          </Button>
        </div>
      )}
    </div>
  );
}
