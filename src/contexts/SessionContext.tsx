import { createContext, useContext, useState } from 'react';
import type { SessionContextValue, SessionExercise } from '@/types';

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  sessionId: string;
  clientId: string;
  clientIdentifier: string;
  professionalId: string;
  difficulty: import('@/types').Difficulty;
  selectedExercises: import('@/types').ExerciseType[];
  children: React.ReactNode;
}

export function SessionProvider({
  sessionId,
  clientId,
  clientIdentifier,
  professionalId,
  difficulty,
  selectedExercises,
  children,
}: SessionProviderProps) {
  const [completedExercises, setCompletedExercises] = useState<SessionExercise[]>([]);

  const addCompletedExercise = (ex: SessionExercise) => {
    setCompletedExercises(prev => [...prev, ex]);
  };

  return (
    <SessionContext.Provider value={{
      sessionId,
      clientId,
      clientIdentifier,
      professionalId,
      difficulty,
      selectedExercises,
      completedExercises,
      addCompletedExercise,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
