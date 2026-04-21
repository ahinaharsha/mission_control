import { useEffect, useRef, useState } from 'react';

const SYSTEM_GREETING = "Hello! How can I help you today? I can assist with invoicing questions, Peppol UBL standards, GST, and more.";

export default function ChatWidget({ token, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: SYSTEM_GREETING }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!token) {
      setMessages(prev => [...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: 'You need to be logged in to chat. Please [login](#login) or [register](#register) to continue.' }
      ]);
      setInput('');
      return;
    }

    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      if (data.messagesRemaining !== null && data.messagesRemaining !== undefined) {
        setRemaining(data.messagesRemaining);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = (href) => {
    if (href === '#login') { onNavigate?.('login'); setOpen(false); }
    if (href === '#register') { onNavigate?.('register'); setOpen(false); }
    if (href === '#billing') { onNavigate?.('billing'); setOpen(false); }
  };

  // Simple markdown-ish renderer for assistant messages
  const renderContent = (content) => {
    return content.split(/(\[.*?\]\(.*?\))/).map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return <span key={i} style={w.link} onClick={() => handleLink(match[2])}>{match[1]}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatBounce {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.12); }
        }
        @keyframes typingDot {
          0%,80%,100% { opacity: 0.2; transform: translateY(0); }
          40%          { opacity: 1;   transform: translateY(-4px); }
        }
        .chat-send:hover:not(:disabled) { background: #4338ca !important; }
        .chat-input-field:focus { outline: none; border-color: rgba(79,70,229,0.6) !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
        .chat-fab:hover { transform: scale(1.08) !important; box-shadow: 0 8px 32px rgba(79,70,229,0.55) !important; }
        .chat-msg-user { animation: chatSlideUp 0.25s ease; }
        .chat-msg-assistant { animation: chatSlideUp 0.3s ease; }
        .chat-close:hover { color: rgba(255,255,255,0.8) !important; }
      `}</style>

      {/* Floating panel */}
      {open && (
        <div style={w.panel}>
          {/* Header */}
          <div style={w.header}>
            <div style={w.headerLeft}>
              <div style={w.avatar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div style={w.headerTitle}>MC Assistant</div>
                <div style={w.headerSub}>Invoicing & billing help</div>
              </div>
            </div>
            <button className="chat-close" style={w.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div style={w.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg-${msg.role}`} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                {msg.role === 'assistant' && (
                  <div style={w.botDot}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                )}
                <div style={msg.role === 'user' ? w.userBubble : w.botBubble}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={w.botDot}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div style={w.botBubble}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', margin: '0 2px', animation: `typingDot 1.2s ease ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={w.errorMsg}>{error}</div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Footer */}
          <div style={w.footer}>
            {remaining !== null && remaining <= 5 && (
              <div style={w.limitBanner}>
                ⚡ {remaining} message{remaining !== 1 ? 's' : ''} remaining today —{' '}
                <span style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }} onClick={() => { onNavigate?.('billing'); setOpen(false); }}>
                  upgrade to Pro
                </span>
              </div>
            )}
            <div style={w.inputRow}>
              <input
                ref={inputRef}
                className="chat-input-field"
                style={w.input}
                placeholder="Ask about invoicing…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={loading}
              />
              <button
                className="chat-send"
                style={{ ...w.sendBtn, opacity: (!input.trim() || loading) ? 0.5 : 1 }}
                onClick={sendMessage}
                disabled={!input.trim() || loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        className="chat-fab"
        style={{ ...w.fab, background: open ? '#374151' : '#4f46e5' }}
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>
    </>
  );
}

const w = {
  fab: { position: 'fixed', bottom: 28, right: 28, zIndex: 200, width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(79,70,229,0.45)', transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s' },
  panel: { position: 'fixed', bottom: 96, right: 28, zIndex: 199, width: 360, maxHeight: 520, borderRadius: 20, background: 'linear-gradient(160deg, #0d1525 0%, #080f1e 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 80px rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', animation: 'chatSlideUp 0.3s ease', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { color: '#fff', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 },
  headerSub: { color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', lineHeight: 1.2 },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, transition: 'color 0.2s', padding: 4 },
  messages: { flex: 1, overflowY: 'auto', padding: '14px 14px 0', display: 'flex', flexDirection: 'column' },
  botDot: { width: 26, height: 26, borderRadius: 8, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end', marginRight: 6, marginBottom: 2 },
  botBubble: { maxWidth: '78%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '14px 14px 14px 2px', padding: '9px 12px', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', lineHeight: 1.55 },
  userBubble: { maxWidth: '78%', background: '#4f46e5', borderRadius: '14px 14px 2px 14px', padding: '9px 12px', color: '#fff', fontSize: '0.85rem', lineHeight: 1.55 },
  errorMsg: { margin: '8px 0', padding: '8px 12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', fontSize: '0.8rem' },
  footer: { padding: '10px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  limitBanner: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: 8, padding: '6px 10px', background: 'rgba(167,139,250,0.08)', borderRadius: 8, border: '1px solid rgba(167,139,250,0.15)' },
  inputRow: { display: 'flex', gap: 8, alignItems: 'center' },
  input: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 13px', color: '#fff', fontSize: '0.85rem', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: 'inherit' },
  sendBtn: { width: 36, height: 36, borderRadius: 10, background: '#4f46e5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s, opacity 0.2s' },
  link: { color: '#818cf8', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 },
};