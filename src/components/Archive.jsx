'use client';
import { useState, useMemo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Icon from './Icon.jsx';
import { LANGUAGES, ARCHIVE_ENTRIES } from '../data.js';

const TYPE_LABELS = { word: 'Kata', phrase: 'Frasa', story: 'Kisah', song: 'Lagu', pantun: 'Pantun' };

const Archive = forwardRef(function Archive(props, ref) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activeLang, setActiveLang] = useState('all');

  const entries = useMemo(() => {
    return ARCHIVE_ENTRIES.filter(e => {
      if (activeType !== 'all' && e.type !== activeType) return false;
      if (activeLang !== 'all' && e.lang !== activeLang) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.primary.toLowerCase().includes(q) ||
          e.gloss.toLowerCase().includes(q) ||
          (e.speaker?.toLowerCase() ?? '').includes(q)
        );
      }
      return true;
    });
  }, [query, activeType, activeLang]);

  return (
    <section className="section archive" id="archive" ref={ref}>
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="kicker">Arsip Terbuka</div>
          <h2 className="section-title">
            Setiap kata punya <span className="hl-orange">penutur</span>.
          </h2>
          <p className="section-sub">
            Arsip Aksarantara terbuka untuk publik — peneliti, pendidik, dan
            anggota komunitas. Tidak ada terjemahan otomatis; semua entri
            diverifikasi oleh koordinator wilayah.
          </p>
        </motion.div>

        <motion.div
          className="archive-controls"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="search-wrap">
            <span className="search-ico">›</span>
            <input
              className="search"
              placeholder="cari kata, arti, atau nama penutur…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')}>
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          <div className="filter-block">
            <div className="filter-row">
              <span className="filter-label">TIPE</span>
              {['all', 'word', 'phrase', 'story', 'song', 'pantun'].map(t => (
                <button
                  key={t}
                  className={`chip ${activeType === t ? 'active' : ''}`}
                  onClick={() => setActiveType(t)}
                >
                  {t === 'all' ? 'semua' : TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            <div className="filter-row">
              <span className="filter-label">BAHASA</span>
              <button
                className={`chip ${activeLang === 'all' ? 'active' : ''}`}
                onClick={() => setActiveLang('all')}
              >
                semua
              </button>
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  className={`chip ${activeLang === l.id ? 'active' : ''}`}
                  onClick={() => setActiveLang(l.id)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="archive-list"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {entries.map((e, i) => {
            const lang = LANGUAGES.find(l => l.id === e.lang);
            return (
              <motion.div
                key={`${e.lang}-${e.primary}-${i}`}
                className="al-row"
                variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.4 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                style={{ cursor: 'pointer' }}
                onClick={() => window.location.href = `/entry/${e.lang}/${e.slug ?? e.id}`}
              >
                <button className="al-play-btn" onClick={ev => ev.stopPropagation()} aria-label="Putar">
                  <Icon name="play" size={18} />
                </button>
                <div className="al-content">
                  <div className="al-badges">
                    <span className="al-lang-tag" data-lang={e.lang}>{lang?.name}</span>
                    <span className="al-type-tag" data-type={e.type}>{TYPE_LABELS[e.type]}</span>
                  </div>
                  <div className="al-primary">{e.primary}</div>
                  <div className="al-gloss">{e.gloss}</div>
                  <div className="al-s-meta">{[e.speaker, e.speaker_village?.split(',')[0]].filter(Boolean).join(' · ')}</div>
                </div>
              </motion.div>
            );
          })}

          {entries.length === 0 && (
            <div className="al-empty">tidak ada entri yang cocok.</div>
          )}
        </motion.div>

        <div className="archive-footer">
          <div className="af-count">
            <span className="af-num">{entries.length}</span> dari 964 entri arsip
          </div>
          <Link className="af-link" href="/archive">
            Buka arsip penuh <Icon name="arrow" size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
});

export default Archive;
