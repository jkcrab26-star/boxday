import { useEffect, useState } from 'react'
import { useStore } from '../store'

export function FocusMode() {
  const { tasks, focusSession, completeTask, snoozeTask, dismissTask, settings, lastEarnedCoins, clearEarnedCoins } = useStore()
  const session = focusSession!
  const task = tasks.find(t => t.id === session.taskId)

  const [elapsed, setElapsed] = useState(0)
  const [showCoinPop, setShowCoinPop] = useState(false)
  const [celebCoins, setCelebCoins] = useState(0)

  const totalMs = session.durationMs
  const remainingMs = Math.max(0, totalMs - elapsed)
  const pulseDurationSec = Math.max(30, Math.floor(totalMs / 1000))

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - session.startedAt)
    }, 1000)
    return () => clearInterval(interval)
  }, [session.startedAt])

  // Show coin pop when earned after completing this task
  useEffect(() => {
    if (lastEarnedCoins && lastEarnedCoins > 0) {
      setCelebCoins(lastEarnedCoins)
      setShowCoinPop(true)
      const t = setTimeout(() => { setShowCoinPop(false); clearEarnedCoins() }, 2200)
      return () => clearTimeout(t)
    }
  }, [lastEarnedCoins])

  if (!task) return null

  const isOvertime = elapsed > totalMs

  return (
    <div
      className={`${settings.ambientPulse ? 'ambient-pulse' : 'bg-[#f0f4ff]'} fixed inset-0 flex flex-col items-center justify-center z-50 px-6`}
      style={settings.ambientPulse ? { '--pulse-duration': `${pulseDurationSec}s` } as React.CSSProperties : undefined}
    >
      <div className="w-full max-w-md relative">
        {/* Coin celebration pop — anchored above timer */}
        {showCoinPop && (
          <div className="coin-pop absolute -top-14 left-1/2 -translate-x-1/2 pointer-events-none text-center">
            <span className="text-3xl font-bold text-yellow-500 drop-shadow-md">
              +{celebCoins} 🪙
            </span>
          </div>
        )}

        {/* Timer */}
        <div className="text-center mb-8">
          <p className={`text-7xl font-mono font-light mb-2 ${isOvertime ? 'text-orange-600' : 'text-gray-800'}`}>
            {isOvertime ? '+' : ''}{formatTime(Math.abs(remainingMs))}
          </p>
          {isOvertime && (
            <p className="text-sm text-orange-500">Running over — wrap up when you can</p>
          )}
        </div>

        {/* Task */}
        <div className="bg-white/80 backdrop-blur rounded-2xl px-6 py-5 mb-8 shadow-sm border border-white/60">
          <p className="text-lg font-medium text-gray-900 text-center leading-snug">
            {task.title}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => completeTask(task.id, true)}
            className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-lg transition-colors"
          >
            ✓ Done
          </button>
          <button
            onClick={() => snoozeTask(task.id)}
            className="w-full py-3 rounded-2xl bg-white/70 hover:bg-white/90 text-gray-700 font-medium text-sm border border-gray-200 transition-colors"
          >
            Snooze 15 min
          </button>
          {/* Escape hatch — Doc's Red Line 4: focus mode must have an exit */}
          <button
            onClick={() => dismissTask(task.id)}
            className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
          >
            Not now → back to grid
          </button>
        </div>
      </div>
    </div>
  )
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
