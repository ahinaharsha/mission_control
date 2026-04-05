import { useEffect, useRef } from 'react';
import logo from '../assets/MCInvoicing_White.png';

export default function Home({ onNavigate }) {
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
      <canvas ref={canvasRef} style={styles.canvas} />
      <style>{`.nav-link:hover { color: rgba(255,255,255,0.9) !important; text-shadow: 0 0 12px rgba(255,255,255,0.3); }`}</style>
      <nav style={styles.nav}>
        <img src={logo} alt="MC Invoicing" style={{ ...styles.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={styles.navLinks}>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('retrieve')}>Retrieve</span>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('login')}>Login</span>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('register')}>Register</span>
        </div>
      </nav>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    flex: 1,
    position: 'relative',
    overflow: 'clip',
    background: 'linear-gradient(180deg, #040814 0%, #081120 35%, #050b16 100%)',
    display: 'flex',
    flexDirection: 'column',
  },
  canvas: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
    filter: 'blur(32px) brightness(0.9)',
    opacity: 0.85,
  },
  nav: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxSizing: 'border-box',
  },
  logo: { height: 60 },
  navLinks: { display: 'flex', gap: 32, alignItems: 'center' },
  navLink: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    userSelect: 'none',
    paddingBottom: 2,
    borderBottom: '2px solid transparent',
  },
};