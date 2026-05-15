// ── Exercise types (existing, unchanged) ─────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ExerciseType =
  | 'memory'
  | 'pattern'
  | 'sequence'
  | 'word'
  | 'spatial'
  | 'attention';

export interface ExerciseStats {
  completed: number;
  bestScore: number;
  averageScore: number;
  totalScore: number;
}

export interface Stats {
  [key: string]: ExerciseStats;
}

export interface Exercise {
  id: ExerciseType;
  icon: string;
  title: string;
  description: string;
}

// ── Telemetry ─────────────────────────────────────────────────────────────

export interface RoundTelemetry {
  round_number: number;
  score: number;
  errors: number;
  response_time_ms: number | null;
  started_at: string;
  completed_at: string;
  metadata?: Record<string, unknown>;
}

// ── Domain model — snake_case matches Supabase column names ──────────────

export interface Professional {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string;
  role: 'professional' | 'supervisor';
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  professional_id: string;
  identifier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  professional_id: string;
  client_id: string;
  difficulty: Difficulty;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  ai_summary: string | null;
  pending_sync: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_type: ExerciseType;
  difficulty: Difficulty;
  sequence_order: number;
  final_score: number;
  duration_seconds: number | null;
  completed: boolean;
  created_at: string;
  rounds?: RoundTelemetry[];
}

export interface AiInsight {
  id: string;
  client_id: string;
  session_id: string | null;
  type: 'session_summary' | 'plateau_alert' | 'regression' | 'recommendation' | 'domain_analysis';
  exercise_type: ExerciseType | null;
  content: string;
  generated_at: string;
  created_at: string;
}

// ── Session context payload ───────────────────────────────────────────────

export interface SessionContextValue {
  sessionId: string;
  clientId: string;
  clientIdentifier: string;
  professionalId: string;
  difficulty: Difficulty;
  selectedExercises: ExerciseType[];
  completedExercises: SessionExercise[];
  addCompletedExercise: (ex: SessionExercise) => void;
}

// ── Offline sync queue ────────────────────────────────────────────────────

export interface OfflineSession {
  session: Omit<Session, 'created_at' | 'updated_at'>;
  exercises: SessionExercise[];
  enqueued_at: string;
}
