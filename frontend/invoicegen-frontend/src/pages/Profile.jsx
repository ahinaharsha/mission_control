// Profile.jsx
import { useState, useRef, useEffect } from 'react';
import logo from '../assets/MCInvoicing_White.png';
import { logout } from '../api/client';

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

export default function Profile({ onNavigate, onLogout, token }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showTrack, setShowTrack] = useState(false);

  async function handleLogout() {
    try { await logout(token); } catch (_) {}
    onLogout();
  }

  return (
    <div style={styles.page}>
      <style>{`
        .nav-link:hover { color: rgba(255,255,255,0.9) !important; text-shadow: 0 0 12px rgba(255,255,255,0.3); }
        .sidebar-item:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.9) !important; }
        .logout-btn:hover { background: rgba(255,80,80,0.15) !important; color: #ff6b6b !important; }
        @keyframes modalIn { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes statusPop { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .page-fade { animation: fadeIn 0.5s ease forwards; }
      `}</style>

      <nav style={styles.nav}>
        <img src={logo} alt="MC Invoicing" style={{ ...styles.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={styles.navLinks}>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('retrieve')}>Retrieve</span>
          <span className="nav-link" style={styles.navLink} onClick={() => setShowTrack(true)}>Track</span>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('app')}>Create Invoice</span>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('update')}>Update Invoice</span>
          <span style={{ ...styles.navLink, ...styles.navLinkActive }}>Profile</span>
        </div>
      </nav>

      <div className="page-fade" style={styles.body}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarTop}>
            <div
              className="sidebar-item"
              style={{ ...styles.sidebarItem, ...(activeTab === 'profile' ? styles.sidebarItemActive : {}) }}
              onClick={() => setActiveTab('profile')}
            >
              <span style={styles.sidebarIcon}>👤</span> My Profile
            </div>
            <div
              className="sidebar-item"
              style={{ ...styles.sidebarItem, ...(activeTab === 'invoices' ? styles.sidebarItemActive : {}) }}
              onClick={() => setActiveTab('invoices')}
            >
              <span style={styles.sidebarIcon}>🧾</span> My Invoices
            </div>
          </div>
          <div className="logout-btn" style={styles.logoutItem} onClick={handleLogout}>
            <span style={styles.sidebarIcon}>→</span> Logout
          </div>
        </div>

        <div style={styles.content}>
          {activeTab === 'profile' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>My Profile</h2>
              <div style={styles.divider} />
              <div style={styles.profileRow}>
                <div style={styles.avatar}>👤</div>
                <div>
                  <p style={styles.profileLabel}>Account</p>
                  <p style={styles.profileValue}>Logged in</p>
                </div>
              </div>
              <p style={styles.hint}>Profile details will appear here once available from the API.</p>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>My Invoices</h2>
              <div style={styles.divider} />
              <InvoiceList onNavigate={onNavigate} token={token} />
            </div>
          )}
        </div>
      </div>

      {showTrack && <TrackModal token={token} onClose={() => setShowTrack(false)} />}
    </div>
  );
}

function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalBox}>
        <div style={styles.modalIcon}>🗑️</div>
        <h2 style={styles.modalTitle}>Delete Invoice</h2>
        <p style={styles.modalText}>Are you sure you want to delete this invoice?</p>
        <p style={styles.modalSubText}>This cannot be undone.</p>
        <div style={styles.modalButtons}>
          <button style={styles.modalNo} onClick={onCancel}>No, keep it</button>
          <button style={styles.modalYes} onClick={onConfirm}>Yes, delete</button>
        </div>
      </div>
    </div>
  );
}

function InvoiceList({ onNavigate, token }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/v1/invoices`, {
          headers: { token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch invoices.');
        setInvoices(data.invoices);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [token]);

  async function handleDelete(invoiceId) {
    setDeletingId(invoiceId);
    setConfirmId(null);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/v1/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete invoice.');
      setInvoices(prev => prev.filter(inv => inv.invoiceid !== invoiceId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Loading invoices...</div>;
  }

  if (invoices.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No invoices yet.</p>
        <button style={styles.createBtn} onClick={() => onNavigate('app')}>+ Create your first invoice</button>
      </div>
    );
  }

  return (
    <div>
      {confirmId && (
        <ConfirmModal
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
      {error && <div style={styles.errorBox}>{error}</div>}
      {invoices.map((inv, i) => {
        const invoiceData = typeof inv.invoicedata === 'string' ? JSON.parse(inv.invoicedata) : inv.invoicedata;
        return (
          <div key={i} style={styles.invoiceRow}>
            <div>
              <p style={styles.invoiceCustomer}>{invoiceData?.customer?.fullName || 'Unknown customer'}</p>
              <p style={styles.invoiceDate}>{new Date(inv.createdat).toLocaleDateString()}</p>
              <p style={styles.invoiceId}>{inv.invoiceid}</p>
            </div>
            <button
              style={{
                ...styles.deleteBtn,
                opacity: deletingId === inv.invoiceid ? 0.5 : 1,
                cursor: deletingId === inv.invoiceid ? 'not-allowed' : 'pointer',
              }}
              onClick={() => setConfirmId(inv.invoiceid)}
              disabled={deletingId === inv.invoiceid}
            >
              {deletingId === inv.invoiceid ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        );
      })}
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
    minHeight: '100vh', background: 'linear-gradient(180deg, #040814 0%, #081120 35%, #050b16 100%)',
    display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif',
  },
  nav: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', boxSizing: 'border-box', zIndex: 1, position: 'relative',
  },
  logo: { height: 60 },
  navLinks: { display: 'flex', gap: 32, alignItems: 'center' },
  navLink: {
    color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', fontWeight: 500,
    cursor: 'pointer', userSelect: 'none', paddingBottom: 2, borderBottom: '2px solid transparent',
  },
  navLinkActive: { color: '#ffffff', borderBottom: '2px solid rgba(255,255,255,0.6)' },
  body: { flex: 1, display: 'flex' },
  sidebar: {
    width: 220, background: 'rgba(0,0,0,0.3)', borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '24px 12px',
  },
  sidebarTop: { display: 'flex', flexDirection: 'column', gap: 4 },
  sidebarItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
    fontSize: '0.95rem', fontWeight: 500, transition: 'background 0.15s, color 0.15s',
  },
  sidebarItemActive: {
    background: 'rgba(79,70,229,0.2)', color: '#ffffff',
    borderLeft: '3px solid #4f46e5', paddingLeft: 11,
  },
  sidebarIcon: { fontSize: 16 },
  logoutItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
    fontSize: '0.95rem', fontWeight: 500, transition: 'background 0.15s, color 0.15s',
  },
  content: { flex: 1, padding: '40px 48px' },
  card: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: '32px', maxWidth: 600,
  },
  cardTitle: { margin: '0 0 16px', fontSize: '1.3rem', fontWeight: 600, color: '#ffffff' },
  divider: { height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 },
  profileRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar: {
    width: 56, height: 56, borderRadius: '50%', background: 'rgba(79,70,229,0.2)',
    border: '1px solid rgba(79,70,229,0.4)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 24,
  },
  profileLabel: { margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  profileValue: { margin: '4px 0 0', fontSize: '1rem', color: '#ffffff', fontWeight: 500 },
  hint: { margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },
  emptyState: { textAlign: 'center', padding: '40px 0' },
  emptyText: { color: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  createBtn: {
    padding: '0.65rem 1.4rem', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
  },
  invoiceRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  invoiceCustomer: { margin: 0, color: '#ffffff', fontSize: '0.95rem', fontWeight: 500 },
  invoiceDate: { margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' },
  invoiceId: { margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' },
  deleteBtn: {
    padding: '0.45rem 1rem', background: 'rgba(255,80,80,0.1)', color: '#ff6b6b',
    border: '1px solid rgba(255,80,80,0.25)', borderRadius: 7, fontSize: '0.85rem',
    fontWeight: 600, flexShrink: 0,
  },
  errorBox: {
    marginBottom: 16, padding: '10px 14px', borderRadius: 8,
    background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
    color: '#ff6b6b', fontSize: '0.85rem',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modalBox: {
    background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16, padding: '40px 36px', maxWidth: 380, width: '100%',
    textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  },
  modalIcon: { fontSize: 36, marginBottom: 16 },
  modalTitle: { margin: '0 0 10px', fontSize: '1.3rem', fontWeight: 600, color: '#ffffff' },
  modalText: { margin: '0 0 6px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)' },
  modalSubText: { margin: '0 0 28px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },
  modalButtons: { display: 'flex', gap: 12 },
  modalNo: {
    flex: 1, padding: '0.7rem', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600,
    cursor: 'pointer', background: 'rgba(255,80,80,0.12)', color: '#ff6b6b',
    border: '1px solid rgba(255,80,80,0.3)',
  },
  modalYes: {
    flex: 1, padding: '0.7rem', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600,
    cursor: 'pointer', background: 'rgba(0,200,100,0.15)', color: '#00e891',
    border: '1px solid rgba(0,200,100,0.3)',
  },
};