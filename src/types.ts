export type Horizon = 'day' | 'week' | 'month'
export type TaskStatus = 'open' | 'done' | 'snoozed'
export type View = 'dump' | 'day' | 'week' | 'month' | 'coins' | 'settings' | 'mustdo'

export interface Task {
  id: string
  title: string
  estimatedMinutes: number | null
  scheduledDate: string | null  // ISO date "YYYY-MM-DD", null = in dump
  scheduledTime: string | null  // "HH:MM" 24h format
  horizon: Horizon
  status: TaskStatus
  mustDoToday: boolean          // pinned to Must Do Today tab
  createdAt: string             // ISO timestamp
  completedAt?: string          // ISO timestamp, set when status → done
}
