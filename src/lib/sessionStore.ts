import type { Difficulty, ExerciseType } from '@/types';

export interface ActiveSession {
  sessionId: string;
  clientId: string;
  clientIdentifier: string;
  professionalId: string;
  difficulty: Difficulty;
  selectedExercises: ExerciseType[];
}

const KEY = 'headway_active_session';

export const sessionStore = {
  set(data: ActiveSession): void {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  },
  get(): ActiveSession | null {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as ActiveSession; } catch { return null; }
  },
  clear(): void {
    sessionStorage.removeItem(KEY);
  },
};
