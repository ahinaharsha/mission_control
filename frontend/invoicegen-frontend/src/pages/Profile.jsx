// Profile.jsx
import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import logo from '../assets/MCInvoicing_White.png';
import { logout } from '../api/client';

export default function Profile({ onNavigate, onLogout, token }) {
  const [activeTab, setActiveTab] = useState('profile');

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
      `}</style>

      <nav style={styles.nav}>
        <img src={logo} alt="MC Invoicing" style={{ ...styles.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={styles.navLinks}>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('retrieve')}>Retrieve</span>
          <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('app')}>Create Invoice</span>
          <span style={{ ...styles.navLink, ...styles.navLinkActive }}>Profile</span>
        </div>
      </nav>

      <div style={styles.body}>
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
  const decoded = jwtDecode(token);
  const userKey = `invoices_${decoded.userId}`;

  const [invoices, setInvoices] = useState(JSON.parse(localStorage.getItem(userKey) || '[]'));
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState('');

  async function handleDelete(invoiceId) {
    setDeletingId(invoiceId);
    setConfirmId(null);
    setError('');
    try {
      const res = await fetch(`http://localhost:3000/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { token },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete invoice.');
      }

      const updated = invoices.filter(inv => inv.id !== invoiceId);
      localStorage.setItem(userKey, JSON.stringify(updated));
      setInvoices(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
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
      {invoices.map((inv, i) => (
        <div key={i} style={styles.invoiceRow}>
          <div>
            <p style={styles.invoiceCustomer}>{inv.customer || 'Unknown customer'}</p>
            <p style={styles.invoiceDate}>{inv.createdAt}</p>
            <p style={styles.invoiceId}>{inv.id}</p>
          </div>
          <button
            style={{
              ...styles.deleteBtn,
              opacity: deletingId === inv.id ? 0.5 : 1,
              cursor: deletingId === inv.id ? 'not-allowed' : 'pointer',
            }}
            onClick={() => setConfirmId(inv.id)}
            disabled={deletingId === inv.id}
          >
            {deletingId === inv.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
}

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