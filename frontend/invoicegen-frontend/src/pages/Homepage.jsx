import logo from '../assets/MCinvoicing.png';

export default function Home({ onNavigate }) {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <img src={logo} alt="MC Invoicing" style={styles.logo} />
        <div style={styles.navButtons}>
          <button
            style={styles.navBtn}
            onClick={() => onNavigate('login')}
          >
            Login
          </button>
          <button
            style={{ ...styles.navBtn, ...styles.navBtnPrimary }}
            onClick={() => onNavigate('register')}
          >
            Register
          </button>
        </div>
      </nav>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background: '#0a0f2c',  // 👈 make sure this is there
    flex: 1,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.05)',
  },
  logo: {
    height: 100,
  },
  navButtons: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  navBtn: {
    padding: '0.5rem 1.25rem',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'none',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navBtnPrimary: {
    background: '#4f46e5',
    border: '1px solid #4f46e5',
  },
  page: {
    minHeight: '100vh',
    background: '#0a0f2c',
    width: '100%',
    flex: 1,
  },
};