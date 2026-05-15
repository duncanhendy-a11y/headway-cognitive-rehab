export type Difficulty = 'easy' | 'medium' | 'hard';

export type ExerciseType = 'memory' | 'pattern' | 'sequence' | 'word' | 'spatial' | 'attention';

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
