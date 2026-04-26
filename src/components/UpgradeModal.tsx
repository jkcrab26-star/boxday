const STRIPE_MONTHLY_LINK = import.meta.env.VITE_STRIPE_MONTHLY_LINK as string ?? '#upgrade';
const STRIPE_ANNUAL_LINK = import.meta.env.VITE_STRIPE_ANNUAL_LINK as string ?? '#upgrade';

const PRO_FEATURES = [
  { icon: '✦', text: 'AI brain-boxing — auto-fill your day from inbox' },
  { icon: '♾️', text: 'Unlimited tasks in every zone' },
  { icon: '🔥', text: 'Streak counter to build your momentum' },
  { icon: '🧠', text: 'Scope Lock — pre-flight focus criteria (coming soon)' },
];

interface UpgradeModalProps {
  onClose: () => void;
  onActivatePro: () => void;
}

export default function UpgradeModal({ onClose, onActivatePro }: UpgradeModalProps) {
  function handleMonthly() {
    // In production, link to real Stripe Payment Link
    // After payment, Stripe redirects back with ?upgraded=1
    window.open(STRIPE_MONTHLY_LINK, '_blank');
    // For dev/demo: immediately activate Pro
    onActivatePro();
  }

  function handleAnnual() {
    window.open(STRIPE_ANNUAL_LINK, '_blank');
    onActivatePro();
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 0 0',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px 36px',
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🧠</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 6 }}>
            Unlock BoxDay Pro
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            Box your day. Build your brain.
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PRO_FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{f.icon}</span>
              <span style={{ fontSize: 14, color: 'var(--text)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            onClick={handleAnnual}
            style={{
              flex: 1,
              padding: '14px 12px',
              background: 'var(--brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 2 }}>Best value</div>
            <div>$79 / year</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>~$6.60/mo · save 27%</div>
          </button>

          <button
            onClick={handleMonthly}
            style={{
              flex: 1,
              padding: '14px 12px',
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              color: 'var(--text)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Monthly</div>
            <div>$9 / month</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>7-day free trial</div>
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
