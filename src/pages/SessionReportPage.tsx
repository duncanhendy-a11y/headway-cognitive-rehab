import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, ChartBar, TrendUp,
  Cards, GridFour, ListNumbers, TextT, PuzzlePiece, Crosshair,
} from '@phosphor-icons/react';
import { calculateInsights } from '@/lib/insights';
import type { Session } from '@/types';

const EXERCISE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  memory:    { label: 'Memory Match',        icon: <Cards weight="duotone" className="w-4 h-4" /> },
  pattern:   { label: 'Pattern Recognition', icon: <GridFour weight="duotone" className="w-4 h-4" /> },
  sequence:  { label: 'Sequence Recall',     icon: <ListNumbers weight="duotone" className="w-4 h-4" /> },
  word:      { label: 'Word Games',          icon: <TextT weight="duotone" className="w-4 h-4" /> },
  spatial:   { label: 'Spatial Puzzle',      icon: <PuzzlePiece weight="duotone" className="w-4 h-4" /> },
  attention: { label: 'Focus Challenge',     icon: <Crosshair weight="duotone" className="w-4 h-4" /> },
};

const DOMAIN_LABELS: Record<string, string> = {
  memory:    'Short-term Memory',
  pattern:   'Sequential Memory',
  sequence:  'Working Memory',
  word:      'Language',
  spatial:   'Spatial Reasoning',
  attention: 'Sustained Attention',
};

const DIFFICULTY_COLOUR: Record<string, string> = {
  easy:   '#22c55e',
  medium: '#f59e0b',
  hard:   '#ef4444',
};

interface SessionExerciseRow {
  id: string;
  exercise_type: string;
  difficulty: string;
  sequence_order: number;
  final_score: number;
  duration_seconds: number | null;
  completed: boolean;
}

interface SessionWithExercises extends Session {
  session_exercises: SessionExerciseRow[];
  clients?: { identifier: string };
}

export function SessionReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SessionWithExercises | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    supabase
      .from('sessions')
      .select('*, session_exercises(*), clients(identifier)')
      .eq('id', sessionId)
      .single()
      .then(({ data: d }) => {
        if (d) setData(d as SessionWithExercises);
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-slate-400 text-sm">Loading report…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-red-500">Session not found.</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
      </div>
    );
  }

  const exercises = [...(data.session_exercises ?? [])].sort((a, b) => a.sequence_order - b.sequence_order);
  const totalScore = exercises.reduce((sum, ex) => sum + ex.final_score, 0);
  const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration_seconds ?? 0), 0);
  const clientIdentifier = data.clients?.identifier ?? 'Client';
  const clientId = data.client_id;

  // Coded session summary — derive from this session's data
  const sessionInsights = calculateInsights([{
    id: data.id,
    started_at: data.started_at,
    difficulty: data.difficulty,
    completed_at: data.completed_at,
    session_exercises: exercises.map(ex => ({
      exercise_type: ex.exercise_type,
      final_score: ex.final_score,
    })),
  }]);
  const summaryInsight = sessionInsights.find(i => i.type === 'session_summary');

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(`/clients/${clientId}`)}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {clientIdentifier}
      </button>

      {/* Header */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#003361' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Session report</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {new Date(data.started_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Badge className="capitalize text-xs font-medium px-3 py-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: 'none' }}>
            <span className="mr-1.5 inline-block w-2 h-2 rounded-full align-middle"
              style={{ backgroundColor: DIFFICULTY_COLOUR[data.difficulty] }} />
            {data.difficulty}
          </Badge>
        </div>
        <div className="flex gap-8">
          <div>
            <p className="text-3xl font-bold text-white tracking-tight">{totalScore}</p>
            <p className="text-blue-300 text-xs mt-0.5">total points</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white tracking-tight">{exercises.length}</p>
            <p className="text-blue-300 text-xs mt-0.5">exercises</p>
          </div>
          {totalDuration > 0 && (
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{formatDuration(totalDuration)}</p>
              <p className="text-blue-300 text-xs mt-0.5">total time</p>
            </div>
          )}
        </div>
      </div>

      {/* Exercise breakdown */}
      <Card className="border-0 shadow-sm mb-5 rounded-2xl bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#003361' }}>
            <TrendUp className="w-4 h-4" style={{ color: '#6491C0' }} /> Exercise results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercises.map(ex => {
            const meta = EXERCISE_META[ex.exercise_type] ?? { label: ex.exercise_type, icon: null };
            const domain = DOMAIN_LABELS[ex.exercise_type] ?? '';
            const pct = Math.min(ex.final_score, 100);
            return (
              <div key={ex.id}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#6491C0' }}>{meta.icon}</span>
                    <div>
                      <span className="text-sm text-slate-600">{meta.label}</span>
                      {domain && <span className="text-xs text-slate-400 ml-1.5">· {domain}</span>}
                    </div>
                    {ex.duration_seconds && (
                      <span className="text-xs text-slate-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {formatDuration(ex.duration_seconds)}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-sm" style={{ color: '#003361' }}>{ex.final_score} pts</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: '#6491C0' }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Session summary — coded */}
      {summaryInsight && (
        <Card className="border-0 shadow-sm mb-5 rounded-2xl bg-white overflow-hidden">
          <div className="flex">
            <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{ backgroundColor: '#FEDC00' }} />
            <CardContent className="p-5 flex-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ChartBar weight="fill" className="w-3.5 h-3.5" style={{ color: '#6491C0' }} /> Session summary
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">{summaryInsight.content}</p>
            </CardContent>
          </div>
        </Card>
      )}

      {/* Notes */}
      {data.notes && (
        <Card className="border-0 shadow-sm mb-5 rounded-2xl bg-white">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Session notes</p>
            <p className="text-sm text-slate-600 leading-relaxed">{data.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate('/dashboard')}>
          Dashboard
        </Button>
        <Button
          className="flex-1 font-semibold rounded-xl"
          style={{ backgroundColor: '#003361', color: 'white' }}
          onClick={() => navigate(`/clients/${clientId}`)}
        >
          View client profile
        </Button>
      </div>
    </div>
  );
}
