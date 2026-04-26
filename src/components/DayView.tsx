import { useState } from 'react';
import type { Task, BoxSlot, DailyReflection } from '../types';
import { todayISO } from '../utils/storage';

const ZONES: { slot: BoxSlot; label: string; time: string; emoji: string; bgVar: string; accentVar: string }[] = [
  { slot: 'AM',      label: 'Morning',   time: '6am – 12pm', emoji: '☀️',  bgVar: '--am-bg',  accentVar: '--am-accent' },
  { slot: 'PM',      label: 'Afternoon', time: '12pm – 6pm', emoji: '🌤️', bgVar: '--pm-bg',  accentVar: '--pm-accent' },
  { slot: 'Evening', label: 'Evening',   time: '6pm – 10pm', emoji: '🌙', bgVar: '--eve-bg', accentVar: '--eve-accent' },
];

const ESTIMATE_LABELS: Record<number, string> = { 15: '15m', 30: '30m', 60: '1h', 90: '90m' };
const ESTIMATES = [15, 30, 60, 90];

interface DayViewProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onMoveTask: (id: string, box: BoxSlot) => void;
  onSetEstimate: (id: string, minutes: number) => void;
  onStartReflect: () => void;
  todayReflection: DailyReflection | undefined;
  isPro: boolean;
  onUpgradeClick: () => void;
}

function TaskCard({
  task, onComplete, onMoveTask, onSetEstimate
}: {
  task: Task;
  onComplete: (id: string) => void;
  onMoveTask: (id: string, box: BoxSlot) => void;
  onSetEstimate: (id: string, minutes: number) => void;
}) {
  const [showMove, setShowMove] = useState(false);

  function cycleEstimate() {
    const cur = task.estimatedMinutes;
    const idx = cur ? ESTIMATES.indexOf(cur) : -1;
    const next = ESTIMATES[(idx + 1) % ESTIMATES.length];
    onSetEstimate(task.id, next);
  }

  const isDone = task.status === 'done';

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        opacity: isDone ? 0.5 : 1,
        transition: 'opacity 0.2s',
        cursor: isDone ? 'default' : 'grab',
        border: '1px solid #f0f0f5',
      }}
    >
      {/* Complete button */}
      <button
        onClick={() => !isDone && onComplete(task.id)}
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: isDone ? 'none' : '2px solid #d1d5db',
          background: isDone ? 'var(--done-color)' : 'transparent',
          cursor: isDone ? 'default' : 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          padding: 0,
        }}
        title={isDone ? 'Done' : 'Mark complete'}
      >
        {isDone ? '✓' : ''}
      </button>

      {/* Title */}
      <span style={{
        flex: 1,
        fontSize: 14,
        color: isDone ? 'var(--muted)' : 'var(--text)',
        textDecoration: isDone ? 'line-through' : 'none',
        lineHeight: 1.4,
      }}>
        {task.title}
      </span>

      {/* Actions (hidden when done) */}
      {!isDone && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={cycleEstimate}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: task.estimatedMinutes ? 'var(--brand)' : '#9ca3af',
              background: task.estimatedMinutes ? 'var(--brand-light)' : '#f3f4f6',
              border: 'none',
              borderRadius: 5,
              padding: '2px 6px',
              cursor: 'pointer',
              minWidth: 30,
            }}
          >
            {task.estimatedMinutes ? ESTIMATE_LABELS[task.estimatedMinutes] : '?'}
          </button>

          <button
            onClick={() => setShowMove(!showMove)}
            style={{
              fontSize: 11,
              color: '#9ca3af',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
            }}
            title="Move to different zone"
          >
            ↕
          </button>
        </div>
      )}

      {/* Move popover */}
      {showMove && (
        <div style={{
          position: 'absolute',
          right: 8,
          top: '100%',
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          zIndex: 50,
          display: 'flex',
          gap: 4,
        }}>
          {(['inbox', 'AM', 'PM', 'Evening'] as BoxSlot[]).filter(s => s !== task.box).map(s => (
            <button
              key={s}
              onClick={() => { onMoveTask(task.id, s); setShowMove(false); }}
              style={{
                padding: '4px 10px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: '#fff',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {s === 'inbox' ? 'Inbox' : s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoneCard({
  zone, tasks, onComplete, onMoveTask, onSetEstimate
}: {
  zone: typeof ZONES[0];
  tasks: Task[];
  onComplete: (id: string) => void;
  onMoveTask: (id: string, box: BoxSlot) => void;
  onSetEstimate: (id: string, minutes: number) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const open = tasks.filter(t => t.status === 'open');
  const done = tasks.filter(t => t.status === 'done');
  const totalMins = open.reduce((sum, t) => sum + (t.estimatedMinutes ?? 30), 0);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const id = e.dataTransfer.getData('taskId');
    if (id) onMoveTask(id, zone.slot);
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      style={{
        background: `var(${zone.bgVar})`,
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        marginBottom: 12,
        border: isDragOver ? `2px solid var(${zone.accentVar})` : '2px solid transparent',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Zone header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>{zone.emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
            {zone.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {zone.time}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {open.length > 0 && (
            <span style={{ fontSize: 11, color: `var(${zone.accentVar})`, fontWeight: 600 }}>
              {Math.floor(totalMins / 60) > 0 ? `${Math.floor(totalMins / 60)}h ` : ''}
              {totalMins % 60 > 0 ? `${totalMins % 60}m` : ''}
            </span>
          )}
          <span style={{
            fontSize: 11,
            color: 'var(--muted)',
            background: 'rgba(0,0,0,0.06)',
            borderRadius: 6,
            padding: '2px 7px',
          }}>
            {open.length} open{done.length > 0 ? ` · ${done.length} done` : ''}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
        {tasks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '20px 0',
            fontSize: 13,
            color: '#9ca3af',
          }}>
            Drop tasks here or drag from another zone
          </div>
        )}
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={onComplete}
            onMoveTask={onMoveTask}
            onSetEstimate={onSetEstimate}
          />
        ))}
      </div>
    </div>
  );
}

export default function DayView({
  tasks, onComplete, onMoveTask, onSetEstimate, onStartReflect, todayReflection,
}: DayViewProps) {
  const today = todayISO();
  const formatted = new Date(today + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  const inboxTasks = tasks.filter(t => t.box === 'inbox' && t.status === 'open');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div>
      {/* Date header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{formatted}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {doneTasks.length} done · {inboxTasks.length} in inbox
          </div>
        </div>
        {!todayReflection && (
          <button
            onClick={onStartReflect}
            style={{
              padding: '8px 14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            Wrap up day
          </button>
        )}
        {todayReflection && (
          <div style={{ fontSize: 12, color: 'var(--done-color)', fontWeight: 600 }}>
            ✓ Day reflected
          </div>
        )}
      </div>

      {/* Zone cards */}
      {ZONES.map(zone => (
        <ZoneCard
          key={zone.slot}
          zone={zone}
          tasks={tasks.filter(t => t.box === zone.slot)}
          onComplete={onComplete}
          onMoveTask={onMoveTask}
          onSetEstimate={onSetEstimate}
        />
      ))}

      {/* Inbox overflow */}
      {inboxTasks.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px 16px',
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
            Still in inbox ({inboxTasks.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {inboxTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onMoveTask={onMoveTask}
                onSetEstimate={onSetEstimate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: 'var(--muted)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No tasks boxed yet</div>
          <div style={{ fontSize: 13 }}>
            Go to <strong>Dump</strong> to capture tasks,<br />
            then use AI boxing to fill your day.
          </div>
        </div>
      )}
    </div>
  );
}
