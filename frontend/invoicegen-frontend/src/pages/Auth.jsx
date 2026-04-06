//Auth.jsx
import { useState, useEffect, useRef } from 'react';
import { login, register } from '../api/client';
import logo from '../assets/MCInvoicing_White.png';

function SpaceBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let meteors = [];
    let animId;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3, o: Math.random() * 0.7 + 0.3,
    }));

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

    function spawnMeteor() {
      meteors.push({ x: Math.random() * W * 1.5, y: -10, len: Math.random() * 120 + 60, speed: Math.random() * 6 + 4, o: 1, angle: Math.PI / 4 });
    }

    function draw() {
      ctx.fillStyle = '#000008';
      ctx.fillRect(0, 0, W, H);
      stars.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o})`; ctx.fill();
      });
      if (Math.random() < 0.015) spawnMeteor();
      meteors = meteors.filter(m => {
        const ex = m.x + Math.cos(m.angle) * m.len;
        const ey = m.y + Math.sin(m.angle) * m.len;
        const grad = ctx.createLinearGradient(m.x, m.y, ex, ey);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, `rgba(255,255,255,${m.o})`);
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
        m.x += Math.cos(m.angle) * m.speed; m.y += Math.sin(m.angle) * m.speed; m.o -= 0.012;
        return m.o > 0 && m.x < W + 100 && m.y < H + 100;
      });
      animId = requestAnimationFrame(draw);
    }

    resize(); draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, filter: 'blur(1px)' }} />;
}

function LoginPromptModal({ onClose }) {
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
        <p style={tm.subtitle}>You must be logged in to track an invoice. Please log in using the form below.</p>
        <button style={{ ...tm.btn, width: '100%' }} onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

export default function Auth({ onLogin, initialTab = 'login', onNavigate }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [showTrackPrompt, setShowTrackPrompt] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'register') {
        await register(email, password);
        setTab('login'); setError('');
        alert('Registered! Please log in.');
      } else {
        const data = await login(email, password);
        onLogin(data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <SpaceBackground />

      <style>{`
        .nav-link:hover { color: rgba(255,255,255,0.9) !important; text-shadow: 0 0 12px rgba(255,255,255,0.3); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .page-fade { animation: fadeIn 0.5s ease forwards; }
        @keyframes modalIn { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      <nav style={styles.nav}>
        <img src={logo} alt="MC Invoicing" style={{ ...styles.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={styles.navLinks}>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('retrieve')}>Retrieve</span>
          <span className="nav-link" style={styles.navLink} onClick={() => setShowTrackPrompt(true)}>Track</span>
          <span
            className="nav-link"
            style={{ ...styles.navLink, ...(tab === 'login' ? styles.navLinkActive : {}) }}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Login
          </span>
          <span
            className="nav-link"
            style={{ ...styles.navLink, ...(tab === 'register' ? styles.navLinkActive : {}) }}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Register
          </span>
        </div>
      </nav>

      <div className="page-fade" style={styles.centeredContent}>
        <div style={styles.card}>
          <h1 style={styles.title}>MC Invoicing Login/Register</h1>
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(tab === 'login' ? styles.tabActive : {}), ...(hovered === 'login' && tab !== 'login' ? styles.tabHover : {}) }}
              onClick={() => { setTab('login'); setError(''); }}
              onMouseEnter={() => setHovered('login')}
              onMouseLeave={() => setHovered(null)}
            >
              Login
            </button>
            <button
              style={{ ...styles.tab, ...(tab === 'register' ? styles.tabActive : {}), ...(hovered === 'register' && tab !== 'register' ? styles.tabHover : {}) }}
              onClick={() => { setTab('register'); setError(''); }}
              onMouseEnter={() => setHovered('register')}
              onMouseLeave={() => setHovered(null)}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} placeholder="you@example.com" required />
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} placeholder="••••••••" required />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Register'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
              {tab === 'login' ? (
                <>Haven't registered yet?{' '}
                  <span onClick={() => { setTab('register'); setError(''); }} style={{ color: '#a5b4fc', cursor: 'pointer', fontWeight: 600 }}>
                    Register now
                  </span>
                </>
              ) : (
                <>Already have an account?{' '}
                  <span onClick={() => { setTab('login'); setError(''); }} style={{ color: '#a5b4fc', cursor: 'pointer', fontWeight: 600 }}>
                    Login here
                  </span>
                </>
              )}
            </p>
          </form>
        </div>
      </div>

      {showTrackPrompt && <LoginPromptModal onClose={() => setShowTrackPrompt(false)} />}
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
  btn: {
    background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px',
    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
  },
};

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', background: '#000008' },
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
  centeredContent: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 24px', position: 'relative', zIndex: 1,
  },
  card: {
    background: 'rgba(135,122,122,0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 400,
    boxShadow: '0 4px 30px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
  },
  title: { textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.6rem', color: '#ffffff' },
  tabs: { display: 'flex', marginBottom: '1.5rem', padding: 4, gap: 4 },
  tab: {
    flex: 1, padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500, borderRadius: 999, transition: 'all 0.2s',
  },
  tabActive: { color: '#ffffff', background: '#4f46e5' },
  tabHover: { color: '#ffffff', background: 'rgba(255,255,255,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' },
  input: {
    padding: '0.6rem 0.8rem', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8, fontSize: '1rem', outline: 'none',
    background: 'rgba(255,255,255,0.1)', color: '#ffffff',
  },
  btn: {
    marginTop: '1rem', padding: '0.75rem', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
  },
  error: { color: '#f87171', fontSize: '0.875rem', margin: 0 },
};