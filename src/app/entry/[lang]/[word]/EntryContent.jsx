'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../components/Topbar.jsx';
import Footer from '../../../../components/Footer.jsx';
import Icon from '../../../../components/Icon.jsx';
import Waveform from '../../../../components/Waveform.jsx';
import { audioMgr } from '../../../../audio.js';

const TYPE_LABELS = { word: 'Kata', phrase: 'Frasa', peribahasa: 'Peribahasa', story: 'Kisah', song: 'Lagu', mantra: 'Mantra', pantun: 'Pantun' };
const POS_LABELS  = { noun: 'Kata Benda', verb: 'Kata Kerja', adjective: 'Kata Sifat', adverb: 'Kata Keterangan', numeral: 'Kata Bilangan', other: 'Lainnya' };

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function AudioCard({ audioUrl, lang, entryId }) {
  const [playing, setPlaying]         = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return audioMgr.subscribe(cur => setPlaying(cur?.seed === `entry-${entryId}`));
    const el = new Audio(audioUrl);
    audioRef.current = el;
    el.addEventListener('play',  () => setPlaying(true));
    el.addEventListener('pause', () => setPlaying(false));
    el.addEventListener('ended', () => { setPlaying(false); setCurrentTime(0); });
    el.addEventListener('loadedmetadata', () => setDuration(el.duration));
    el.addEventListener('timeupdate', () => setCurrentTime(el.currentTime));
    return () => { el.pause(); };
  }, [audioUrl, entryId]);

  function toggle() {
    if (!audioUrl) { playing ? audioMgr.stop() : audioMgr.play(`entry-${entryId}`, 1.2); return; }
    const el = audioRef.current;
    if (!el) return;
    el.paused ? el.play() : el.pause();
  }

  function restart() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    if (!playing) el.play();
  }

  function skipFwd() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(el.duration || 0, el.currentTime + 10);
  }

  const timeLabel = duration > 0 ? ` · ${fmt(currentTime)} / ${fmt(duration)}` : '';

  return (
    <div className="ed-audio-card">
      <div className="ed-audio-glow" style={{ background: `radial-gradient(circle at 80% 0%, ${lang.color}55, transparent 60%)` }} />
      <div className="ed-audio-inner">
        <div className="ed-audio-label">SUARA{timeLabel}</div>
        <div className="ed-audio-wave">
          <Waveform
            seed={`entry-${entryId}`}
            data={lang.wave}
            height={64}
            color={lang.color}
            src={audioUrl || null}
            duration={1.8}
          />
        </div>
        <div className="ed-audio-controls">
          <button className="ed-ctrl-btn" onClick={restart} aria-label="Mulai ulang">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5L9 12l11 7z"/></svg>
          </button>
          <button className="ed-play-main" onClick={toggle} aria-label={playing ? 'Jeda' : 'Putar'}>
            {playing
              ? <Icon name="pause" size={22} />
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>
            }
          </button>
          <button className="ed-ctrl-btn" onClick={skipFwd} aria-label="Maju 10 detik">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5l11 7-11 7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EntryContent({ entry, lang, related, speakerCount }) {
  const router = useRouter();
  const isLong = entry.type === 'story' || entry.type === 'song';

  return (
    <>
      <Topbar />
      <main>
        <div className="container">
          <div className="ed-page">

            {/* Breadcrumb */}
            <div className="ed-breadcrumb">
              <Link href={`/language/${lang.id}`} style={{ color: lang.color }}>{lang.name}</Link>
              <span className="ed-bc-sep">·</span>
              <span>{TYPE_LABELS[entry.type] ?? entry.type}</span>
              {entry.pos && <><span className="ed-bc-sep">·</span><span>{POS_LABELS[entry.pos] ?? entry.pos}</span></>}
            </div>

            {isLong ? (
              /* ── LONG-FORM layout (story / song) ── */
              <div className="ed-long">
                <h1 className="ed-word">{entry.primary_text}</h1>
                {entry.speaker && (
                  <div className="ed-long-attr">
                    dituturkan oleh <strong>{entry.speaker.name}</strong>
                    {entry.speaker.age ? `, ${entry.speaker.age} thn` : ''}
                    {entry.speaker.village ? ` · ${entry.speaker.village}` : ''}
                  </div>
                )}
                <AudioCard audioUrl={entry.audio_url || null} lang={lang} entryId={entry.id} />
                {entry.contextual_meaning && (
                  <div className="ed-long-body">
                    <div className="ed-section-label">{entry.type === 'song' ? 'Lirik' : 'Isi Kisah'}</div>
                    <div className="ed-long-text">{entry.contextual_meaning}</div>
                  </div>
                )}
                {entry.gloss_id && (
                  <div className="ed-example" style={{ borderLeftColor: lang.color }}>
                    <div className="ed-example-text">{entry.gloss_id}</div>
                  </div>
                )}
              </div>
            ) : (
              /* ── WORD / PHRASE layout ── */
              <div className="ed-layout">

                <div className="ed-main">
                  <h1 className="ed-word">{entry.primary_text}</h1>
                  {entry.phonetic && <div className="ed-phonetic">{entry.phonetic}</div>}

                  <div className="ed-meanings">
                    {(entry.gloss_id || entry.gloss) && (
                      <div className="ed-meaning-col">
                        <div className="ed-meaning-label">Indonesia</div>
                        <div className="ed-meaning-val">{entry.gloss_id || entry.gloss}</div>
                      </div>
                    )}
                    {entry.gloss && entry.gloss !== entry.gloss_id && (
                      <div className="ed-meaning-col">
                        <div className="ed-meaning-label">English</div>
                        <div className="ed-meaning-val">{entry.gloss}</div>
                      </div>
                    )}
                  </div>

                  {entry.contextual_meaning && (
                    <div className="ed-context-block">
                      <div className="ed-section-label">Makna Kontekstual</div>
                      <div className="ed-context-text">{entry.contextual_meaning}</div>
                    </div>
                  )}

                  {entry.usage_example && (
                    <div className="ed-example" style={{ borderLeftColor: lang.color }}>
                      <div className="ed-section-label">Contoh Penggunaan</div>
                      <div className="ed-example-text">&ldquo;{entry.usage_example}&rdquo;</div>
                    </div>
                  )}
                </div>

                <div className="ed-aside">
                  <AudioCard audioUrl={entry.audio_url || null} lang={lang} entryId={entry.id} />

                  {entry.speaker && (
                    <div className="ed-speaker-card">
                      <div className="ed-speaker-avatar" style={{ background: lang.color }}>
                        {entry.speaker.name?.[0] ?? '?'}
                      </div>
                      <div className="ed-speaker-info">
                        <div className="ed-speaker-name">
                          {entry.speaker.name}{entry.speaker.age ? `, ${entry.speaker.age}` : ''}
                        </div>
                        {entry.speaker.village && (
                          <div className="ed-speaker-loc">{entry.speaker.village}</div>
                        )}
                      </div>
                      {speakerCount > 0 && entry.speaker.slug && (
                        <Link href={`/suara/${entry.speaker.slug}`} className="ed-speaker-count" style={{ color: lang.color }}>
                          {speakerCount} entri →
                        </Link>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Related entries */}
            {related.length > 0 && (
              <div className="ed-related">
                <div className="ed-section-label">Entri Terkait di {lang.name}</div>
                <div className="ed-related-grid">
                  {related.map(e => (
                    <button
                      key={e.id}
                      className="ed-related-card"
                      onClick={() => router.push(`/entry/${e.lang}/${e.slug ?? e.id}`)}
                    >
                      <div className="ed-related-word">{e.primary_text}</div>
                      <div className="ed-related-gloss">{e.gloss_id || e.gloss}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
