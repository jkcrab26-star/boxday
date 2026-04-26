import { format, parseISO, isAfter, startOfDay, addDays } from 'date-fns'

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// Day boundary is 4am, not midnight — catches late-night ADHD sessions
export function getDayBoundaryDate(): string {
  const now = new Date()
  // Before 4am we're still on the "previous day"
  if (now.getHours() < 4) {
    return format(addDays(now, -1), 'yyyy-MM-dd')
  }
  return format(now, 'yyyy-MM-dd')
}

export function shouldReset(lastResetDate: string | null): boolean {
  const effectiveToday = getDayBoundaryDate()
  if (!lastResetDate) return true
  return lastResetDate < effectiveToday
}

// Returns array of 30-min slot labels: ["08:00","08:30",..."22:00"]
export function getSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 22) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

export function formatSlot(slot: string): string {
  const [h, m] = slot.split(':').map(Number)
  const period = h < 12 ? 'am' : 'pm'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}${m === 30 ? ':30' : ''}${period}`
}

export function estimatedBucket(minutes: number | null): string {
  if (!minutes) return '?'
  if (minutes <= 15) return '15m'
  if (minutes <= 30) return '30m'
  if (minutes <= 60) return '1h'
  return '90m+'
}

// Heuristic AI time estimation (placeholder; real Claude call comes in Phase 2)
const KEYWORD_ESTIMATES: Array<[RegExp, number]> = [
  [/email|reply|respond/i, 15],
  [/meeting|call|sync/i, 60],
  [/review|read/i, 30],
  [/write|draft|document/i, 60],
  [/fix|debug|bug/i, 45],
  [/build|implement|create|develop/i, 90],
  [/research|explore|investigate/i, 60],
  [/plan|outline|brainstorm/i, 30],
  [/send|submit|upload/i, 15],
  [/quick|brief|short/i, 15],
]

export function estimateMinutes(title: string): number {
  for (const [pattern, mins] of KEYWORD_ESTIMATES) {
    if (pattern.test(title)) return mins
  }
  return 30
}

// Returns the week days (Mon–Sun) for the week containing the given date
export function getWeekDays(dateISO: string): string[] {
  const date = parseISO(dateISO)
  const dayOfWeek = date.getDay() // 0=Sun
  const monday = addDays(date, dayOfWeek === 0 ? -6 : -(dayOfWeek - 1))
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
}

export { format, parseISO, isAfter, startOfDay, addDays }
