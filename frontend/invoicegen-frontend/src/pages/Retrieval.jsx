import { useState, useEffect, useRef } from 'react';
import logo from '../assets/MCInvoicing_White.png';

const STATUS_META = {
  Generated:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '📄' },
  InProgress: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: '🔄' },
  Sent:       { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '📨' },
  Paid:       { color: '#00e891', bg: 'rgba(0,232,145,0.12)',   icon: '✅' },
  Overdue:    { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '⚠️' },
  Deleted:    { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '🗑️' },
};

function TrackModal({ token, onClose }) {
  const [invoiceId, setInvoiceId] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef(null);

  const handleTrack = async () => {
    if (!invoiceId.trim()) { setError('Please enter an Invoice ID.'); return; }
    setLoading(true); setError(''); setStatus(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/v1/invoices/${invoiceId.trim()}/status`, { headers: { token } });
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
    <div ref={overlayRef} style={tm.overlay} onClick={e => e.target === overlayRef.current && onClose()}>
      <div style={tm.card}>
        <button style={tm.closeBtn} onClick={onClose}>✕</button>
        <div style={tm.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h2 style={tm.title}>Track Invoice</h2>
        <p style={tm.subtitle}>Enter your Invoice ID to check its current status.</p>
        <div style={tm.inputRow}>
          <input style={tm.input} placeholder="e.g. INV-00123" value={invoiceId}
            onChange={e => { setInvoiceId(e.target.value); setError(''); setStatus(null); }}
            onKeyDown={e => e.key === 'Enter' && handleTrack()} />
          <button style={{ ...tm.btn, opacity: loading ? 0.7 : 1 }} onClick={handleTrack} disabled={loading}>
            {loading ? '…' : 'Check'}
          </button>
        </div>
        {error && <div style={tm.error}>{error}</div>}
        {status && meta && (
          <div style={{ ...tm.statusCard, background: meta.bg, borderColor: `${meta.color}33` }}>
            <span style={{ fontSize: '1.8rem' }}>{meta.icon}</span>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: 4 }}>Current status</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: meta.color }}>{status}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginPromptModal({ onClose, onNavigate }) {
  const overlayRef = useRef(null);
  return (
    <div ref={overlayRef} style={tm.overlay} onClick={e => e.target === overlayRef.current && onClose()}>
      <div style={tm.card}>
        <button style={tm.closeBtn} onClick={onClose}>✕</button>
        <div style={tm.iconWrap}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style={tm.title}>Login required</h2>
        <p style={tm.subtitle}>You must be logged in to track an invoice.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button style={{ ...tm.btn, flex: 1 }} onClick={() => { onClose(); onNavigate('login'); }}>Login</button>
          <button style={{ ...tm.btn, flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            onClick={() => { onClose(); onNavigate('register'); }}>Register</button>
        </div>
      </div>
    </div>
  );
}

export default function Retrieval({ onNavigate, token }) {
  const [invoiceId, setInvoiceId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showXml, setShowXml] = useState(false);
  const [showTrack, setShowTrack] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    let rafId;
    let t = 0;

    function draw() {
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      const bands = [
        { y: H*0.55, amp: 120, freq: 0.004, speed: 0.000015, phase: 0,   color: [0,255,150],   alpha: 0.55, thickness: 100 },
        { y: H*0.65, amp: 90,  freq: 0.005, speed: 0.00002, phase: 2.1, color: [80,200,255],  alpha: 0.38, thickness: 60  },
        { y: H*0.50, amp: 75,  freq: 0.003, speed: 0.00001, phase: 4.3, color: [0,255,120],   alpha: 0.3,  thickness: 45  },
        { y: H*0.72, amp: 60,  freq: 0.006, speed: 0.000025, phase: 1.0, color: [140,100,255], alpha: 0.25, thickness: 40  },
        { y: H*0.48, amp: 50,  freq: 0.004, speed: 0.000013, phase: 3.5, color: [0,200,180],   alpha: 0.2,  thickness: 35  },
      ];

      for (const b of bands) {
        const pts = [];
        for (let x = -20; x <= W + 20; x += 4) {
          const y = b.y
            + Math.sin(x * b.freq + t * b.speed * 1000 + b.phase) * b.amp
            + Math.sin(x * b.freq * 1.7 + t * b.speed * 600 + b.phase + 1) * b.amp * 0.4;
          pts.push([x, y]);
        }
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        const [r, g, bl] = b.color;
        grad.addColorStop(0,    `rgba(${r},${g},${bl},0)`);
        grad.addColorStop(0.15, `rgba(${r},${g},${bl},${b.alpha})`);
        grad.addColorStop(0.5,  `rgba(${r},${g},${bl},${b.alpha * 1.3})`);
        grad.addColorStop(0.85, `rgba(${r},${g},${bl},${b.alpha})`);
        grad.addColorStop(1,    `rgba(${r},${g},${bl},0)`);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1] - b.thickness);
        for (const [x, y] of pts) ctx.lineTo(x, y - b.thickness);
        for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + b.thickness);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      t++;
      rafId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  async function handleRetrieve() {
    if (!invoiceId.trim()) { setError('Please enter an invoice ID.'); return; }
    if (!token) { setError('You must be logged in to retrieve an invoice.'); return; }

    setLoading(true); setError(''); setResult(null); setShowXml(false);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/v1/invoices/${invoiceId.trim()}`, {
        headers: { token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invoice not found.');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <canvas ref={canvasRef} style={styles.canvas} />

      <style>{`
        .nav-link:hover { color: rgba(255,255,255,0.9) !important; text-shadow: 0 0 12px rgba(255,255,255,0.3); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .page-fade { animation: fadeIn 0.5s ease forwards; }
        @keyframes modalIn { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      <nav style={styles.nav}>
        <img src={logo} alt="MC Invoicing" style={{ ...styles.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={styles.navLinks}>
          <span style={{ ...styles.navLink, ...styles.navLinkActive }}>Retrieve</span>
          <span className="nav-link" style={styles.navLink} onClick={() => token ? setShowTrack(true) : setShowTrack('login')}>Track</span>
          {token ? (
            <>
              <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('app')}>Create Invoice</span>
              <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('update')}>Update Invoice</span>
              <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('profile')}>Profile</span>
            </>
          ) : (
            <>
              <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('login')}>Login</span>
              <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('register')}>Register</span>
            </>
          )}
        </div>
      </nav>

      <div className="page-fade" style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Retrieve Invoice</h1>
          <p style={styles.subtitle}>
            {token ? 'Enter your invoice ID to look up its details.' : 'You need to be logged in to retrieve an invoice.'}
          </p>

          {!token ? (
            <button style={styles.button} onClick={() => onNavigate('login')}>Login to continue</button>
          ) : (
            <div style={styles.inputRow}>
              <input
                style={styles.input}
                type="text"
                placeholder="Invoice ID (e.g. 3f2a1b...)"
                value={invoiceId}
                onChange={e => setInvoiceId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRetrieve()}
              />
              <button
                style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
                onClick={handleRetrieve}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Retrieve'}
              </button>
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          {result && (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <span style={styles.resultLabel}>Invoice Found</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: result.status === 'Paid' ? 'rgba(0,255,150,0.12)' : 'rgba(255,180,0,0.12)',
                    color: result.status === 'Paid' ? '#00e891' : '#ffb400',
                    border: `1px solid ${result.status === 'Paid' ? 'rgba(0,255,150,0.3)' : 'rgba(255,180,0,0.3)'}`,
                  }}
                >
                  {result.status}
                </span>
              </div>

              <div style={styles.divider} />

              <div style={styles.fieldGrid}>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Invoice ID</span>
                  <span style={styles.fieldValue}>{result.invoiceId}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Status</span>
                  <span style={styles.fieldValue}>{result.status}</span>
                </div>
              </div>

              <div style={styles.field}>
                <button type="button" style={styles.xmlToggle} onClick={() => setShowXml(prev => !prev)}>
                  {showXml ? 'Hide XML Payload' : 'Show XML Payload'}
                </button>
                {showXml && <pre style={styles.xmlBox}>{result.xml}</pre>}
              </div>
            </div>
          )}
        </div>
      </div>

      {showTrack === true && <TrackModal token={token} onClose={() => setShowTrack(false)} />}
      {showTrack === 'login' && <LoginPromptModal onClose={() => setShowTrack(false)} onNavigate={onNavigate} />}
    </div>
  );
}

const tm = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    position: 'relative', background: 'linear-gradient(160deg, #0d1525 0%, #080f1e 100%)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '40px 36px 36px',
    width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'modalIn 0.3s ease',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 18, background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.3)', fontSize: '1rem', cursor: 'pointer',
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 14, background: 'rgba(79,70,229,0.15)',
    border: '1px solid rgba(79,70,229,0.3)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
  },
  title: { color: '#fff', fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px' },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 28px' },
  inputRow: { display: 'flex', gap: 10 },
  input: {
    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '11px 16px', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit',
  },
  btn: {
    background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px',
    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
  },
  error: {
    marginTop: 14, padding: '10px 14px', background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem',
  },
  statusCard: {
    marginTop: 20, padding: '16px 20px', border: '1px solid', borderRadius: 12,
    display: 'flex', alignItems: 'center', gap: 16,
  },
};

const styles = {
  page: {
    minHeight: '100vh', width: '100%', position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(180deg, #030810 0%, #060e18 35%, #040a14 100%)',
    display: 'flex', flexDirection: 'column',
  },
  canvas: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 0, filter: 'blur(32px) brightness(0.9)', opacity: 0.85,
  },
  nav: {
    position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '10px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxSizing: 'border-box',
  },
  logo: { height: 60 },
  navLinks: { display: 'flex', gap: 32, alignItems: 'center' },
  navLink: {
    color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', fontWeight: 500,
    cursor: 'pointer', userSelect: 'none', paddingBottom: 2, borderBottom: '2px solid transparent',
  },
  navLinkActive: { color: '#ffffff', borderBottom: '2px solid rgba(255,255,255,0.6)' },
  container: {
    position: 'relative', zIndex: 1, flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px',
  },
  card: {
    width: '100%', maxWidth: 560, background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '40px 36px',
  },
  title: { margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 600, color: '#ffffff' },
  subtitle: { margin: '0 0 28px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)' },
  inputRow: { display: 'flex', gap: 10 },
  input: {
    flex: 1, padding: '0.65rem 1rem', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
    color: '#ffffff', fontSize: '0.95rem', outline: 'none',
  },
  button: {
    padding: '0.65rem 1.4rem', borderRadius: 8, border: 'none', background: '#4f46e5',
    color: '#ffffff', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  errorBox: {
    marginTop: 16, padding: '12px 16px', borderRadius: 8,
    background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
    color: '#ff6b6b', fontSize: '0.9rem',
  },
  resultCard: {
    marginTop: 24, background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px',
  },
  resultHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  resultLabel: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  statusBadge: { padding: '4px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 500 },
  divider: { height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 },
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 },
  fieldLabel: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  fieldValue: { fontSize: '0.95rem', color: '#ffffff', wordBreak: 'break-all' },
  xmlToggle: {
    alignSelf: 'flex-start', padding: '0.55rem 1rem', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    color: '#ffffff', fontSize: '0.9rem', cursor: 'pointer',
  },
  xmlBox: {
    marginTop: 6, padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)',
    fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap',
    wordBreak: 'break-word', fontFamily: 'monospace', lineHeight: 1.6,
  },
};