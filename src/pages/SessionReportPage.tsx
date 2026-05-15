import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, TrendingUp } from 'lucide-react';
import type { Session } from '@/types';

const EXERCISE_META: Record<string, { label: string; icon: string }> = {
  memory:    { label: 'Memory Match',        icon: '🃏' },
  pattern:   { label: 'Pattern Recognition', icon: '🎨' },
  sequence:  { label: 'Sequence Recall',     icon: '🔢' },
  word:      { label: 'Word Games',          icon: '📝' },
  spatial:   { label: 'Spatial Puzzle',      icon: '🧩' },
  attention: { label: 'Focus Challenge',     icon: '🔍' },
};

const DIFFICULTY_COLOUR: Record<string, string> = {
  easy:   '#4CAF50',
  medium: '#FF9800',
  hard:   '#F44336',
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
        <p className="text-headway-navy">Loading report…</p>
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
  const clientIdentifier = (data as SessionWithExercises).clients?.identifier ?? 'Client';
  const clientId = data.client_id;

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(`/clients/${clientId}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-headway-navy mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {clientIdentifier}
      </button>

      {/* Header */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#003361' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Session report</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {new Date(data.started_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Badge className="capitalize text-sm px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: 'none' }}>
            <span className="mr-1.5 inline-block w-2 h-2 rounded-full" style={{ backgroundColor: DIFFICULTY_COLOUR[data.difficulty] }} />
            {data.difficulty}
          </Badge>
        </div>
        <div className="flex gap-8 mt-5">
          <div>
            <p className="text-3xl font-bold text-white">{totalScore}</p>
            <p className="text-blue-300 text-xs mt-0.5">total points</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{exercises.length}</p>
            <p className="text-blue-300 text-xs mt-0.5">exercises</p>
          </div>
          {totalDuration > 0 && (
            <div>
              <p className="text-3xl font-bold text-white">{formatDuration(totalDuration)}</p>
              <p className="text-blue-300 text-xs mt-0.5">total time</p>
            </div>
          )}
        </div>
      </div>

      {/* Exercise breakdown */}
      <Card className="border-0 shadow-sm mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-headway-navy flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-headway-blue" /> Exercise results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {exercises.map(ex => {
            const meta = EXERCISE_META[ex.exercise_type] ?? { label: ex.exercise_type, icon: '📊' };
            const pct = Math.min(ex.final_score, 100);
            return (
              <div key={ex.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{meta.icon}</span>
                    <span className="text-sm text-gray-600">{meta.label}</span>
                    {ex.duration_seconds && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {formatDuration(ex.duration_seconds)}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-headway-navy text-sm">{ex.final_score} pts</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: '#6491C0' }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Notes */}
      {data.notes && (
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Session notes</p>
            <p className="text-sm text-gray-700 leading-relaxed">{data.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
          Dashboard
        </Button>
        <Button
          className="flex-1 font-bold"
          style={{ backgroundColor: '#003361', color: 'white' }}
          onClick={() => navigate(`/clients/${clientId}`)}
        >
          View client profile
        </Button>
      </div>
    </div>
  );
}
