import type { Task, DailyReflection } from '../types';
import { todayISO } from '../utils/storage';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDays(today: string): string[] {
  const d = new Date(today + 'T12:00:00');
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

function completionsOn(tasks: Task[], date: string): number {
  return tasks.filter(t => t.completedAt?.startsWith(date)).length;
}

interface WeekViewProps {
  tasks: Task[];
  reflections: DailyReflection[];
  isPro: boolean;
  onUpgradeClick: () => void;
  onGoToDay: () => void;
}

export default function WeekView({ tasks, reflections, isPro, onUpgradeClick, onGoToDay }: WeekViewProps) {
  if (!isPro) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Week view is Pro</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          See your full week at a glance and track momentum across days.
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

  const today = todayISO();
  const days = getWeekDays(today);
  const reflectedDates = new Set(reflections.map(r => r.date));
  const weekDone = days.reduce((sum, d) => sum + completionsOn(tasks, d), 0);
  const activeDays = days.filter(d => completionsOn(tasks, d) > 0).length;

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>This Week</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            {weekDone} tasks done · {activeDays} active days
          </div>
        </div>
        <button
          onClick={onGoToDay}
          style={{
            padding: '7px 14px',
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Today →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((day, i) => {
          const isToday = day === today;
          const isPast = day < today;
          const done = completionsOn(tasks, day);
          const hasReflection = reflectedDates.has(day);
          const dateNum = new Date(day + 'T12:00:00').getDate();

          const amCount = isToday ? tasks.filter(t => t.box === 'AM' && t.status === 'open').length : 0;
          const pmCount = isToday ? tasks.filter(t => t.box === 'PM' && t.status === 'open').length : 0;
          const eveCount = isToday ? tasks.filter(t => t.box === 'Evening' && t.status === 'open').length : 0;

          return (
            <div
              key={day}
              onClick={isToday ? onGoToDay : undefined}
              style={{
                borderRadius: 10,
                padding: '10px 4px 8px',
                background: isToday ? 'var(--brand-light)' : 'var(--surface)',
                border: isToday ? '2px solid var(--brand)' : '1px solid var(--border)',
                textAlign: 'center',
                cursor: isToday ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: 10, color: isToday ? 'var(--brand)' : 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                {DAY_LABELS[i]}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: isToday ? 'var(--brand)' : 'var(--text)', marginBottom: 8 }}>
                {dateNum}
              </div>

              {isToday && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[{ e: '☀️', c: amCount }, { e: '🌤️', c: pmCount }, { e: '🌙', c: eveCount }].map(({ e, c }) => (
                    <div key={e} style={{ fontSize: 10, color: c > 0 ? 'var(--text)' : '#d1d5db', display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <span>{e}</span><span style={{ fontWeight: 600 }}>{c}</span>
                    </div>
                  ))}
                  {done > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--done-color)', fontWeight: 700, marginTop: 2 }}>✓{done}</div>
                  )}
                </div>
              )}

              {isPast && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: done > 0 ? `hsl(142, 60%, ${70 - Math.min(done, 8) * 5}%)` : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: done >= 3 ? '#065f46' : '#9ca3af',
                  }}>
                    {done > 0 ? done : '·'}
                  </div>
                  {hasReflection && <div style={{ fontSize: 9, color: 'var(--done-color)' }}>📝</div>}
                </div>
              )}

              {!isToday && !isPast && (
                <div style={{ fontSize: 16, color: '#e5e7eb', lineHeight: 1 }}>—</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 20,
        padding: '14px 16px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Week recap</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--done-color)' }}>{weekDone}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>done</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>{activeDays}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>active days</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#8b5cf6' }}>
              {reflections.filter(r => days.includes(r.date)).length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>reflections</div>
          </div>
        </div>
      </div>
    </div>
  );
}
