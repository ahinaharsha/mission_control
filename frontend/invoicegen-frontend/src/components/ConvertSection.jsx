import { useRef, useState } from 'react';
import { parseXMLToInvoice, parseJSONToInvoice, buildAndPrintPDF } from '../utils/invoiceHelpers';

export default function ConvertSection() {
  const [mode, setMode] = useState('xml');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleConvert = () => {
    setError(''); setSuccess(false);
    if (!input.trim()) { setError('Please paste or upload your invoice data first.'); return; }
    try {
      const inv = mode === 'xml' ? parseXMLToInvoice(input.trim()) : parseJSONToInvoice(input.trim());
      buildAndPrintPDF(inv);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.message || 'Could not parse the file. Check the format and try again.');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'json') setMode('json');
    else if (ext === 'xml') setMode('xml');
    const reader = new FileReader();
    reader.onload = (e) => { setInput(e.target.result); setError(''); setSuccess(false); };
    reader.readAsText(file);
  };

  const features = [
    { icon: '⚡', title: 'Quick formatting',     desc: 'Paste raw XML or JSON and get a clean, print-ready invoice instantly, no reformatting required.' },
    { icon: '🔄', title: 'Quick converting',     desc: 'One click converts your data to a professional PDF. No account, no uploads to a server.' },
    { icon: '📂', title: 'Drag & drop files',    desc: 'Drop a .xml or .json file directly onto the editor and the format is detected automatically.' },
    { icon: '🛡️', title: 'Stays on your device', desc: 'Everything runs in your browser. Your invoice data never leaves your machine.' },
  ];

  return (
    <section style={cvs.section}>
      <style>{`
        .cv-tab { transition: background 0.2s, color 0.2s, border-color 0.2s; }
        .cv-tab:hover:not(.cv-tab-active) { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.65) !important; }
        .cv-textarea { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
        .cv-textarea::-webkit-scrollbar { width: 4px; }
        .cv-textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }
        .cv-textarea:focus { outline: none; border-color: rgba(79,70,229,0.6) !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.14) !important; }
        .cv-btn-convert:hover { background: #4338ca !important; }
        .cv-btn-clear:hover { background: rgba(255,255,255,0.09) !important; }
        .cv-upload:hover { border-color: rgba(79,70,229,0.45) !important; background: rgba(79,70,229,0.07) !important; }
        @keyframes cvFadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={cvs.inner}>
        <div style={cvs.infoCol}>
          <div style={cvs.infoSticky}>
            <div style={cvs.tag}>Quick Convert</div>
            <h2 style={cvs.infoTitle}>Quick formatting &amp;<br />quick converting to PDF</h2>
            <p style={cvs.infoText}>Already have an invoice as XML or JSON? Skip the typing. Paste your data, hit convert, and a PDF is opened immediately, ready to print or save instantly.</p>
            <div style={cvs.featureList}>
              {features.map((f) => (
                <div key={f.title} style={cvs.featureItem}>
                  <div style={cvs.featureIcon}>{f.icon}</div>
                  <div><div style={cvs.featureTitle}>{f.title}</div><div style={cvs.featureDesc}>{f.desc}</div></div>
                </div>
              ))}
            </div>
            <div style={cvs.formatBadges}>
              {['XML', 'JSON'].map((fmt) => (
                <div key={fmt} style={cvs.badge}><span style={cvs.badgeDot} />{fmt} supported</div>
              ))}
            </div>
          </div>
        </div>

        <div style={cvs.formCol}>
          <div style={cvs.card}>
            <div style={cvs.cardHeader}>
              <div>
                <p style={cvs.cardLabel}>Input format</p>
                <div style={cvs.tabs}>
                  {['xml', 'json'].map((m) => (
                    <button key={m} className={`cv-tab${mode === m ? ' cv-tab-active' : ''}`}
                      style={mode === m ? cvs.tabActive : cvs.tab}
                      onClick={() => { setMode(m); setError(''); setSuccess(false); }}>
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <input ref={fileRef} type="file" accept=".xml,.json" style={{ display: 'none' }}
                  onChange={(e) => handleFile(e.target.files?.[0])} />
                <button className="cv-upload" style={cvs.uploadBtn} onClick={() => fileRef.current?.click()}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload file
                </button>
              </div>
            </div>

            <div style={{ ...cvs.dropZone, ...(dragging ? cvs.dropZoneActive : {}) }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}>
              {!input && !dragging && (
                <div style={cvs.dropHint}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Drop a .{mode} file here, or paste below</span>
                </div>
              )}
              {dragging && (
                <div style={{ ...cvs.dropHint, color: '#a78bfa' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Release to load file</span>
                </div>
              )}
              <textarea className="cv-textarea" style={{ ...cvs.textarea, opacity: dragging ? 0 : 1 }}
                value={input} onChange={(e) => { setInput(e.target.value); setError(''); setSuccess(false); }}
                placeholder={mode === 'xml' ? '<?xml version="1.0"?>\n<invoice>…</invoice>' : '{\n  "billFrom": {…},\n  "lineItems": […]\n}'}
                spellCheck={false} />
            </div>

            {error && (
              <div style={cvs.errorBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div style={cvs.successBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e891" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>PDF opened — use your browser's print dialog to save.</span>
              </div>
            )}

            <div style={cvs.actions}>
              <button className="cv-btn-convert" style={cvs.btnConvert} onClick={handleConvert}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 7 }}>
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Convert to PDF
              </button>
              {input && (
                <button className="cv-btn-clear" style={cvs.btnClear}
                  onClick={() => { setInput(''); setError(''); setSuccess(false); }}>
                  Clear
                </button>
              )}
            </div>

            <p style={cvs.footerNote}>
              Expected schema matches MC Invoicing XML / JSON output. Fields absent from the source are simply omitted from the PDF.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const cvs = {
  section: { position: 'relative', background: 'linear-gradient(180deg, #060d1c 0%, #040a14 100%)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '80px 24px 100px' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 48, alignItems: 'start' },
  infoCol: {},
  infoSticky: { position: 'sticky', top: 32 },
  tag: { display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: 'rgba(0,232,145,0.12)', border: '1px solid rgba(0,232,145,0.28)', color: '#00e891', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 20, textTransform: 'uppercase' },
  infoTitle: { fontSize: '1.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.25, margin: '0 0 16px' },
  infoText: { fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 28px' },
  featureList: { display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 },
  featureItem: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  featureIcon: { width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 },
  featureTitle: { fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 3 },
  featureDesc: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 },
  formatBadges: { display: 'flex', gap: 10 },
  badge: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 500 },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: '#00e891', flexShrink: 0 },
  formCol: {},
  card: { background: 'rgba(13,21,37,0.9)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '32px 32px 28px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, gap: 12 },
  cardLabel: { fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, marginTop: 0 },
  tabs: { display: 'flex', gap: 6 },
  tab: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', fontWeight: 600, padding: '6px 18px', cursor: 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit' },
  tabActive: { background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.45)', borderRadius: 8, color: '#a78bfa', fontSize: '0.82rem', fontWeight: 600, padding: '6px 18px', cursor: 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit' },
  uploadBtn: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', padding: '7px 14px', cursor: 'pointer', transition: 'background 0.2s ease, border-color 0.2s ease', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  dropZone: { position: 'relative', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, overflow: 'hidden', marginBottom: 16, transition: 'border-color 0.2s ease' },
  dropZoneActive: { border: '1px solid rgba(167,139,250,0.5)', background: 'rgba(79,70,229,0.06)' },
  dropHint: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem', pointerEvents: 'none', zIndex: 1, gap: 2 },
  textarea: { display: 'block', width: '100%', height: 280, background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 12, color: '#7dd3a8', fontFamily: "'Courier New', Courier, monospace", fontSize: '0.78rem', lineHeight: 1.65, padding: '16px 18px', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' },
  errorBox: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'rgba(248,113,113,0.09)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', fontSize: '0.84rem', marginBottom: 14, lineHeight: 1.5 },
  successBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(0,232,145,0.08)', border: '1px solid rgba(0,232,145,0.22)', borderRadius: 8, color: '#00e891', fontSize: '0.84rem', marginBottom: 14, animation: 'cvFadeIn 0.3s ease' },
  actions: { display: 'flex', gap: 10, marginBottom: 16 },
  btnConvert: { display: 'flex', alignItems: 'center', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s ease', fontFamily: 'inherit' },
  btnClear: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s ease', fontFamily: 'inherit' },
  footerNote: { margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 },
};