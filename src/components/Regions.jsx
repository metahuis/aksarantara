'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Icon from './Icon.jsx';
import Waveform from './Waveform.jsx';
import { LANGUAGES, STATUS_COLORS } from '../data.js';
import { createClient } from '../lib/supabase.js';

function LanguageCard({ lang, index, audioUrl }) {
  return (
    <motion.article
      className="lang-card"
      style={{ '--card-color': lang.color, cursor: 'pointer' }}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => window.location.href = `/language/${lang.id}`}
    >
      <div className="lc-color-bar" />
      <header className="lc-head">
        <h3 className="lc-title">{lang.name}</h3>
        <div className="lc-status" style={{ background: STATUS_COLORS[lang.status]?.bg, color: STATUS_COLORS[lang.status]?.text }}>{lang.status}</div>
      </header>
      <div className="lc-meta">
        <div className="lc-meta-row"><Icon name="pin" size={12} /> {lang.region}</div>
        <div className="lc-meta-row"><Icon name="user" size={12} /> {lang.speakers} penutur</div>
      </div>

      <p className="lc-note">{lang.note}</p>

      <div className="lc-sample">
        <div className="lc-sw">
          <span className="sw-word">{lang.sample.word}</span>
          <span className="sw-arr">→</span>
          <span className="sw-meaning">{lang.sample.meaning}</span>
        </div>
        <div className="lc-wave" onClick={e => e.stopPropagation()}>
          <Waveform
            seed={`lang-${lang.id}`}
            data={lang.wave}
            height={40}
            duration={1.4}
            color={lang.color}
            barWidth={2.5}
            gap={2}
            src={audioUrl ?? null}
          />
        </div>
        <div className="lc-speaker">
          <div>oleh <strong>{lang.sample.speaker}</strong> tahun</div>
          <div>{lang.sample.village}</div>
        </div>
      </div>
    </motion.article>
  );
}

export default function Regions() {
  const [audioUrls, setAudioUrls] = useState({});
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const sampleWords = LANGUAGES.map(l => l.sample.word);
    supabase
      .from('entries')
      .select('lang, primary_text, audio_url')
      .eq('status', 'approved')
      .not('audio_url', 'is', null)
      .in('primary_text', sampleWords)
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        LANGUAGES.forEach(lang => {
          const match = data.find(e => e.lang === lang.id && e.primary_text === lang.sample.word);
          if (match) map[lang.id] = match.audio_url;
        });
        setAudioUrls(map);
      });
  }, []);

  const prev = () => setActiveIdx(i => (i - 1 + LANGUAGES.length) % LANGUAGES.length);
  const next = () => setActiveIdx(i => (i + 1) % LANGUAGES.length);

  return (
    <section className="section regions" id="regions">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="kicker"><span className="dot" style={{ background: 'var(--blue)', boxShadow: '0 0 0 3px rgba(28,176,246,0.18)' }} /> Regional Languages (Pilot)</div>
          <h2 className="section-title">
            5 bahasa, 3 provinsi, <span className="hl-blue">1 koleksi suara bersama</span>.
          </h2>
          <p className="section-sub">
            Setiap wilayah dikelola oleh koordinator lokal yang bekerja bersama
            penutur asli. Koleksi tumbuh terdesentralisasi, namun terstruktur
            dalam satu arsip yang harmonis — menghasilkan karya budaya digital
            yang dapat diakses siapapun.
          </p>
        </motion.div>

        {/* Desktop: grid */}
        <motion.div
          className="lang-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {LANGUAGES.map((lang, i) => (
            <LanguageCard key={lang.id} lang={lang} index={i} audioUrl={audioUrls[lang.id]} />
          ))}
        </motion.div>

        {/* Mobile: stacked single card */}
        <div className="lang-stack">
          {/* Visual stack area — ghosts confined here */}
          <div className="lang-stack-visual">
            <div className="lang-stack-ghost lang-stack-ghost-2" style={{ background: LANGUAGES[(activeIdx + 2) % LANGUAGES.length].color + '22' }} />
            <div className="lang-stack-ghost lang-stack-ghost-1" style={{ background: LANGUAGES[(activeIdx + 1) % LANGUAGES.length].color + '33' }} />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                className="lang-stack-card"
                initial={{ opacity: 0, x: 40, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, { offset }) => {
                  if (offset.x < -50) next();
                  else if (offset.x > 50) prev();
                }}
              >
                <LanguageCard lang={LANGUAGES[activeIdx]} index={activeIdx} audioUrl={audioUrls[LANGUAGES[activeIdx].id]} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="lang-stack-dots">
            {LANGUAGES.map((l, i) => (
              <button
                key={l.id}
                className={`lang-stack-dot${i === activeIdx ? ' active' : ''}`}
                style={{ background: i === activeIdx ? l.color : undefined }}
                onClick={() => setActiveIdx(i)}
                aria-label={l.name}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
