import { useEffect } from 'react'
import { useStore } from './store'
import { BrainDump } from './components/BrainDump'
import { DayView } from './components/DayView'
import { WeekView } from './components/WeekView'
import { MonthView } from './components/MonthView'
import { FocusMode } from './components/FocusMode'
import { format, parseISO } from './lib/time'
import type { View } from './types'

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'dump', label: 'Dump' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

export default function App() {
  const { view, setView, focusSession, init, tasks, selectedDate } = useStore()

  useEffect(() => {
    init()
  }, [])

  const dumpCount = tasks.filter(t => t.status === 'open' && !t.scheduledDate).length
  const dayLabel = format(parseISO(selectedDate), 'EEE MMM d')

  return (
    <div className="min-h-dvh flex flex-col bg-[#fafaf8]">
      {/* Top nav */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-indigo-600 tracking-tight">BoxDay</span>
          <span className="text-xs text-gray-400">{dayLabel}</span>
        </div>

        <nav className="flex gap-1 ml-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${view === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {item.label}
              {item.id === 'dump' && dumpCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {dumpCount > 9 ? '9+' : dumpCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === 'dump' && <BrainDump />}
        {view === 'day' && <DayView />}
        {view === 'week' && <WeekView />}
        {view === 'month' && <MonthView />}
      </main>

      {/* Focus mode overlay */}
      {focusSession && <FocusMode />}
    </div>
  )
}
