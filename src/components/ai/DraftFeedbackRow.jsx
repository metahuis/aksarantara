'use client';
import { useState } from 'react';

/** @param {{ draftId?: string }} props */
export default function DraftFeedbackRow({ draftId }) {
  const [voted, setVoted] = useState(null); // 'yes' | 'no' | null

  async function vote(v) {
    setVoted(v);
    try {
      await fetch('/api/ai/draft-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, vote: v }),
      });
    } catch {
      // silent — feedback is non-critical
    }
  }

  return (
    <div className="ai-feedback-row">
      <span>Apakah draft ini berguna?</span>
      {voted ? (
        <span className="ai-feedback-thanks">Terima kasih — masukan Anda memperbaiki model.</span>
      ) : (
        <>
          <button className="ai-feedback-btn" onClick={() => vote('yes')}>👍 Ya</button>
          <button className="ai-feedback-btn" onClick={() => vote('no')}>👎 Tidak</button>
        </>
      )}
    </div>
  );
}
