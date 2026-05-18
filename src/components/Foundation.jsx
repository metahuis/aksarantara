'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '../lib/supabase.js';

function CountUp({ to, suffix = '', duration = 1.2 }) {
  const [v, setV] = useState(0);
  const ref = useRef();

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const start = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - start) / (duration * 1000));
          const eased = 1 - Math.pow(1 - p, 3);
          setV(Math.round(eased * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{v}{suffix}</span>;
}

const ROADMAP = [
  { tag: 'Phase 01 · 0–6 bulan',   title: 'Archive Platform',     desc: 'Pemutar audio, jalur kontribusi, dan struktur data awal. Pendaftaran hak cipta ke DJKI Kemenkumham.', status: 'berjalan', color: '#58cc02' },
  { tag: 'Phase 02 · 6–12 bulan',  title: 'Research Library',     desc: 'Arsip terbuka dengan entri yang dapat dikutip, metadata terstruktur, dan akses API publik untuk linguis dan peneliti di seluruh dunia.', color: '#1cb0f6' },
  { tag: 'Phase 03 · 12–24 bulan', title: 'Mobile App',           desc: 'Aplikasi iOS dan Android untuk kontributor lapangan dan pendengar umum — rekam, kirim, dan jelajahi suara-suara daerah kapan saja.', color: '#ff9600' },
  { tag: 'Phase 04 · Jangka panjang', title: 'Collective Foundation', desc: 'Meresmikan Aksarantara sebagai kolektif nirlaba — dikelola oleh kontributor, didukung institusi, dan diwariskan lintas generasi.', color: '#a855f7' },
];

export default function Foundation() {
  const [liveEntries, setLiveEntries]   = useState(null);
  const [liveSpeakers, setLiveSpeakers] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('entries').select('id', { count: 'exact', head: true }).eq('status', 'approved')
      .then(({ count }) => { if (count) setLiveEntries(count); });
    supabase.from('speakers').select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count) setLiveSpeakers(count); });
  }, []);

  const STATS = [
    { label: 'Bahasa dalam pilot',    value: 5,                   suffix: '', note: 'di 3 provinsi' },
    { label: 'Penutur asli terlibat', value: liveSpeakers ?? 47, suffix: '', note: 'dari target 40–60' },
    { label: 'Entri terarsipkan',     value: liveEntries ?? 438, suffix: '', note: 'tinjauan dua-mata' },
    { label: 'Dialek tercakup',       value: 31,                  suffix: '', note: 'di 5 bahasa pilot' },
  ];

  return (
    <section className="section foundation" id="foundation">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="kicker"><span className="dot" style={{ background: 'var(--purple)', boxShadow: '0 0 0 3px rgba(206,130,255,0.18)' }} /> About</div>
          <h2 className="section-title">
            Sebuah infrastruktur komunitas <span className="hl-purple">yang dirancang untuk bertahan.</span>
          </h2>
          <p className="section-sub">
            Aksarantara adalah inisiatif independen untuk mendokumentasikan
            bahasa-bahasa daerah Indonesia melalui rekaman suara otentik — dimulai dari
            lima bahasa pilot, dengan visi mencakup seluruh bahasa daerah Nusantara.
            Infrastruktur data komunitas yang terbuka, dapat dikutip, dan gratis selamanya.
            Bukan produk komersial. Bukan startup. Sebuah arsip publik permanen yang dapat
            dijadikan referensi oleh peneliti, linguis, aktivis, dan komunitas di seluruh
            dunia. Visi jangka panjang: membentuk Collective Foundation yang dikelola
            bersama dan diwariskan lintas generasi.
          </p>
        </motion.div>

        <motion.div
          className="stats-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              className="stat"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.55 }}
            >
              <div className="stat-num"><CountUp to={s.value} suffix={s.suffix} /></div>
              <div className="stat-lbl">{s.label}</div>
              <div className="stat-note">{s.note}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="roadmap">
          <div className="rm-head">Roadmap</div>
          <motion.div
            className="rm-track"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {ROADMAP.map((p, i) => (
              <motion.div
                key={i}
                className={`rm-phase ${p.muted ? 'muted' : ''}`}
                style={{ '--phase-color': p.color }}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <div className="rm-tag">{p.tag}</div>
                <div className="rm-title">{p.title}</div>
                <div className="rm-desc">{p.desc}</div>
                {p.status && <div className="rm-status">● {p.status}</div>}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
