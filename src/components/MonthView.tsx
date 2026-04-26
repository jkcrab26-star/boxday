import { useState } from 'react';
import type { Task } from '../types';
import { todayISO } from '../utils/storage';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['M','T','W','T','F','S','S'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstWeekday(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface MonthViewProps {
  tasks: Task[];
  isPro: boolean;
  onUpgradeClick: () => void;
}

export default function MonthView({ tasks, isPro, onUpgradeClick }: MonthViewProps) {
  const todayStr = todayISO();
  const [year, setYear] = useState(() => parseInt(todayStr.slice(0, 4)));
  const [month, setMonth] = useState(() => parseInt(todayStr.slice(5, 7)) - 1);

  if (!isPro) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗓️</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Month view is Pro</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          Your completion heat-map across the full month.
        </div>
        <button
          onClick={onUpgradeClick}
          style={{
            padding: '12px 28px',
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const completionMap: Record<string, number> = {};
  tasks.forEach(t => {
    if (t.completedAt?.startsWith(prefix)) {
      const d = t.completedAt.slice(0, 10);
      completionMap[d] = (completionMap[d] ?? 0) + 1;
    }
  });

  const maxCount = Math.max(1, ...Object.values(completionMap));
  const monthTotal = Object.values(completionMap).reduce((a, b) => a + b, 0);
  const powerDays = Object.values(completionMap).filter(c => c >= 5).length;

  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getFirstWeekday(year, month);
  const totalCells = Math.ceil((daysInMonth + firstWeekday) / 7) * 7;

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', padding: '4px 8px' }}>‹</button>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{MONTH_NAMES[month]} {year}</div>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', padding: '4px 8px' }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {DAY_LABELS.map((l, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--muted)', paddingBottom: 4 }}>
            {l}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - firstWeekday + 1;
          if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} />;

          const dateStr = toISODate(year, month, dayNum);
          const count = completionMap[dateStr] ?? 0;
          const isToday = dateStr === todayStr;
          const intensity = count > 0 ? count / maxCount : 0;

          return (
            <div
              key={i}
              title={count > 0 ? `${count} task${count !== 1 ? 's' : ''} done` : undefined}
              style={{
                aspectRatio: '1',
                borderRadius: 5,
                background: count > 0 ? `hsl(142, 60%, ${75 - intensity * 30}%)` : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                border: isToday ? '2px solid var(--brand)' : '2px solid transparent',
              }}
            >
              <span style={{
                fontSize: 11,
                fontWeight: isToday ? 800 : 500,
                color: isToday ? 'var(--brand)' : count > 0 && intensity > 0.5 ? '#065f46' : count > 0 ? '#374151' : '#9ca3af',
                lineHeight: 1.2,
              }}>
                {dayNum}
              </span>
              {count > 0 && (
                <span style={{ fontSize: 8, fontWeight: 700, color: intensity > 0.5 ? '#065f46' : '#6b7280', lineHeight: 1 }}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: 3,
            background: v === 0 ? '#f3f4f6' : `hsl(142, 60%, ${75 - v * 30}%)`,
          }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>More</span>
      </div>

      <div style={{
        marginTop: 20,
        padding: '14px 16px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Month summary</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--done-color)' }}>{monthTotal}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>tasks done</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>{Object.keys(completionMap).length}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>active days</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{powerDays}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>power days (5+)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
