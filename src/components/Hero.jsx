'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon.jsx';
import Waveform from './Waveform.jsx';
import { LANGUAGES } from '../data.js';
import { createClient } from '../lib/supabase.js';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fallbackWave = [0.2,0.35,0.55,0.7,0.85,0.95,0.8,0.6,0.4,0.55,0.75,0.9,0.7,0.45,0.3,0.5,0.72,0.88,0.95,0.75,0.55,0.35,0.5,0.7,0.85,0.65,0.4,0.25,0.45,0.65,0.8,0.95,0.75,0.5,0.3,0.45,0.65,0.85,0.7,0.5,0.3,0.2];

function getDayIndex(count) {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return dayOfYear % count;
}

export default function Hero({ onContribute }) {
  const [wordOfDay, setWordOfDay]     = useState(null);
  const [entryCount, setEntryCount]   = useState(438);
  const [speakerCount, setSpeakerCount] = useState(47);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.from('entries')
      .select('*, speaker:speakers(*)')
      .eq('status', 'approved')
      .eq('type', 'word')
      .not('audio_url', 'is', null)
      .order('id')
      .then(({ data }) => {
        if (!data?.length) return;
        setWordOfDay(data[getDayIndex(data.length)]);
      });
    supabase.from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count }) => { if (count) setEntryCount(count); });
    supabase.from('speakers')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count) setSpeakerCount(count); });
  }, []);

  const lang = wordOfDay ? LANGUAGES.find(l => l.id === wordOfDay.lang) : null;
  const waveColor = lang?.color ?? '#1cb0f6';
  const waveData  = lang?.wave ?? fallbackWave;

  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero-grid">
          <motion.div
            className="hero-lead"
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
          >

          <motion.h1
            className="hero-title"
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
          >
            Setiap suara<br /><em style={{ fontFamily: 'var(--font-editorial)', fontWeight: 500, fontStyle: 'italic', fontSize: 'clamp(30px, 6.5vw, 48px)' }}>adalah arsip.</em>
          </motion.h1>
            <p>
              Aksarantara mendokumentasikan bahasa-bahasa daerah Indonesia
              melalui <strong>rekaman suara otentik</strong> — dialek, intonasi,
              dan tradisi lisan tepat sebagaimana diucapkan penutur aslinya.
              Sebuah arsip terbuka yang dapat dikutip oleh siapa saja,{' '}
              <strong>selamanya</strong>.
            </p>
            <div className="hero-ctas">
<a href="/archive" className="btn-primary lg">
                Jelajahi arsip <Icon name="arrow" size={16} />
              </a>
              <motion.button
                className="btn-ghost lg"
                onClick={onContribute}
                whileHover={{ y: -2 }} whileTap={{ y: 0 }}
              >
                <Icon name="mic" size={14} /> Rekam suara
              </motion.button>
            </div>

            <div className="hero-pills">
              <div className="pill"><span className="pill-num">5</span> bahasa</div>
              <div className="pill"><span className="pill-num">3</span> provinsi</div>
              <div className="pill"><span className="pill-num">{speakerCount}</span> penutur</div>
              <div className="pill"><span className="pill-num">{entryCount.toLocaleString('id-ID')}</span> entri</div>
            </div>
          </motion.div>

          <motion.aside
            className="hero-card"
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ '--hc-accent': waveColor }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="hc-ribbon">KATA HARI INI</div>
              {lang && (
                <span className="al-lang-tag" style={{ background: lang.color + '22', color: lang.color }}>
                  {lang.name}
                </span>
              )}
            </div>
            <div className="hc-head">
              <div>
                <div className="hc-word">{wordOfDay?.primary_text ?? '…'}</div>
                {wordOfDay?.phonetic && <div className="hc-phon">{wordOfDay.phonetic}</div>}
              </div>
            </div>
            <div className="hc-gloss">
              {wordOfDay ? (
                <>
                  {(wordOfDay.gloss_id || wordOfDay.gloss) && (
                    <><span className="gl-id">id.</span> {wordOfDay.gloss_id || wordOfDay.gloss}</>
                  )}
                  {wordOfDay.gloss && wordOfDay.gloss !== wordOfDay.gloss_id && (
                    <><span className="gl-sep">·</span><span className="gl-en">en.</span> {wordOfDay.gloss}</>
                  )}
                </>
              ) : <span style={{ color: 'var(--n-300)' }}>—</span>}
            </div>

            <div className="hc-wave" style={{ color: waveColor }}>
              <Waveform
                seed={`hero-wod-${wordOfDay?.id ?? 'placeholder'}`}
                data={waveData}
                height={72}
                duration={1.8}
                color={waveColor}
                src={wordOfDay?.audio_url ?? null}
              />
            </div>
            <div className="hc-hint"><Icon name="waveform" size={12} /> klik untuk mendengar</div>

            <div className="hc-meta">
              <div>
                <div className="hc-l">Penutur</div>
                <div className="hc-v">{wordOfDay?.speaker?.name ?? '—'}</div>
              </div>
              <div>
                <div className="hc-l">Desa</div>
                <div className="hc-v">{wordOfDay?.speaker?.village ?? '—'}</div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>

      <div className="hero-marquee">
        <div className="marquee-track">
          {[...Array(2)].flatMap((_, k) =>
            ['BUGIS', 'MASSENREMPULU', 'KONJO', 'MINANGKABAU', 'MELAYU JAMBI'].map((l, i) => (
              <span key={`${k}-${i}`} className="marquee-item">
                <span className="marquee-star">✦</span> {l}
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
