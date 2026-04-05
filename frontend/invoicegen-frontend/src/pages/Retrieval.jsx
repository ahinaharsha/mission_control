import { useState, useEffect, useRef } from 'react';
import logo from '../assets/MCInvoicing_White.png';
import { logout } from '../api/client';

export default function Retrieval({ onNavigate, token, onLogout }) {
  const [invoiceId, setInvoiceId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;
    const bands = [
      { y: H*0.55, amp: 120, freq: 0.004, speed: 0.00003, phase: 0,   color: [0,255,150],   alpha: 0.55, thickness: 100 },
      { y: H*0.65, amp: 90,  freq: 0.005, speed: 0.00004, phase: 2.1, color: [80,200,255],  alpha: 0.38, thickness: 60  },
      { y: H*0.50, amp: 75,  freq: 0.003, speed: 0.00002, phase: 4.3, color: [0,255,120],   alpha: 0.3,  thickness: 45  },
      { y: H*0.72, amp: 60,  freq: 0.006, speed: 0.00005, phase: 1.0, color: [140,100,255], alpha: 0.25, thickness: 40  },
      { y: H*0.48, amp: 50,  freq: 0.004, speed: 0.00003, phase: 3.5, color: [0,200,180],   alpha: 0.2,  thickness: 35  },
    ];
    let t = 0, rafId;
    function draw() {
      ctx.clearRect(0, 0, W, H);
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
    return () => cancelAnimationFrame(rafId);
  }, []);

  async function handleRetrieve() {
    if (!invoiceId.trim()) { setError('Please enter an invoice ID.'); return; }
    if (!token) { setError('You must be logged in to retrieve an invoice.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`http://localhost:3000/invoices/${invoiceId.trim()}`, {
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

  async function handleLogout() {
    try { await logout(token); } catch (_) {}
    onLogout();
  }

  return (
    <div style={styles.page}>
      <canvas ref={canvasRef} style={styles.canvas} />

      <style>{`
  .nav-link:hover { color: rgba(255,255,255,0.9) !important; text-shadow: 0 0 12px rgba(255,255,255,0.3); }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .page-fade { animation: fadeIn 0.5s ease forwards; }
`}</style>
      <nav style={styles.nav}>
        <img src={logo} alt="MC Invoicing" style={{ ...styles.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={styles.navLinks}>
          <span style={{ ...styles.navLink, ...styles.navLinkActive }}>Retrieve</span>
          {token ? (
            <>
              <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('app')}>Create Invoice</span>
              <button className="nav-link" style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <span style={styles.navLink} onClick={() => onNavigate('login')}>Login</span>
              <span style={styles.navLink} onClick={() => onNavigate('register')}>Register</span>
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
              <button style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} onClick={handleRetrieve} disabled={loading}>
                {loading ? 'Searching...' : 'Retrieve'}
              </button>
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          {result && (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <span style={styles.resultLabel}>Invoice found</span>
                <span style={{
                  ...styles.statusBadge,
                  background: result.status === 'Paid' ? 'rgba(0,255,150,0.12)' : 'rgba(255,180,0,0.12)',
                  color: result.status === 'Paid' ? '#00e891' : '#ffb400',
                  border: `1px solid ${result.status === 'Paid' ? 'rgba(0,255,150,0.3)' : 'rgba(255,180,0,0.3)'}`,
                }}>
                  {result.status}
                </span>
              </div>
              <div style={styles.divider} />
              <div style={styles.fieldGrid}>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Invoice ID</span>
                  <span style={styles.fieldValue}>{result.invoiceid}</span>
                </div>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Status</span>
                  <span style={styles.fieldValue}>{result.status}</span>
                </div>
              </div>
              {result.invoicedata && (
                <div style={styles.fieldGrid}>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>Customer</span>
                    <span style={styles.fieldValue}>{result.invoicedata?.customer?.fullName || '—'}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.fieldLabel}>Business</span>
                    <span style={styles.fieldValue}>{result.invoicedata?.from?.businessName || '—'}</span>
                  </div>
                </div>
              )}
              <div style={styles.field}>
                <span style={styles.fieldLabel}>XML Payload</span>
                <pre style={styles.xmlBox}>{result.invoicexml}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', width: '100%', position: 'relative',
    overflow: 'clip', background: 'linear-gradient(180deg, #040814 0%, #081120 35%, #050b16 100%)',
    display: 'flex', flexDirection: 'column',
  },
  canvas: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
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
  logoutBtn: {
    padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
    cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem',
  },
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
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 },
  fieldLabel: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  fieldValue: { fontSize: '0.95rem', color: '#ffffff', wordBreak: 'break-all' },
  xmlBox: {
    marginTop: 6, padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)',
    fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap',
    wordBreak: 'break-word', fontFamily: 'monospace', lineHeight: 1.6,
  },
};
