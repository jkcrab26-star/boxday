import { useState } from 'react'
import { useStore } from '../store'

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

  function confirmClearData() {
    if (window.confirm('Clear all 80HD data? This cannot be undone.')) {
      clearAllData()
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 overflow-y-auto h-[calc(100dvh-56px)]">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h1>

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

      {/* Appearance */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Appearance
        </h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          <Row label="Theme">
            <div className="flex gap-2">
              {(['light', 'dark'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => updateSetting('theme', t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                    settings.theme === t
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {t === 'light' ? '☀️ Light' : '🌙 Dark'}
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
