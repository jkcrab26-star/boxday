export type BoxSlot = 'inbox' | 'AM' | 'PM' | 'Evening';
export type TaskStatus = 'open' | 'done';

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number | null;
  box: BoxSlot;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
}

export interface DailyReflection {
  date: string;
  q1: string;
  q2: string;
  q3: string;
  completedAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface AppState {
  tasks: Task[];
  reflections: DailyReflection[];
  streak: StreakData;
  lastResetDate: string | null;
  isPro: boolean;
}

export type View = 'dump' | 'day' | 'reflect';
