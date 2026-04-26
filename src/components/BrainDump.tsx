import { useState, useRef, useEffect } from 'react';
import type { Task, BoxSlot } from '../types';

const ESTIMATES = [15, 30, 60, 90];
const ESTIMATE_LABELS: Record<number, string> = { 15: '15m', 30: '30m', 60: '1h', 90: '90m' };

interface BrainDumpProps {
  tasks: Task[];
  allTasks: Task[];
  onAdd: (title: string) => void;
  onDelete: (id: string) => void;
  onSetEstimate: (id: string, minutes: number) => void;
  onBoxAll: () => void;
  onMoveTask: (id: string, box: BoxSlot) => void;
  isBoxing: boolean;
  isPro: boolean;
  onUpgradeClick: () => void;
  onSwitchToDay: () => void;
}

export default function BrainDump({
  tasks, allTasks, onAdd, onDelete, onSetEstimate, onBoxAll, onMoveTask,
  isBoxing, isPro, onUpgradeClick, onSwitchToDay,
}: BrainDumpProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const val = input.trim();
      if (val) {
        onAdd(val);
        setInput('');
      }
    }
  }

  function cycleEstimate(task: Task) {
    const cur = task.estimatedMinutes;
    const idx = cur ? ESTIMATES.indexOf(cur) : -1;
    const next = ESTIMATES[(idx + 1) % ESTIMATES.length];
    onSetEstimate(task.id, next);
  }

  function handleBoxAll() {
    if (!isPro) {
      onUpgradeClick();
      return;
    }
    onBoxAll();
  }

  const todayBoxed = allTasks.filter(t => t.box !== 'inbox').length;

  return (
    <div>
      {/* Hero input */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: '20px',
        marginBottom: 16,
      }}>
        <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
          What's on your mind?
        </div>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a task and press Enter to add it..."
          rows={3}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: 16,
            fontFamily: 'inherit',
            color: 'var(--text)',
            background: 'transparent',
            lineHeight: 1.5,
          }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
          Press Enter to add · Shift+Enter for new line
        </div>
      </div>

      {/* AI Box All */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleBoxAll}
            disabled={isBoxing}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: isPro ? 'var(--brand)' : '#e5e7eb',
              color: isPro ? '#fff' : 'var(--muted)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isBoxing ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {isBoxing ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                Boxing your day...
              </>
            ) : (
              <>
                {isPro ? '✦' : '🔒'} Box everything with AI
                {!isPro && <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>— Pro</span>}
              </>
            )}
          </button>
          {todayBoxed > 0 && (
            <button
              onClick={onSwitchToDay}
              style={{
                padding: '12px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Today →
            </button>
          )}
        </div>
      )}

      {/* Task list */}
      {tasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: 'var(--muted)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Brain dump is empty</div>
          <div style={{ fontSize: 13 }}>
            Start typing to capture what's on your mind.<br />
            No judgment — just get it out.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map(task => (
          <div
            key={task.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            {/* Drag handle (visual only for now) */}
            <div style={{ color: '#d1d5db', paddingTop: 2, cursor: 'grab', userSelect: 'none', fontSize: 14 }}>
              ⠿
            </div>

            {/* Task title */}
            <div style={{ flex: 1, fontSize: 14, lineHeight: 1.4, color: 'var(--text)' }}>
              {task.title}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              {/* Time estimate badge */}
              <button
                onClick={() => cycleEstimate(task)}
                title="Tap to change estimate"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: task.estimatedMinutes ? 'var(--brand)' : '#9ca3af',
                  background: task.estimatedMinutes ? 'var(--brand-light)' : '#f3f4f6',
                  border: 'none',
                  borderRadius: 6,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  minWidth: 36,
                }}
              >
                {task.estimatedMinutes ? ESTIMATE_LABELS[task.estimatedMinutes] : '?'}
              </button>

              {/* Manual assign to zone */}
              <select
                value=""
                onChange={e => { if (e.target.value) onMoveTask(task.id, e.target.value as BoxSlot); }}
                style={{
                  fontSize: 12,
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '3px 6px',
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <option value="">Box →</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
                <option value="Evening">Evening</option>
              </select>

              {/* Delete */}
              <button
                onClick={() => onDelete(task.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                  padding: '2px 4px',
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {tasks.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          {tasks.length} item{tasks.length !== 1 ? 's' : ''} in inbox
        </div>
      )}
    </div>
  );
}
