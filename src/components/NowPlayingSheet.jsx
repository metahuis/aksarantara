'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Icon from './Icon.jsx';
import Waveform from './Waveform.jsx';
import { LANGUAGES, ARCHIVE_ENTRIES } from '../data.js';

export default function NowPlayingSheet({ playing, onClose }) {
  if (!playing) return null;

  const entry = ARCHIVE_ENTRIES.find(e => playing.seed && playing.seed.includes(e.id));
  const lang = entry ? LANGUAGES.find(l => l.id === entry.lang) : null;

  if (!entry || !lang) return null;

  return (
    <>
      <motion.div
        className="np-sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="np-sheet"
        initial={{ y: 600 }}
        animate={{ y: 0 }}
        exit={{ y: 600 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.y > 100 && velocity.y > 300) onClose();
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div className="np-sheet-handle" />

        <div className="np-sheet-content">
          {/* Nav row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: 'rgba(255,255,255,0.08)', color: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevron-down" size={18} />
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(251,247,240,0.55)', textTransform: 'uppercase' }}>
              SEDANG MENDENGAR
            </span>
            <button style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: 'rgba(255,255,255,0.08)', color: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="dots" size={18} />
            </button>
          </div>

          {/* Art tile */}
          <div style={{
            borderRadius: 20, overflow: 'hidden', marginBottom: 28, aspectRatio: '1',
            background: `linear-gradient(135deg, ${lang.color}88 0%, rgba(26,23,20,0.9) 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 86, fontStyle: 'italic', fontWeight: 500, opacity: 0.6, color: 'var(--paper)', lineHeight: 1, userSelect: 'none' }}>
              {entry.primary_text?.slice(0, 2) ?? '—'}
            </div>
            <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
              <span className="al-lang-tag" data-lang={entry.lang}>{lang.name}</span>
            </div>
          </div>

          {/* Title + speaker */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--paper)', lineHeight: 1.15, marginBottom: 6 }}>
              {entry.primary_text}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(251,247,240,0.55)', letterSpacing: '0.06em' }}>
              {[entry.speaker?.name ?? entry.speaker, (entry.speaker?.village ?? entry.speaker_village)?.split(',')[0]].filter(Boolean).join(' · ')}
            </div>
          </div>

          {/* Waveform scrubber */}
          <div style={{ marginBottom: 20 }}>
            <Waveform
              seed={`np-sheet-${entry.id}`}
              data={lang.wave}
              height={64}
              duration={1.8}
              color="rgba(251,247,240,0.55)"
              src={null}
              interactive={true}
            />
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, padding: '0 4px' }}>
            <button style={{ width: 44, height: 44, borderRadius: 999, border: 0, background: 'transparent', color: 'rgba(251,247,240,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="heart" size={20} />
            </button>
            <button style={{ width: 44, height: 44, borderRadius: 999, border: 0, background: 'transparent', color: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="skip-bwd" size={22} />
            </button>
            <button style={{
              width: 70, height: 70, borderRadius: '50%',
              background: 'var(--paper)', color: 'var(--ink)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 12px 28px -8px rgba(255,255,255,0.3)',
            }}>
              <Icon name="pause" size={26} />
            </button>
            <button style={{ width: 44, height: 44, borderRadius: 999, border: 0, background: 'transparent', color: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="skip-fwd" size={22} />
            </button>
            <button style={{ width: 44, height: 44, borderRadius: 999, border: 0, background: 'transparent', color: 'rgba(251,247,240,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="share" size={18} />
            </button>
          </div>

          {/* CTA */}
          <Link href={`/entry/${entry.lang}/${entry.id}`} style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', height: 50, borderRadius: 14, marginBottom: 20,
              background: 'rgba(251,247,240,0.1)', border: '1px solid rgba(251,247,240,0.15)',
              color: 'var(--paper)', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              Baca entri lengkap →
            </button>
          </Link>

          {/* Queue */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'rgba(251,247,240,0.45)', letterSpacing: '0.16em', fontWeight: 600, marginBottom: 10 }}>
              BERIKUTNYA · {lang?.name?.toUpperCase()}
            </div>
            {[
              { w: entry.primary_text, spk: entry.speaker?.name ?? entry.speaker, t: null },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: `${lang?.color}33`, color: lang?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="wave-line" size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--paper)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.w}</div>
                  {r.spk && <div style={{ fontSize: 11.5, color: 'rgba(251,247,240,0.5)' }}>{r.spk}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
