import { useEffect, useRef, useState } from 'react';
import logo from '../assets/MCInvoicing_White.png';

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
      const res = await fetch(`/invoices/${invoiceId.trim()}/status`, { headers: { token } });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.message || `Error ${res.status}`); }
      const data = await res.json();
      setStatus(data.status ?? data);
    } catch (err) { setError(err.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose(); };
  const meta = status ? STATUS_META[status] ?? { color: '#fff', bg: 'rgba(255,255,255,0.08)', icon: '❓' } : null;

  return (
    <div ref={overlayRef} style={modalStyles.overlay} onClick={handleOverlayClick}>
      <style>{`
        @keyframes modalIn { from { opacity:0;transform:translateY(24px) scale(0.97);} to { opacity:1;transform:translateY(0) scale(1);} }
        @keyframes statusPop { from { opacity:0;transform:scale(0.88);} to { opacity:1;transform:scale(1);} }
        .track-input:focus { outline:none;border-color:rgba(79,70,229,0.7)!important;box-shadow:0 0 0 3px rgba(79,70,229,0.18); }
        .track-btn:hover:not(:disabled) { background:#4338ca!important; }
        .track-close:hover { color:rgba(255,255,255,0.8)!important; }
      `}</style>
      <div style={modalStyles.card}>
        <button className="track-close" style={modalStyles.closeBtn} onClick={onClose}>✕</button>
        <div style={modalStyles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h2 style={modalStyles.title}>Track Invoice</h2>
        <p style={modalStyles.subtitle}>Enter your Invoice ID to check its current status.</p>
        <div style={modalStyles.inputRow}>
          <input className="track-input" style={modalStyles.input} placeholder="e.g. INV-00123" value={invoiceId}
            onChange={e => { setInvoiceId(e.target.value); setError(''); setStatus(null); }}
            onKeyDown={e => e.key === 'Enter' && handleTrack()} />
          <button className="track-btn" style={{ ...modalStyles.btn, opacity: loading ? 0.7 : 1 }} onClick={handleTrack} disabled={loading}>
            {loading ? '…' : 'Check'}
          </button>
        </div>
        {error && <div style={modalStyles.error}>{error}</div>}
        {status && meta && (
          <div style={{ ...modalStyles.statusCard, background: meta.bg, borderColor: `${meta.color}33`, animation: 'statusPop 0.35s ease' }}>
            <span style={modalStyles.statusIcon}>{meta.icon}</span>
            <div>
              <div style={modalStyles.statusLabel}>Current status</div>
              <div style={{ ...modalStyles.statusValue, color: meta.color }}>{status}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginPromptModal({ onClose, onNavigate }) {
  const overlayRef = useRef(null);
  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose(); };
  return (
    <div ref={overlayRef} style={modalStyles.overlay} onClick={handleOverlayClick}>
      <div style={modalStyles.card}>
        <button className="track-close" style={modalStyles.closeBtn} onClick={onClose}>✕</button>
        <div style={modalStyles.iconWrap}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style={modalStyles.title}>Login required</h2>
        <p style={modalStyles.subtitle}>You must be logged in to track an invoice.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button style={{ ...modalStyles.btn, flex: 1 }} onClick={() => { onClose(); onNavigate('login'); }}>Login</button>
          <button style={{ ...modalStyles.btn, flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            onClick={() => { onClose(); onNavigate('register'); }}>Register</button>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Invoice helpers ────────────────────────────────────────────────────

function generateXML(form) {
  const date = new Date().toISOString().split('T')[0];
  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const itemsXML = form.items
    .filter(i => i.desc)
    .map((i, idx) => {
      const amount = (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0);
      return `    <item index="${idx + 1}">
      <description>${escapeXML(i.desc)}</description>
      <quantity>${i.qty || 0}</quantity>
      <unitRate>${(parseFloat(i.rate) || 0).toFixed(2)}</unitRate>
      <amount>${amount.toFixed(2)}</amount>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<invoice>
  <meta>
    <date>${date}</date>
    <currency>AUD</currency>
  </meta>
  <billFrom>
    <name>${escapeXML(form.fromName)}</name>
    <email>${escapeXML(form.fromEmail)}</email>
    <address>${escapeXML(form.fromAddress)}</address>
    <postcode>${escapeXML(form.fromPostcode)}</postcode>
  </billFrom>
  <billTo>
    <name>${escapeXML(form.toName)}</name>
    <email>${escapeXML(form.toEmail)}</email>
    <address>${escapeXML(form.toAddress)}</address>
    <postcode>${escapeXML(form.toPostcode)}</postcode>
  </billTo>
  <lineItems>
${itemsXML}
  </lineItems>
  <totals>
    <subtotal>${subtotal.toFixed(2)}</subtotal>
    <gst rate="10%">${gst.toFixed(2)}</gst>
    <total>${total.toFixed(2)}</total>
  </totals>
</invoice>`;
}

function escapeXML(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function downloadXML(xml) {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'invoice.xml'; a.click();
  URL.revokeObjectURL(url);
}

function validateForm(form) {
  const errors = [];
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const postcodeRx = /^\d+$/;

  if (form.fromEmail && !emailRx.test(form.fromEmail))
    errors.push('From email is not valid (must contain @).');
  if (form.toEmail && !emailRx.test(form.toEmail))
    errors.push('To email is not valid (must contain @).');
  if (form.fromPostcode && !postcodeRx.test(form.fromPostcode))
    errors.push('From postcode must be numbers only.');
  if (form.toPostcode && !postcodeRx.test(form.toPostcode))
    errors.push('To postcode must be numbers only.');

  return errors;
}

function downloadPDF(form) {
  const date = new Date().toISOString().split('T')[0];
  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const itemRows = form.items.filter(i => i.desc).map(i => {
    const amt = (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0);
    return `<tr>
      <td style="padding:7px 8px;border-bottom:1px solid #cccccc;font-size:9pt;">${escapeXML(i.desc)}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #cccccc;text-align:right;font-size:9pt;">${i.qty || 0}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #cccccc;text-align:right;font-size:9pt;">${(parseFloat(i.rate)||0).toFixed(2)}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #cccccc;text-align:right;font-size:9pt;">${amt.toFixed(2)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #222; background: #fff; padding: 50px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .invoice-title { font-size: 22pt; font-weight: 700; letter-spacing: 0.02em; color: #111; }
  .meta-table { font-size: 9pt; color: #444; text-align: right; line-height: 1.8; }
  .meta-label { color: #888; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
  .party-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 6px; }
  .party-name { font-size: 11pt; font-weight: 700; color: #111; margin-bottom: 2px; }
  .party-detail { font-size: 9pt; color: #555; line-height: 1.6; }
  .divider { border: none; border-top: 1px solid #ccc; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; }
  th { padding: 8px 8px; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; text-align: left; }
  th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
  td { font-size: 9pt; color: #333; }
  .totals { margin-left: auto; width: 260px; border-top: 1px solid #ccc; padding-top: 10px; }
  .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 9pt; color: #555; }
  .total-row span:last-child { font-variant-numeric: tabular-nums; }
  .total-final { display: flex; justify-content: space-between; padding: 8px 0 0; font-size: 11pt; font-weight: 700; color: #111; border-top: 1px solid #ccc; margin-top: 6px; }
  .footer { margin-top: 48px; font-size: 8pt; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
</style></head><body>
  <div class="header">
    <div class="invoice-title">INVOICE</div>
    <table class="meta-table" style="border:none;">
      <tr><td class="meta-label">Issue Date:&nbsp;</td><td>${date}</td></tr>
      <tr><td class="meta-label">Currency:&nbsp;</td><td>AUD</td></tr>
    </table>
  </div>
  <div class="parties">
    <div>
      <div class="party-label">From</div>
      <div class="party-name">${escapeXML(form.fromName)}</div>
      ${form.fromEmail ? `<div class="party-detail">${escapeXML(form.fromEmail)}</div>` : ''}
      ${form.fromAddress ? `<div class="party-detail">${escapeXML(form.fromAddress)}</div>` : ''}
      ${form.fromPostcode ? `<div class="party-detail">${escapeXML(form.fromPostcode)}</div>` : ''}
    </div>
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${escapeXML(form.toName)}</div>
      ${form.toEmail ? `<div class="party-detail">${escapeXML(form.toEmail)}</div>` : ''}
      ${form.toAddress ? `<div class="party-detail">${escapeXML(form.toAddress)}</div>` : ''}
      ${form.toPostcode ? `<div class="party-detail">${escapeXML(form.toPostcode)}</div>` : ''}
    </div>
  </div>
  <hr class="divider" />
  <table>
    <thead><tr>
      <th style="width:50%">Description</th>
      <th style="width:12%">Qty</th>
      <th style="width:18%">Rate</th>
      <th style="width:20%">Amount</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>AUD ${subtotal.toFixed(2)}</span></div>
    <div class="total-row"><span>Tax (GST 10%)</span><span>AUD ${gst.toFixed(2)}</span></div>
    <div class="total-final"><span>Total</span><span>AUD ${total.toFixed(2)}</span></div>
  </div>
  <div class="footer">Payment due within 30 days. Thank you for your business.</div>
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

const EMPTY_ITEM = () => ({ desc: '', qty: '', rate: '' });

function QuickInvoiceSection() {
  const [form, setForm] = useState({
    fromName: '', fromEmail: '', fromAddress: '', fromPostcode: '',
    toName: '', toEmail: '', toAddress: '', toPostcode: '',
    items: [EMPTY_ITEM()],
  });
  const [xmlOut, setXmlOut] = useState('');
  const [showXML, setShowXML] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setValidationErrors([]);
  };
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
    const xml = generateXML(form);
    setXmlOut(xml);
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
        {/* ── Left: Form ── */}
        <div style={qs.formCol}>
          <div style={qs.formCard}>

            {/* Parties */}
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

            {/* Line items */}
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
                    {form.items.length > 1 && (
                      <button className="qi-remove" style={qs.removeBtn} onClick={() => removeItem(idx)}>✕</button>
                    )}
                    {form.items.length === 1 && <span style={{ width: 28 }} />}
                  </div>
                );
              })}
            </div>

            <button className="qi-btn-ghost" style={qs.addItemBtn} onClick={addItem}>+ Add line item</button>

            <div style={qs.divider} />

            {/* Totals */}
            <div style={qs.totalsBlock}>
              <div style={qs.totalRow}><span style={{ color: 'rgba(255,255,255,0.45)' }}>Subtotal</span><span>AUD ${subtotal.toFixed(2)}</span></div>
              <div style={qs.totalRow}><span style={{ color: 'rgba(255,255,255,0.45)' }}>GST (10%)</span><span>AUD ${gst.toFixed(2)}</span></div>
              <div style={{ ...qs.totalRow, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 4, fontSize: '1.05rem', fontWeight: 600 }}>
                <span style={{ color: '#fff' }}>Total</span>
                <span style={{ color: '#00e891' }}>AUD ${total.toFixed(2)}</span>
              </div>
            </div>

            <div style={qs.divider} />

            {/* Actions */}
            {validationErrors.length > 0 && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8 }}>
                {validationErrors.map((e, i) => (
                  <div key={i} style={{ color: '#f87171', fontSize: '0.83rem', lineHeight: 1.6 }}>• {e}</div>
                ))}
              </div>
            )}

            <div style={qs.actions}>
              <button className="qi-btn-primary" style={qs.btnPrimary} onClick={handleGenerateXML}>Generate XML</button>
              <button className="qi-btn-green" style={qs.btnGreen} onClick={handleDownloadPDF}>Download PDF</button>
            </div>

            {/* XML Output */}
            {showXML && xmlOut && (
              <div style={qs.xmlBlock}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>invoice.xml</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="qi-btn-ghost" style={{ ...qs.smallBtn }} onClick={() => { navigator.clipboard.writeText(xmlOut); }}>Copy</button>
                    <button className="qi-btn-ghost" style={{ ...qs.smallBtn }} onClick={() => downloadXML(xmlOut)}>Download</button>
                  </div>
                </div>
                <pre className="qi-xml-pre" style={qs.xmlPre}>{xmlOut}</pre>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Info panel ── */}
        <div style={qs.infoCol}>
          <div style={qs.infoSticky}>
            <div style={qs.infoTag}>Quick Invoice</div>
            <h2 style={qs.infoTitle}>Generate a professional invoice in seconds</h2>
            <p style={qs.infoText}>
              No account needed. Fill in your details, add your line items, and download a clean PDF or export the raw XML, all without leaving this page.
            </p>

            <div style={qs.featureList}>
              {[
                { icon: '⚡', title: 'Instant generation', desc: 'Your invoice is built in real time as you type.' },
                { icon: '📄', title: 'PDF & XML export', desc: 'Download a print-ready PDF or machine-readable XML.' },
                { icon: '🧮', title: 'GST calculated', desc: 'Australian GST (10%) is computed automatically.' },
              ].map((f) => (
                <div key={f.title} style={qs.featureItem}>
                  <div style={qs.featureIcon}>{f.icon}</div>
                  <div>
                    <div style={qs.featureTitle}>{f.title}</div>
                    <div style={qs.featureDesc}>{f.desc}</div>
                  </div>
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
                <span style={qs.disclaimerLink} onClick={() => document.dispatchEvent(new CustomEvent('qi-navigate', { detail: 'register' }))}>sign up</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// pass onNavigate into QuickInvoiceSection via a small event bridge
function QuickInvoiceSectionWrapped({ onNavigate }) {
  useEffect(() => {
    const handler = (e) => onNavigate(e.detail);
    document.addEventListener('qi-navigate', handler);
    return () => document.removeEventListener('qi-navigate', handler);
  }, [onNavigate]);
  return <QuickInvoiceSection />;
}

export default function Home({ onNavigate, token }) {
  const canvasRef = useRef(null);
  const quickRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [showTrack, setShowTrack] = useState(false);

  useEffect(() => {
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
      { y: H*0.55, amp: 120, freq: 0.004, speed: 0.000015, phase: 0,   color: [0,255,150],   alpha: 0.55, thickness: 100 },
      { y: H*0.65, amp: 90,  freq: 0.005, speed: 0.00002,  phase: 2.1, color: [80,200,255],  alpha: 0.38, thickness: 60  },
      { y: H*0.50, amp: 75,  freq: 0.003, speed: 0.00001,  phase: 4.3, color: [0,255,120],   alpha: 0.3,  thickness: 45  },
      { y: H*0.72, amp: 60,  freq: 0.006, speed: 0.000025, phase: 1.0, color: [140,100,255], alpha: 0.25, thickness: 40  },
      { y: H*0.48, amp: 50,  freq: 0.004, speed: 0.000013, phase: 3.5, color: [0,200,180],   alpha: 0.2,  thickness: 35  },
    ];
    let t = 0, rafId;
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

  const scrollToQuick = () => {
    quickRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={styles.page}>
      <style>{`
        .nav-link:hover { color:rgba(255,255,255,0.9)!important;text-shadow:0 0 12px rgba(255,255,255,0.3); }
        .hero-fade { opacity:0;transform:translateY(32px);transition:opacity 0.9s ease,transform 0.9s ease; }
        .hero-fade.visible { opacity:1;transform:translateY(0); }
        .mockup-fade { opacity:0;transform:translateY(48px);transition:opacity 1.1s ease 0.4s,transform 1.1s ease 0.4s; }
        .mockup-fade.visible { opacity:1;transform:translateY(0); }
        .hero-btn-primary:hover { background:#4338ca!important; }
        .hero-btn-ghost:hover { background:rgba(255,255,255,0.08)!important;border-color:rgba(255,255,255,0.25)!important; }
      `}</style>

      {/* ── Hero section: canvas is scoped inside this wrapper ── */}
      <div style={styles.heroSection}>
        <canvas ref={canvasRef} style={styles.canvas} />

        <nav style={styles.nav}>
          <img src={logo} alt="MC Invoicing" style={{ ...styles.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
          <div style={styles.navLinks}>
            <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('retrieve')}>Retrieve</span>
            <span className="nav-link" style={styles.navLink} onClick={() => token ? setShowTrack(true) : setShowTrack('login')}>Track</span>
            {token ? (
              <>
                <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('app')}>Create Invoice</span>
                <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('update')}>Update Invoice</span>
                <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('profile')}>Profile</span>
              </>
            ) : (
              <>
                <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('login')}>Login</span>
                <span className="nav-link" style={styles.navLink} onClick={() => onNavigate('register')}>Register</span>
              </>
            )}
          </div>
        </nav>

        <div style={styles.heroContainer}>
          <div className={`hero-fade${visible ? ' visible' : ''}`} style={styles.hero}>
            <h1 style={styles.heroTitle}>Free, smart invoicing<br />built to move fast</h1>
            <p style={styles.heroSubtitle}>
              MC Invoicing is a streamlined, efficient, and completely free e-invoicing solution. Generate and manage professional invoices in seconds, no unnecessary steps, no wasted time.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {token ? (
                <button className="hero-btn-primary" style={styles.heroBtn} onClick={() => onNavigate('app')}>
                  Create an invoice →
                </button>
              ) : (
                <>
                  <button className="hero-btn-primary" style={styles.heroBtn} onClick={scrollToQuick}>
                    Quick invoice (no login) →
                  </button>
                  <button className="hero-btn-ghost" style={styles.heroBtnGhost} onClick={() => onNavigate('register')}>
                    Sign up free
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={`mockup-fade${visible ? ' visible' : ''}`} style={styles.mockupWrapper}>
            <div style={styles.mockup}>
              <div style={styles.mockupHeader}>
                <span style={styles.mockupHeaderText}>INVOICE</span>
              </div>
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
                  <div style={{ flex: 1 }}><span style={styles.mockupLabel}>Description</span><div style={styles.mockupLine} /></div>
                  <div style={{ width: 60 }}><span style={styles.mockupLabel}>Qty</span><div style={styles.mockupLine} /></div>
                  <div style={{ width: 80 }}><span style={styles.mockupLabel}>Rate</span><div style={styles.mockupLine} /></div>
                  <div style={{ width: 80 }}><span style={styles.mockupLabel}>Amount</span><div style={styles.mockupLine} /></div>
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
      </div>{/* end heroSection */}

      {/* ── Quick Invoice Section (no canvas bleed) ── */}
      <div ref={quickRef}>
        <QuickInvoiceSectionWrapped onNavigate={onNavigate} />
      </div>

      {showTrack === true && <TrackModal token={token} onClose={() => setShowTrack(false)} />}
      {showTrack === 'login' && <LoginPromptModal onClose={() => setShowTrack(false)} onNavigate={onNavigate} />}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh', width: '100%', flex: 1,
    background: 'linear-gradient(180deg, #030810 0%, #060e18 35%, #040a14 100%)',
    display: 'flex', flexDirection: 'column',
  },
  // NEW: scopes the canvas to only the hero area
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
  heroTitle: { fontSize: '3rem', fontWeight: 700, color: '#ffffff', margin: '0 0 1.25rem', lineHeight: 1.15 },
  heroSubtitle: { fontSize: '1.05rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 2rem' },
  heroBtn: {
    padding: '0.85rem 2rem', background: '#4f46e5', color: '#ffffff',
    border: 'none', borderRadius: 999, fontSize: '1rem', fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.2s ease',
  },
  heroBtnGhost: {
    padding: '0.85rem 2rem', background: 'transparent', color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, fontSize: '1rem', fontWeight: 500,
    cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease',
  },
  mockupWrapper: { width: '100%', maxWidth: 720 },
  mockup: {
    background: 'rgba(15,20,40,0.85)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, overflow: 'hidden',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  },
  mockupHeader: { background: '#4f46e5', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end' },
  mockupHeaderText: { color: '#ffffff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em' },
  mockupBody: { padding: '24px' },
  mockupRow: { display: 'flex', gap: 16, marginBottom: 16 },
  mockupBox: { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px' },
  mockupLabel: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 6 },
  mockupLine: { height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 6, width: '80%' },
  mockupDivider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' },
};

const qs = {
  section: {
    position: 'relative', zIndex: 1,
    background: 'linear-gradient(180deg, #040a14 0%, #060d1c 100%)',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    padding: '80px 24px 100px',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto',
    display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start',
  },
  formCol: {},
  formCard: {
    background: 'rgba(13,21,37,0.9)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 20, padding: '36px 32px',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 },
  groupLabel: { fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, marginTop: 0 },
  fieldStack: { display: 'flex', flexDirection: 'column', gap: 8 },
  divider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' },
  itemsHeader: {
    display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8,
    fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 2,
  },
  itemRow: { display: 'flex', gap: 8, alignItems: 'center' },
  removeBtn: {
    width: 28, height: 28, background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '0.85rem',
    borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'color 0.2s ease', flexShrink: 0, padding: 0,
  },
  addItemBtn: {
    marginTop: 10, background: 'transparent', border: '1px dashed rgba(255,255,255,0.12)',
    borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem',
    padding: '8px 16px', cursor: 'pointer', transition: 'background 0.2s ease',
    width: '100%', fontFamily: 'inherit',
  },
  totalsBlock: { display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' },
  totalRow: { display: 'flex', gap: 32, fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', justifyContent: 'flex-end', width: '100%', maxWidth: 280 },
  actions: { display: 'flex', gap: 12 },
  btnPrimary: {
    flex: 1, background: '#4f46e5', color: '#fff', border: 'none',
    borderRadius: 10, padding: '12px 0', fontWeight: 600, fontSize: '0.9rem',
    cursor: 'pointer', transition: 'background 0.2s ease', fontFamily: 'inherit',
  },
  btnGreen: {
    flex: 1, background: '#00b86a', color: '#fff', border: 'none',
    borderRadius: 10, padding: '12px 0', fontWeight: 600, fontSize: '0.9rem',
    cursor: 'pointer', transition: 'background 0.2s ease', fontFamily: 'inherit',
  },
  xmlBlock: {
    marginTop: 20, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '14px 16px',
  },
  xmlPre: {
    margin: 0, fontFamily: 'monospace', fontSize: '0.78rem',
    color: '#7dd3a8', lineHeight: 1.6, overflowX: 'auto',
    maxHeight: 280, overflowY: 'auto',
  },
  smallBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem',
    padding: '4px 10px', cursor: 'pointer', transition: 'background 0.2s ease', fontFamily: 'inherit',
  },

  // Info panel
  infoCol: {},
  infoSticky: { position: 'sticky', top: 32 },
  infoTag: {
    display: 'inline-block', padding: '4px 12px', borderRadius: 999,
    background: 'rgba(79,70,229,0.18)', border: '1px solid rgba(79,70,229,0.35)',
    color: '#a78bfa', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em',
    marginBottom: 20, textTransform: 'uppercase',
  },
  infoTitle: { fontSize: '1.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.25, margin: '0 0 16px' },
  infoText: { fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 28px' },
  featureList: { display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 },
  featureItem: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  featureIcon: {
    width: 36, height: 36, borderRadius: 9,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1rem', flexShrink: 0,
  },
  featureTitle: { fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 3 },
  featureDesc: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 },
  disclaimer: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    padding: '14px 16px', borderRadius: 10,
    background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)',
  },
  disclaimerText: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, margin: 0 },
  disclaimerLink: { color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline' },
};

const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    position: 'relative',
    background: 'linear-gradient(160deg, #0d1525 0%, #080f1e 100%)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20, padding: '40px 36px 36px',
    width: '100%', maxWidth: 420,
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    animation: 'modalIn 0.3s ease',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 18,
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
    fontSize: '1rem', cursor: 'pointer', transition: 'color 0.2s ease', lineHeight: 1,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 14,
    background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { color: '#fff', fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 28px' },
  inputRow: { display: 'flex', gap: 10 },
  input: {
    flex: 1, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '11px 16px',
    color: '#fff', fontSize: '0.95rem',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease', fontFamily: 'inherit',
  },
  btn: {
    background: '#4f46e5', color: '#fff', border: 'none',
    borderRadius: 10, padding: '11px 20px',
    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
    transition: 'background 0.2s ease', whiteSpace: 'nowrap', fontFamily: 'inherit',
  },
  error: {
    marginTop: 14, padding: '10px 14px',
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: 8, color: '#f87171', fontSize: '0.85rem',
  },
  statusCard: {
    marginTop: 20, padding: '16px 20px',
    border: '1px solid', borderRadius: 12,
    display: 'flex', alignItems: 'center', gap: 16,
  },
  statusIcon: { fontSize: '1.8rem', lineHeight: 1 },
  statusLabel: { color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: 4 },
  statusValue: { fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.01em' },
};