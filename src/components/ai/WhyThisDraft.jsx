'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Expandable disclosure showing Whisper transcription + Gemma confidence.
 * @param {{ transcription?: string, confidence?: number }} props
 */
export default function WhyThisDraft({ transcription, confidence }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((confidence ?? 0) * 100);

  return (
    <div className="ai-why-disclosure">
      <button className="ai-why-trigger" onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 13 }}>?</span>
        Mengapa draft ini?
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="ai-why-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            {transcription && (
              <div className="ai-why-row">
                <span className="ai-why-label">Transkripsi Whisper</span>
                <span className="ai-why-value">{transcription}</span>
              </div>
            )}
            <div className="ai-why-row">
              <span className="ai-why-label">Kepercayaan Gemma</span>
              <span className="ai-why-value">{pct}%</span>
              <div className="ai-why-conf-bar">
                <div className="ai-why-conf-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--n-500)', margin: '8px 0 0', lineHeight: 1.5 }}>
              Draft ini dibuat dari rekaman Anda. Anda bebas mengubah atau menghapus apa pun.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
