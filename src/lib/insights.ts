export type InsightType = 'session_summary' | 'plateau_alert' | 'regression' | 'recommendation' | 'domain_analysis';

export interface CodedInsight {
  id: string;
  type: InsightType;
  content: string;
  session_id: string | null;
  generated_at: string;
}

interface ExerciseRow {
  exercise_type: string;
  final_score: number;
}

interface SessionRow {
  id: string;
  started_at: string;
  difficulty: string;
  completed_at: string | null;
  session_exercises?: ExerciseRow[];
}

const DOMAIN_LABELS: Record<string, string> = {
  memory:    'Short-term Memory',
  pattern:   'Sequential Memory',
  sequence:  'Working Memory',
  word:      'Language',
  spatial:   'Spatial Reasoning',
  attention: 'Sustained Attention',
};

export function calculateInsights(sessions: SessionRow[]): CodedInsight[] {
  const completed = sessions
    .filter(s => s.completed_at)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  if (completed.length === 0) return [];

  const insights: CodedInsight[] = [];
  let idCounter = 0;
  const makeId = () => `coded-${++idCounter}`;
  const now = new Date().toISOString();

  // ── Per-domain score series ───────────────────────────────────────────────
  const domainSeries: Record<string, { sessionId: string; score: number; date: string }[]> = {};
  for (const s of completed) {
    for (const ex of s.session_exercises ?? []) {
      if (!domainSeries[ex.exercise_type]) domainSeries[ex.exercise_type] = [];
      domainSeries[ex.exercise_type].push({
        sessionId: s.id,
        score: ex.final_score,
        date: s.started_at,
      });
    }
  }

  // ── Session summary for most recent session ───────────────────────────────
  const latest = completed[completed.length - 1];
  const latestExercises = latest.session_exercises ?? [];
  if (latestExercises.length > 0) {
    const totalScore = latestExercises.reduce((sum, ex) => sum + ex.final_score, 0);
    const sorted = [...latestExercises].sort((a, b) => b.final_score - a.final_score);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const bestLabel = DOMAIN_LABELS[best.exercise_type] ?? best.exercise_type;
    const worstLabel = DOMAIN_LABELS[worst.exercise_type] ?? worst.exercise_type;

    let summary = `Session total: ${totalScore} points across ${latestExercises.length} exercise${latestExercises.length !== 1 ? 's' : ''}.`;
    if (latestExercises.length > 1) {
      summary += ` Strongest area: ${bestLabel} (${best.final_score} pts).`;
      if (worst.exercise_type !== best.exercise_type) {
        summary += ` Most room to grow: ${worstLabel} (${worst.final_score} pts).`;
      }
    }

    insights.push({
      id: makeId(),
      type: 'session_summary',
      content: summary,
      session_id: latest.id,
      generated_at: now,
    });
  }

  // ── Domain analysis across all sessions ──────────────────────────────────
  if (completed.length >= 2) {
    const averages = Object.entries(domainSeries).map(([type, entries]) => {
      const avg = Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length);
      return { type, avg, label: DOMAIN_LABELS[type] ?? type };
    }).sort((a, b) => b.avg - a.avg);

    if (averages.length > 0) {
      const strongest = averages[0];
      const weakest = averages[averages.length - 1];
      let analysis = `Across ${completed.length} sessions, ${strongest.label} is the strongest area (avg ${strongest.avg} pts).`;
      if (weakest.type !== strongest.type) {
        analysis += ` ${weakest.label} has the lowest average (${weakest.avg} pts) and may benefit from more targeted practice.`;
      }
      insights.push({
        id: makeId(),
        type: 'domain_analysis',
        content: analysis,
        session_id: null,
        generated_at: now,
      });
    }
  }

  // ── Plateau detection (3+ sessions, score within ±10%) ───────────────────
  for (const [type, entries] of Object.entries(domainSeries)) {
    if (entries.length < 3) continue;
    const last3 = entries.slice(-3);
    const scores = last3.map(e => e.score);
    const avg = scores.reduce((s, v) => s + v, 0) / 3;
    const allClose = scores.every(s => Math.abs(s - avg) / (avg || 1) <= 0.1);
    if (allClose && avg > 0) {
      insights.push({
        id: makeId(),
        type: 'plateau_alert',
        content: `${DOMAIN_LABELS[type] ?? type} scores have stayed consistently around ${Math.round(avg)} pts across the last 3 sessions. Consider adjusting difficulty or exercise variation to stimulate further progress.`,
        session_id: last3[last3.length - 1].sessionId,
        generated_at: now,
      });
    }
  }

  // ── Regression detection (last score drops >15% from previous) ───────────
  for (const [type, entries] of Object.entries(domainSeries)) {
    if (entries.length < 2) continue;
    const prev = entries[entries.length - 2].score;
    const curr = entries[entries.length - 1].score;
    if (prev > 0 && (prev - curr) / prev > 0.15) {
      const drop = Math.round(((prev - curr) / prev) * 100);
      insights.push({
        id: makeId(),
        type: 'regression',
        content: `${DOMAIN_LABELS[type] ?? type} dropped by ${drop}% in the most recent session (${prev} → ${curr} pts). This may reflect fatigue, a harder difficulty, or a day-to-day variation. Worth monitoring next session.`,
        session_id: entries[entries.length - 1].sessionId,
        generated_at: now,
      });
    }
  }

  // ── Recommendation ────────────────────────────────────────────────────────
  const rec = buildRecommendation(completed, domainSeries);
  if (rec) {
    insights.push({
      id: makeId(),
      type: 'recommendation',
      content: rec,
      session_id: null,
      generated_at: now,
    });
  }

  return insights;
}

function buildRecommendation(
  sessions: SessionRow[],
  domainSeries: Record<string, { score: number }[]>,
): string | null {
  if (sessions.length === 0) return null;

  const latest = sessions[sessions.length - 1];
  const latestExercises = latest.session_exercises ?? [];
  if (latestExercises.length === 0) return null;

  // Find the weakest domain in the most recent session
  const sorted = [...latestExercises].sort((a, b) => a.final_score - b.final_score);
  const weakest = sorted[0];
  const weakestLabel = DOMAIN_LABELS[weakest.exercise_type] ?? weakest.exercise_type;

  // Check if it's also weak historically
  const history = domainSeries[weakest.exercise_type] ?? [];
  const historicalAvg = history.length
    ? Math.round(history.reduce((s, e) => s + e.score, 0) / history.length)
    : weakest.final_score;

  // Difficulty-based suggestion
  const difficulty = latest.difficulty;
  if (weakest.final_score < 20 && difficulty !== 'easy') {
    return `${weakestLabel} scored ${weakest.final_score} pts in the last session. Consider reducing difficulty to Gentle for this area next time to build confidence before increasing challenge.`;
  }

  if (history.length >= 2 && weakest.final_score > historicalAvg * 1.15) {
    return `${weakestLabel} showed improvement in the last session (${weakest.final_score} pts vs historical average of ${historicalAvg} pts). A good moment to consider stepping up difficulty.`;
  }

  return `${weakestLabel} remains the area with most room for development (${weakest.final_score} pts last session). Prioritising this area in the next session could help drive meaningful progress.`;
}
