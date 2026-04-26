import { useState, useEffect, useRef } from 'react';
import type { Task } from '../types';

interface FocusModeProps {
  task: Task;
  onDone: (id: string) => void;
  onSnooze: (id: string) => void;
  onExit: () => void;
}

function getAmbientClass(elapsed: number, total: number): string {
  const pct = total > 0 ? elapsed / total : 0;
  if (pct < 0.5) return 'ambient-calm';
  if (pct < 0.85) return 'ambient-warm';
  return 'ambient-urgent';
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function FocusMode({ task, onDone, onSnooze, onExit }: FocusModeProps) {
  const totalSeconds = (task.estimatedMinutes ?? 30) * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev >= totalSeconds) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          return totalSeconds;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running, totalSeconds]);

  const remaining = Math.max(0, totalSeconds - elapsed);
  const ambientClass = getAmbientClass(elapsed, totalSeconds);
  const isOvertime = elapsed >= totalSeconds;

  return (
    <div
      className={ambientClass}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      {/* Exit */}
      <button
        onClick={onExit}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(255,255,255,0.35)',
          border: 'none',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          color: '#374151',
        }}
      >
        ← Back
      </button>

      {/* Task title */}
      <div style={{
        fontSize: 22,
        fontWeight: 700,
        textAlign: 'center',
        color: '#1f2937',
        maxWidth: 400,
        lineHeight: 1.3,
        marginBottom: 32,
        background: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
        padding: '14px 20px',
      }}>
        {task.title}
      </div>

      {/* Timer */}
      <div style={{
        fontSize: isOvertime ? 48 : 64,
        fontWeight: 800,
        color: isOvertime ? '#dc2626' : '#111827',
        letterSpacing: '-2px',
        marginBottom: 8,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {isOvertime ? `+${formatCountdown(elapsed - totalSeconds)}` : formatCountdown(remaining)}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 40 }}>
        {isOvertime ? 'overtime' : `of ${task.estimatedMinutes ?? 30} min`}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360 }}>
        <button
          onClick={() => onSnooze(task.id)}
          style={{
            flex: 1,
            padding: '14px 0',
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.6)',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            color: '#374151',
          }}
        >
          → Snooze 15 min
        </button>
        <button
          onClick={() => onDone(task.id)}
          style={{
            flex: 1,
            padding: '14px 0',
            background: '#10b981',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
          }}
        >
          ✓ Done
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'rgba(0,0,0,0.1)',
      }}>
        <div style={{
          height: '100%',
          background: isOvertime ? '#dc2626' : '#10b981',
          width: `${Math.min(100, (elapsed / totalSeconds) * 100)}%`,
          transition: 'width 1s linear',
        }} />
      </div>
    </div>
  );
}
