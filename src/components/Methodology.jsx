'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon.jsx';

const METHOD_STEPS = [
  { n: '01', c: '#1cb0f6', title: 'Pemetaan Komunitas',     body: 'Koordinator wilayah memetakan penutur asli — terutama tetua — di desa target. Kami membangun kepercayaan dulu, merekam kemudian.',   detail: '3–4 minggu per wilayah' },
  { n: '02', c: '#ff9600', title: 'Wawancara Terpandu',     body: 'Templat terstruktur: kata → pelafalan → arti, frasa → konteks, cerita → narasi. Tidak ada skrip kaku.',                            detail: 'mobile-first, offline' },
  { n: '03', c: '#ff4b4b', title: 'Rekaman Otentik',        body: 'Audio adalah sumber utama — bukan transkripsi. Dialek, jeda, tawa, dan aksen tetap dipertahankan.',                                  detail: 'WAV 48kHz, arsip permanen' },
  { n: '04', c: '#ce82ff', title: 'Verifikasi Komunitas',   body: 'Setiap entri diperiksa minimal dua penutur dari wilayah yang sama sebelum masuk arsip publik — membangun kepercayaan lintas komunitas.',  detail: 'tinjauan dua-mata' },
  { n: '05', c: '#58cc02', title: 'Dokumentasi Terstruktur',body: 'Setiap entri ditautkan ke penutur, lokasi, dan tanggal untuk memungkinkan riset jangka panjang.',                                   detail: 'skema terbuka, JSON' },
];

function StepCard({ s }) {
  return (
    <article className="method-step" style={{ '--step-color': s.c, height: '100%', boxSizing: 'border-box' }}>
      <div className="ms-num" style={{ color: s.c }}>{s.n}</div>
      <h3 className="ms-title">{s.title}</h3>
      <p className="ms-body">{s.body}</p>
      <div className="ms-detail">{s.detail}</div>
    </article>
  );
}

export default function Methodology() {
  const [idx, setIdx] = useState(0);

  function handleDragEnd(_, info) {
    if (info.offset.x < -50 && idx < METHOD_STEPS.length - 1) setIdx(i => i + 1);
    else if (info.offset.x > 50 && idx > 0) setIdx(i => i - 1);
  }

  return (
    <section className="section method" id="method">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="kicker"><span className="dot" style={{ background: 'var(--green)', boxShadow: '0 0 0 3px rgba(88,204,2,0.18)' }} /> Methodology</div>
          <h2 className="section-title">
            Audio <span className="hl-green">terlebih dahulu</span>. Teknologi, belakangan.
          </h2>
          <p className="section-sub">
            Aksarantara <strong>bukan</strong> produk AI, bukan penerjemah, bukan
            mesin generatif. Kami adalah arsip kultural sekaligus teknologi sipil —
            sistem dokumentasi yang menghormati cara sebuah bahasa benar-benar diucapkan,
            dan infrastruktur data terbuka yang memungkinkan komunitas minoritas
            untuk hadir dan berpartisipasi di ruang digital.
          </p>
        </motion.div>

        {/* Desktop grid */}
        <motion.div
          className="method-grid meth-desktop-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {METHOD_STEPS.map(s => (
            <motion.div key={s.n} variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.55 }} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}>
              <StepCard s={s} />
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile carousel */}
        <div className="di-mobile-carousel meth-mobile-carousel">
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
              {METHOD_STEPS.map(s => (
                <div key={s.n} className="swipe-slide">
                  <StepCard s={s} />
                </div>
              ))}
            </motion.div>
          </div>
          <div className="swipe-dots">
            {METHOD_STEPS.map((s, i) => (
              <button key={i} className={`swipe-dot${i === idx ? ' active' : ''}`} onClick={() => setIdx(i)} style={{ '--dot-color': s.c }} />
            ))}
          </div>
        </div>

        <motion.div
          className="method-not"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="mn-col mn-is">
            <div className="mn-lab">Aksarantara ADALAH</div>
            <ul>
              <li><Icon name="check" size={14} /> Arsip audio komunitas</li>
              <li><Icon name="check" size={14} /> Dokumentasi terstruktur</li>
              <li><Icon name="check" size={14} /> Arsip terbuka untuk semua (CC&#8209;BY&#8209;SA 4.0)</li>
              <li><Icon name="check" size={14} /> Teknologi sipil untuk inklusi digital</li>
              <li><Icon name="check" size={14} /> Platform partisipasi komunitas akar rumput</li>
              <li><Icon name="check" size={14} /> Asisten AI yang bersandar pada arsip nyata</li>
              <li><Icon name="check" size={14} /> Pembaca aksara Lontara berbasis visi komputer</li>
            </ul>
          </div>
          <div className="mn-col mn-isnt">
            <div className="mn-lab">Aksarantara BUKAN</div>
            <ul>
              <li><Icon name="x" size={14} /> Pengganti penutur asli</li>
              <li><Icon name="x" size={14} /> Mesin penerjemah umum</li>
              <li><Icon name="x" size={14} /> Platform komersial</li>
              <li><Icon name="x" size={14} /> Sistem generatif tanpa sumber</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
