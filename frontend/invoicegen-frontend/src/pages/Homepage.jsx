import { useEffect, useRef, useState } from 'react';
import logo from '../assets/MCInvoicing_White.png';

export default function Home({ onNavigate }) {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in after mount
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
      { y: H*0.55, amp: 120, freq: 0.004, speed: 0.00003, phase: 0,   color: [0,255,150],   alpha: 0.55, thickness: 100 },
      { y: H*0.65, amp: 90,  freq: 0.005, speed: 0.00004, phase: 2.1, color: [80,200,255],  alpha: 0.38, thickness: 60  },
      { y: H*0.50, amp: 75,  freq: 0.003, speed: 0.00002, phase: 4.3, color: [0,255,120],   alpha: 0.3,  thickness: 45  },
      { y: H*0.72, amp: 60,  freq: 0.006, speed: 0.00005, phase: 1.0, color: [140,100,255], alpha: 0.25, thickness: 40  },
      { y: H*0.48, amp: 50,  freq: 0.004, speed: 0.00003, phase: 3.5, color: [0,200,180],   alpha: 0.2,  thickness: 35  },
    ];

    let t = 0;
    let rafId;

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

  return (
    <div style={styles.page}>
      <style>{`
        .nav-link:hover { color: rgba(255,255,255,0.9) !important; text-shadow: 0 0 12px rgba(255,255,255,0.3); }
        .hero-fade { opacity: 0; transform: translateY(32px); transition: opacity 0.9s ease, transform 0.9s ease; }
        .hero-fade.visible { opacity: 1; transform: translateY(0); }
        .mockup-fade { opacity: 0; transform: translateY(48px); transition: opacity 1.1s ease 0.4s, transform 1.1s ease 0.4s; }
        .mockup-fade.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      <canvas ref={canvasRef} style={styles.canvas} />

      <nav style={styles.nav}>
        <img src={logo} alt="MC Invoicing" style={{ ...styles.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={styles.navLinks}>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('retrieve')}>Retrieve</span>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('login')}>Login</span>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('register')}>Register</span>
        </div>
      </nav>

      {/* Hero */}
      <div style={styles.heroContainer}>
        <div className={`hero-fade${visible ? ' visible' : ''}`} style={styles.hero}>
          <h1 style={styles.heroTitle}>Free invoice generator</h1>
          <p style={styles.heroSubtitle}>
            Create professional invoices without effort. Generate, track, and retrieve
            your invoices, it is all in one place, and is tailored to your business needs.
          </p>
          <button style={styles.heroBtn} onClick={() => onNavigate('register')}>
            Generate invoices now →
          </button>
        </div>

        {/* Mockup */}
        <div className={`mockup-fade${visible ? ' visible' : ''}`} style={styles.mockupWrapper}>
          <div style={styles.mockup}>
            {/* Mockup header */}
            <div style={styles.mockupHeader}>
              <span style={styles.mockupHeaderText}>INVOICE</span>
            </div>
            {/* Mockup body */}
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
                <div style={{ flex: 1 }}>
                  <span style={styles.mockupLabel}>Description</span>
                  <div style={styles.mockupLine} />
                </div>
                <div style={{ width: 60 }}>
                  <span style={styles.mockupLabel}>Qty</span>
                  <div style={styles.mockupLine} />
                </div>
                <div style={{ width: 80 }}>
                  <span style={styles.mockupLabel}>Rate</span>
                  <div style={styles.mockupLine} />
                </div>
                <div style={{ width: 80 }}>
                  <span style={styles.mockupLabel}>Amount</span>
                  <div style={styles.mockupLine} />
                </div>
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
  );
}

const styles = {
  page: {
    minHeight: '100vh', width: '100%', flex: 1, position: 'relative',
    overflow: 'hidden', background: 'linear-gradient(180deg, #040814 0%, #081120 35%, #050b16 100%)',
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
    transition: 'color 0.2s ease, text-shadow 0.2s ease',
  },
  heroContainer: {
    position: 'relative', zIndex: 1, flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '80px 24px 60px', gap: 60,
  },
  hero: { textAlign: 'center', maxWidth: 640 },
  heroTitle: {
    fontSize: '3rem', fontWeight: 700, color: '#ffffff',
    margin: '0 0 1.25rem', lineHeight: 1.15,
  },
  heroSubtitle: {
    fontSize: '1.05rem', color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.7, margin: '0 0 2rem',
  },
  heroBtn: {
    padding: '0.85rem 2rem', background: '#4f46e5', color: '#ffffff',
    border: 'none', borderRadius: 999, fontSize: '1rem', fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.2s ease',
  },
  mockupWrapper: { width: '100%', maxWidth: 720 },
  mockup: {
    background: 'rgba(15,20,40,0.85)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, overflow: 'hidden',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  },
  mockupHeader: {
    background: '#4f46e5', padding: '12px 24px',
    display: 'flex', justifyContent: 'flex-end',
  },
  mockupHeaderText: { color: '#ffffff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em' },
  mockupBody: { padding: '24px' },
  mockupRow: { display: 'flex', gap: 16, marginBottom: 16 },
  mockupBox: {
    flex: 1, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px',
  },
  mockupLabel: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 6 },
  mockupLine: { height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 6, width: '80%' },
  mockupDivider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' },
};
