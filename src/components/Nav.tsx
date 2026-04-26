import type { View, StreakData } from '../types';

interface NavProps {
  view: View;
  setView: (v: View) => void;
  streak: StreakData;
  isPro: boolean;
  onUpgradeClick: () => void;
  inboxCount: number;
}

const TABS: { id: View; label: string }[] = [
  { id: 'dump', label: 'Dump' },
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

export default function Nav({ view, setView, streak, isPro, onUpgradeClick, inboxCount }: NavProps) {
  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '0 12px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--brand)', letterSpacing: '-0.5px' }}>
            BoxDay
          </span>
          {!isPro && (
            <button
              onClick={onUpgradeClick}
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--brand)',
                background: 'var(--brand-light)',
                border: 'none',
                borderRadius: 5,
                padding: '2px 6px',
                cursor: 'pointer',
              }}
            >
              Free
            </button>
          )}
          {isPro && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#7c3aed',
              background: '#ede9fe',
              borderRadius: 5,
              padding: '2px 6px',
            }}>
              PRO
            </span>
          )}
        </div>

        {/* Nav tabs */}
        <nav style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                padding: '5px 10px',
                borderRadius: 7,
                border: 'none',
                background: view === id ? 'var(--brand)' : 'transparent',
                color: view === id ? '#fff' : 'var(--muted)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
              {id === 'dump' && inboxCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 15,
                  height: 15,
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {inboxCount > 9 ? '9+' : inboxCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Streak */}
        {streak.currentStreak > 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 13,
            fontWeight: 700,
            color: '#f59e0b',
            flexShrink: 0,
          }}>
            🔥{streak.currentStreak}
          </div>
        ) : <div style={{ width: 36 }} />}
      </div>
    </header>
  );
}
