import { create } from 'zustand'
import type { Task, View } from './types'
import { loadTasks, saveTasks, getLastResetDate, setLastResetDate } from './lib/storage'
import { shouldReset, getDayBoundaryDate, estimateMinutes } from './lib/time'

interface FocusSession {
  taskId: string
  startedAt: number
  durationMs: number
}

interface State {
  tasks: Task[]
  view: View
  selectedDate: string
  focusSession: FocusSession | null
  lastCompletedTaskId: string | null

  // Actions
  init: () => void
  addTask: (title: string) => void
  setTaskEstimate: (id: string, minutes: number) => void
  scheduleTask: (id: string, date: string, time: string | null) => void
  unscheduleTask: (id: string) => void
  completeTask: (id: string) => void
  snoozeTask: (id: string) => void
  dismissTask: (id: string) => void
  setView: (view: View) => void
  setSelectedDate: (date: string) => void
  startFocus: (taskId: string) => void
  endFocus: () => void
  triggerReset: () => void
}

export const useStore = create<State>((set, get) => ({
  tasks: [],
  view: 'day',
  selectedDate: getDayBoundaryDate(),
  focusSession: null,
  lastCompletedTaskId: null,

  init() {
    const tasks = loadTasks()
    const lastReset = getLastResetDate()
    const effectiveToday = getDayBoundaryDate()

    if (shouldReset(lastReset)) {
      // Move incomplete tasks back to dump (no shame — just unschedule)
      const reset = tasks.map(t =>
        t.status === 'open' && t.scheduledDate && t.scheduledDate < effectiveToday
          ? { ...t, scheduledDate: null, scheduledTime: null }
          : t
      )
      saveTasks(reset)
      setLastResetDate(effectiveToday)
      set({ tasks: reset, selectedDate: effectiveToday })
    } else {
      set({ tasks, selectedDate: effectiveToday })
    }
  },

  addTask(title) {
    const id = nanoid()
    const task: Task = {
      id,
      title: title.trim(),
      estimatedMinutes: estimateMinutes(title),
      scheduledDate: null,
      scheduledTime: null,
      horizon: 'day',
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    set(s => {
      const tasks = [...s.tasks, task]
      saveTasks(tasks)
      return { tasks }
    })
  },

  setTaskEstimate(id, minutes) {
    set(s => {
      const tasks = s.tasks.map(t => t.id === id ? { ...t, estimatedMinutes: minutes } : t)
      saveTasks(tasks)
      return { tasks }
    })
  },

  scheduleTask(id, date, time) {
    set(s => {
      const tasks = s.tasks.map(t =>
        t.id === id ? { ...t, scheduledDate: date, scheduledTime: time } : t
      )
      saveTasks(tasks)
      return { tasks }
    })
  },

  unscheduleTask(id) {
    set(s => {
      const tasks = s.tasks.map(t =>
        t.id === id ? { ...t, scheduledDate: null, scheduledTime: null } : t
      )
      saveTasks(tasks)
      return { tasks }
    })
  },

  completeTask(id) {
    set(s => {
      const tasks = s.tasks.map(t => t.id === id ? { ...t, status: 'done' as const } : t)
      saveTasks(tasks)
      return { tasks, lastCompletedTaskId: id, focusSession: null }
    })
  },

  snoozeTask(id) {
    set(s => {
      const tasks = s.tasks.map(t =>
        t.id === id ? { ...t, status: 'open' as const, scheduledTime: null } : t
      )
      saveTasks(tasks)
      return { tasks, focusSession: null }
    })
  },

  dismissTask(id) {
    // Return task to dump without marking it failed
    set(s => {
      const tasks = s.tasks.map(t =>
        t.id === id
          ? { ...t, scheduledDate: null, scheduledTime: null, status: 'open' as const }
          : t
      )
      saveTasks(tasks)
      return { tasks, focusSession: null }
    })
  },

  setView(view) {
    set({ view })
  },

  setSelectedDate(date) {
    set({ selectedDate: date })
  },

  startFocus(taskId) {
    const task = get().tasks.find(t => t.id === taskId)
    if (!task) return
    const durationMs = (task.estimatedMinutes ?? 30) * 60 * 1000
    set({ focusSession: { taskId, startedAt: Date.now(), durationMs }, lastCompletedTaskId: null })
  },

  endFocus() {
    set({ focusSession: null })
  },

  triggerReset() {
    const effectiveToday = getDayBoundaryDate()
    set(s => {
      const tasks = s.tasks.map(t =>
        t.status === 'open' && t.scheduledDate && t.scheduledDate < effectiveToday
          ? { ...t, scheduledDate: null, scheduledTime: null }
          : t
      )
      saveTasks(tasks)
      setLastResetDate(effectiveToday)
      return { tasks, selectedDate: effectiveToday }
    })
  },
}))

// nanoid shim — not installed yet, inline uuid fallback
function nanoid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
