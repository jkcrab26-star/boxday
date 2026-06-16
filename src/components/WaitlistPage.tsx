import { useState } from 'react';

const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID as string | undefined;

const SITE_URL = 'https://jkcrab26-star.github.io/boxday/';

const UTM = {
  tiktok:    `${SITE_URL}?utm_source=tiktok&utm_medium=social&utm_campaign=waitlist`,
  instagram: `${SITE_URL}?utm_source=instagram&utm_medium=social&utm_campaign=waitlist`,
  youtube:   `${SITE_URL}?utm_source=youtube&utm_medium=social&utm_campaign=waitlist`,
  x:         `${SITE_URL}?utm_source=x&utm_medium=social&utm_campaign=waitlist`,
};

const SOCIAL = {
  tiktok:    'https://www.tiktok.com/@boxdayapp',
  instagram: 'https://www.instagram.com/boxdayapp',
  youtube:   'https://www.youtube.com/@boxdayapp',
  x:         'https://x.com/boxdayapp',
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function WaitlistPage() {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!FORMSPREE_ID) {
      if (import.meta.env.DEV) {
        console.warn('VITE_FORMSPREE_ID not set — add it to .env.local to test real submissions');
        setStatus('success');
      } else {
        setStatus('error');
      }
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email }),
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '72px 24px 64px',
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
          fontSize: 'clamp(30px, 6vw, 54px)',
          fontWeight: 800,
          lineHeight: 1.1,
          color: 'var(--text)',
          margin: '0 0 20px',
          maxWidth: 680,
          letterSpacing: '-1.5px',
        }}>
          Your brain isn't broken.{' '}
          <span style={{ color: 'var(--brand)' }}>It just needs the right trigger.</span>
        </h1>

        <p style={{
          fontSize: 18,
          color: 'var(--muted)',
          maxWidth: 520,
          lineHeight: 1.65,
          margin: '0 0 44px',
        }}>
          BoxDay uses AI to sort your tasks into morning, afternoon, and evening boxes.
          No rigid schedules. No willpower required. Built for how ADHD brains actually work.
        </p>

        {/* Waitlist form / success state */}
        {status === 'success' ? (
          <ThankYou />
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
            maxWidth: 440,
            alignItems: 'stretch',
          }}>
            <input
              type="text"
              required
              placeholder="Your first name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={status === 'submitting'}
              style={inputStyle}
            />
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={status === 'submitting'}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              style={{
                padding: '14px 24px',
                fontSize: 15,
                fontWeight: 700,
                background: status === 'submitting' ? 'var(--brand-dark)' : 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: status === 'submitting' ? 'default' : 'pointer',
                boxShadow: '0 2px 8px rgba(91,110,245,0.35)',
              }}
            >
              {status === 'submitting' ? 'Joining…' : 'Join the Waitlist'}
            </button>
            {status === 'error' && (
              <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 14, margin: 0 }}>
                Something went wrong — try again or email us directly.
              </p>
            )}
          </form>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: '#9ca3af' }}>
          No spam. No credit card. Just early access.
        </p>
      </section>

      {/* Product Demo */}
      <section style={{
        background: '#f1f5ff',
        padding: '64px 24px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          See it in action
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 36px', textAlign: 'center' }}>
          Try the real app — no sign-up needed.
        </p>
        <div style={{
          width: '100%',
          maxWidth: 390,
          borderRadius: 32,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          border: '8px solid #1a1a2e',
          background: '#1a1a2e',
          aspectRatio: '9/19',
          position: 'relative',
        }}>
          <iframe
            src="?app=1"
            title="BoxDay app preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
          />
        </div>
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
        padding: '32px 24px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {([
            { label: 'TikTok',   href: SOCIAL.tiktok,    icon: TikTokIcon },
            { label: 'Instagram',href: SOCIAL.instagram, icon: InstagramIcon },
            { label: 'YouTube',  href: SOCIAL.youtube,   icon: YouTubeIcon },
            { label: 'X',        href: SOCIAL.x,         icon: XIcon },
          ] as const).map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--muted)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Icon />
              {label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
          BoxDay — built for the ADHD brain.
        </p>
      </footer>
    </div>
  );
}

/* ── Thank-you state with UTM share links ── */
function ThankYou() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(platform: keyof typeof UTM) {
    navigator.clipboard.writeText(UTM[platform]).then(() => {
      setCopied(platform);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div style={{
      background: '#ecfdf5',
      border: '1px solid #6ee7b7',
      borderRadius: 'var(--radius)',
      padding: '24px 28px',
      maxWidth: 480,
      width: '100%',
      textAlign: 'left',
    }}>
      <p style={{ fontSize: 17, fontWeight: 700, color: '#065f46', margin: '0 0 6px' }}>
        You're on the list!
      </p>
      <p style={{ fontSize: 14, color: '#047857', margin: '0 0 20px' }}>
        We'll let you know the moment BoxDay is ready. Know someone who'd love it? Share your link:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {([
          { platform: 'tiktok',    label: 'TikTok' },
          { platform: 'instagram', label: 'Instagram' },
          { platform: 'youtube',   label: 'YouTube Shorts' },
          { platform: 'x',         label: 'X / Twitter' },
        ] as const).map(({ platform, label }) => (
          <button
            key={platform}
            onClick={() => copy(platform)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: copied === platform ? '#d1fae5' : '#fff',
              border: '1px solid #6ee7b7',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: '#065f46',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <span>{label}</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {copied === platform ? 'Copied!' : 'Copy link'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Feature cards ── */
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

/* ── Shared input style ── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 18px',
  fontSize: 15,
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
  boxShadow: 'var(--shadow)',
  boxSizing: 'border-box',
};

/* ── SVG icons ── */
function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}
function YouTubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
