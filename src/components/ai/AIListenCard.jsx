'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIBadge from '../AIBadge.jsx';

/**
 * 2-second "Gemma sedang membaca" animation that transitions to a done state.
 * @param {{ state: 'idle'|'listening'|'done'|'error', onDone?: () => void }} props
 */
export default function AIListenCard({ state, onDone }) {
  const [phase, setPhase] = useState(state);

  useEffect(() => {
    setPhase(state);
    if (state === 'listening') {
      const t = setTimeout(() => {
        setPhase('done');
        onDone?.();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [state, onDone]);

  if (phase === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      {phase === 'listening' && (
        <motion.div
          key="listening"
          className="ai-listen-card"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <AIBadge />
          <div className="ai-listen-wave">
            <i /><i /><i /><i /><i /><i /><i /><i /><i />
          </div>
          <span className="ai-listen-label">Gemma sedang membaca…</span>
        </motion.div>
      )}

      {phase === 'done' && (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* parent handles rendering results */}
        </motion.div>
      )}

      {phase === 'error' && (
        <motion.div
          key="error"
          className="ai-draft-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Gemma tidak bisa membuat draft kali ini. Coba rekam ulang atau isi manual.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
