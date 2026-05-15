import { useParams, useNavigate } from 'react-router-dom';
import { useClientData } from '@/hooks/useClientData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Play, Brain, ClipboardText, Lightbulb, Calendar, Clock,
  TrendUp, Warning, TrendDown, ChartPieSlice,
} from '@phosphor-icons/react';
import { DomainRadarChart } from '@/components/DomainRadarChart';
import { EditClientDialog } from '@/components/EditClientDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-semibold text-sm" style={{ color: '#003361' }}>{formatDate(session.started_at)}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {session.completed_at
                ? `${Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)} min`
                : 'In progress'}
            </p>
          </div>
          <Badge className="capitalize text-xs font-medium" style={{ backgroundColor: '#EEF3FA', color: '#003361', border: 'none' }}>
            {session.difficulty}
          </Badge>
        </div>

        {exerciseCount > 0 && (
          <div className="space-y-1.5 mb-4">
            {session.session_exercises?.map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{EXERCISE_LABELS[ex.exercise_type] ?? ex.exercise_type}</span>
                <span className="font-semibold" style={{ color: '#003361' }}>{ex.final_score} pts</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
          <span className="font-bold text-sm" style={{ color: '#003361' }}>{totalScore} total</span>
        </div>

        {session.notes && (
          <p className="text-xs text-slate-400 mt-3 italic line-clamp-2">"{session.notes}"</p>
        )}
      </CardContent>
    </Card>
  );
}

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  plateau_alert:    <Warning weight="fill" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />,
  regression:       <TrendDown weight="fill" className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />,
  recommendation:   <Lightbulb weight="fill" className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FEDC00' }} />,
  session_summary:  <ClipboardText weight="fill" className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />,
  domain_analysis:  <ChartPieSlice weight="fill" className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#6491C0' }} />,
};

function InsightCard({ insight }: { insight: AiInsight }) {
  const icon = INSIGHT_ICONS[insight.type] ?? <ChartPieSlice weight="fill" className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />;
  return (
    <Card className="border-0 shadow-sm rounded-2xl bg-white">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {icon}
          <div>
            <Badge className="text-xs mb-2 capitalize font-medium" style={{ backgroundColor: '#EEF3FA', color: '#003361', border: 'none' }}>
              {insight.type.replace('_', ' ')}
            </Badge>
            <p className="text-sm text-slate-600 leading-relaxed">{insight.content}</p>
            <p className="text-xs text-slate-400 mt-2">{formatDate(insight.generated_at)}</p>
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
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'insights'>('overview');
  const { client, sessions, insights, loading, error, refetch } = useClientData(clientId!);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full"><div className="text-slate-400 text-sm">Loading…</div></div>;
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

  const tabs = [
    { id: 'overview' as const,  label: 'Overview',               icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'sessions' as const,  label: `Sessions (${sessions.length})`, icon: <ClipboardText className="w-3.5 h-3.5" /> },
    { id: 'insights' as const,  label: 'Insights',               icon: <Lightbulb className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </button>

      {/* Profile header */}
      <div className="rounded-2xl p-6 mb-8 flex items-center justify-between"
        style={{ backgroundColor: '#003361' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            {client.identifier.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{client.identifier}</h1>
            <p className="text-blue-300 text-xs mt-0.5">Added {formatDate(client.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white tracking-tight">{sessions.length}</p>
            <p className="text-blue-300 text-xs mt-0.5">sessions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">
              {lastSession ? new Date(lastSession.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'None yet'}
            </p>
            <p className="text-blue-300 text-xs mt-0.5">last session</p>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}
                  className="text-white border-white/20 hover:bg-white/10 bg-transparent font-medium text-xs">
                  Edit
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit client name or remove from your list</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button size="sm"
                  onClick={() => navigate('/session/setup', { state: { clientId: client.id, clientIdentifier: client.identifier } })}
                  className="font-semibold gap-1.5 text-xs" style={{ backgroundColor: '#FEDC00', color: '#003361' }}>
                  <Play weight="fill" className="w-3 h-3" /> Start session
                </Button>
              </TooltipTrigger>
              <TooltipContent>Set up exercises, hand to client, and begin recording</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Underline tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-headway-navy text-headway-navy'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
              style={activeTab === tab.id ? { borderColor: '#003361', color: '#003361' } : {}}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#003361' }}>
                <Brain className="w-4 h-4" style={{ color: '#6491C0' }} /> Cognitive domain scores
              </CardTitle>
              <p className="text-xs text-slate-400">Average score per domain across all sessions</p>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="py-12 text-center text-slate-300">
                  <Brain className="w-10 h-10 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No session data yet</p>
                  <p className="text-xs mt-1 text-slate-300">Complete a session to see domain scores</p>
                </div>
              ) : (
                <DomainRadarChart data={domainScores} />
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#003361' }}>
                  <TrendUp className="w-4 h-4" style={{ color: '#6491C0' }} /> Exercise breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allExercises.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {domainScores.map(({ score, exerciseType }) => (
                      <div key={exerciseType}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">{EXERCISE_LABELS[exerciseType]}</span>
                          <span className="font-semibold" style={{ color: '#003361' }}>{score}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
              <Card className="border-0 shadow-sm rounded-2xl bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5" /> Last session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-bold text-sm" style={{ color: '#003361' }}>{formatDate(lastSession.started_at)}</p>
                  <p className="text-xs text-slate-400 capitalize mt-0.5">{lastSession.difficulty} difficulty</p>
                  {lastSession.ai_summary && (
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed italic">"{lastSession.ai_summary}"</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Sessions */}
      {activeTab === 'sessions' && (
        sessions.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 shadow-none bg-transparent rounded-2xl">
            <CardContent className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF3FA' }}>
                <ClipboardText className="w-6 h-6" style={{ color: '#6491C0' }} />
              </div>
              <p className="text-slate-600 font-semibold">No sessions yet</p>
              <p className="text-slate-400 text-sm mt-1 mb-5">Start a session to begin tracking progress.</p>
              <Button
                onClick={() => navigate('/session/setup', { state: { clientId: client.id, clientIdentifier: client.identifier } })}
                style={{ backgroundColor: '#003361', color: 'white' }} className="font-semibold gap-2">
                <Play weight="fill" className="w-4 h-4" /> Start first session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {sessionsTyped.map(s => <SessionCard key={s.id} session={s} />)}
          </div>
        )
      )}

      {/* Insights */}
      {activeTab === 'insights' && (
        insights.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 shadow-none bg-transparent rounded-2xl">
            <CardContent className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF3FA' }}>
                <Lightbulb className="w-6 h-6" style={{ color: '#6491C0' }} />
              </div>
              <p className="text-slate-600 font-semibold">No AI insights yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Insights are generated automatically after sessions are completed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map(insight => <InsightCard key={insight.id} insight={insight} />)}
          </div>
        )
      )}

      <EditClientDialog
        open={showEdit}
        client={client}
        onClose={() => setShowEdit(false)}
        onUpdated={refetch}
      />
    </div>
  );
}
