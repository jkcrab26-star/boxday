export type CoinTxType = 'task' | 'box' | 'day_first'

export interface CoinTransaction {
  id: string
  type: CoinTxType
  amount: number
  taskTitle: string
  earnedAt: string  // ISO timestamp
}

export interface CoinLedger {
  balance: number
  transactions: CoinTransaction[]  // newest first, capped at 200
  todayDate: string
  todayEarned: number
}

// Earn rates per Toshi Phase-0 spec
export const EARN_RATES = {
  task: 1,
  box: 3,
  day_first: 10,
} as const

export const DAILY_CAP = 50

const COINS_KEY = 'boxday_coins'

function emptyLedger(): CoinLedger {
  return { balance: 0, transactions: [], todayDate: '', todayEarned: 0 }
}

export function loadLedger(): CoinLedger {
  try {
    const raw = localStorage.getItem(COINS_KEY)
    return raw ? JSON.parse(raw) : emptyLedger()
  } catch {
    return emptyLedger()
  }
}

export function saveLedger(ledger: CoinLedger): void {
  localStorage.setItem(COINS_KEY, JSON.stringify(ledger))
}

export function earnCoins(
  ledger: CoinLedger,
  taskTitle: string,
  viaFocus: boolean,
  todayDate: string,
  completedCountToday: number  // tasks completed today BEFORE this one
): { ledger: CoinLedger; earned: number } {
  // Reset daily counter on new day
  const base: CoinLedger = ledger.todayDate === todayDate
    ? ledger
    : { ...ledger, todayDate, todayEarned: 0 }

  const remaining = DAILY_CAP - base.todayEarned
  if (remaining <= 0) return { ledger: base, earned: 0 }

  const newTxns: CoinTransaction[] = []
  let totalEarned = 0

  const baseType: CoinTxType = viaFocus ? 'box' : 'task'
  const baseAmount = Math.min(EARN_RATES[baseType], remaining)
  if (baseAmount > 0) {
    newTxns.push({ id: nanoid(), type: baseType, amount: baseAmount, taskTitle, earnedAt: new Date().toISOString() })
    totalEarned += baseAmount
  }

  // First completion of the day bonus
  if (completedCountToday === 0 && remaining - totalEarned >= EARN_RATES.day_first) {
    newTxns.push({ id: nanoid(), type: 'day_first', amount: EARN_RATES.day_first, taskTitle, earnedAt: new Date().toISOString() })
    totalEarned += EARN_RATES.day_first
  }

  const newLedger: CoinLedger = {
    balance: base.balance + totalEarned,
    transactions: [...newTxns, ...base.transactions].slice(0, 200),
    todayDate,
    todayEarned: base.todayEarned + totalEarned,
  }
  saveLedger(newLedger)
  return { ledger: newLedger, earned: totalEarned }
}

function nanoid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
