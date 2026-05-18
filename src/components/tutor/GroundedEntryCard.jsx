'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';

/**
 * The load-bearing component — embeds a real corpus entry inside the chat.
 * @param {{ entry: { word: string, ipa?: string, gloss: string, lang: string, audioUrl?: string, slug?: string } }} props
 */
export default function GroundedEntryCard({ entry }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const langLabel = entry.lang?.charAt(0).toUpperCase() + entry.lang?.slice(1) || 'Bahasa';

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); }
    else           { el.pause(); setPlaying(false); }
  }

  return (
    <div className="tutor-entry-card">
      <div className="tutor-entry-card-head">
        <div className="tutor-entry-lang">Aksarantara · {langLabel} · Arsip</div>
        <div className="tutor-entry-word">{entry.word}</div>
        {entry.ipa && <div className="tutor-entry-ipa">/{entry.ipa}/</div>}
      </div>

      <div className="tutor-entry-gloss">{entry.gloss}</div>

      <div className="tutor-entry-foot">
        {entry.audioUrl ? (
          <>
            <audio
              ref={audioRef}
              src={entry.audioUrl}
              onEnded={() => setPlaying(false)}
              onPause={() => setPlaying(false)}
              onPlay={() => setPlaying(true)}
              preload="metadata"
            />
            <button
              className="tutor-entry-play"
              onClick={togglePlay}
              aria-label={playing ? 'Jeda audio' : 'Putar audio'}
            >
              {playing ? '⏸' : '▶'} Dengar
            </button>
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--n-500)' }}>Belum ada rekaman</span>
        )}

        {entry.slug && (
          <Link
            href={`/entry/${entry.lang}/${entry.slug}`}
            className="tutor-entry-link"
          >
            Buka entri lengkap →
          </Link>
        )}
      </div>
    </div>
  );
}
