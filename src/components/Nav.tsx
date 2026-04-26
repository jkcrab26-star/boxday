import type { View } from '../types';
import type { StreakData } from '../types';

interface NavProps {
  view: View;
  setView: (v: View) => void;
  streak: StreakData;
  isPro: boolean;
  onUpgradeClick: () => void;
  inboxCount: number;
}

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
        padding: '0 16px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand)', letterSpacing: '-0.5px' }}>
            BoxDay
          </span>
          {!isPro && (
            <button
              onClick={onUpgradeClick}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--brand)',
                background: 'var(--brand-light)',
                border: 'none',
                borderRadius: 6,
                padding: '2px 7px',
                cursor: 'pointer',
              }}
            >
              Free
            </button>
          )}
          {isPro && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#7c3aed',
              background: '#ede9fe',
              borderRadius: 6,
              padding: '2px 7px',
            }}>
              PRO
            </span>
          )}
        </div>

        {/* Nav tabs */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {(['dump', 'day', 'reflect'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: 'none',
                background: view === v ? 'var(--brand)' : 'transparent',
                color: view === v ? '#fff' : 'var(--muted)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.15s',
              }}
            >
              {v === 'dump' ? 'Dump' : v === 'day' ? 'Today' : 'Reflect'}
              {v === 'dump' && inboxCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: 10,
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
        {streak.currentStreak > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 700,
            color: '#f59e0b',
          }}>
            <span>🔥</span>
            <span>{streak.currentStreak}</span>
          </div>
        )}
        {streak.currentStreak === 0 && <div style={{ width: 40 }} />}
      </div>
    </header>
  );
}
