import { useState } from 'react';

const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID as string | undefined;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!FORMSPREE_ID) {
      // Dev fallback: just show success
      setStatus('success');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand)', letterSpacing: '-0.5px' }}>
          BoxDay
        </span>
        <span style={{
          marginLeft: 8,
          fontSize: 11,
          fontWeight: 600,
          background: 'var(--brand)',
          color: '#fff',
          borderRadius: 4,
          padding: '2px 7px',
          letterSpacing: '0.5px',
        }}>
          COMING SOON
        </span>
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '72px 24px 56px',
        textAlign: 'center',
        background: 'linear-gradient(160deg, #fff 0%, var(--brand-light) 100%)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--brand-light)',
          border: '1px solid #c7d2fe',
          borderRadius: 999,
          padding: '5px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--brand)',
          marginBottom: 28,
        }}>
          <span>✦</span> ADHD-native time-boxing
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 800,
          lineHeight: 1.1,
          color: 'var(--text)',
          margin: '0 0 20px',
          maxWidth: 680,
          letterSpacing: '-1.5px',
        }}>
          Brain dump to a <span style={{ color: 'var(--brand)' }}>structured day</span> — in seconds.
        </h1>

        <p style={{
          fontSize: 18,
          color: 'var(--muted)',
          maxWidth: 520,
          lineHeight: 1.65,
          margin: '0 0 44px',
        }}>
          BoxDay uses AI to sort your tasks into morning, afternoon, and evening boxes. No rigid schedules. No willpower required. Built for how ADHD brains actually work.
        </p>

        {/* Waitlist form */}
        {status === 'success' ? (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #6ee7b7',
            borderRadius: 'var(--radius)',
            padding: '16px 28px',
            fontSize: 16,
            color: '#065f46',
            fontWeight: 600,
            maxWidth: 400,
          }}>
            You're on the list. We'll let you know the moment BoxDay is ready.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            gap: 10,
            width: '100%',
            maxWidth: 440,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={status === 'submitting'}
              style={{
                flex: 1,
                minWidth: 220,
                padding: '13px 18px',
                fontSize: 15,
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                color: 'var(--text)',
                outline: 'none',
                boxShadow: 'var(--shadow)',
              }}
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              style={{
                padding: '13px 24px',
                fontSize: 15,
                fontWeight: 700,
                background: status === 'submitting' ? 'var(--brand-dark)' : 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: status === 'submitting' ? 'default' : 'pointer',
                boxShadow: '0 2px 8px rgba(91,110,245,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              {status === 'submitting' ? 'Joining…' : 'Join the waitlist'}
            </button>
            {status === 'error' && (
              <p style={{ width: '100%', textAlign: 'center', color: '#dc2626', fontSize: 14, margin: 0 }}>
                Something went wrong — try again or email us directly.
              </p>
            )}
          </form>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: '#9ca3af' }}>
          No spam. No credit card. Just early access.
        </p>
      </section>

      {/* Features */}
      <section style={{
        background: 'var(--surface)',
        padding: '64px 24px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 48,
            letterSpacing: '-0.5px',
          }}>
            How BoxDay works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}>
            {features.map(f => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '28px 24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        fontSize: 13,
        color: 'var(--muted)',
        background: 'var(--bg)',
      }}>
        BoxDay — built for the ADHD brain.
      </footer>
    </div>
  );
}

const features = [
  {
    emoji: '🧠',
    title: 'Brain dump freely',
    body: "Write everything in your head without structure. BoxDay's AI reads the chaos and sorts it for you.",
    accent: 'var(--am-accent)',
    bg: 'var(--am-bg)',
  },
  {
    emoji: '📦',
    title: 'Auto-boxed into your day',
    body: 'Tasks land in AM, PM, or Evening boxes based on effort and urgency — not an arbitrary time grid.',
    accent: 'var(--pm-accent)',
    bg: 'var(--pm-bg)',
  },
  {
    emoji: '🎯',
    title: 'Focus Mode, one task at a time',
    body: "Locks you into a single task with a gentle ambient timer. Calm turns to warm when time's up — never shame.",
    accent: 'var(--eve-accent)',
    bg: 'var(--eve-bg)',
  },
];

function FeatureCard({ emoji, title, body, accent, bg }: typeof features[0]) {
  return (
    <div style={{
      background: bg,
      borderRadius: 'var(--radius)',
      padding: '28px 24px',
      border: `1px solid ${accent}22`,
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{emoji}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px', letterSpacing: '-0.3px' }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}
