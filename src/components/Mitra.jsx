'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PARTNERS as STATIC_PARTNERS, COORDINATORS as STATIC_COORDINATORS } from '../data.js';
import { createClient } from '../lib/supabase.js';
import Icon from './Icon.jsx';

function CoordCard({ c }) {
  const langs = Array.isArray(c.languages) ? c.languages : [];
  return (
    <div className="coord-card" style={{ '--coord-color': c.color ?? '#1cb0f6', height: '100%', boxSizing: 'border-box' }}>
      <div className="coord-lang-pills">
        {langs.map(l => <span key={l} className="coord-lang-pill">{l}</span>)}
      </div>
      <div className="coord-name">{c.name}</div>
      <div className="coord-role">{c.role}</div>
      <div className="coord-affil">{c.affil ?? c.affiliation}</div>
      <div className="coord-foot">
        <span className="coord-entries-num" style={{ color: c.color ?? '#1cb0f6' }}>
          {c.entries ?? c.entries_curated ?? 0}
        </span>
        <span className="coord-entries-lbl">entri dikurasi</span>
      </div>
    </div>
  );
}

function CtaCard() {
  return (
    <div className="coord-cta-card">
      <div className="coord-cta-icon">🏛️</div>
      <div className="coord-cta-title">Institusi Anda di sini</div>
      <p className="coord-cta-body">
        Bergabunglah sebagai koordinator wilayah dan bantu mendokumentasikan bahasa daerah Indonesia bersama komunitas kami.
      </p>
      <a href="mailto:hamka.rasufit@gmail.com" className="coord-cta-btn">Hubungi Kami →</a>
    </div>
  );
}

export default function Mitra() {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [partners, setPartners] = useState(STATIC_PARTNERS);
  const [coordinators, setCoordinators] = useState(
    STATIC_COORDINATORS.map(c => ({ ...c, languages: c.languages ?? [] }))
  );
  const [coordIdx, setCoordIdx] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('partners').select('*').eq('active', true).order('sort_order').then(({ data, error }) => {
      if (!error && data?.length) setPartners(data);
    });
    supabase.from('coordinators').select('*').eq('active', true).order('sort_order').then(({ data, error }) => {
      if (!error && data?.length) {
        setCoordinators(data.map(c => ({
          ...c,
          languages: c.languages ?? [],
          affil: c.affiliation,
          entries: c.entries_curated,
        })));
      }
    });
  }, []);

  function handleCoordDrag(_, info) {
    const total = coordinators.length + 1; // +1 for CTA card
    if (info.offset.x < -50 && coordIdx < total - 1) setCoordIdx(i => i + 1);
    else if (info.offset.x > 50 && coordIdx > 0) setCoordIdx(i => i - 1);
  }

  const marqueeItems = [...partners, ...partners];
  const marqueeSpeed = Math.max(20, partners.length * 5);

  return (
    <section className="section mitra-section" ref={ref}>
      <div className="container">
        <div className="section-head">
          <div className="kicker">
            <span className="dot" style={{ background: 'var(--indigo)', boxShadow: '0 0 0 3px rgba(43,112,201,0.18)' }} />
            Partners & Coordinators
          </div>
          <h2 className="section-title">Didukung institusi, dijalankan komunitas.</h2>
          <p className="section-sub">
            Aksarantara bekerja bersama perguruan tinggi, lembaga riset, dan koordinator lapangan yang berakar di masing-masing wilayah bahasa.
          </p>
        </div>

        {/* ── Mitra Institusional — marquee ── */}
        <div className="mitra-label">Mitra Institusional</div>
        <div className="marquee-outer">
          <div className="marquee-track" style={{ animationDuration: `${marqueeSpeed}s` }}>
            {marqueeItems.map((p, i) => (
              <div key={i} className="partner-item">
                <div className="marquee-logo">
                  {p.logo_url
                    ? <img src={p.logo_url} alt={p.short_name ?? p.short} width={32} height={32} style={{ objectFit: 'contain' }} />
                    : <div className="marquee-abbr">{p.short_name ?? p.short}</div>
                  }
                </div>
                <span className="marquee-name">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Koordinator Lapangan ── */}
        <div className="mitra-label" style={{ marginTop: 48 }}>Koordinator Lapangan</div>

        {/* Desktop grid */}
        <div className="coord-grid coord-grid-desktop">
          {coordinators.map((c, i) => (
            <motion.div
              key={c.id ?? c.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <CoordCard c={c} />
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + coordinators.length * 0.12, duration: 0.5 }}
          >
            <CtaCard />
          </motion.div>
        </div>

        {/* Mobile carousel */}
        <div className="di-mobile-carousel">
          <div className="swipe-track-wrap">
            <motion.div
              className="swipe-track"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={handleCoordDrag}
              animate={{ x: `${-coordIdx * 100}%` }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {coordinators.map(c => (
                <div key={c.id ?? c.name} className="swipe-slide">
                  <CoordCard c={c} />
                </div>
              ))}
              <div className="swipe-slide">
                <CtaCard />
              </div>
            </motion.div>
          </div>
          <div className="swipe-dots">
            {[...coordinators, { id: 'cta' }].map((_, i) => (
              <button key={i} className={`swipe-dot${i === coordIdx ? ' active' : ''}`} onClick={() => setCoordIdx(i)} style={{ '--dot-color': 'var(--indigo)' }} />
            ))}
          </div>
        </div>

        {/* Trust statement */}
        <motion.div
          className="mitra-trust"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Icon name="check" size={16} />
          <span>
            Semua mitra akan menandatangani <strong>Nota Kesepahaman (MoU)</strong> dan berkomitmen mengikuti protokol etika dokumentasi bahasa ELDP/ELAR.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
