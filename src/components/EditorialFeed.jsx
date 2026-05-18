'use client';
import { useState, useEffect, useRef } from 'react';
import { audioMgr } from '../audio.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LANGUAGES, STATUS_COLORS } from '../data.js';
import { createClient } from '../lib/supabase.js';
import Waveform from './Waveform.jsx';

const TYPE_LABELS = { word: 'Kata', phrase: 'Frasa', peribahasa: 'Peribahasa', story: 'Kisah', song: 'Lagu', pantun: 'Pantun', mantra: 'Mantra' };

function PlayDot({ audioUrl, color }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;
    const a = new Audio(audioUrl);
    ref.current = a;
    const stop = () => setPlaying(false);
    a.addEventListener('ended', stop);
    a.addEventListener('pause', stop);
    return () => {
      audioMgr.unregisterHtml(a);
      a.pause();
      a.removeEventListener('ended', stop);
      a.removeEventListener('pause', stop);
      ref.current = null;
    };
  }, [audioUrl]);

  function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!ref.current) return;
    if (playing) { ref.current.pause(); }
    else { audioMgr.registerHtml(ref.current); ref.current.currentTime = 0; ref.current.play().catch(() => {}); setPlaying(true); }
  }

  return (
    <button
      className="ef-today-dot"
      style={{ background: color ?? 'var(--n-300)', opacity: audioUrl ? 1 : 0.35, cursor: audioUrl ? 'pointer' : 'default' }}
      onClick={toggle}
      aria-label={playing ? 'Jeda' : 'Dengarkan'}
    >
      {playing
        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        : <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>
      }
    </button>
  );
}

export default function EditorialFeed() {
  const [featured, setFeatured] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [heroPlaying, setHeroPlaying] = useState(false);
  const heroAudioRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const langIds = LANGUAGES.map(l => l.id);

    // Featured: stories only, prefer with audio
    supabase.from('entries').select('*, speaker:speakers(*)')
      .eq('status', 'approved')
      .in('lang', langIds)
      .eq('type', 'story')
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) { setFeatured(data[0]); return; }
        // fallback: story without audio
        supabase.from('entries').select('*, speaker:speakers(*)')
          .eq('status', 'approved')
          .in('lang', langIds)
          .eq('type', 'story')
          .order('created_at', { ascending: false })
          .limit(1)
          .then(({ data: d2 }) => { if (d2?.[0]) setFeatured(d2[0]); });
      });

    // Recent entries for horizontal strip (any type with audio)
    supabase.from('entries').select('*, speaker:speakers(*)')
      .eq('status', 'approved')
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentEntries(data ?? []));

  }, []);

  useEffect(() => {
    if (!featured?.audio_url) return;
    const audio = new Audio(featured.audio_url);
    heroAudioRef.current = audio;
    const onEnded = () => setHeroPlaying(false);
    const onPause = () => setHeroPlaying(false);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.pause();
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      heroAudioRef.current = null;
    };
  }, [featured]);

  function toggleHero(e) {
    e.stopPropagation();
    const audio = heroAudioRef.current;
    if (!audio) return;
    if (heroPlaying) { audio.pause(); setHeroPlaying(false); }
    else { audioMgr.registerHtml(audio); audio.play().then(() => setHeroPlaying(true)).catch(() => {}); }
  }

  return (
    <section className="ef-section">
      <div className="container">

        {/* ── Mission strip — mobile only ──────────────────────── */}
        <div className="ef-mission">
          <div className="ef-mission-kicker">
          </div>
          <h1 className="ef-mission-h1">
            Setiap suara <em>adalah arsip.</em>
          </h1>
        </div>

        {/* ── Desktop two-column grid: Featured + Rekaman Terbaru ── */}
        <div className="ef-grid">

          {/* Left: Featured Story Hero */}
          <div className="ef-grid-left">
            {featured && (() => {
              const lang = LANGUAGES.find(l => l.id === featured.lang);
              if (!lang) return null;
              return (
                <div
                  className="ef-hero"
                  style={{ borderTop: `3px solid ${lang.color}` }}
                  onClick={() => router.push(`/entry/${featured.lang}/${featured.slug ?? featured.id}`)}
                >
                  <div className="ef-hero-glow-1" style={{ background: `radial-gradient(circle, ${lang.color}45, transparent 70%)` }} />
                  <div className="ef-hero-glow-2" style={{ background: `radial-gradient(circle, ${lang.color}25, transparent 70%)` }} />
                  <div className="ef-hero-inner">
                    <div className="ef-hero-badges">
                      <span className="ef-pill ef-pill-solid">✦ Kisah Unggulan</span>
                      <span className="ef-pill" style={{ background: lang.color + '30', color: lang.color, border: `1px solid ${lang.color}50` }}>
                        {lang.name}
                      </span>
                    </div>
                    <div className="ef-hero-title">{featured.primary_text}</div>
                    {(featured.gloss_id || featured.contextual_meaning) && (
                      <div className="ef-hero-sub">
                        {featured.gloss_id || featured.contextual_meaning}
                      </div>
                    )}
                    {featured.speaker?.name && (
                      <div className="ef-hero-speaker">
                        <div className="ef-hero-speaker-chip">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                          {featured.speaker.name}
                          {featured.speaker.village ? ` · ${featured.speaker.village.split(',')[0]}` : ''}
                        </div>
                      </div>
                    )}
                    <div className="ef-hero-controls">
                      <div className="ef-hero-track" onClick={e => e.stopPropagation()}>
                        <Waveform
                          seed={`ef-hero-${featured.id}`}
                          data={lang.wave}
                          height={24}
                          color="rgba(255,255,255,0.35)"
                          interactive={false}
                          animate={heroPlaying}
                        />
                      </div>
                      <button
                        className={`ef-hero-play-btn${!featured.audio_url ? ' ef-hero-play-disabled' : ''}`}
                        style={{ background: featured.audio_url ? lang.color : 'rgba(255,255,255,0.12)' }}
                        onClick={featured.audio_url ? toggleHero : e => { e.stopPropagation(); router.push(`/entry/${featured.lang}/${featured.slug ?? featured.id}`); }}
                        aria-label={heroPlaying ? 'Jeda' : 'Dengarkan'}
                      >
                        {heroPlaying
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right: Rekaman Terbaru — panel card with list */}
          {recentEntries.length > 0 && (
            <div className="ef-grid-right">
              <div className="ef-rec-panel">
                <div className="ef-rec-panel-head">
                  <span className="ef-label">REKAMAN TERBARU</span>
                  <Link href="/archive" className="ef-action">semua →</Link>
                </div>
                <div className="ef-rec-panel-list">
                  {recentEntries.map((e, i) => {
                    const lang = LANGUAGES.find(l => l.id === e.lang);
                    return (
                      <div
                        key={e.id}
                        className="ef-rec-row"
                        onClick={() => router.push(`/entry/${e.lang}/${e.slug ?? e.id}`)}
                        style={{ borderBottom: i < recentEntries.length - 1 ? '1px solid var(--n-100)' : 'none' }}
                      >
                        <PlayDot audioUrl={e.audio_url ?? null} color={lang?.color ?? 'var(--n-300)'} />
                        <div className="ef-rec-row-body">
                          <div className="ef-rec-row-word">{e.primary_text}</div>
                          {(e.gloss_id || e.gloss) && (
                            <div className="ef-rec-row-gloss">{e.gloss_id || e.gloss}</div>
                          )}
                        </div>
                        <div className="ef-rec-row-meta">
                          <span style={{ color: lang?.color ?? 'var(--n-500)' }}>{lang?.name ?? e.lang}</span>
                          <span>{TYPE_LABELS[e.type] ?? 'Entri'}</span>
                        </div>
                        <svg className="ef-today-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>


      </div>
    </section>
  );
}
