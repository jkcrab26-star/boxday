import { create } from 'zustand'
import type { Task, View, Horizon } from './types'
import { loadTasks, saveTasks, getLastResetDate, setLastResetDate } from './lib/storage'
import { shouldReset, getDayBoundaryDate, estimateMinutes } from './lib/time'
import { loadSettings, saveSettings, applyTheme, type AppSettings } from './lib/settings'
import { loadLedger, earnCoins, type CoinLedger } from './lib/coins'

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
  lastEarnedCoins: number | null  // cleared after animation plays
  settings: AppSettings
  coins: CoinLedger

  // Actions
  init: () => void
  addTask: (title: string) => void
  editTask: (id: string, title: string, minutes: number | null, horizon: Horizon) => void
  deleteTask: (id: string) => void
  setTaskEstimate: (id: string, minutes: number) => void
  scheduleTask: (id: string, date: string, time: string | null) => void
  unscheduleTask: (id: string) => void
  completeTask: (id: string, viaFocus?: boolean) => void
  snoozeTask: (id: string) => void
  dismissTask: (id: string) => void
  setView: (view: View) => void
  setSelectedDate: (date: string) => void
  startFocus: (taskId: string) => void
  endFocus: () => void
  triggerReset: () => void
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  clearAllData: () => void
  clearEarnedCoins: () => void
  pinToMustDo: (id: string) => void
  unpinFromMustDo: (id: string) => void
}

export const useStore = create<State>((set, get) => ({
  tasks: [],
  view: 'day',
  selectedDate: getDayBoundaryDate(),
  focusSession: null,
  lastCompletedTaskId: null,
  lastEarnedCoins: null,
  settings: loadSettings(),
  coins: loadLedger(),

  init() {
    const rawTasks = loadTasks()
    // Migrate old tasks that don't have mustDoToday field
    const tasks = rawTasks.map(t => ({ ...t, mustDoToday: t.mustDoToday ?? false }))
    const lastReset = getLastResetDate()
    const effectiveToday = getDayBoundaryDate()
    const settings = loadSettings()
    const coins = loadLedger()

    applyTheme(settings.theme)

    if (shouldReset(lastReset)) {
      const reset = tasks.map(t =>
        t.status === 'open' && t.scheduledDate && t.scheduledDate < effectiveToday
          ? { ...t, scheduledDate: null, scheduledTime: null }
          : t
      )
      saveTasks(reset)
      setLastResetDate(effectiveToday)
      set({ tasks: reset, selectedDate: effectiveToday, settings, coins })
    } else {
      set({ tasks, selectedDate: effectiveToday, settings, coins })
    }
  },

  addTask(title) {
    const { settings } = get()
    const task: Task = {
      id: nanoid(),
      title: title.trim(),
      estimatedMinutes: estimateMinutes(title) ?? settings.defaultBlockMinutes,
      scheduledDate: null,
      scheduledTime: null,
      horizon: 'day',
      status: 'open',
      mustDoToday: false,
      createdAt: new Date().toISOString(),
    }
    set(s => {
      const tasks = [...s.tasks, task]
      saveTasks(tasks)
      return { tasks }
    })
  },

  editTask(id, title, minutes, horizon) {
    set(s => {
      const tasks = s.tasks.map(t =>
        t.id === id ? { ...t, title: title.trim(), estimatedMinutes: minutes, horizon } : t
      )
      saveTasks(tasks)
      return { tasks }
    })
  },

  deleteTask(id) {
    set(s => {
      const tasks = s.tasks.filter(t => t.id !== id)
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

  completeTask(id, viaFocus = false) {
    const { tasks, coins } = get()
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const today = getDayBoundaryDate()

    const { ledger: newLedger, earned } = earnCoins(
      coins,
      task.title,
      viaFocus,
      today,
    )

    const updatedTasks = tasks.map(t =>
      t.id === id ? { ...t, status: 'done' as const, completedAt: new Date().toISOString() } : t
    )
    saveTasks(updatedTasks)

    set({
      tasks: updatedTasks,
      lastCompletedTaskId: id,
      focusSession: null,
      coins: newLedger,
      lastEarnedCoins: earned > 0 ? earned : null,
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

  setView(view) { set({ view }) },
  setSelectedDate(date) { set({ selectedDate: date }) },

  startFocus(taskId) {
    const { tasks, settings } = get()
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const durationMs = (task.estimatedMinutes ?? settings.defaultBlockMinutes) * 60 * 1000
    set({ focusSession: { taskId, startedAt: Date.now(), durationMs }, lastCompletedTaskId: null })
  },

  endFocus() { set({ focusSession: null }) },

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

  updateSetting(key, value) {
    set(s => {
      const settings = { ...s.settings, [key]: value }
      saveSettings(settings)
      return { settings }
    })
  },

  clearAllData() {
    localStorage.clear()
    const settings = loadSettings()
    const coins = loadLedger()
    set({ tasks: [], coins, settings, focusSession: null, lastCompletedTaskId: null, lastEarnedCoins: null })
  },

  clearEarnedCoins() {
    set({ lastEarnedCoins: null })
  },

  pinToMustDo(id) {
    set(s => {
      const tasks = s.tasks.map(t => t.id === id ? { ...t, mustDoToday: true } : t)
      saveTasks(tasks)
      return { tasks }
    })
  },

  unpinFromMustDo(id) {
    set(s => {
      const tasks = s.tasks.map(t => t.id === id ? { ...t, mustDoToday: false } : t)
      saveTasks(tasks)
      return { tasks }
    })
  },
}))

// Inline nanoid to avoid adding a dependency
function nanoid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
