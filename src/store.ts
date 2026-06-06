import { create } from 'zustand'
import type { Task, TaskList, View, Horizon } from './types'
import { loadTasks, saveTasks, getLastResetDate, setLastResetDate, loadTaskLists, saveTaskLists } from './lib/storage'
import { shouldReset, getDayBoundaryDate, estimateMinutes } from './lib/time'
import { loadSettings, saveSettings, applyTheme, type AppSettings } from './lib/settings'
import { loadLedger, earnCoins, deductCoins, type CoinLedger } from './lib/coins'
import { createCalendarEvent, isConnected as gcalConnected } from './lib/googleCalendar'

interface FocusSession {
  taskId: string
  startedAt: number
  durationMs: number
}

interface State {
  tasks: Task[]
  taskLists: TaskList[]
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
  reopenTask: (id: string) => void
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
  // Task list actions
  addTaskList: (name: string) => void
  deleteTaskList: (listId: string) => void
  renameTaskList: (listId: string, name: string) => void
  addListItem: (listId: string, title: string) => void
  toggleListItem: (listId: string, itemId: string) => void
  deleteListItem: (listId: string, itemId: string) => void
  scheduleTaskList: (listId: string, date: string) => void
  unscheduleTaskList: (listId: string) => void
}

export const useStore = create<State>((set, get) => ({
  tasks: [],
  taskLists: [],
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
    const taskLists = loadTaskLists()

    applyTheme(settings.theme)

    if (shouldReset(lastReset)) {
      const reset = tasks.map(t =>
        t.status === 'open' && t.scheduledDate && t.scheduledDate < effectiveToday
          ? { ...t, scheduledDate: null, scheduledTime: null }
          : t
      )
      saveTasks(reset)
      setLastResetDate(effectiveToday)
      set({ tasks: reset, taskLists, selectedDate: effectiveToday, settings, coins })
    } else {
      set({ tasks, taskLists, selectedDate: effectiveToday, settings, coins })
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
    const { tasks, coins, settings } = get()
    const task = tasks.find(t => t.id === id)
    const newTasks = tasks.filter(t => t.id !== id)
    saveTasks(newTasks)
    if (task && task.status !== 'done' && settings.negativeReinforcement) {
      const newCoins = deductCoins(coins, task.title)
      set({ tasks: newTasks, coins: newCoins })
    } else {
      set({ tasks: newTasks })
    }
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
      // Fire-and-forget: push to Google Calendar if connected and time is set
      if (time && s.settings.googleCalendarEnabled && gcalConnected()) {
        const task = tasks.find(t => t.id === id)
        if (task) {
          createCalendarEvent(task.title, date, time, task.estimatedMinutes ?? 30).catch(() => {})
        }
      }
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

  reopenTask(id) {
    set(s => {
      const tasks = s.tasks.map(t =>
        t.id === id ? { ...t, status: 'open' as const, completedAt: undefined } : t
      )
      saveTasks(tasks)
      return { tasks }
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

  addTaskList(name) {
    const list: TaskList = {
      id: nanoid(),
      name: name.trim(),
      items: [],
      scheduledDate: null,
      createdAt: new Date().toISOString(),
    }
    set(s => {
      const taskLists = [...s.taskLists, list]
      saveTaskLists(taskLists)
      return { taskLists }
    })
  },

  deleteTaskList(listId) {
    set(s => {
      const taskLists = s.taskLists.filter(l => l.id !== listId)
      saveTaskLists(taskLists)
      return { taskLists }
    })
  },

  renameTaskList(listId, name) {
    set(s => {
      const taskLists = s.taskLists.map(l => l.id === listId ? { ...l, name: name.trim() } : l)
      saveTaskLists(taskLists)
      return { taskLists }
    })
  },

  addListItem(listId, title) {
    set(s => {
      const taskLists = s.taskLists.map(l =>
        l.id !== listId ? l : {
          ...l,
          items: [...l.items, { id: nanoid(), title: title.trim(), done: false }],
        }
      )
      saveTaskLists(taskLists)
      return { taskLists }
    })
  },

  toggleListItem(listId, itemId) {
    set(s => {
      const taskLists = s.taskLists.map(l =>
        l.id !== listId ? l : {
          ...l,
          items: l.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i),
        }
      )
      saveTaskLists(taskLists)
      return { taskLists }
    })
  },

  deleteListItem(listId, itemId) {
    set(s => {
      const taskLists = s.taskLists.map(l =>
        l.id !== listId ? l : { ...l, items: l.items.filter(i => i.id !== itemId) }
      )
      saveTaskLists(taskLists)
      return { taskLists }
    })
  },

  scheduleTaskList(listId, date) {
    set(s => {
      const taskLists = s.taskLists.map(l => l.id === listId ? { ...l, scheduledDate: date } : l)
      saveTaskLists(taskLists)
      return { taskLists }
    })
  },

  unscheduleTaskList(listId) {
    set(s => {
      const taskLists = s.taskLists.map(l => l.id === listId ? { ...l, scheduledDate: null } : l)
      saveTaskLists(taskLists)
      return { taskLists }
    })
  },
}))

// Inline nanoid to avoid adding a dependency
function nanoid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
