import { useParams, useNavigate } from 'react-router-dom';
import { useClientData } from '@/hooks/useClientData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Brain, ClipboardList, Lightbulb, Calendar, Clock, TrendingUp } from 'lucide-react';
import { DomainRadarChart } from '@/components/DomainRadarChart';
import { EditClientDialog } from '@/components/EditClientDialog';
import { useState } from 'react';
import type { Session, AiInsight } from '@/types';

const EXERCISE_LABELS: Record<string, string> = {
  memory:    'Memory Match',
  pattern:   'Pattern Recognition',
  sequence:  'Sequence Recall',
  word:      'Word Games',
  spatial:   'Spatial Puzzle',
  attention: 'Focus Challenge',
};

const DOMAIN_LABELS: Record<string, string> = {
  memory:    'Short-term Memory',
  pattern:   'Sequential Memory',
  sequence:  'Working Memory',
  word:      'Language',
  spatial:   'Spatial Reasoning',
  attention: 'Sustained Attention',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

type SessionWithExercises = Session & {
  session_exercises?: { exercise_type: string; final_score: number; difficulty: string; duration_seconds: number | null }[];
};

function SessionCard({ session }: { session: SessionWithExercises }) {
  const totalScore = session.session_exercises?.reduce((sum, ex) => sum + ex.final_score, 0) ?? 0;
  const exerciseCount = session.session_exercises?.length ?? 0;

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-headway-navy">{formatDate(session.started_at)}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {session.completed_at
                ? `${Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)} min`
                : 'In progress'}
            </p>
          </div>
          <Badge className="capitalize" style={{ backgroundColor: '#E8F0F8', color: '#003361', border: 'none' }}>
            {session.difficulty}
          </Badge>
        </div>

        {exerciseCount > 0 && (
          <div className="space-y-1.5 mb-3">
            {session.session_exercises?.map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{EXERCISE_LABELS[ex.exercise_type] ?? ex.exercise_type}</span>
                <span className="font-semibold text-headway-navy">{ex.final_score} pts</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
          <span className="font-bold text-headway-navy">{totalScore} total</span>
        </div>

        {session.notes && (
          <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">"{session.notes}"</p>
        )}
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: AiInsight }) {
  const icons: Record<string, string> = {
    plateau_alert: '⚠️', regression: '📉', recommendation: '💡',
    session_summary: '📋', domain_analysis: '📊',
  };
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">{icons[insight.type] ?? '📊'}</span>
          <div>
            <Badge className="text-xs mb-2 capitalize" style={{ backgroundColor: '#E8F0F8', color: '#003361', border: 'none' }}>
              {insight.type.replace('_', ' ')}
            </Badge>
            <p className="text-sm text-gray-700 leading-relaxed">{insight.content}</p>
            <p className="text-xs text-gray-400 mt-2">{formatDate(insight.generated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientProfilePage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const { client, sessions, insights, loading, error, refetch } = useClientData(clientId!);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full"><div className="text-headway-navy">Loading…</div></div>;
  }
  if (error || !client) {
    return <div className="p-8"><p className="text-red-500">{error ?? 'Client not found.'}</p></div>;
  }

  const sessionsTyped = sessions as SessionWithExercises[];
  const allExercises = sessionsTyped.flatMap(s => s.session_exercises ?? []);

  const domainScores = Object.keys(DOMAIN_LABELS).map(type => {
    const ofType = allExercises.filter(ex => ex.exercise_type === type);
    const avg = ofType.length
      ? Math.round(ofType.reduce((sum, ex) => sum + ex.final_score, 0) / ofType.length)
      : 0;
    return { domain: DOMAIN_LABELS[type], score: avg, exerciseType: type };
  });

  const lastSession = sessionsTyped[0];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-headway-navy mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </button>

      {/* Profile header */}
      <div className="rounded-2xl p-6 mb-6 flex items-center justify-between"
        style={{ backgroundColor: '#003361' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
            style={{ backgroundColor: '#6491C0' }}>
            {client.identifier.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.identifier}</h1>
            <p className="text-blue-300 text-sm">Added {formatDate(client.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{sessions.length}</p>
            <p className="text-blue-300 text-xs">sessions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">
              {lastSession ? new Date(lastSession.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
            </p>
            <p className="text-blue-300 text-xs">last session</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}
              className="text-white border-blue-400 hover:bg-blue-900 bg-transparent">
              Edit
            </Button>
            <Button size="sm"
              onClick={() => navigate('/session/setup', { state: { clientId: client.id, clientIdentifier: client.identifier } })}
              className="font-bold" style={{ backgroundColor: '#FEDC00', color: '#003361' }}>
              <Play className="w-3.5 h-3.5 mr-1.5" /> Start session
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Brain className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Sessions ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-headway-navy flex items-center gap-2">
                  <Brain className="w-4 h-4 text-headway-blue" /> Cognitive domain scores
                </CardTitle>
                <p className="text-xs text-gray-400">Average score per domain across all sessions</p>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Brain className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm">No session data yet</p>
                    <p className="text-xs mt-1">Complete a session to see domain scores</p>
                  </div>
                ) : (
                  <DomainRadarChart data={domainScores} />
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-headway-navy flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-headway-blue" /> Exercise breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allExercises.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {domainScores.map(({ score, exerciseType }) => (
                        <div key={exerciseType}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{EXERCISE_LABELS[exerciseType]}</span>
                            <span className="font-semibold text-headway-navy">{score}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(score, 100)}%`, backgroundColor: '#6491C0' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {lastSession && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Last session
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-headway-navy">{formatDate(lastSession.started_at)}</p>
                    <p className="text-sm text-gray-500 capitalize mt-0.5">{lastSession.difficulty} difficulty</p>
                    {lastSession.ai_summary && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed italic">"{lastSession.ai_summary}"</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          {sessions.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 shadow-none">
              <CardContent className="py-16 text-center">
                <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No sessions yet</p>
                <p className="text-gray-400 text-sm mt-1 mb-5">Start a session to begin tracking progress.</p>
                <Button
                  onClick={() => navigate('/session/setup', { state: { clientId: client.id, clientIdentifier: client.identifier } })}
                  style={{ backgroundColor: '#003361', color: 'white' }} className="font-bold">
                  <Play className="w-4 h-4 mr-2" /> Start first session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {sessionsTyped.map(s => <SessionCard key={s.id} session={s} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights">
          {insights.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 shadow-none">
              <CardContent className="py-16 text-center">
                <Lightbulb className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No AI insights yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Insights are generated automatically after sessions are completed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {insights.map(insight => <InsightCard key={insight.id} insight={insight} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EditClientDialog
        open={showEdit}
        client={client}
        onClose={() => setShowEdit(false)}
        onUpdated={refetch}
      />
    </div>
  );
}
