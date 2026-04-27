import { useState, useRef } from 'react';

const STATUS_META = {
  Generated:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '📄' },
  InProgress: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: '🔄' },
  Sent:       { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '📨' },
  Paid:       { color: '#00e891', bg: 'rgba(0,232,145,0.12)',   icon: '✅' },
  Overdue:    { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '⚠️' },
  Deleted:    { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '🗑️' },
};

export function TrackModal({ token, onClose }) {
  const [invoiceId, setInvoiceId] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef(null);

  const handleTrack = async () => {
    if (!invoiceId.trim()) { setError('Please enter an Invoice ID.'); return; }
    setLoading(true); setError(''); setStatus(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/v1/invoices/${invoiceId.trim()}/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setStatus(data.status ?? data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const meta = status ? STATUS_META[status] ?? { color: '#fff', bg: 'rgba(255,255,255,0.08)', icon: '❓' } : null;

  return (
    <div ref={overlayRef} style={s.overlay} onClick={e => e.target === overlayRef.current && onClose()}>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes statusPop { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
        .track-input:focus { outline:none; border-color:rgba(79,70,229,0.7)!important; box-shadow:0 0 0 3px rgba(79,70,229,0.18); }
        .track-btn:hover:not(:disabled) { background:#4338ca!important; }
        .track-close:hover { color:rgba(255,255,255,0.8)!important; }
      `}</style>
      <div style={s.card}>
        <button className="track-close" style={s.closeBtn} onClick={onClose}>✕</button>
        <div style={s.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h2 style={s.title}>Track Invoice</h2>
        <p style={s.subtitle}>Enter your Invoice ID to check its current status.</p>
        <div style={s.inputRow}>
          <input
            className="track-input"
            style={s.input}
            placeholder="e.g. INV-00123"
            value={invoiceId}
            onChange={e => { setInvoiceId(e.target.value); setError(''); setStatus(null); }}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
          />
          <button className="track-btn" style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleTrack} disabled={loading}>
            {loading ? '…' : 'Check'}
          </button>
        </div>
        {error && <div style={s.error}>{error}</div>}
        {status && meta && (
          <div style={{ ...s.statusCard, background: meta.bg, borderColor: `${meta.color}33`, animation: 'statusPop 0.35s ease' }}>
            <span style={s.statusIcon}>{meta.icon}</span>
            <div>
              <div style={s.statusLabel}>Current status</div>
              <div style={{ ...s.statusValue, color: meta.color }}>{status}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginPromptModal({ onClose, onNavigate }) {
  const overlayRef = useRef(null);
  return (
    <div ref={overlayRef} style={s.overlay} onClick={e => e.target === overlayRef.current && onClose()}>
      <div style={s.card}>
        <button className="track-close" style={s.closeBtn} onClick={onClose}>✕</button>
        <div style={s.iconWrap}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style={s.title}>Login required</h2>
        <p style={s.subtitle}>You must be logged in to track an invoice.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button style={{ ...s.btn, flex: 1 }} onClick={() => { onClose(); onNavigate('login'); }}>Login</button>
          <button style={{ ...s.btn, flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            onClick={() => { onClose(); onNavigate('register'); }}>Register</button>
        </div>
      </div>
    </div>
  );
}

// Hook to use in any page
export function useTrack() {
  const [showTrack, setShowTrack] = useState(false);
  const openTrack = (token) => setShowTrack(token ? true : 'login');
  const closeTrack = () => setShowTrack(false);
  return { showTrack, openTrack, closeTrack };
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    position: 'relative',
    background: 'linear-gradient(160deg, #0d1525 0%, #080f1e 100%)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20, padding: '40px 36px 36px',
    width: '100%', maxWidth: 420,
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    animation: 'modalIn 0.3s ease',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 18,
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
    fontSize: '1rem', cursor: 'pointer', transition: 'color 0.2s ease', lineHeight: 1,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 14,
    background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { color: '#fff', fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 28px' },
  inputRow: { display: 'flex', gap: 10 },
  input: {
    flex: 1, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '11px 16px',
    color: '#fff', fontSize: '0.95rem',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease', fontFamily: 'inherit',
  },
  btn: {
    background: '#4f46e5', color: '#fff', border: 'none',
    borderRadius: 10, padding: '11px 20px',
    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
    transition: 'background 0.2s ease', whiteSpace: 'nowrap', fontFamily: 'inherit',
  },
  error: {
    marginTop: 14, padding: '10px 14px',
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: 8, color: '#f87171', fontSize: '0.85rem',
  },
  statusCard: {
    marginTop: 20, padding: '16px 20px', border: '1px solid',
    borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16,
  },
  statusIcon: { fontSize: '1.8rem', lineHeight: 1 },
  statusLabel: { color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: 4 },
  statusValue: { fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.01em' },
};