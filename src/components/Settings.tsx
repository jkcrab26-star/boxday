import { useState } from 'react'
import { useStore } from '../store'
import { STRIPE_MONTHLY, STRIPE_ANNUAL } from '../lib/stripe'
import { connectGoogleCalendar, clearToken, isConnected as isGcalConnected } from '../lib/googleCalendar'

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">⚡</div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Go Pro</h2>
          <p className="text-sm text-gray-500 mt-1">Unlimited AI boxing, advanced focus modes, and more.</p>
        </div>
        {STRIPE_MONTHLY ? (
          <a
            href={STRIPE_MONTHLY}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            $9 / month
          </a>
        ) : (
          <span className="block w-full text-center bg-violet-300 text-white font-semibold rounded-xl py-3 text-sm cursor-not-allowed">
            $9 / month
          </span>
        )}
        {STRIPE_ANNUAL ? (
          <a
            href={STRIPE_ANNUAL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            $79 / year <span className="text-xs font-normal text-green-600 ml-1">save 27%</span>
          </a>
        ) : (
          <span className="block w-full text-center bg-gray-100 dark:bg-gray-800 text-gray-400 font-semibold rounded-xl py-3 text-sm cursor-not-allowed">
            $79 / year <span className="text-xs font-normal ml-1">save 27%</span>
          </span>
        )}
        <button
          onClick={onClose}
          className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 pt-1"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i)
const BLOCK_OPTIONS = [15, 25, 30, 45, 60, 90]
const RESET_HOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6]

function hourLabel(h: number): string {
  if (h === 0) return '12:00 AM'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

export function Settings() {
  const { settings, updateSetting, clearAllData } = useStore()
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [gcalConnected, setGcalConnected] = useState(() => isGcalConnected())

  function confirmClearData() {
    if (window.confirm('Clear all 80HD data? This cannot be undone.')) {
      clearAllData()
    }
  }

  function handleGcalConnect() {
    connectGoogleCalendar(ok => {
      if (ok) {
        updateSetting('googleCalendarEnabled', true)
        setGcalConnected(true)
      }
    })
  }

  function handleGcalDisconnect() {
    clearToken()
    updateSetting('googleCalendarEnabled', false)
    setGcalConnected(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 overflow-y-auto h-[calc(100dvh-56px)]">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Upgrade to Pro */}
      <button
        onClick={() => setShowUpgrade(true)}
        className="w-full flex items-center justify-between bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-2xl px-4 py-4 shadow-md hover:opacity-90 transition-opacity"
      >
        <div className="text-left">
          <div className="font-bold text-sm">Upgrade to 80HD Pro</div>
          <div className="text-xs opacity-80 mt-0.5">Unlimited AI boxing · Advanced focus · Priority support</div>
        </div>
        <span className="text-lg">⚡</span>
      </button>

      {/* AI / BYOK */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          AI Time-Boxing (optional)
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          80HD uses smart heuristics by default — free, no key needed. Add your own key to unlock real AI suggestions.
        </p>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          <Row label="Anthropic API Key">
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                type={showAnthropicKey ? 'text' : 'password'}
                value={settings.anthropicApiKey}
                onChange={e => updateSetting('anthropicApiKey', e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-violet-400 font-mono"
              />
              <button
                onClick={() => setShowAnthropicKey(s => !s)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {showAnthropicKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </Row>
          <Row label="OpenAI API Key">
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                type={showOpenAIKey ? 'text' : 'password'}
                value={settings.openaiApiKey}
                onChange={e => updateSetting('openaiApiKey', e.target.value)}
                placeholder="sk-..."
                className="flex-1 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-violet-400 font-mono"
              />
              <button
                onClick={() => setShowOpenAIKey(s => !s)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {showOpenAIKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </Row>
          <div className="px-4 py-2">
            <p className="text-[10px] text-gray-400">
              Keys are stored only on this device. 80HD never sends them to our servers.
              {settings.anthropicApiKey || settings.openaiApiKey
                ? ' ✓ Your key is active — AI suggestions enabled.'
                : ' Using round-robin fallback (free).'}
            </p>
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Calendar
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Sync tasks to Google Calendar. When you drop a task into a time slot, an event is created automatically.
        </p>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          <Row label="Google Calendar">
            {gcalConnected ? (
              <button
                onClick={handleGcalDisconnect}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleGcalConnect}
                className="flex items-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                Connect Google
              </button>
            )}
          </Row>
          {gcalConnected && (
            <div className="px-4 py-2">
              <p className="text-[10px] text-gray-400">
                ✓ Connected — tasks dropped into time slots will sync as Google Calendar events. Calendar events appear greyed out in Day View.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Day boundaries */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Day Boundaries
        </h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          <Row label="Day starts at">
            <select
              value={settings.dayStartHour}
              onChange={e => updateSetting('dayStartHour', Number(e.target.value))}
              className="text-sm text-gray-700 dark:text-gray-300 bg-transparent outline-none"
            >
              {HOUR_OPTIONS.filter(h => h < settings.afternoonStartHour).map(h => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </Row>
          <Row label="Afternoon starts at">
            <select
              value={settings.afternoonStartHour}
              onChange={e => updateSetting('afternoonStartHour', Number(e.target.value))}
              className="text-sm text-gray-700 dark:text-gray-300 bg-transparent outline-none"
            >
              {HOUR_OPTIONS.filter(h => h > settings.dayStartHour && h < settings.eveningStartHour).map(h => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </Row>
          <Row label="Evening starts at">
            <select
              value={settings.eveningStartHour}
              onChange={e => updateSetting('eveningStartHour', Number(e.target.value))}
              className="text-sm text-gray-700 dark:text-gray-300 bg-transparent outline-none"
            >
              {HOUR_OPTIONS.filter(h => h > settings.afternoonStartHour).map(h => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </Row>
          <Row label="Daily reset at">
            <select
              value={settings.dailyResetHour}
              onChange={e => updateSetting('dailyResetHour', Number(e.target.value))}
              className="text-sm text-gray-700 dark:text-gray-300 bg-transparent outline-none"
            >
              {RESET_HOUR_OPTIONS.map(h => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </Row>
        </div>
      </section>

      {/* Focus */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Focus
        </h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          <Row label="Default focus timer">
            <div className="flex gap-1 flex-wrap justify-end">
              {BLOCK_OPTIONS.map(mins => (
                <button
                  key={mins}
                  onClick={() => updateSetting('defaultBlockMinutes', mins)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono ${
                    settings.defaultBlockMinutes === mins
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Ambient Time Pulse">
            <Toggle
              value={settings.ambientPulse}
              onChange={v => updateSetting('ambientPulse', v)}
            />
          </Row>
          <Row label="Sound">
            <Toggle
              value={settings.soundEnabled}
              onChange={v => updateSetting('soundEnabled', v)}
            />
          </Row>
        </div>
      </section>

      {/* Coins */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Coins
        </h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          <Row label="Negative reinforcement">
            <Toggle
              value={settings.negativeReinforcement}
              onChange={v => updateSetting('negativeReinforcement', v)}
            />
          </Row>
          {settings.negativeReinforcement && (
            <div className="px-4 py-2">
              <p className="text-[10px] text-gray-400">
                Deleting an incomplete task deducts 5 coins (balance won't go below 0).
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Appearance */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Appearance
        </h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          <Row label="Theme">
            <div className="flex gap-1">
              {([
                { value: 'light', label: '☀️ Light' },
                { value: 'system', label: '⚙️ Auto' },
                { value: 'dark', label: '🌙 Dark' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSetting('theme', value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    settings.theme === value
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Row>
        </div>
      </section>

      {/* Data */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Data
        </h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <button
            onClick={confirmClearData}
            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-colors"
          >
            Clear all data &amp; reset onboarding
          </button>
        </div>
      </section>

      <p className="text-xs text-gray-400 text-center pb-6">
        80HD · All data stored locally on this device
      </p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-sm text-gray-700 dark:text-gray-300 shrink-0">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
      role="switch"
      aria-checked={value}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
