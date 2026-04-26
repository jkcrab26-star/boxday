import type { Task } from '../types'

const TASKS_KEY = 'boxday_tasks'
const RESET_KEY = 'boxday_last_reset'

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

export function getLastResetDate(): string | null {
  return localStorage.getItem(RESET_KEY)
}

export function setLastResetDate(date: string): void {
  localStorage.setItem(RESET_KEY, date)
}
