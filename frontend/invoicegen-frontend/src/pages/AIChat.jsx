import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import logo from '../assets/MCInvoicing_White.png';
import { chatWithAI, clearAIChatHistory, updateUserTier } from '../api/client';

const s = {
  page: {
    minHeight: '100vh',
    background: '#0a0d1a',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Segoe UI', sans-serif",
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  canvas: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  nav: {
    position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '10px 32px', boxSizing: 'border-box',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logo: { height: 60 },
  navLinks: { display: 'flex', gap: '1.5rem', alignItems: 'center' },
  navLink: {
    color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', fontWeight: 500,
    cursor: 'pointer', userSelect: 'none', paddingBottom: 2,
    borderBottom: '2px solid transparent', transition: 'color 0.2s ease, text-shadow 0.2s ease',
  },
  navLinkActive: { color: '#a5b4fc', borderBottom: '2px solid #a5b4fc' },
  body: {
    position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '2rem 1rem 1rem', boxSizing: 'border-box', maxWidth: 800,
    margin: '0 auto', width: '100%',
  },
  header: { textAlign: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', margin: '0.4rem 0 0' },
  tierBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
    borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, marginTop: '0.75rem',
    cursor: 'pointer', transition: 'opacity 0.2s',
  },
  tierStandard: { background: 'rgba(165,180,252,0.15)', border: '1px solid rgba(165,180,252,0.3)', color: '#a5b4fc' },
  tierPro: { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' },
  remainingBar: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '10px 16px', marginBottom: '1rem', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.5)',
  },
  remainingCount: { color: '#a5b4fc', fontWeight: 600 },
  chatBox: {
    width: '100%', flex: 1, background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: '1.25rem', overflowY: 'auto', marginBottom: '1rem',
    minHeight: 320, maxHeight: 'calc(100vh - 380px)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.2)', gap: 8,
  },
  emptyIcon: { fontSize: '2.5rem' },
  emptyText: { fontSize: '0.9rem' },
  msgRow: { display: 'flex', gap: 10 },
  msgRowUser: { flexDirection: 'row-reverse' },
  bubble: {
    maxWidth: '75%', padding: '10px 14px', borderRadius: 14, fontSize: '0.9rem',
    lineHeight: 1.6, wordBreak: 'break-word',
  },
  bubbleUser: {
    background: 'rgba(165,180,252,0.2)', border: '1px solid rgba(165,180,252,0.3)',
    color: '#e0e7ff', borderTopRightRadius: 4,
  },
  bubbleAI: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.85)', borderTopLeftRadius: 4,
  },
  bubbleLoading: { color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
  avatar: {
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
    marginTop: 2,
  },
  avatarAI: { background: 'rgba(165,180,252,0.2)', border: '1px solid rgba(165,180,252,0.3)', color: '#a5b4fc' },
  avatarUser: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' },
  inputRow: {
    display: 'flex', gap: 10, width: '100%', alignItems: 'flex-end',
  },
  textarea: {
    flex: 1, background: 'rgba(15,20,40,0.85)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: '0.92rem', resize: 'none',
    fontFamily: 'inherit', outline: 'none', lineHeight: 1.5, minHeight: 48, maxHeight: 120,
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
    borderRadius: 12, padding: '12px 20px', color: '#fff', fontWeight: 600,
    cursor: 'pointer', fontSize: '0.9rem', transition: 'opacity 0.2s, transform 0.1s',
    flexShrink: 0, height: 48,
  },
  suggestions: {
    display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '0.75rem', width: '100%',
  },
  suggBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20, padding: '6px 14px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  clearBtn: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8, padding: '6px 14px', color: '#f87171', fontSize: '0.8rem',
    cursor: 'pointer', transition: 'all 0.2s', alignSelf: 'center',
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modalCard: {
    background: 'rgba(15,20,40,0.97)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 420, backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  modalTitle: { fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem' },
  modalText: { color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.6 },
  modalBtns: { display: 'flex', gap: 10 },
  modalConfirm: {
    flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 10, padding: '10px', color: '#f87171', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
  },
  modalCancel: {
    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.9rem',
  },
  upgradeCard: {
    width: '100%', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
    borderRadius: 12, padding: '14px 18px', marginBottom: '0.75rem', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  upgradeText: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' },
  upgradeBtn: {
    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', border: 'none',
    borderRadius: 8, padding: '7px 16px', color: '#000', fontWeight: 700,
    cursor: 'pointer', fontSize: '0.82rem', flexShrink: 0, whiteSpace: 'nowrap',
  },
};

const SUGGESTIONS = [
  'What is a Peppol invoice?',
  'How does GST work in Australia?',
  'What fields are required for an invoice?',
  'What is UBL compliance?',
];

function StarCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3, a: Math.random(),
      speed: Math.random() * 0.003 + 0.001,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.a += s.speed;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.abs(Math.sin(s.a)) * 0.5})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={s.canvas} />;
}

export default function AIChat({ token, onNavigate, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [showClear, setShowClear] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [tierLoading, setTierLoading] = useState(false);
  const chatRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await chatWithAI(token, msg);
      setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);
      setTier(res.tier);
      setRemaining(res.messagesRemaining);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message || 'Something went wrong.'}`, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleClear = async () => {
    try {
      await clearAIChatHistory(token);
      setMessages([]);
      setShowClear(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUpgrade = async (newTier) => {
    setTierLoading(true);
    try {
      await updateUserTier(token, newTier);
      setTier(newTier);
      setRemaining(newTier === 'pro' ? null : 25);
      setShowUpgrade(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setTierLoading(false);
    }
  };

  const isPro = tier === 'pro';

  return (
    <div style={s.page}>
      <style>{`
        .nav-link:hover { color: rgba(255,255,255,0.9) !important; text-shadow: 0 0 12px rgba(255,255,255,0.3); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .page-fade { animation: fadeIn 0.5s ease forwards; }
        .send-btn:hover:not(:disabled) { opacity: 0.85; transform: scale(0.97); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sugg-btn:hover { background: rgba(165,180,252,0.1) !important; border-color: rgba(165,180,252,0.3) !important; color: #a5b4fc !important; }
        .clear-btn:hover { background: rgba(239,68,68,0.2) !important; }
        .upgrade-btn:hover { opacity: 0.88; }
        .tier-badge:hover { opacity: 0.8; }
        textarea:focus { border-color: rgba(165,180,252,0.4) !important; }
        .page-fade p { margin: 0 0 0.5rem; }
        .page-fade p:last-child { margin: 0; }
        .page-fade strong { color: #e0e7ff; }
        .page-fade h1, .page-fade h2, .page-fade h3 { color: #e0e7ff; margin: 0.5rem 0 0.25rem; font-size: 1rem; }
        .page-fade ul, .page-fade ol { margin: 0.25rem 0 0.5rem; padding-left: 1.25rem; }
        .page-fade li { margin-bottom: 0.2rem; }
        .page-fade code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 4px; font-size: 0.85em; }
      `}</style>
      <StarCanvas />

      <nav style={s.nav}>
        <img src={logo} alt="MC Invoicing" style={{ ...s.logo, cursor: 'pointer' }} onClick={() => onNavigate('home')} />
        <div style={s.navLinks}>
          <span className="nav-link" style={s.navLink} onClick={() => onNavigate('retrieve')}>Retrieve</span>
          <span className="nav-link" style={s.navLink} onClick={() => onNavigate('track')}>Track</span>
          <span className="nav-link" style={s.navLink} onClick={() => onNavigate('app')}>Create Invoice</span>
          <span className="nav-link" style={s.navLink} onClick={() => onNavigate('update')}>Update Invoice</span>
          <span style={{ ...s.navLink, ...s.navLinkActive }}>AI Chat</span>
          <span className="nav-link" style={s.navLink} onClick={() => onNavigate('profile')}>Profile</span>
        </div>
      </nav>

      <div className="page-fade" style={s.body}>
        <div style={s.header}>
          <h1 style={s.title}>✦ AI Invoicing Assistant</h1>
          <p style={s.subtitle}>Ask anything about invoicing, Peppol, GST, or UBL compliance</p>
          {tier && (
            <div
              className="tier-badge"
              style={{ ...s.tierBadge, ...(isPro ? s.tierPro : s.tierStandard) }}
              onClick={() => setShowUpgrade(true)}
              title="Click to change plan"
            >
              {isPro ? '⭐ Pro Plan' : '◈ Standard Plan'} · click to {isPro ? 'downgrade' : 'upgrade'}
            </div>
          )}
        </div>

        {/* Upgrade banner for standard users */}
        {tier === 'standard' && remaining !== null && remaining <= 10 && (
          <div style={s.upgradeCard}>
            <p style={{ ...s.upgradeText, margin: 0 }}>
              {remaining <= 0
                ? "🚫 You've hit your daily limit. Upgrade to Pro for unlimited messages."
                : `⚠️ Only ${remaining} message${remaining === 1 ? '' : 's'} left today. Upgrade for unlimited.`}
            </p>
            <button className="upgrade-btn" style={s.upgradeBtn} onClick={() => setShowUpgrade(true)}>
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Remaining messages bar */}
        {tier === 'standard' && remaining !== null && remaining > 10 && (
          <div style={s.remainingBar}>
            <span>Daily messages remaining</span>
            <span style={s.remainingCount}>{remaining} / 25</span>
          </div>
        )}

        {/* Pro clear history */}
        {isPro && messages.length > 0 && (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
            <button className="clear-btn" style={s.clearBtn} onClick={() => setShowClear(true)}>
              🗑 Clear history
            </button>
          </div>
        )}

        {/* Chat window */}
        <div ref={chatRef} style={s.chatBox}>
          {messages.length === 0 && !loading && (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🪐</div>
              <div style={s.emptyText}>Ask me anything about invoicing</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ ...s.msgRow, ...(m.role === 'user' ? s.msgRowUser : {}) }}>
              <div style={{ ...s.avatar, ...(m.role === 'user' ? s.avatarUser : s.avatarAI) }}>
                {m.role === 'user' ? 'U' : 'AI'}
              </div>
              <div style={{
                ...s.bubble,
                ...(m.role === 'user' ? s.bubbleUser : s.bubbleAI),
                ...(m.error ? { color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' } : {}),
              }}>
                {m.role === 'assistant' && !m.error
                  ? <ReactMarkdown>{m.content}</ReactMarkdown>
                  : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={s.msgRow}>
              <div style={{ ...s.avatar, ...s.avatarAI }}>AI</div>
              <div style={{ ...s.bubble, ...s.bubbleAI, ...s.bubbleLoading }}>Thinking…</div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div style={s.suggestions}>
            {SUGGESTIONS.map((q, i) => (
              <button key={i} className="sugg-btn" style={s.suggBtn} onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={s.inputRow}>
          <textarea
            ref={textareaRef}
            style={s.textarea}
            placeholder="Ask about invoicing, Peppol, GST…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={tier === 'standard' && remaining !== null && remaining <= 0}
          />
          <button
            className="send-btn"
            style={s.sendBtn}
            onClick={() => send()}
            disabled={!input.trim() || loading || (tier === 'standard' && remaining !== null && remaining <= 0)}
          >
            Send ↑
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', margin: '0.5rem 0 0', textAlign: 'center' }}>
          {isPro ? 'Pro: persistent history · unlimited messages' : 'Standard: 25 messages/day · no history saved'}
        </p>
      </div>

      {/* Clear history modal */}
      {showClear && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={s.modalTitle}>Clear chat history?</h2>
            <p style={s.modalText}>This will permanently delete all your saved conversation history from the server. This can't be undone.</p>
            <div style={s.modalBtns}>
              <button style={s.modalConfirm} onClick={handleClear}>Clear history</button>
              <button style={s.modalCancel} onClick={() => setShowClear(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Tier modal */}
      {showUpgrade && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={s.modalTitle}>{isPro ? 'Change plan' : 'Upgrade to Pro'}</h2>
            <p style={s.modalText}>
              {isPro
                ? 'You\'re currently on Pro. Downgrading to Standard limits you to 25 messages/day and removes chat history.'
                : 'Pro unlocks unlimited daily messages and persistent chat history — your context is remembered across sessions.'}
            </p>
            <div style={s.modalBtns}>
              {isPro ? (
                <>
                  <button style={s.modalConfirm} onClick={() => handleUpgrade('standard')} disabled={tierLoading}>
                    {tierLoading ? 'Updating…' : 'Downgrade to Standard'}
                  </button>
                  <button style={s.modalCancel} onClick={() => setShowUpgrade(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <button style={{ ...s.modalConfirm, background: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.4)', color: '#fbbf24' }} onClick={() => handleUpgrade('pro')} disabled={tierLoading}>
                    {tierLoading ? 'Updating…' : '⭐ Upgrade to Pro'}
                  </button>
                  <button style={s.modalCancel} onClick={() => setShowUpgrade(false)}>Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
