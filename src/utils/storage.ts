import { Stats, ExerciseType } from '../types';

const STATS_KEY = 'cognitive_rehab_stats';

export const getStats = (): Stats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const updateStats = (exercise: ExerciseType, score: number): void => {
  const stats = getStats();

  if (!stats[exercise]) {
    stats[exercise] = {
      completed: 0,
      bestScore: 0,
      averageScore: 0,
      totalScore: 0,
    };
  }

  const exerciseStats = stats[exercise];
  exerciseStats.completed += 1;
  exerciseStats.totalScore += score;
  exerciseStats.bestScore = Math.max(exerciseStats.bestScore, score);
  exerciseStats.averageScore = exerciseStats.totalScore / exerciseStats.completed;

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const clearStats = (): void => {
  localStorage.removeItem(STATS_KEY);
};
