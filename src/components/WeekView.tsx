import { useStore } from '../store'
import { getWeekDays, format, parseISO } from '../lib/time'
import { STRIPE_MONTHLY } from '../lib/stripe'

export function WeekView() {
  const { tasks, selectedDate, setSelectedDate, setView, settings } = useStore()
  const weekDays = getWeekDays(selectedDate)

  if (!settings.isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <span className="text-4xl">📅</span>
        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">Week view is Pro</div>
        <p className="text-sm text-gray-500 max-w-xs">See your full week at a glance and track momentum across days.</p>
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

  function goToDay(date: string) {
    setSelectedDate(date)
    setView('day')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(date => {
          const dayTasks = tasks.filter(t => t.scheduledDate === date && t.status === 'open')
          const doneTasks = tasks.filter(t => t.scheduledDate === date && t.status === 'done')
          const totalMins = dayTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 30), 0)
          const hours = totalMins / 60
          const isBusy = hours > 8
          const isSelected = date === selectedDate
          const dayLabel = format(parseISO(date), 'EEE')
          const dayNum = format(parseISO(date), 'd')
          const isToday = date === format(new Date(), 'yyyy-MM-dd')

          return (
            <button
              key={date}
              onClick={() => goToDay(date)}
              className={`
                rounded-xl p-2 text-left border transition-all min-h-[120px]
                ${isSelected ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
            >
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs text-gray-500 font-medium">{dayLabel}</span>
                <span className={`text-sm font-semibold ${isToday ? 'text-violet-600' : 'text-gray-800'}`}>
                  {dayNum}
                </span>
              </div>

              {/* Load indicator — non-shaming per Doc's red line 1 */}
              {isBusy && (
                <div className="text-xs text-amber-600 mb-1">Busy day</div>
              )}

              <div className="space-y-0.5">
                {dayTasks.slice(0, 4).map(t => (
                  <div key={t.id} className="text-xs text-gray-600 truncate leading-tight">
                    · {t.title}
                  </div>
                ))}
                {dayTasks.length > 4 && (
                  <div className="text-xs text-gray-400">+{dayTasks.length - 4} more</div>
                )}
              </div>

              {doneTasks.length > 0 && (
                <div className="mt-1 text-xs text-green-600">✓ {doneTasks.length} done</div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        Click any day to view and box tasks
      </div>
    </div>
  )
}
