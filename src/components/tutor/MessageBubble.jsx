'use client';
import { motion } from 'framer-motion';
import GroundedEntryCard from './GroundedEntryCard.jsx';
import QuizCardStack from './QuizCardStack.jsx';

/**
 * Renders a single chat message.
 * @param {{ msg: { role:'gemma'|'user', type?:'text'|'voice'|'tool'|'entry'|'quiz', content?: string, entry?: object, entries?: object[] } }} props
 */
export default function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (msg.type === 'tool') {
    return (
      <motion.div
        className="tutor-tool-chip"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
      >
        <span className="spin" style={{ display: 'inline-block', animation: 'spin 0.9s linear infinite' }}>◌</span>
        📚 Membaca arsip…
        {msg.content && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.7 }}> {msg.content}</span>
        )}
      </motion.div>
    );
  }

  if (msg.type === 'entry' && msg.entry) {
    return (
      <motion.div
        className="tutor-bubble tutor-bubble--gemma"
        style={{ maxWidth: '100%', background: 'transparent', border: 'none', padding: 0 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <GroundedEntryCard entry={msg.entry} />
      </motion.div>
    );
  }

  if (msg.type === 'quiz' && msg.entries) {
    return (
      <motion.div
        className="tutor-quiz-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <QuizCardStack entries={msg.entries} />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`tutor-bubble ${isUser ? 'tutor-bubble--user' : 'tutor-bubble--gemma'}`}
      initial={{ opacity: 0, y: isUser ? 4 : 8, x: isUser ? 4 : -4 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {msg.content}
    </motion.div>
  );
}
