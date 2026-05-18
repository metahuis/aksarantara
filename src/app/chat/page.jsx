'use client';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Topbar from '../../components/Topbar.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import MessageBubble from '../../components/tutor/MessageBubble.jsx';
import { PROMPTS_BY_LANG } from '../../components/tutor/SuggestedPrompts.jsx';
import { LANGUAGES } from '../../data.js';

export default function ChatPage() {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [lang, setLang]           = useState('bugis');
  const [loading, setLoading]     = useState(false);
  const [rateLimited, setRateLimited] = useState(0); // countdown seconds
  const threadRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  // Rate-limit countdown
  useEffect(() => {
    if (rateLimited <= 0) return;
    const t = setTimeout(() => setRateLimited(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [rateLimited]);

  function addMsg(msg) {
    setMessages(prev => [...prev, msg]);
  }

  async function send(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', type: 'text', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Show tool-call chip
    const toolChipId = Date.now();
    setMessages(prev => [...prev, { role: 'gemma', type: 'tool', id: toolChipId, content: '' }]);

    try {
      const res = await fetch('/api/ai/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content || '' })),
          lang,
        }),
      });

      // Remove tool chip
      setMessages(prev => prev.filter(m => m.id !== toolChipId));

      if (res.status === 429) {
        setRateLimited(20);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');

      // Handle response — text always precedes card/quiz
      if (data.text) {
        addMsg({ role: 'gemma', type: 'text', content: data.text });
      }
      if (data.entry) {
        addMsg({ role: 'gemma', type: 'entry', entry: data.entry });
      }
      if (data.entries && data.quiz) {
        addMsg({ role: 'gemma', type: 'quiz', entries: data.entries });
      }
      if (!data.entry && !data.quiz && !data.text) {
        addMsg({ role: 'gemma', type: 'text', content: 'Maaf, saya tidak bisa menemukan jawaban untuk itu di arsip.' });
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== toolChipId));
      addMsg({ role: 'gemma', type: 'text', content: `Kesalahan: ${err.message}` });
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      <Topbar />
      <div className="tutor-layout">

          {/* Sidebar (desktop only) */}
          <aside className="tutor-sidebar">
            <div>
              <div className="tutor-sidebar-heading">Cara Pakai</div>
              <div className="tutor-sidebar-tip">Tanya kata — ketik kata untuk mencari artinya di arsip.</div>
              <div className="tutor-sidebar-tip">Minta kuis — ketik "Kuis 10 kata [bahasa]" untuk latihan.</div>
              <div className="tutor-sidebar-tip">Ngobrol — tanya sejarah atau budaya bahasa yang dipilih.</div>
            </div>
            <div>
              <div className="tutor-sidebar-heading">
                Coba Tanya — {LANGUAGES.find(l => l.id === lang)?.name}
              </div>
              {PROMPTS_BY_LANG[lang].map(p => (
                <button key={p} className="tutor-sidebar-item" onClick={() => send(p)}>
                  {p}
                </button>
              ))}
            </div>
          </aside>

          {/* Main area */}
          <div className="tutor-main">
            {/* Thread */}
            <div className="tutor-thread" ref={threadRef}>
              {isEmpty ? (
                <div className="tutor-empty-hero">
                  <AIBadge size="lg" />
                  <div className="tutor-empty-title">Ngobrol sama Aksarantara</div>
                  <p className="tutor-empty-sub">Talk to your archive.</p>
                  <p style={{ fontSize: 13, color: 'var(--n-500)', maxWidth: 320, lineHeight: 1.6 }}>
                    Tanya kata, minta kuis, atau cari pantun — setiap jawaban bersandar pada entri nyata di arsip.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} />
                  ))}
                  {loading && !messages.some(m => m.type === 'tool') && (
                    <motion.div
                      key="typing"
                      className="tutor-tool-chip"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span style={{ display: 'inline-block', animation: 'spin 0.9s linear infinite' }}>◌</span>
                      📚 Membaca arsip…
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Rate limit banner */}
            {rateLimited > 0 && (
              <div className="tutor-ratelimit-banner">
                Terlalu cepat — coba lagi dalam {rateLimited} detik.
              </div>
            )}

            {/* Composer */}
            <div className="tutor-composer-wrap">
              <div className="tutor-lang-row">
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    className={`tutor-lang-chip${lang === l.id ? ' active' : ''}`}
                    onClick={() => setLang(l.id)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>

              <div className="tutor-composer">
                <textarea
                  ref={inputRef}
                  className="tutor-composer-input"
                  rows={1}
                  placeholder="Tulis pertanyaan atau minta kuis…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={rateLimited > 0}
                />
                <button
                  className="tutor-composer-send"
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading || rateLimited > 0}
                >
                  ▸
                </button>
              </div>
            </div>
          </div>

      </div>
    </>
  );
}
