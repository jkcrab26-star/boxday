import { useEffect, useState } from 'react';
import type { Task } from '../types';

interface MomentumBannerProps {
  task: Task | null;
  onStart: (id: string) => void;
  onDismiss: () => void;
}

export default function MomentumBanner({ task, onStart, onDismiss }: MomentumBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!task) { setVisible(false); return; }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null;

  function dismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s',
      opacity: visible ? 1 : 0,
      zIndex: 200,
      background: '#1f2937',
      color: '#fff',
      borderRadius: 14,
      padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      maxWidth: 380,
      width: 'calc(100vw - 48px)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 3 }}>NEXT UP</div>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#f9fafb',
        }}>
          {task.title}
        </div>
      </div>
      <button
        onClick={() => { onStart(task.id); dismiss(); }}
        style={{
          padding: '8px 14px',
          background: 'var(--brand)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Focus
      </button>
      <button
        onClick={dismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          fontSize: 18,
          padding: '2px 4px',
          flexShrink: 0,
          lineHeight: 1,
        }}
        title="Later"
      >
        ×
      </button>
    </div>
  );
}
