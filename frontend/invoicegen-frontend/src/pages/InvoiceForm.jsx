import { useState } from 'react';
import { createInvoice, logout } from '../api/client';
import { buildOrderXML } from '../utils/xmlBuilder';

const emptyAddress = { street: '', city: '', postcode: '', country: '' };

const defaultForm = {
  from: {
    businessName: '',
    taxId: '',
    abnNumber: '',
    address: { ...emptyAddress },
  },
  customer: {
    id: '',
    fullName: '',
    email: '',
    phone: '',
    billingAddress: { ...emptyAddress },
    shippingAddress: { ...emptyAddress },
  },
  lineItems: [{ description: '', quantity: 1, rate: 0 }],
  currency: 'AUD',
};

export default function InvoiceForm({ token, onLogout, onDone }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // --- Nested field updaters ---
  function setFrom(field, value) {
    setForm(f => ({ ...f, from: { ...f.from, [field]: value } }));
  }
  function setFromAddress(field, value) {
    setForm(f => ({ ...f, from: { ...f.from, address: { ...f.from.address, [field]: value } } }));
  }
  function setCustomer(field, value) {
    setForm(f => ({ ...f, customer: { ...f.customer, [field]: value } }));
  }
  function setCustomerBilling(field, value) {
    setForm(f => ({ ...f, customer: { ...f.customer, billingAddress: { ...f.customer.billingAddress, [field]: value } } }));
  }
  function setLineItem(index, field, value) {
    setForm(f => {
      const items = [...f.lineItems];
      items[index] = { ...items[index], [field]: field === 'description' ? value : Number(value) };
      return { ...f, lineItems: items };
    });
  }
  function addLineItem() {
    setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: '', quantity: 1, rate: 0 }] }));
  }
  function removeLineItem(index) {
    setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== index) }));
  }

  // --- Submit ---
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const xml = buildOrderXML(form);
      const data = await createInvoice(xml, token);
      // Save to local invoice list for the dashboard
      if (data.id) {
        const saved = JSON.parse(localStorage.getItem('invoices') || '[]');
        saved.unshift({ id: data.id, customer: form.customer.fullName, createdAt: new Date().toLocaleDateString() });
        localStorage.setItem('invoices', JSON.stringify(saved));
      }
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

  // --- Subtotal calculation ---
  const subtotal = form.lineItems.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.headerTitle}>🧾 Invoice Generator</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </header>

      <div style={styles.container}>
        {result ? (
          <div style={styles.successCard}>
            <h2 style={{ color: '#276749' }}>✅ Invoice Created!</h2>
            <p>{result.message}</p>
            {result.filePath && (
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>View generated XML</summary>
                <pre style={styles.xmlBox}>{result.filePath}</pre>
              </details>
            )}
            <button style={styles.btn} onClick={() => { setResult(null); setForm(defaultForm); }}>
              Create Another Invoice
            </button>
            {onDone && (
              <button style={{ ...styles.btn, background: '#e2e8f0', color: '#4a5568', marginLeft: '0.75rem' }} onClick={onDone}>
                ← Back to Dashboard
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* FROM */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>From (Your Business)</h2>
              <div style={styles.grid2}>
                <Field label="Business Name" value={form.from.businessName} onChange={v => setFrom('businessName', v)} required />
                <Field label="ABN Number" value={form.from.abnNumber} onChange={v => setFrom('abnNumber', v)} required />
                <Field label="Tax ID" value={form.from.taxId} onChange={v => setFrom('taxId', v)} />
                <Field label="Street" value={form.from.address.street} onChange={v => setFromAddress('street', v)} required />
                <Field label="City" value={form.from.address.city} onChange={v => setFromAddress('city', v)} required />
                <Field label="Postcode" value={form.from.address.postcode} onChange={v => setFromAddress('postcode', v)} required />
                <Field label="Country Code (e.g. AU)" value={form.from.address.country} onChange={v => setFromAddress('country', v)} required />
              </div>
            </section>

            {/* CUSTOMER */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Bill To (Customer)</h2>
              <div style={styles.grid2}>
                <Field label="Full Name" value={form.customer.fullName} onChange={v => setCustomer('fullName', v)} required />
                <Field label="Email" type="email" value={form.customer.email} onChange={v => setCustomer('email', v)} required />
                <Field label="Phone" value={form.customer.phone} onChange={v => setCustomer('phone', v)} required />
                <Field label="Customer ID (optional)" value={form.customer.id} onChange={v => setCustomer('id', v)} />
              </div>
              <h3 style={styles.subTitle}>Billing Address</h3>
              <div style={styles.grid2}>
                <Field label="Street" value={form.customer.billingAddress.street} onChange={v => setCustomerBilling('street', v)} required />
                <Field label="City" value={form.customer.billingAddress.city} onChange={v => setCustomerBilling('city', v)} required />
                <Field label="Postcode" value={form.customer.billingAddress.postcode} onChange={v => setCustomerBilling('postcode', v)} required />
                <Field label="Country Code (e.g. AU)" value={form.customer.billingAddress.country} onChange={v => setCustomerBilling('country', v)} required />
              </div>
            </section>

            {/* LINE ITEMS */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Line Items</h2>
              <p style={styles.note}>⚠️ Note: the backend currently processes only the first line item.</p>
              {form.lineItems.map((item, i) => (
                <div key={i} style={styles.lineItemRow}>
                  <div style={{ flex: 3, minWidth: 160 }}>
                    <label style={styles.label}>Description</label>
                    <input style={styles.input} value={item.description} onChange={e => setLineItem(i, 'description', e.target.value)} required />
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <label style={styles.label}>Qty</label>
                    <input style={styles.input} type="number" min="1" value={item.quantity} onChange={e => setLineItem(i, 'quantity', e.target.value)} required />
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={styles.label}>Rate ({form.currency})</label>
                    <input style={styles.input} type="number" min="0" step="0.01" value={item.rate} onChange={e => setLineItem(i, 'rate', e.target.value)} required />
                  </div>
                  <div style={{ flex: 1, minWidth: 100, paddingTop: 22 }}>
                    <span style={{ fontWeight: 600 }}>{form.currency} {(item.quantity * item.rate).toFixed(2)}</span>
                  </div>
                  {form.lineItems.length > 1 && (
                    <button type="button" style={styles.removeBtn} onClick={() => removeLineItem(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" style={styles.addBtn} onClick={addLineItem}>+ Add Line Item</button>

              {/* Totals */}
              <div style={styles.totals}>
                <div style={styles.totalRow}><span>Subtotal</span><span>{form.currency} {subtotal.toFixed(2)}</span></div>
                <div style={styles.totalRow}><span>GST (10%)</span><span>{form.currency} {tax.toFixed(2)}</span></div>
                <div style={{ ...styles.totalRow, fontWeight: 700, fontSize: '1.1rem' }}>
                  <span>Total</span><span>{form.currency} {total.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* CURRENCY */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Currency</h2>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Currency</label>
                  <select style={styles.input} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="AUD">AUD</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="NZD">NZD</option>
                  </select>
                </div>
              </div>
            </section>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Generating...' : '🧾 Generate Invoice'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label style={styles.label}>{label}{required && ' *'}</label>
      <input
        style={styles.input}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f4f8', fontFamily: 'system-ui, sans-serif' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  headerTitle: { fontWeight: 700, fontSize: '1.2rem', color: '#1a202c' },
  logoutBtn: {
    padding: '0.4rem 1rem', background: 'none', border: '1px solid #e2e8f0',
    borderRadius: 6, cursor: 'pointer', color: '#718096',
  },
  container: { maxWidth: 860, margin: '2rem auto', padding: '0 1rem' },
  section: {
    background: '#fff', borderRadius: 10, padding: '1.5rem',
    marginBottom: '1.5rem', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.1rem', color: '#1a202c', fontWeight: 700 },
  subTitle: { margin: '1rem 0 0.5rem', fontSize: '0.95rem', color: '#4a5568', fontWeight: 600 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: 4 },
  input: {
    width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #e2e8f0',
    borderRadius: 7, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none',
  },
  lineItemRow: { display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem', flexWrap: 'wrap' },
  removeBtn: {
    padding: '0.55rem 0.75rem', background: '#fff5f5', color: '#c53030',
    border: '1px solid #fed7d7', borderRadius: 7, cursor: 'pointer', fontWeight: 700,
  },
  addBtn: {
    padding: '0.5rem 1rem', background: '#ebf4ff', color: '#2b6cb0',
    border: '1px solid #bee3f8', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
  },
  totals: {
    marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem',
    maxWidth: 320, marginLeft: 'auto',
  },
  totalRow: { display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#4a5568' },
  note: { fontSize: '0.8rem', color: '#d69e2e', margin: '0 0 1rem', background: '#fefcbf', padding: '0.4rem 0.75rem', borderRadius: 6 },
  submitBtn: {
    width: '100%', padding: '0.9rem', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
    marginBottom: '2rem',
  },
  error: { color: '#c53030', background: '#fff5f5', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem' },
  successCard: {
    background: '#fff', borderRadius: 10, padding: '2rem', textAlign: 'center',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  xmlBox: {
    background: '#f7fafc', padding: '1rem', borderRadius: 8, textAlign: 'left',
    fontSize: '0.75rem', overflow: 'auto', maxHeight: 300,
  },
  btn: {
    marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
  },
};
