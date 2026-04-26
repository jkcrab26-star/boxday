import type { AppState, StreakData, Task } from '../types';

const KEY = 'boxday_v0';

const DEFAULT_STREAK: StreakData = { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

export const DEFAULT_STATE: AppState = {
  tasks: [],
  reflections: [],
  streak: DEFAULT_STREAK,
  lastResetDate: null,
  isPro: false,
};

const DEFAULT_TASK_FIELDS: Pick<Task, 'scheduledDate' | 'estimatedMinutes' | 'completedAt'> = {
  scheduledDate: null,
  estimatedMinutes: null,
  completedAt: null,
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      tasks: (parsed.tasks ?? []).map(t => ({ ...DEFAULT_TASK_FIELDS, ...t })),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
