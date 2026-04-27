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

// Earn rates per MKG-198 spec
export const EARN_RATES = {
  task: 10,      // base: complete any task
  box: 5,        // bonus: complete via Focus Mode timer
  day_first: 0,  // reserved — not active in v0
} as const

export const DAILY_CAP = 200

const COINS_KEY = '80hd_coins'

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
): { ledger: CoinLedger; earned: number } {
  // Reset daily counter on new day
  const base: CoinLedger = ledger.todayDate === todayDate
    ? ledger
    : { ...ledger, todayDate, todayEarned: 0 }

  const remaining = DAILY_CAP - base.todayEarned
  if (remaining <= 0) return { ledger: base, earned: 0 }

  const newTxns: CoinTransaction[] = []
  let totalEarned = 0

  // Base: +10 for any completed task
  const taskAmount = Math.min(EARN_RATES.task, remaining)
  if (taskAmount > 0) {
    newTxns.push({ id: nanoid(), type: 'task', amount: taskAmount, taskTitle, earnedAt: new Date().toISOString() })
    totalEarned += taskAmount
  }

  // Focus bonus: +5 extra if completed within Focus Mode timer
  if (viaFocus && remaining - totalEarned >= EARN_RATES.box) {
    newTxns.push({ id: nanoid(), type: 'box', amount: EARN_RATES.box, taskTitle, earnedAt: new Date().toISOString() })
    totalEarned += EARN_RATES.box
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
