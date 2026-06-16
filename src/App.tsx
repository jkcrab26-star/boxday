import { useEffect, useRef } from 'react'
import { useStore } from './store'
import { applyTheme } from './lib/settings'
import { BrainDump } from './components/BrainDump'
import { DayView } from './components/DayView'
import { WeekView } from './components/WeekView'
import { MonthView } from './components/MonthView'
import { FocusMode } from './components/FocusMode'
import { CoinsView } from './components/CoinsView'
import { Settings } from './components/Settings'
import { MustDoView } from './components/MustDoView'
import { PrivacyPolicy } from './components/PrivacyPolicy'
import { TermsOfService } from './components/TermsOfService'
import { format, parseISO } from './lib/time'
import type { View } from './types'

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'dump', label: 'Dump' },
  { id: 'mustdo', label: 'Must Do' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

export default function App() {
  const { view, setView, focusSession, init, tasks, selectedDate, coins, lastEarnedCoins, clearEarnedCoins, updateSetting } = useStore()
  const coinPopRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    init()
  }, [])

  // Stripe checkout success redirects back with ?pro=1 — flip the entitlement and clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('pro') === '1') {
      updateSetting('isPro', true)
      window.history.replaceState({}, '', window.location.pathname + '?app=1')
    }
  }, [])

  // Re-apply theme when OS dark-mode preference changes (relevant when theme === 'system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const { settings } = useStore.getState()
      if (settings.theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Trigger coin pop animation when coins are earned
  useEffect(() => {
    if (lastEarnedCoins && coinPopRef.current) {
      coinPopRef.current.classList.remove('coin-pop')
      // Force reflow
      void coinPopRef.current.offsetHeight
      coinPopRef.current.classList.add('coin-pop')
      const timer = setTimeout(() => clearEarnedCoins(), 900)
      return () => clearTimeout(timer)
    }
  }, [lastEarnedCoins])

  const dumpCount = tasks.filter(t => t.status === 'open' && !t.scheduledDate).length
  const mustDoCount = tasks.filter(t => t.status === 'open' && t.mustDoToday).length
  const dayLabel = format(parseISO(selectedDate), 'EEE MMM d')

  return (
    <div className="min-h-dvh flex flex-col bg-[#fdf8f0] dark:bg-[#111110]">
      {/* Top nav */}
      <header className="h-14 border-b border-amber-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center px-4 gap-2 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <img src="/we80hd-logo.svg" alt="80HD" className="h-6" />
          <span className="text-xs text-gray-400 hidden sm:inline">{dayLabel}</span>
        </div>

        <nav className="flex gap-1 ml-auto overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                relative px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0
                ${view === item.id
                  ? 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {item.label}
              {item.id === 'dump' && dumpCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {dumpCount > 9 ? '9+' : dumpCount}
                </span>
              )}
              {item.id === 'mustdo' && mustDoCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {mustDoCount > 9 ? '9+' : mustDoCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Coin balance + Settings */}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            onClick={() => setView('coins')}
            className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${view === 'coins' ? 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <span>🪙</span>
            <span className="font-semibold text-amber-600">{coins.balance}</span>
            {lastEarnedCoins && (
              <span
                ref={coinPopRef}
                className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-amber-500 pointer-events-none"
              >
                +{lastEarnedCoins}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('settings')}
            className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${view === 'settings' ? 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === 'dump' && <BrainDump />}
        {view === 'mustdo' && <MustDoView />}
        {view === 'day' && <DayView />}
        {view === 'week' && <WeekView />}
        {view === 'month' && <MonthView />}
        {view === 'coins' && <CoinsView />}
        {view === 'settings' && <Settings />}
        {view === 'privacy' && (
          <div className="h-full overflow-y-auto bg-white">
            <PrivacyPolicy />
          </div>
        )}
        {view === 'terms' && (
          <div className="h-full overflow-y-auto bg-white">
            <TermsOfService />
          </div>
        )}
      </main>

      {/* Footer — always visible, no login required */}
      {view !== 'privacy' && view !== 'terms' && (
        <footer className="shrink-0 border-t border-amber-100 bg-white px-4 py-2 flex justify-center gap-4 text-xs text-gray-400">
          <a
            href="/boxday/privacy/"
            className="hover:text-violet-600 transition-colors"
          >
            Privacy Policy
          </a>
          <span>·</span>
          <a
            href="/boxday/terms/"
            className="hover:text-violet-600 transition-colors"
          >
            Terms of Service
          </a>
        </footer>
      )}

      {/* Focus mode overlay */}
      {focusSession && <FocusMode />}
    </div>
  )
}
