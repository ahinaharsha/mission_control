import { useEffect, useRef, useState } from 'react';
import logo from '../assets/MCInvoicing_White.png';
import QuickInvoiceSection from '../components/QuickInvoiceSection';
import ConvertSection from '../components/ConvertSection';
import ChatWidget from '../components/ChatWidget';

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
      const res = await fetch(`/invoices/${invoiceId.trim()}/status`, { headers: { token } });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.message || `Error ${res.status}`); }
      const data = await res.json();
      setStatus(data.status ?? data);
    } catch (err) { setError(err.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose(); };
  const meta = status ? STATUS_META[status] ?? { color: '#fff', bg: 'rgba(255,255,255,0.08)', icon: '❓' } : null;

  return (
    <div ref={overlayRef} style={modalStyles.overlay} onClick={handleOverlayClick}>
      <style>{`
        @keyframes modalIn { from { opacity:0;transform:translateY(24px) scale(0.97);} to { opacity:1;transform:translateY(0) scale(1);} }
        @keyframes statusPop { from { opacity:0;transform:scale(0.88);} to { opacity:1;transform:scale(1);} }
        .track-input:focus { outline:none;border-color:rgba(79,70,229,0.7)!important;box-shadow:0 0 0 3px rgba(79,70,229,0.18); }
        .track-btn:hover:not(:disabled) { background:#4338ca!important; }
        .track-close:hover { color:rgba(255,255,255,0.8)!important; }
      `}</style>
      <div style={modalStyles.card}>
        <button className="track-close" style={modalStyles.closeBtn} onClick={onClose}>✕</button>
        <div style={modalStyles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h2 style={modalStyles.title}>Track Invoice</h2>
        <p style={modalStyles.subtitle}>Enter your Invoice ID to check its current status.</p>
        <div style={modalStyles.inputRow}>
          <input className="track-input" style={modalStyles.input} placeholder="e.g. INV-00123" value={invoiceId}
            onChange={e => { setInvoiceId(e.target.value); setError(''); setStatus(null); }}
            onKeyDown={e => e.key === 'Enter' && handleTrack()} />
          <button className="track-btn" style={{ ...modalStyles.btn, opacity: loading ? 0.7 : 1 }} onClick={handleTrack} disabled={loading}>
            {loading ? '…' : 'Check'}
          </button>
        </div>
        {error && <div style={modalStyles.error}>{error}</div>}
        {status && meta && (
          <div style={{ ...modalStyles.statusCard, background: meta.bg, borderColor: `${meta.color}33`, animation: 'statusPop 0.35s ease' }}>
            <span style={modalStyles.statusIcon}>{meta.icon}</span>
            <div>
              <div style={modalStyles.statusLabel}>Current status</div>
              <div style={{ ...modalStyles.statusValue, color: meta.color }}>{status}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginPromptModal({ onClose, onNavigate }) {
  const overlayRef = useRef(null);
  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose(); };
  return (
    <div ref={overlayRef} style={modalStyles.overlay} onClick={handleOverlayClick}>
      <div style={modalStyles.card}>
        <button className="track-close" style={modalStyles.closeBtn} onClick={onClose}>✕</button>
        <div style={modalStyles.iconWrap}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style={modalStyles.title}>Login required</h2>
        <p style={modalStyles.subtitle}>You must be logged in to track an invoice.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button style={{ ...modalStyles.btn, flex: 1 }} onClick={() => { onClose(); onNavigate('login'); }}>Login</button>
          <button style={{ ...modalStyles.btn, flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            onClick={() => { onClose(); onNavigate('register'); }}>Register</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pricing Section ────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'standard',
    name: 'Standard',
    price: 'Free',
    priceSub: 'forever',
    accent: '#60a5fa',
    accentBg: 'rgba(96,165,250,0.08)',
    accentBorder: 'rgba(96,165,250,0.2)',
    badge: null,
    cta: 'Get started free',
    ctaStyle: 'ghost',
    features: [
      { icon: '💬', label: 'General invoicing assistant', desc: 'Ask questions about invoicing, GST, Peppol and more.' },
      { icon: '📊', label: '25 messages per day', desc: 'Daily limit resets at midnight. Sufficient for casual use.' },
      { icon: '🕐', label: 'Session-only memory', desc: 'Chat history is cleared when you close the window.' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    priceSub: 'per month',
    accent: '#00e891',
    accentBg: 'rgba(0,232,145,0.07)',
    accentBorder: 'rgba(0,232,145,0.25)',
    badge: 'Most popular',
    cta: 'Upgrade to Pro',
    ctaStyle: 'solid',
    features: [
      { icon: '♾️', label: 'Unlimited messages', desc: 'No daily caps — chat as much as you need, any time.' },
      { icon: '🧠', label: 'Persistent chat memory', desc: 'Conversation history saved across sessions in your account.' },
      { icon: '⚡', label: 'AI invoice autofill', desc: 'Describe your invoice in plain English and the AI pre-fills the creation form with structured data.' },
      { icon: '✏️', label: 'AI-assisted invoice updates', desc: 'Describe changes and the AI returns the exact fields to update — no manual editing required.' },
    ],
  },
];

function PricingSection({ onNavigate, token }) {
  return (
    <section style={pricing.section}>
      <style>{`
        @keyframes pricingFadeUp { from { opacity:0;transform:translateY(28px);} to { opacity:1;transform:translateY(0);} }
        .plan-card { animation: pricingFadeUp 0.6s ease both; }
        .plan-card:nth-child(2) { animation-delay: 0.12s; }
        .plan-cta-solid:hover { background: #00c97a !important; }
        .plan-cta-ghost:hover { background: rgba(96,165,250,0.12) !important; border-color: rgba(96,165,250,0.4) !important; }
      `}</style>

      <div style={pricing.header}>
        <div style={pricing.eyebrow}>AI Chat Plans</div>
        <h2 style={pricing.title}>Choose your plan</h2>
        <p style={pricing.sub}>Upgrade anytime. All plans include access to the invoicing platform.</p>
      </div>

      <div style={pricing.grid}>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="plan-card"
            style={{
              ...pricing.card,
              background: plan.ctaStyle === 'solid'
                ? 'linear-gradient(160deg, #0d1a2e 0%, #0a1520 100%)'
                : 'linear-gradient(160deg, #0b1525 0%, #080f1e 100%)',
              borderColor: plan.accentBorder,
              boxShadow: plan.ctaStyle === 'solid'
                ? `0 0 0 1px ${plan.accentBorder}, 0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,232,145,0.06)`
                : '0 8px 40px rgba(0,0,0,0.35)',
            }}
          >
            {plan.badge && (
              <div style={{ ...pricing.badge, background: plan.accentBg, color: plan.accent, borderColor: plan.accentBorder }}>
                {plan.badge}
              </div>
            )}

            <div style={pricing.planName}>{plan.name}</div>
            <div style={pricing.priceRow}>
              <span style={{ ...pricing.price, color: plan.accent }}>{plan.price}</span>
              <span style={pricing.priceSub}>{plan.priceSub}</span>
            </div>

            <div style={pricing.divider} />

            <ul style={pricing.featureList}>
              {plan.features.map((f, i) => (
                <li key={i} style={pricing.featureItem}>
                  <span style={pricing.featureIcon}>{f.icon}</span>
                  <div>
                    <div style={pricing.featureLabel}>{f.label}</div>
                    <div style={pricing.featureDesc}>{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            <button
              className={plan.ctaStyle === 'solid' ? 'plan-cta-solid' : 'plan-cta-ghost'}
              style={{
                ...pricing.cta,
                ...(plan.ctaStyle === 'solid'
                  ? { background: '#00e891', color: '#050f0a', border: 'none' }
                  : { background: 'transparent', color: 'rgba(255,255,255,0.7)', border: `1px solid ${plan.accentBorder}` })
              }}
              onClick={() => {
                if (plan.id === 'standard') {
                  if (!token) onNavigate('register');
                  else onNavigate('app');
                } else {
                  onNavigate('billing');
                }
              }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Home ────────────────────────────────────────────────────────────────────

export default function Home({ onNavigate, token }) {
  const canvasRef = useRef(null);
  const quickRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [showTrack, setShowTrack] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;
    const bands = [
      { y: H*0.55, amp: 120, freq: 0.004, speed: 0.000015, phase: 0,   color: [0,255,150],   alpha: 0.55, thickness: 100 },
      { y: H*0.65, amp: 90,  freq: 0.005, speed: 0.00002,  phase: 2.1, color: [80,200,255],  alpha: 0.38, thickness: 60  },
      { y: H*0.50, amp: 75,  freq: 0.003, speed: 0.00001,  phase: 4.3, color: [0,255,120],   alpha: 0.3,  thickness: 45  },
      { y: H*0.72, amp: 60,  freq: 0.006, speed: 0.000025, phase: 1.0, color: [140,100,255], alpha: 0.25, thickness: 40  },
      { y: H*0.48, amp: 50,  freq: 0.004, speed: 0.000013, phase: 3.5, color: [0,200,180],   alpha: 0.2,  thickness: 35  },
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

  const scrollToQuick = () => quickRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div style={styles.page}>
      <style>{`
        .nav-link:hover { color:rgba(255,255,255,0.9)!important;text-shadow:0 0 12px rgba(255,255,255,0.3); }
        .hero-fade { opacity:0;transform:translateY(32px);transition:opacity 0.9s ease,transform 0.9s ease; }
        .hero-fade.visible { opacity:1;transform:translateY(0); }
        .mockup-fade { opacity:0;transform:translateY(48px);transition:opacity 1.1s ease 0.4s,transform 1.1s ease 0.4s; }
        .mockup-fade.visible { opacity:1;transform:translateY(0); }
        .hero-btn-primary:hover { background:#4338ca!important; }
        .hero-btn-ghost:hover { background:rgba(255,255,255,0.08)!important;border-color:rgba(255,255,255,0.25)!important; }
      `}</style>

      <div style={styles.heroSection}>
        <canvas ref={canvasRef} style={styles.canvas} />
        <nav style={styles.nav}>
          <img src={logo} alt="MC Invoicing" style={{ ...styles.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
          <div style={styles.navLinks}>
            <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('retrieve')}>Retrieve</span>
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

        <div style={styles.heroContainer}>
          <div className={`hero-fade${visible ? ' visible' : ''}`} style={styles.hero}>
            <h1 style={styles.heroTitle}>Free, smart invoicing<br />built to move fast</h1>
            <p style={styles.heroSubtitle}>
              MC Invoicing is a streamlined, efficient, and completely free e-invoicing solution. Generate and manage professional invoices in seconds, no unnecessary steps, no wasted time.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {token ? (
                <button className="hero-btn-primary" style={styles.heroBtn} onClick={() => onNavigate('app')}>Create an invoice →</button>
              ) : (
                <>
                  <button className="hero-btn-primary" style={styles.heroBtn} onClick={scrollToQuick}>Quick invoice (no login) →</button>
                  <button className="hero-btn-ghost" style={styles.heroBtnGhost} onClick={() => onNavigate('register')}>Sign up free</button>
                </>
              )}
            </div>
          </div>

          <div className={`mockup-fade${visible ? ' visible' : ''}`} style={styles.mockupWrapper}>
            <div style={styles.mockup}>
              <div style={styles.mockupHeader}>
                <span style={styles.mockupHeaderText}>INVOICE</span>
              </div>
              <div style={styles.mockupBody}>
                <div style={styles.mockupRow}>
                  <div style={styles.mockupBox}>
                    <span style={styles.mockupLabel}>Bill from</span>
                    <div style={styles.mockupLine} />
                    <div style={{ ...styles.mockupLine, width: '60%' }} />
                  </div>
                  <div style={styles.mockupBox}>
                    <span style={styles.mockupLabel}>Bill to</span>
                    <div style={styles.mockupLine} />
                    <div style={{ ...styles.mockupLine, width: '70%' }} />
                  </div>
                </div>
                <div style={styles.mockupDivider} />
                <div style={styles.mockupRow}>
                  <div style={{ flex: 1 }}><span style={styles.mockupLabel}>Description</span><div style={styles.mockupLine} /></div>
                  <div style={{ width: 60 }}><span style={styles.mockupLabel}>Qty</span><div style={styles.mockupLine} /></div>
                  <div style={{ width: 80 }}><span style={styles.mockupLabel}>Rate</span><div style={styles.mockupLine} /></div>
                  <div style={{ width: 80 }}><span style={styles.mockupLabel}>Amount</span><div style={styles.mockupLine} /></div>
                </div>
                <div style={styles.mockupDivider} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...styles.mockupLabel, marginBottom: 4 }}>Subtotal</div>
                    <div style={{ ...styles.mockupLabel, marginBottom: 4 }}>GST (10%)</div>
                    <div style={{ ...styles.mockupLabel, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Total</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <div style={{ ...styles.mockupLabel, marginBottom: 4 }}>AUD —</div>
                    <div style={{ ...styles.mockupLabel, marginBottom: 4 }}>AUD —</div>
                    <div style={{ ...styles.mockupLabel, fontWeight: 700, color: '#00e891' }}>AUD —</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={quickRef}>
        <QuickInvoiceSection onNavigate={onNavigate} />
      </div>

      <ConvertSection />

      {/* Pricing Section */}
      <PricingSection onNavigate={onNavigate} token={token} />

      {showTrack === true && <TrackModal token={token} onClose={() => setShowTrack(false)} />}
      {showTrack === 'login' && <LoginPromptModal onClose={() => setShowTrack(false)} onNavigate={onNavigate} />}

      {/* Floating Chat Widget - rendered last so it's always on top */}
      <ChatWidget token={token} onNavigate={onNavigate} />
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  page: { minHeight: '100vh', width: '100%', flex: 1, background: 'linear-gradient(180deg, #030810 0%, #060e18 35%, #040a14 100%)', display: 'flex', flexDirection: 'column' },
  heroSection: { position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, filter: 'blur(32px) brightness(0.9)', opacity: 0.85 },
  nav: { position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxSizing: 'border-box' },
  logo: { height: 60 },
  navLinks: { display: 'flex', gap: 32, alignItems: 'center' },
  navLink: { color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', userSelect: 'none', paddingBottom: 2, borderBottom: '2px solid transparent', transition: 'color 0.2s ease, text-shadow 0.2s ease' },
  heroContainer: { position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px 60px', gap: 60 },
  hero: { textAlign: 'center', maxWidth: 640 },
  heroTitle: { fontSize: '3rem', fontWeight: 700, color: '#ffffff', margin: '0 0 1.25rem', lineHeight: 1.15 },
  heroSubtitle: { fontSize: '1.05rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 2rem' },
  heroBtn: { padding: '0.85rem 2rem', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: 999, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s ease' },
  heroBtnGhost: { padding: '0.85rem 2rem', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, fontSize: '1rem', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease' },
  mockupWrapper: { width: '100%', maxWidth: 720 },
  mockup: { background: 'rgba(15,20,40,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' },
  mockupHeader: { background: '#4f46e5', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end' },
  mockupHeaderText: { color: '#ffffff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em' },
  mockupBody: { padding: '24px' },
  mockupRow: { display: 'flex', gap: 16, marginBottom: 16 },
  mockupBox: { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px' },
  mockupLabel: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 6 },
  mockupLine: { height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 6, width: '80%' },
  mockupDivider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' },
};

const pricing = {
  section: { padding: '80px 24px 100px', maxWidth: 900, margin: '0 auto', width: '100%', boxSizing: 'border-box' },
  header: { textAlign: 'center', marginBottom: 52 },
  eyebrow: { display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#00e891', background: 'rgba(0,232,145,0.08)', border: '1px solid rgba(0,232,145,0.2)', borderRadius: 999, padding: '4px 14px', marginBottom: 16 },
  title: { fontSize: '2.1rem', fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.15 },
  sub: { color: 'rgba(255,255,255,0.45)', fontSize: '1rem', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 },
  card: { position: 'relative', border: '1px solid', borderRadius: 20, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 0 },
  badge: { display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid', borderRadius: 999, padding: '3px 12px', marginBottom: 16, alignSelf: 'flex-start' },
  planName: { color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 },
  price: { fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 },
  priceSub: { color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' },
  divider: { height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 16 },
  featureItem: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  featureIcon: { fontSize: '1.1rem', flexShrink: 0, marginTop: 1 },
  featureLabel: { color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', fontWeight: 600, marginBottom: 2 },
  featureDesc: { color: 'rgba(255,255,255,0.38)', fontSize: '0.8rem', lineHeight: 1.5 },
  cta: { display: 'block', width: '100%', padding: '12px 0', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s, border-color 0.2s', marginTop: 'auto' },
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { position: 'relative', background: 'linear-gradient(160deg, #0d1525 0%, #080f1e 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '40px 36px 36px', width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'modalIn 0.3s ease' },
  closeBtn: { position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '1rem', cursor: 'pointer', transition: 'color 0.2s ease', lineHeight: 1 },
  iconWrap: { width: 52, height: 52, borderRadius: 14, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 28px' },
  inputRow: { display: 'flex', gap: 10 },
  input: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '11px 16px', color: '#fff', fontSize: '0.95rem', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', fontFamily: 'inherit' },
  btn: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s ease', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  error: { marginTop: 14, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem' },
  statusCard: { marginTop: 20, padding: '16px 20px', border: '1px solid', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 },
  statusIcon: { fontSize: '1.8rem', lineHeight: 1 },
  statusLabel: { color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: 4 },
  statusValue: { fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.01em' },
};