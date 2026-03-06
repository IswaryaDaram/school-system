import { useState, useRef, useEffect } from 'react';
import { chatbotAPI } from '../../utils/api';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Chatbot() {
  const { i18n } = useTranslation();
  const lang     = i18n.language;

  const welcomeMsg = lang === 'te'
    ? 'నమస్కారం! నేను మీ పాఠశాల సహాయకుడిని. హాజరు, మార్కులు, అసైన్‌మెంట్లు లేదా పత్రాల గురించి తెలుగులో అడగండి.'
    : "Hello! I'm your school assistant. Ask me anything about attendance, marks, assignments or documents.";

  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState([{ role: 'assistant', content: welcomeMsg }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // Update welcome when language changes
  useEffect(() => {
    setMsgs([{ role: 'assistant', content: welcomeMsg }]);
  }, [lang]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const quickPrompts = lang === 'te'
    ? ['నా హాజరు శాతం ఎంత?', 'రాబోయే అసైన్‌మెంట్లు', '10వ తర్వాత ఏ స్ట్రీమ్ తీసుకోవాలి?', 'బొనాఫైడ్ ఎలా పొందాలి?']
    : ['My attendance %?', 'Upcoming assignments', 'Which stream after 10th?', 'How to get Bonafide certificate?'];

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const history = msgs.map(m => ({ role: m.role, content: m.content }));
      const res = await chatbotAPI.chat({ message: msg, conversationHistory: history, language: lang });
      setMsgs(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setMsgs(prev => [...prev, {
        role: 'assistant',
        content: lang === 'te'
          ? '⚠️ కనెక్షన్ లోపం. మళ్ళీ ప్రయత్నించండి.'
          : '⚠️ Connection error. Please try again.'
      }]);
    } finally { setLoading(false); }
  };

  // Styles that work for both light and dark mode using inline styles + CSS vars
  const chatBg    = 'var(--chat-bg, #0f172a)';
  const chatCard  = 'var(--chat-card, #1e293b)';
  const chatBord  = 'var(--chat-border, rgba(51,65,85,0.6))';
  const chatText  = 'var(--chat-text, #f1f5f9)';
  const chatMuted = 'var(--chat-muted, #94a3b8)';

  return (
    <>
      {/* Extra CSS vars injected for chatbot so it always stays readable */}
      <style>{`
        html:not(.light) {
          --chat-bg: #0f172a; --chat-card: #1e293b;
          --chat-border: rgba(51,65,85,0.6); --chat-text: #f1f5f9; --chat-muted: #94a3b8;
        }
        html.light {
          --chat-bg: #ffffff; --chat-card: #f1f5f9;
          --chat-border: rgba(203,213,225,0.8); --chat-text: #0f172a; --chat-muted: #64748b;
        }
      `}</style>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
        {open ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: 500, background: chatBg, border: `1px solid ${chatBord}` }}>

          {/* Header — always indigo gradient */}
          <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
            className="px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">
                  {lang === 'te' ? 'పాఠశాల సహాయకుడు' : 'School Assistant'}
                </p>
                <p className="text-white/75 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                  {lang === 'te' ? 'AI అందుబాటులో ఉంది' : 'AI • Online'}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.7)' }}
              className="hover:text-white transition-colors p-1">
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: m.role === 'assistant' ? 'rgba(99,102,241,0.2)' : '#4f46e5' }}>
                  {m.role === 'assistant'
                    ? <Bot size={14} color="#818cf8" />
                    : <User size={14} color="#fff" />}
                </div>
                <div className="max-w-[78%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.role === 'assistant'
                    ? { background: chatCard, color: chatText, borderRadius: '4px 16px 16px 16px' }
                    : { background: '#4f46e5', color: '#fff', borderRadius: '16px 4px 16px 16px' }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <Bot size={14} color="#818cf8" />
                </div>
                <div className="rounded-2xl px-4 py-3 flex gap-1 items-center"
                  style={{ background: chatCard, borderRadius: '4px 16px 16px 16px' }}>
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts — shown only on first open */}
          {msgs.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5" style={{ borderTop: `1px solid ${chatBord}`, paddingTop: 10 }}>
              {quickPrompts.map(p => (
                <button key={p} onClick={() => send(p)}
                  className="text-xs px-2.5 py-1.5 rounded-full transition-colors hover:bg-indigo-600 hover:text-white"
                  style={{ background: chatCard, color: '#818cf8', border: '1px solid rgba(99,102,241,0.35)' }}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); send(); }}
            className="p-3 flex gap-2 flex-shrink-0"
            style={{ borderTop: `1px solid ${chatBord}` }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={lang === 'te' ? 'ఏదైనా అడగండి...' : 'Ask anything...'}
              className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ background: chatCard, color: chatText, border: `1px solid ${chatBord}` }}
            />
            <button type="submit" disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
              style={{ background: '#4f46e5' }}>
              <Send size={14} color="#fff" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
