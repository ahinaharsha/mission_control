import { useState, useRef, useEffect } from 'react';
import logo from '../assets/MCInvoicing_White.png';

function SpaceBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2, o: Math.random() * 0.5 + 0.2,
    }));

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

    function draw() {
      ctx.fillStyle = '#000008';
      ctx.fillRect(0, 0, W, H);
      stars.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }

    resize(); draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, filter: 'blur(0.5px)' }} />;
}

const FEATURES = [
  '♾️  Unlimited AI chat messages',
  '🧠  Persistent memory across sessions',
  '⚡  AI invoice autofill from plain English',
  '✏️  AI-assisted invoice field updates',
  '📊  Priority support',
];

export default function Billing({ onNavigate, token }) {
  const [billing, setBilling] = useState({ name: '', card: '', expiry: '', cvc: '' });
  const [plan, setPlan] = useState('monthly');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const price = plan === 'monthly' ? '$12' : '$99';
  const priceSub = plan === 'monthly' ? '/month' : '/year  (save $45)';

  const formatCard = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  };
  const formatCvc = (val) => val.replace(/\D/g, '').slice(0, 4);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1600);
  };

  if (submitted) {
    return (
      <div style={s.page}>
        <SpaceBackground />
        <nav style={s.nav}>
          <img src={logo} alt="MC Invoicing" style={{ height: 60, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        </nav>
        <div style={{ ...s.center, position: 'relative', zIndex: 1 }}>
          <div style={{ ...s.card, textAlign: 'center', maxWidth: 460, animation: 'fadeUp 0.5s ease' }}>
            <div style={s.successIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e891" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px' }}>You're on Pro!</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 28px' }}>
              Your account has been upgraded. Enjoy unlimited messages, persistent memory, and AI-powered invoice tools.
            </p>
            <button style={s.submitBtn} onClick={() => onNavigate('app')}>
              Start creating invoices →
            </button>
          </div>
        </div>
        <style>{`@keyframes fadeUp { from { opacity:0;transform:translateY(24px);} to { opacity:1;transform:translateY(0);} }`}</style>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <SpaceBackground />
      <style>{`
        @keyframes fadeUp { from { opacity:0;transform:translateY(28px);} to { opacity:1;transform:translateY(0);} }
        .billing-input:focus { outline:none; border-color:rgba(79,70,229,0.7)!important; box-shadow:0 0 0 3px rgba(79,70,229,0.15); }
        .nav-link:hover { color:rgba(255,255,255,0.9)!important; }
        .toggle-btn:hover { background:rgba(255,255,255,0.06)!important; }
        .submit-btn:hover:not(:disabled) { background:#00c97a!important; }
        .back-link:hover { color:rgba(255,255,255,0.7)!important; }
      `}</style>

      <nav style={s.nav}>
        <img src={logo} alt="MC Invoicing" style={{ height: 60, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={{ display: 'flex', gap: 32 }}>
          <span className="nav-link" style={s.navLink} onClick={() => onNavigate('home')}>Home</span>
          {token && <span className="nav-link" style={s.navLink} onClick={() => onNavigate('app')}>Dashboard</span>}
        </div>
      </nav>

      <div style={{ ...s.center, position: 'relative', zIndex: 1, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
        <div style={s.layout}>

          {/* Left — plan summary */}
          <div style={s.summary}>
            <div style={s.summaryEyebrow}>Upgrading to</div>
            <div style={s.summaryPlan}>Pro Plan</div>

            {/* Toggle */}
            <div style={s.toggleRow}>
              {['monthly', 'yearly'].map(p => (
                <button
                  key={p}
                  className="toggle-btn"
                  style={{ ...s.toggleBtn, ...(plan === p ? s.toggleActive : {}) }}
                  onClick={() => setPlan(p)}
                >
                  {p === 'monthly' ? 'Monthly' : 'Yearly'}
                  {p === 'yearly' && <span style={s.saveBadge}>Save 37%</span>}
                </button>
              ))}
            </div>

            <div style={s.priceBlock}>
              <span style={s.price}>{price}</span>
              <span style={s.priceSub}>{priceSub}</span>
            </div>

            <div style={s.divider} />

            <div style={s.featureTitle}>Everything included:</div>
            <ul style={s.featureList}>
              {FEATURES.map((f, i) => (
                <li key={i} style={s.featureItem}>{f}</li>
              ))}
            </ul>

            <div style={s.divider} />

            <div style={s.guarantee}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e891" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Cancel any time. No lock-in contracts.</span>
            </div>
          </div>

          {/* Right — payment form */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Payment details</h2>
            <p style={s.cardSub}>This is a proof-of-concept — no real charges will occur.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div style={s.fieldGroup}>
                <label style={s.label}>Cardholder name</label>
                <input
                  className="billing-input"
                  style={{ ...s.input, ...(focused === 'name' ? s.inputFocused : {}) }}
                  placeholder="Jane Smith"
                  value={billing.name}
                  onChange={e => setBilling(b => ({ ...b, name: e.target.value }))}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  required
                />
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Card number</label>
                <div style={s.cardInputWrap}>
                  <input
                    className="billing-input"
                    style={{ ...s.input, ...s.cardInput, ...(focused === 'card' ? s.inputFocused : {}) }}
                    placeholder="1234 5678 9012 3456"
                    value={billing.card}
                    onChange={e => setBilling(b => ({ ...b, card: formatCard(e.target.value) }))}
                    onFocus={() => setFocused('card')}
                    onBlur={() => setFocused(null)}
                    inputMode="numeric"
                    required
                  />
                  <div style={s.cardIcons}>
                    {/* Visa-ish */}
                    <div style={{ ...s.cardIcon, background: '#1a1f71', color: '#fff', fontWeight: 800, fontSize: '0.55rem', letterSpacing: '-0.02em' }}>VISA</div>
                    {/* MC-ish */}
                    <div style={s.mcIcon}>
                      <div style={{ ...s.mcCircle, background: '#eb001b', marginRight: -6 }} />
                      <div style={{ ...s.mcCircle, background: '#f79e1b' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ ...s.fieldGroup, flex: 1 }}>
                  <label style={s.label}>Expiry</label>
                  <input
                    className="billing-input"
                    style={{ ...s.input, ...(focused === 'expiry' ? s.inputFocused : {}) }}
                    placeholder="MM / YY"
                    value={billing.expiry}
                    onChange={e => setBilling(b => ({ ...b, expiry: formatExpiry(e.target.value) }))}
                    onFocus={() => setFocused('expiry')}
                    onBlur={() => setFocused(null)}
                    inputMode="numeric"
                    required
                  />
                </div>
                <div style={{ ...s.fieldGroup, flex: 1 }}>
                  <label style={s.label}>CVC</label>
                  <input
                    className="billing-input"
                    style={{ ...s.input, ...(focused === 'cvc' ? s.inputFocused : {}) }}
                    placeholder="•••"
                    value={billing.cvc}
                    onChange={e => setBilling(b => ({ ...b, cvc: formatCvc(e.target.value) }))}
                    onFocus={() => setFocused('cvc')}
                    onBlur={() => setFocused(null)}
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <div style={s.orderRow}>
                <span style={s.orderLabel}>Total today</span>
                <span style={s.orderPrice}>{price}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>{priceSub}</span></span>
              </div>

              <button
                type="submit"
                className="submit-btn"
                style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#050f0a', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Processing…
                  </span>
                ) : `Upgrade to Pro ${price}${plan === 'monthly' ? '/mo' : '/yr'}`}
              </button>

              <p style={s.legal}>
                By continuing you agree to our{' '}
                <span style={s.legalLink}>Terms of Service</span> and{' '}
                <span style={s.legalLink}>Privacy Policy</span>.
                Payments are encrypted and secure.
              </p>
            </form>

            <button className="back-link" style={s.backLink} onClick={() => onNavigate('home')}>
              ← Back to home
            </button>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000008' },
  nav: { position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxSizing: 'border-box' },
  navLink: { color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' },
  center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, width: '100%', maxWidth: 860, alignItems: 'start' },

  // Summary panel
  summary: { color: '#fff', padding: '8px 0' },
  summaryEyebrow: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#00e891', marginBottom: 6 },
  summaryPlan: { fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.1, marginBottom: 24 },
  toggleRow: { display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' },
  toggleActive: { background: 'rgba(255,255,255,0.1)', color: '#fff' },
  saveBadge: { fontSize: '0.65rem', background: 'rgba(0,232,145,0.15)', color: '#00e891', border: '1px solid rgba(0,232,145,0.25)', borderRadius: 999, padding: '2px 7px', fontWeight: 700 },
  priceBlock: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 },
  price: { fontSize: '3rem', fontWeight: 800, color: '#00e891', lineHeight: 1 },
  priceSub: { color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' },
  divider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' },
  featureTitle: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 },
  featureList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 },
  featureItem: { fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 },
  guarantee: { display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' },

  // Card
  card: { background: 'linear-gradient(160deg, #0d1525 0%, #080f1e 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' },
  cardTitle: { color: '#fff', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px' },
  cardSub: { color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', margin: '0 0 24px', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' },
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: '0.9rem', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  inputFocused: { borderColor: 'rgba(79,70,229,0.7)', boxShadow: '0 0 0 3px rgba(79,70,229,0.15)' },
  cardInputWrap: { position: 'relative' },
  cardInput: { paddingRight: 80 },
  cardIcons: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6 },
  cardIcon: { width: 32, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mcIcon: { display: 'flex', alignItems: 'center', width: 32, height: 20 },
  mcCircle: { width: 18, height: 18, borderRadius: '50%', opacity: 0.9 },
  orderRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.07)' },
  orderLabel: { color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' },
  orderPrice: { color: '#fff', fontSize: '1.5rem', fontWeight: 800 },
  submitBtn: { padding: '13px 0', background: '#00e891', color: '#050f0a', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit' },
  legal: { color: 'rgba(255,255,255,0.25)', fontSize: '0.73rem', textAlign: 'center', lineHeight: 1.6, margin: 0 },
  legalLink: { color: 'rgba(255,255,255,0.45)', cursor: 'pointer', textDecoration: 'underline' },
  backLink: { marginTop: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.82rem', padding: 0, display: 'block', transition: 'color 0.2s', fontFamily: 'inherit' },

  // Success
  successIcon: { width: 64, height: 64, borderRadius: 18, background: 'rgba(0,232,145,0.1)', border: '1px solid rgba(0,232,145,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
};