import { useState } from 'react';
import type { DailyReflection } from '../types';

const QUESTIONS = [
  { key: 'q1' as const, label: "What's one win from today?", placeholder: "Even a tiny one counts..." },
  { key: 'q2' as const, label: "What got in the way?", placeholder: "No judgment — just notice it..." },
  { key: 'q3' as const, label: "What's one thing to tackle first tomorrow?", placeholder: "One thing — not ten..." },
];

interface ReflectionPromptProps {
  onSubmit: (q1: string, q2: string, q3: string) => void;
  onSkip: () => void;
  existing: DailyReflection | undefined;
}

export default function ReflectionPrompt({ onSubmit, onSkip, existing }: ReflectionPromptProps) {
  const [answers, setAnswers] = useState({
    q1: existing?.q1 ?? '',
    q2: existing?.q2 ?? '',
    q3: existing?.q3 ?? '',
  });

  function handleSubmit() {
    onSubmit(answers.q1, answers.q2, answers.q3);
  }

  const hasAny = answers.q1.trim() || answers.q2.trim() || answers.q3.trim();

  return (
    <div>
      <div style={{
        textAlign: 'center',
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>✨</div>
        <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 6 }}>
          Wrapping up your day
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>
          Three quick questions — no wrong answers.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {QUESTIONS.map((q, i) => (
          <div
            key={q.key}
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <label style={{
              display: 'block',
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--text)',
              marginBottom: 10,
            }}>
              <span style={{
                display: 'inline-block',
                width: 22,
                height: 22,
                background: 'var(--brand)',
                color: '#fff',
                borderRadius: '50%',
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: '22px',
                marginRight: 8,
              }}>
                {i + 1}
              </span>
              {q.label}
            </label>
            <textarea
              value={answers[q.key]}
              onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
              placeholder={q.placeholder}
              rows={2}
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'none',
                color: 'var(--text)',
                background: '#fafafa',
                outline: 'none',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button
          onClick={onSkip}
          style={{
            flex: '0 0 auto',
            padding: '12px 20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={!hasAny}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: hasAny ? 'var(--brand)' : '#e5e7eb',
            color: hasAny ? '#fff' : 'var(--muted)',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            cursor: hasAny ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          Done ✓
        </button>
      </div>
    </div>
  );
}
