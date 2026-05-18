'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

const PILLARS = [
  {
    title: 'Infrastruktur Data Terbuka',
    body: 'Seluruh entri tersedia bebas (CC BY-SA 4.0) untuk peneliti, pengembang, dan komunitas sipil — tanpa registrasi, tanpa biaya.',
    color: 'var(--blue)',
  },
  {
    title: 'Partisipasi Komunitas Asli',
    body: 'Penutur asli adalah pemilik data, bukan objek studi. Kontribusi suara adalah bentuk partisipasi sipil yang nyata dan terarsipkan secara permanen.',
    color: 'var(--green)',
  },
  {
    title: 'Teknologi untuk Bahasa Minoritas',
    body: 'Data yang dikumpulkan menjadi fondasi alat digital untuk bahasa-bahasa yang selama ini tak terwakili di internet dan kecerdasan buatan.',
    color: 'var(--purple)',
  },
];

function PillarCard({ p }) {
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '2px solid var(--n-100)',
        borderTop: `4px solid ${p.color}`,
        borderRadius: 'var(--radius-xl)',
        padding: '24px 20px',
        boxShadow: 'var(--shadow-sm)',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        {p.title}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--n-700)', lineHeight: 1.65, margin: 0 }}>
        {p.body}
      </p>
    </div>
  );
}

export default function DigitalInclusion() {
  const [idx, setIdx] = useState(0);

  function handleDragEnd(_, info) {
    if (info.offset.x < -50 && idx < PILLARS.length - 1) setIdx(i => i + 1);
    else if (info.offset.x > 50 && idx > 0) setIdx(i => i - 1);
  }

  return (
    <section className="section" id="inklusi" style={{ background: 'var(--n-50)' }}>
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="kicker">
            <span className="dot" style={{ background: 'var(--purple)', boxShadow: '0 0 0 3px rgba(206,130,255,0.18)' }} />
            Digital Inclusion
          </div>
          <h2 className="section-title">
            Hadir di ruang digital<br />
            bukan kemewahan — <span className="hl-purple">tapi hak.</span>
          </h2>
          <p className="section-sub">
            Tidak ada <em>autocorrect</em> untuk <strong>bosi</strong>. Tidak ada model bahasa
            yang mengenal <strong>kamase-mase</strong>. Tidak ada keyboard standar untuk aksara
            Lontara. Aksarantara membangun lapisan data dasar yang memungkinkan bahasa-bahasa
            minoritas hadir di era digital — sebagai infrastruktur komunitas yang aktif digunakan,
            bukan sekadar koleksi museum.
          </p>
        </motion.div>

        {/* Desktop grid */}
        <motion.div
          className="di-desktop-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {PILLARS.map(p => (
            <motion.div key={p.title} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.5 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
              <PillarCard p={p} />
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile carousel */}
        <div className="di-mobile-carousel">
          <div className="swipe-track-wrap">
            <motion.div
              className="swipe-track"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={handleDragEnd}
              animate={{ x: `${-idx * 100}%` }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {PILLARS.map(p => (
                <div key={p.title} className="swipe-slide">
                  <PillarCard p={p} />
                </div>
              ))}
            </motion.div>
          </div>
          <div className="swipe-dots">
            {PILLARS.map((_, i) => (
              <button key={i} className={`swipe-dot${i === idx ? ' active' : ''}`} onClick={() => setIdx(i)} style={{ '--dot-color': PILLARS[i].color }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
