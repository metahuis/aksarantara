'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const FEATURES = [
  {
    href: '/chat',
    color: 'var(--green)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    kicker: 'AI Tutor',
    title: 'Ngobrol dengan arsip',
    body: 'Tanya kata, minta kuis, atau gali sejarah budaya — semua jawaban bersandar pada entri nyata di arsip, didukung Gemma 4.',
    cta: 'Mulai ngobrol',
  },
  {
    href: '/scan',
    color: 'var(--orange)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    kicker: 'Visi Komputer',
    title: 'Baca aksara Lontara',
    body: 'Upload foto manuskrip atau papan nama — sistem mengenali aksara Lontara dan menerjemahkannya ke teks Latin secara otomatis.',
    cta: 'Coba sekarang',
  },
];

export default function FeatureStrip() {
  return (
    <section className="section" id="fitur" style={{ background: 'var(--n-50)', borderTop: '1px solid var(--n-100)' }}>
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="kicker">
            <span className="dot" style={{ background: 'var(--green)', boxShadow: '0 0 0 3px rgba(88,204,2,0.18)' }} />
            AI Features
          </div>
          <h2 className="section-title">
            Arsip yang bisa <span className="hl-green">kamu ajak bicara.</span>
          </h2>
          <p className="section-sub">
            Dua alat berbasis kecerdasan buatan yang menggunakan data arsip nyata sebagai fondasinya —
            bukan model generatif yang berhalusinasi.
          </p>
        </motion.div>

        <motion.div
          className="fs-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.href}
              className="fs-card"
              style={{ '--fs-accent': f.color }}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.55 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="fs-icon" style={{ color: f.color, background: f.color + '18' }}>
                {f.icon}
              </div>
              <div className="fs-kicker" style={{ color: f.color }}>{f.kicker}</div>
              <div className="fs-title">{f.title}</div>
              <p className="fs-body">{f.body}</p>
              <Link href={f.href} className="fs-cta" style={{ color: f.color }}>
                {f.cta} →
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
