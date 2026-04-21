import { useState, useRef, useEffect } from 'react';


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