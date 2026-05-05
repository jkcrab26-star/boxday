export interface AppSettings {
  dayStartHour: number         // hour grid begins, default 8
  afternoonStartHour: number   // "Afternoon" section label, default 12
  eveningStartHour: number     // "Evening" section label, default 17
  defaultBlockMinutes: number  // default 25
  soundEnabled: boolean
  theme: 'light' | 'dark'
  ambientPulse: boolean        // Ambient Time Pulse on/off in focus mode
  dailyResetHour: number       // hour at which daily reset triggers, default 4
  anthropicApiKey: string      // BYOK — user's own Anthropic key (optional)
  openaiApiKey: string         // BYOK — user's own OpenAI key (optional)
  isPro: boolean               // Pro entitlement, flipped via ?pro=1 redirect after Stripe checkout
}

const SETTINGS_KEY = '80hd_settings'

export const DEFAULT_SETTINGS: AppSettings = {
  dayStartHour: 8,
  afternoonStartHour: 12,
  eveningStartHour: 17,
  defaultBlockMinutes: 25,
  soundEnabled: true,
  theme: 'light',
  ambientPulse: true,
  dailyResetHour: 4,
  anthropicApiKey: '',
  openaiApiKey: '',
  isPro: false,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  applyTheme(settings.theme)
}

export function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme)
}
