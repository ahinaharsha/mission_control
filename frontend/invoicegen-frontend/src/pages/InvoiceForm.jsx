import { useState, useEffect, useRef } from 'react';
import { createInvoice } from '../api/client';
import { buildOrderXML } from '../utils/xmlBuilder';
import logo from '../assets/MCInvoicing_White.png';

const emptyAddress = { street: '', city: '', postcode: '', country: '' };

const defaultForm = {
  from: { businessName: '', taxId: '', abnNumber: '', address: { ...emptyAddress } },
  customer: { id: '', fullName: '', email: '', phone: '', billingAddress: { ...emptyAddress }, shippingAddress: { ...emptyAddress } },
  lineItems: [{ description: '', quantity: 1, rate: '' }],
  currency: 'AUD',
};

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

export default function InvoiceForm({ token, onLogout, onNavigate }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function setFrom(field, value) { setForm(f => ({ ...f, from: { ...f.from, [field]: value } })); }
  function setFromAddress(field, value) { setForm(f => ({ ...f, from: { ...f.from, address: { ...f.from.address, [field]: value } } })); }
  function setCustomer(field, value) { setForm(f => ({ ...f, customer: { ...f.customer, [field]: value } })); }
  function setCustomerBilling(field, value) { setForm(f => ({ ...f, customer: { ...f.customer, billingAddress: { ...f.customer.billingAddress, [field]: value } } })); }
  function setLineItem(index, field, value) {
    setForm(f => {
      const items = [...f.lineItems];
      items[index] = { ...items[index], [field]: field === 'quantity' ? Number(value) : value };
      return { ...f, lineItems: items };
    });
  }
  function addLineItem() { setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: '', quantity: 1, rate: 0 }] })); }
  function removeLineItem(index) { setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== index) })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const xml = buildOrderXML(form);
      const data = await createInvoice(xml, token);
      if (data.invoiceId) {
        const saved = JSON.parse(localStorage.getItem('invoices') || '[]');
        saved.unshift({ id: data.invoiceId, customer: form.customer.fullName, createdAt: new Date().toLocaleDateString() });
        localStorage.setItem('invoices', JSON.stringify(saved));
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const subtotal = form.lineItems.reduce((sum, i) => sum + i.quantity * (parseFloat(i.rate) || 0), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div style={s.page}>
      <SpaceBackground />
      <style>{`
        .nav-link:hover { color: rgba(255,255,255,0.9) !important; text-shadow: 0 0 12px rgba(255,255,255,0.3); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .page-fade { animation: fadeIn 0.5s ease forwards; }
      `}</style>
      <nav style={s.nav}>
        <img src={logo} alt="MC Invoicing" style={{ ...s.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={s.navLinks}>
          <span className="nav-link" style={s.navLink} onClick={() => onNavigate('retrieve')}>Retrieve</span>
          <span style={{ ...s.navLink, ...s.navLinkActive }}>Create Invoice</span>
          <span className="nav-link" style={s.navLink} onClick={() => onNavigate('profile')}>Profile</span>
        </div>
      </nav>

      <div className="page-fade" style={s.container}>
        {result ? (
          <div style={s.card}>
            <h2 style={{ color: '#00e891', margin: '0 0 0.5rem' }}>✅ Invoice Created!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>{result.message}</p>
            {result.invoiceId && (
              <div style={s.invoiceIdBox}>
                <span style={s.invoiceIdLabel}>Your Invoice ID</span>
                <span style={s.invoiceIdValue}>{result.invoiceId}</span>
                <span style={s.invoiceIdHint}>Save this ID — you'll need it to retrieve your invoice.</span>
                <button style={s.copyBtn} onClick={() => { navigator.clipboard.writeText(result.invoiceId); alert('Copied!'); }}>
                  Copy ID
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button style={s.primaryBtn} onClick={() => { setResult(null); setForm(defaultForm); }}>+ Create Another</button>
              <button style={s.secondaryBtn} onClick={() => onNavigate('retrieve')}>🔍 Retrieve Invoice</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 860 }}>
            <h1 style={s.pageTitle}>Create Invoice</h1>

            <div style={s.section}>
              <h2 style={s.sectionTitle}>From (Your Business)</h2>
              <div style={s.grid2}>
                <Field label="Business Name" value={form.from.businessName} onChange={v => setFrom('businessName', v)} required />
                <Field label="ABN Number" value={form.from.abnNumber} onChange={v => setFrom('abnNumber', v)} required />
                <Field label="Tax ID" value={form.from.taxId} onChange={v => setFrom('taxId', v)} />
                <Field label="Street" value={form.from.address.street} onChange={v => setFromAddress('street', v)} required />
                <Field label="City" value={form.from.address.city} onChange={v => setFromAddress('city', v)} required />
                <Field label="Postcode" value={form.from.address.postcode} onChange={v => setFromAddress('postcode', v)} required />
                <Field label="Country Code (e.g. AU)" value={form.from.address.country} onChange={v => setFromAddress('country', v)} required />
              </div>
            </div>

            <div style={s.section}>
              <h2 style={s.sectionTitle}>Bill To (Customer)</h2>
              <div style={s.grid2}>
                <Field label="Full Name" value={form.customer.fullName} onChange={v => setCustomer('fullName', v)} required />
                <Field label="Email" type="email" value={form.customer.email} onChange={v => setCustomer('email', v)} required />
                <Field label="Phone" value={form.customer.phone} onChange={v => setCustomer('phone', v)} required />
                <Field label="Customer ID (optional)" value={form.customer.id} onChange={v => setCustomer('id', v)} />
              </div>
              <h3 style={s.subTitle}>Billing Address</h3>
              <div style={s.grid2}>
                <Field label="Street" value={form.customer.billingAddress.street} onChange={v => setCustomerBilling('street', v)} required />
                <Field label="City" value={form.customer.billingAddress.city} onChange={v => setCustomerBilling('city', v)} required />
                <Field label="Postcode" value={form.customer.billingAddress.postcode} onChange={v => setCustomerBilling('postcode', v)} required />
                <Field label="Country Code (e.g. AU)" value={form.customer.billingAddress.country} onChange={v => setCustomerBilling('country', v)} required />
              </div>
            </div>

            <div style={s.section}>
              <h2 style={s.sectionTitle}>Line Items</h2>
              <p style={s.note}>⚠️ The backend currently processes only the first line item.</p>
              {form.lineItems.map((item, i) => (
                <div key={i} style={s.lineItemRow}>
                  <div style={{ flex: 3, minWidth: 160 }}>
                    <label style={s.label}>Description</label>
                    <input style={s.input} value={item.description} onChange={e => setLineItem(i, 'description', e.target.value)} required />
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <label style={s.label}>Qty</label>
                    <input style={s.input} type="number" min="1" value={item.quantity} onChange={e => setLineItem(i, 'quantity', e.target.value)} required />
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={s.label}>Rate ({form.currency})</label>
                    <input style={s.input} type="number" min="0" step="0.01" value={item.rate} onChange={e => setLineItem(i, 'rate', e.target.value)} required />
                  </div>
                  <div style={{ flex: 1, minWidth: 100, paddingTop: 22 }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{form.currency} {(item.quantity * item.rate).toFixed(2)}</span>
                  </div>
                  {form.lineItems.length > 1 && (
                    <button type="button" style={s.removeBtn} onClick={() => removeLineItem(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" style={s.addBtn} onClick={addLineItem}>+ Add Line Item</button>
              <div style={s.totals}>
                <div style={s.totalRow}><span>Subtotal</span><span>{form.currency} {subtotal.toFixed(2)}</span></div>
                <div style={s.totalRow}><span>GST (10%)</span><span>{form.currency} {tax.toFixed(2)}</span></div>
                <div style={{ ...s.totalRow, fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                  <span>Total</span><span>{form.currency} {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={s.section}>
              <h2 style={s.sectionTitle}>Currency</h2>
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>Currency</label>
                  <select style={s.input} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="AUD">AUD</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="NZD">NZD</option>
                  </select>
                </div>
              </div>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}
            <button type="submit" style={s.submitBtn} disabled={loading}>
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
      <label style={s.label}>{label}{required && ' *'}</label>
      <input style={s.input} type={type} value={value} onChange={e => onChange(e.target.value)} required={required} />
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', background: '#000008',
    fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column',
  },
  nav: {
    position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '10px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxSizing: 'border-box',
  },
  logo: { height: 60 },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: {
    color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', fontWeight: 500,
    cursor: 'pointer', userSelect: 'none', paddingBottom: 2, borderBottom: '2px solid transparent',
  },
  navLinkActive: { color: '#ffffff', borderBottom: '2px solid rgba(255,255,255,0.6)' },
  container: {
    position: 'relative', zIndex: 1, flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '2rem 1rem',
  },
  pageTitle: { color: '#ffffff', fontSize: '1.6rem', fontWeight: 600, margin: '0 0 1.5rem', alignSelf: 'flex-start', width: '100%', maxWidth: 860 },
  section: {
    width: '100%', background: 'rgba(15,20,40,0.85)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 },
  subTitle: { margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  input: {
    width: '100%', padding: '0.55rem 0.75rem', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 7, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none',
    background: 'rgba(255,255,255,0.06)', color: '#ffffff',
  },
  lineItemRow: { display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem', flexWrap: 'wrap' },
  removeBtn: {
    padding: '0.55rem 0.75rem', background: 'rgba(255,80,80,0.1)', color: '#ff6b6b',
    border: '1px solid rgba(255,80,80,0.25)', borderRadius: 7, cursor: 'pointer', fontWeight: 700,
  },
  addBtn: {
    padding: '0.5rem 1rem', background: 'rgba(79,70,229,0.15)', color: '#a5b4fc',
    border: '1px solid rgba(79,70,229,0.3)', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
  },
  totals: {
    marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem',
    maxWidth: 320, marginLeft: 'auto',
  },
  totalRow: { display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: 'rgba(255,255,255,0.6)' },
  note: {
    fontSize: '0.8rem', color: '#fbbf24', margin: '0 0 1rem',
    background: 'rgba(251,191,36,0.08)', padding: '0.4rem 0.75rem', borderRadius: 6,
    border: '1px solid rgba(251,191,36,0.2)',
  },
  submitBtn: {
    width: '100%', maxWidth: 860, padding: '0.9rem', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
    marginBottom: '2rem',
  },
  errorBox: {
    width: '100%', maxWidth: 860, color: '#ff6b6b', background: 'rgba(255,80,80,0.1)',
    padding: '0.75rem', borderRadius: 8, marginBottom: '1rem',
    border: '1px solid rgba(255,80,80,0.25)',
  },
  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: '2.5rem', maxWidth: 520, width: '100%', textAlign: 'center',
  },
  invoiceIdBox: {
    background: 'rgba(0,232,145,0.07)', border: '1px solid rgba(0,232,145,0.25)',
    borderRadius: 10, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
  },
  invoiceIdLabel: { fontSize: '0.75rem', color: 'rgba(0,232,145,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  invoiceIdValue: { fontSize: '1rem', color: '#00e891', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 700 },
  invoiceIdHint: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' },
  copyBtn: {
    marginTop: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(0,232,145,0.15)',
    border: '1px solid rgba(0,232,145,0.3)', borderRadius: 6, color: '#00e891',
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'center',
  },
  primaryBtn: {
    padding: '0.65rem 1.4rem', background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '0.65rem 1.4rem', background: 'rgba(255,255,255,0.06)', color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: '0.95rem',
    fontWeight: 500, cursor: 'pointer',
  },
};