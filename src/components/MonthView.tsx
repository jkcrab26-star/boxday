import { useStore } from '../store'
import { format, parseISO } from '../lib/time'
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { STRIPE_MONTHLY } from '../lib/stripe'

export function MonthView() {
  const { tasks, selectedDate, setSelectedDate, setView, settings } = useStore()

  if (!settings.isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <span className="text-4xl">📅</span>
        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">Month view is Pro</div>
        <p className="text-sm text-gray-500 max-w-xs">See the whole month as a load heat map and spot heavy weeks ahead of time.</p>
        <a
          href={STRIPE_MONTHLY ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Upgrade to Pro — $9/mo
        </a>
      </div>
    )
  }

  const base = parseISO(selectedDate)
  const monthStart = startOfMonth(base)
  const monthEnd = endOfMonth(base)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad to start on Monday
  const startPad = (getDay(monthStart) + 6) % 7
  const nullPads: (string | null)[] = Array.from({ length: startPad }, () => null)
  const paddedDays = [...nullPads, ...days.map(d => format(d, 'yyyy-MM-dd'))]

  function goToDay(date: string) {
    setSelectedDate(date)
    setView('day')
  }

  // Heat map: 0=empty, 1=light, 2=medium, 3=heavy
  function getLoad(date: string): number {
    const dayTasks = tasks.filter(t => t.scheduledDate === date && t.status === 'open')
    const totalMins = dayTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 30), 0)
    if (totalMins === 0) return 0
    if (totalMins <= 120) return 1
    if (totalMins <= 360) return 2
    return 3
  }

  const loadColors = ['', 'bg-violet-100', 'bg-violet-200', 'bg-violet-300']

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <p className="text-center text-sm text-gray-500 mb-4">
        {format(base, 'MMMM yyyy')} — click any day to open it
      </p>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {paddedDays.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />

          const load = getLoad(date)
          const isToday = date === format(new Date(), 'yyyy-MM-dd')
          const isSelected = date === selectedDate
          const dayNum = format(parseISO(date), 'd')

          return (
            <button
              key={date}
              onClick={() => goToDay(date)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                transition-all border
                ${isSelected ? 'border-violet-500 text-violet-700' : 'border-transparent'}
                ${isToday ? 'ring-2 ring-violet-400' : ''}
                ${load > 0 ? loadColors[load] : 'hover:bg-gray-100'}
                ${load > 0 ? 'text-violet-800' : 'text-gray-700'}
              `}
            >
              {dayNum}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 justify-center text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-violet-100 inline-block" /> Light
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-violet-200 inline-block" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-violet-300 inline-block" /> Heavy
        </span>
      </div>

      <p className="text-xs text-gray-300 text-center mt-2">
        Month view shows load heat map — open a day for details
      </p>
    </div>
  )
}
