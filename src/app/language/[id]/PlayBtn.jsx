'use client';
import { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/Icon.jsx';
import { audioMgr } from '../../../audio.js';

export default function PlayBtn({ seed, color, audioUrl = null }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return audioMgr.subscribe(cur => setPlaying(cur?.seed === seed));
    const el = new Audio(audioUrl);
    audioRef.current = el;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    el.addEventListener('play',  onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    return () => { el.pause(); el.removeEventListener('play', onPlay); el.removeEventListener('pause', onPause); el.removeEventListener('ended', onEnded); };
  }, [seed, audioUrl]);

  function toggle(e) {
    e.preventDefault(); e.stopPropagation();
    if (audioUrl) {
      const el = audioRef.current;
      if (!el) return;
      if (el.paused) el.play(); else el.pause();
    } else {
      playing ? audioMgr.stop() : audioMgr.play(seed, 1.2);
    }
  }

  return (
    <button
      className="lp2-play-btn"
      style={{
        background: !audioUrl ? 'var(--paper-alt)' : playing ? color : `${color}14`,
        borderColor: !audioUrl ? 'var(--hair)' : playing ? color : `${color}35`,
        color: !audioUrl ? 'var(--muted)' : playing ? '#fff' : color,
        opacity: !audioUrl ? 0.4 : 1,
        cursor: !audioUrl ? 'not-allowed' : 'pointer',
      }}
      onClick={!audioUrl ? undefined : toggle}
      disabled={!audioUrl}
    >
      {playing
        ? <Icon name="pause" size={16} />
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      }
    </button>
  );
}
