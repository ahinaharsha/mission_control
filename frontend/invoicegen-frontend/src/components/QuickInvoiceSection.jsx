import { useEffect, useState } from 'react';
import { validateForm, generateXML, downloadXML, downloadPDF, escapeXML } from '../utils/invoiceHelpers';

const EMPTY_ITEM = () => ({ desc: '', qty: '', rate: '' });

export default function QuickInvoiceSection({ onNavigate }) {
  const [form, setForm] = useState({
    fromName: '', fromEmail: '', fromAddress: '', fromPostcode: '',
    toName: '', toEmail: '', toAddress: '', toPostcode: '',
    items: [EMPTY_ITEM()],
  });
  const [xmlOut, setXmlOut] = useState('');
  const [showXML, setShowXML] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    const handler = (e) => onNavigate(e.detail);
    document.addEventListener('qi-navigate', handler);
    return () => document.removeEventListener('qi-navigate', handler);
  }, [onNavigate]);

  const setField = (key, val) => { setForm(f => ({ ...f, [key]: val })); setValidationErrors([]); };
  const setItem = (idx, key, val) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [key]: val };
      return { ...f, items };
    });
  };
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, EMPTY_ITEM()] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const handleGenerateXML = () => {
    const errs = validateForm(form);
    if (errs.length) { setValidationErrors(errs); return; }
    setValidationErrors([]);
    setXmlOut(generateXML(form));
    setShowXML(true);
  };

  const handleDownloadPDF = () => {
    const errs = validateForm(form);
    if (errs.length) { setValidationErrors(errs); return; }
    setValidationErrors([]);
    downloadPDF(form);
  };

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const postcodeRx = /^\d+$/;
  const emailErr = (val) => val && !emailRx.test(val);
  const postcodeErr = (val) => val && !postcodeRx.test(val);

  return (
    <section style={qs.section} id="quick-invoice">
      <style>{`
        .qi-input { background:rgba(255,255,255,0.05)!important;border:1px solid rgba(255,255,255,0.1)!important;border-radius:8px!important;color:#e4e8f0!important;font-size:0.875rem!important;padding:9px 12px!important;box-sizing:border-box!important;font-family:inherit!important;transition:border-color 0.2s ease, box-shadow 0.2s ease!important;min-width:0!important; }
        .qi-input:focus { outline:none!important;border-color:rgba(79,70,229,0.6)!important;box-shadow:0 0 0 3px rgba(79,70,229,0.15)!important; }
        .qi-input.qi-err { border-color:rgba(248,113,113,0.65)!important; }
        .qi-input.qi-err:focus { border-color:rgba(248,113,113,0.85)!important;box-shadow:0 0 0 3px rgba(248,113,113,0.18)!important; }
        .qi-input::placeholder { color:rgba(255,255,255,0.22)!important; }
        .qi-btn-ghost:hover { background:rgba(255,255,255,0.08)!important; }
        .qi-btn-primary:hover { background:#4338ca!important; }
        .qi-btn-green:hover { background:#00c97a!important; }
        .qi-remove:hover { color:#f87171!important; }
        .qi-xml-pre { scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent; }
        .qi-xml-pre::-webkit-scrollbar { width:4px; }
        .qi-xml-pre::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15);border-radius:4px; }
      `}</style>

      <div style={qs.inner}>
        <div style={qs.formCol}>
          <div style={qs.formCard}>
            <div style={qs.twoCol}>
              <div>
                <p style={qs.groupLabel}>Bill from</p>
                <div style={qs.fieldStack}>
                  <input className="qi-input" style={{width:'100%'}} placeholder="Your name / company" value={form.fromName} onChange={e => setField('fromName', e.target.value)} />
                  <input className={`qi-input${emailErr(form.fromEmail) ? ' qi-err' : ''}`} style={{width:'100%'}} placeholder="Email" value={form.fromEmail} onChange={e => setField('fromEmail', e.target.value)} />
                  <input className="qi-input" style={{width:'100%'}} placeholder="Address" value={form.fromAddress} onChange={e => setField('fromAddress', e.target.value)} />
                  <input className={`qi-input${postcodeErr(form.fromPostcode) ? ' qi-err' : ''}`} style={{width:'100%'}} placeholder="Postcode" value={form.fromPostcode} onChange={e => setField('fromPostcode', e.target.value)} />
                </div>
              </div>
              <div>
                <p style={qs.groupLabel}>Bill to</p>
                <div style={qs.fieldStack}>
                  <input className="qi-input" style={{width:'100%'}} placeholder="Client name / company" value={form.toName} onChange={e => setField('toName', e.target.value)} />
                  <input className={`qi-input${emailErr(form.toEmail) ? ' qi-err' : ''}`} style={{width:'100%'}} placeholder="Email" value={form.toEmail} onChange={e => setField('toEmail', e.target.value)} />
                  <input className="qi-input" style={{width:'100%'}} placeholder="Address" value={form.toAddress} onChange={e => setField('toAddress', e.target.value)} />
                  <input className={`qi-input${postcodeErr(form.toPostcode) ? ' qi-err' : ''}`} style={{width:'100%'}} placeholder="Postcode" value={form.toPostcode} onChange={e => setField('toPostcode', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={qs.divider} />

            <p style={qs.groupLabel}>Line items</p>
            <div style={qs.itemsHeader}>
              <span style={{ flex: 1 }}>Description</span>
              <span style={{ width: 60, textAlign: 'center' }}>Qty</span>
              <span style={{ width: 90, textAlign: 'right' }}>Rate (AUD)</span>
              <span style={{ width: 90, textAlign: 'right' }}>Amount</span>
              <span style={{ width: 28 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.items.map((item, idx) => {
                const amt = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                return (
                  <div key={idx} style={qs.itemRow}>
                    <input className="qi-input" style={{ flex: 1, width: 0 }} placeholder="Description" value={item.desc} onChange={e => setItem(idx, 'desc', e.target.value)} />
                    <input className="qi-input" style={{ width: 60, flexShrink: 0 }} placeholder="1" type="number" min="0" value={item.qty} onChange={e => setItem(idx, 'qty', e.target.value)} />
                    <input className="qi-input" style={{ width: 90, flexShrink: 0 }} placeholder="0.00" type="number" min="0" step="0.01" value={item.rate} onChange={e => setItem(idx, 'rate', e.target.value)} />
                    <span style={{ width: 90, textAlign: 'right', fontSize: '0.875rem', color: '#a0aec0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      ${amt.toFixed(2)}
                    </span>
                    {form.items.length > 1
                      ? <button className="qi-remove" style={qs.removeBtn} onClick={() => removeItem(idx)}>✕</button>
                      : <span style={{ width: 28 }} />}
                  </div>
                );
              })}
            </div>

            <button className="qi-btn-ghost" style={qs.addItemBtn} onClick={addItem}>+ Add line item</button>
            <div style={qs.divider} />

            <div style={qs.totalsBlock}>
              <div style={qs.totalRow}><span style={{ color: 'rgba(255,255,255,0.45)' }}>Subtotal</span><span>AUD ${subtotal.toFixed(2)}</span></div>
              <div style={qs.totalRow}><span style={{ color: 'rgba(255,255,255,0.45)' }}>GST (10%)</span><span>AUD ${gst.toFixed(2)}</span></div>
              <div style={{ ...qs.totalRow, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 4, fontSize: '1.05rem', fontWeight: 600 }}>
                <span style={{ color: '#fff' }}>Total</span>
                <span style={{ color: '#00e891' }}>AUD ${total.toFixed(2)}</span>
              </div>
            </div>

            <div style={qs.divider} />

            {validationErrors.length > 0 && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8 }}>
                {validationErrors.map((e, i) => <div key={i} style={{ color: '#f87171', fontSize: '0.83rem', lineHeight: 1.6 }}>• {e}</div>)}
              </div>
            )}

            <div style={qs.actions}>
              <button className="qi-btn-primary" style={qs.btnPrimary} onClick={handleGenerateXML}>Generate XML</button>
              <button className="qi-btn-green" style={qs.btnGreen} onClick={handleDownloadPDF}>Download PDF</button>
            </div>

            {showXML && xmlOut && (
              <div style={qs.xmlBlock}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>invoice.xml</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="qi-btn-ghost" style={qs.smallBtn} onClick={() => navigator.clipboard.writeText(xmlOut)}>Copy</button>
                    <button className="qi-btn-ghost" style={qs.smallBtn} onClick={() => downloadXML(xmlOut)}>Download</button>
                  </div>
                </div>
                <pre className="qi-xml-pre" style={qs.xmlPre}>{xmlOut}</pre>
              </div>
            )}
          </div>
        </div>

        <div style={qs.infoCol}>
          <div style={qs.infoSticky}>
            <div style={qs.infoTag}>Quick Invoice</div>
            <h2 style={qs.infoTitle}>Generate a professional invoice in seconds</h2>
            <p style={qs.infoText}>No account needed. Fill in your details, add your line items, and download a clean PDF or export the raw XML, all without leaving this page.</p>
            <div style={qs.featureList}>
              {[
                { icon: '⚡', title: 'Instant generation', desc: 'Your invoice is built in real time as you type.' },
                { icon: '📄', title: 'PDF & XML export', desc: 'Download a print-ready PDF or machine-readable XML.' },
                { icon: '🧮', title: 'GST calculated', desc: 'Australian GST (10%) is computed automatically.' },
              ].map((f) => (
                <div key={f.title} style={qs.featureItem}>
                  <div style={qs.featureIcon}>{f.icon}</div>
                  <div><div style={qs.featureTitle}>{f.title}</div><div style={qs.featureDesc}>{f.desc}</div></div>
                </div>
              ))}
            </div>
            <div style={qs.disclaimer}>
              <svg style={{ flexShrink: 0, marginTop: 2 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={qs.disclaimerText}>
                By using Quick Invoice, you will <strong style={{ color: 'rgba(255,255,255,0.7)' }}>not</strong> be able to retrieve, track, or update the invoice as it is not stored in our database. To store it within our database please{' '}
                <span style={qs.disclaimerLink} onClick={() => document.dispatchEvent(new CustomEvent('qi-navigate', { detail: 'login' }))}>login</span>
                {' '}or{' '}
                <span style={qs.disclaimerLink} onClick={() => document.dispatchEvent(new CustomEvent('qi-navigate', { detail: 'register' }))}>register</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const qs = {
  section: { position: 'relative', zIndex: 1, background: 'linear-gradient(180deg, #040a14 0%, #060d1c 100%)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '80px 24px 100px' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' },
  formCol: {},
  formCard: { background: 'rgba(13,21,37,0.9)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '36px 32px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 },
  groupLabel: { fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, marginTop: 0 },
  fieldStack: { display: 'flex', flexDirection: 'column', gap: 8 },
  divider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' },
  itemsHeader: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 2 },
  itemRow: { display: 'flex', gap: 8, alignItems: 'center' },
  removeBtn: { width: 28, height: 28, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '0.85rem', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s ease', flexShrink: 0, padding: 0 },
  addItemBtn: { marginTop: 10, background: 'transparent', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', padding: '8px 16px', cursor: 'pointer', transition: 'background 0.2s ease', width: '100%', fontFamily: 'inherit' },
  totalsBlock: { display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' },
  totalRow: { display: 'flex', gap: 32, fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', justifyContent: 'flex-end', width: '100%', maxWidth: 280 },
  actions: { display: 'flex', gap: 12 },
  btnPrimary: { flex: 1, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s ease', fontFamily: 'inherit' },
  btnGreen: { flex: 1, background: '#00b86a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s ease', fontFamily: 'inherit' },
  xmlBlock: { marginTop: 20, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px' },
  xmlPre: { margin: 0, fontFamily: 'monospace', fontSize: '0.78rem', color: '#7dd3a8', lineHeight: 1.6, overflowX: 'auto', maxHeight: 280, overflowY: 'auto' },
  smallBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', padding: '4px 10px', cursor: 'pointer', transition: 'background 0.2s ease', fontFamily: 'inherit' },
  infoCol: {},
  infoSticky: { position: 'sticky', top: 32 },
  infoTag: { display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: 'rgba(79,70,229,0.18)', border: '1px solid rgba(79,70,229,0.35)', color: '#a78bfa', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 20, textTransform: 'uppercase' },
  infoTitle: { fontSize: '1.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.25, margin: '0 0 16px' },
  infoText: { fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 28px' },
  featureList: { display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 },
  featureItem: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  featureIcon: { width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 },
  featureTitle: { fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 3 },
  featureDesc: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 },
  disclaimer: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)' },
  disclaimerText: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, margin: 0 },
  disclaimerLink: { color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline' },
};