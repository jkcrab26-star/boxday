import type { Task, TaskList } from '../types'

const TASKS_KEY = '80hd_tasks'
const RESET_KEY = '80hd_last_reset'
const LISTS_KEY = '80hd_task_lists'

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

export function loadTaskLists(): TaskList[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTaskLists(lists: TaskList[]): void {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
}
