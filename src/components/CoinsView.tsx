import { useStore } from '../store'
import { format, parseISO } from '../lib/time'
import { EARN_RATES, DEDUCT_RATES, DAILY_CAP } from '../lib/coins'

const TX_LABELS: Record<string, string> = {
  task: `+${EARN_RATES.task} — task complete`,
  box: `+${EARN_RATES.box} — focus bonus`,
  day_first: `+${EARN_RATES.day_first} — first of day`,
  dismiss: `-${DEDUCT_RATES.dismiss} — task deleted`,
}

export function CoinsView() {
  const { coins } = useStore()

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Balance hero */}
      <div className="text-center mb-8">
        <div className="text-6xl font-bold text-violet-600 mb-1">
          {coins.balance}
        </div>
        <div className="text-sm text-gray-500">coins earned</div>
        <div className="mt-4 text-xs text-gray-400">
          Today: {coins.todayEarned} / {DAILY_CAP} daily cap
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 max-w-xs mx-auto">
          <div
            className="bg-violet-500 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(100, (coins.todayEarned / DAILY_CAP) * 100)}%` }}
          />
        </div>
      </div>

      {/* How to earn */}
      <div className="bg-violet-50 dark:bg-violet-950 rounded-xl p-4 mb-6 text-sm">
        <p className="font-medium text-violet-900 dark:text-violet-100 mb-2">How to earn</p>
        <ul className="space-y-1 text-violet-700 dark:text-violet-300 text-xs">
          <li>✓ Complete any task: <strong>+{EARN_RATES.task} coins</strong></li>
          <li>▶ Complete via Focus Mode: <strong>+{EARN_RATES.box} bonus coins</strong> (= +{EARN_RATES.task + EARN_RATES.box} total)</li>
          <li>⚡ Daily cap: <strong>{DAILY_CAP} coins</strong> (keeps it healthy)</li>
        </ul>
      </div>

      {/* Redemption stub */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <p className="font-medium text-amber-900 dark:text-amber-100 text-sm mb-1">🎁 Prizes coming soon</p>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Redeem coins for free Pro months, discounts, and more. On-chain settlement launches post-v0. Your balance is safe.
        </p>
      </div>

      {/* Coin history */}
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Coin history
      </h2>

      {coins.transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🪙</p>
          <p className="text-sm">Complete your first task to earn coins.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {coins.transactions.map(tx => {
            const isDismiss = tx.type === 'dismiss'
            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border ${
                  isDismiss
                    ? 'bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-900'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                }`}
              >
                <span className="text-lg">
                  {isDismiss ? '✕' : tx.type === 'box' ? '🎯' : tx.type === 'day_first' ? '☀️' : '✓'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${isDismiss ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {tx.taskTitle}
                  </p>
                  <p className="text-[10px] text-gray-400">{TX_LABELS[tx.type]}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-semibold ${isDismiss ? 'text-red-500' : 'text-violet-600'}`}>
                    {isDismiss ? tx.amount : `+${tx.amount}`}
                  </span>
                  <p className="text-[10px] text-gray-400">
                    {format(parseISO(tx.earnedAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
