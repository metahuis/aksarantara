'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** @param {{ entries: { word: string, gloss: string }[] }} props */
export default function QuizCardStack({ entries }) {
  const [idx, setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore]  = useState(0);
  const [done, setDone]    = useState(false);

  const current = entries[idx];

  function advance(correct) {
    if (correct) setScore(s => s + 1);
    setFlipped(false);
    if (idx + 1 >= entries.length) {
      setDone(true);
    } else {
      setTimeout(() => setIdx(i => i + 1), 220);
    }
  }

  function skipCard() {
    setFlipped(false);
    if (idx + 1 >= entries.length) {
      setDone(true);
    } else {
      setTimeout(() => setIdx(i => i + 1), 220);
    }
  }

  if (done) {
    return (
      <div className="tutor-quiz-card">
        <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
        <div className="tutor-quiz-front">{score}/{entries.length} benar</div>
        <div className="tutor-quiz-back" style={{ marginTop: 6 }}>Latihan selesai!</div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress dots */}
      <div className="tutor-quiz-dots">
        {entries.map((_, i) => (
          <div
            key={i}
            className={`tutor-quiz-dot${i < idx ? ' done' : i === idx ? ' curr' : ''}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${idx}-${flipped}`}
          className="tutor-quiz-card"
          initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ cursor: flipped ? 'default' : 'pointer' }}
          onClick={() => !flipped && setFlipped(true)}
        >
          {flipped ? (
            <>
              <div className="tutor-quiz-front">{current.word}</div>
              <div className="tutor-quiz-back">{current.gloss}</div>
            </>
          ) : (
            <>
              <div className="tutor-quiz-front">{current.word}</div>
              <div className="tutor-quiz-back" style={{ fontSize: 12, color: 'var(--n-500)' }}>
                Ketuk untuk lihat arti
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {flipped && (
        <div className="tutor-quiz-actions" style={{ marginTop: 10 }}>
          <button className="tutor-quiz-btn wrong"   onClick={() => advance(false)}>✗ Salah</button>
          <button className="tutor-quiz-btn"         onClick={skipCard}>→ Skip</button>
          <button className="tutor-quiz-btn correct" onClick={() => advance(true)}>✓ Benar</button>
        </div>
      )}
    </div>
  );
}
