'use client';
import { motion } from 'framer-motion';
import Icon from './Icon.jsx';

const CHANNELS = [
  {
    n: '01',
    color: '#1cb0f6',
    title: 'Open Archive',
    body: 'Seluruh koleksi tersedia secara permanen di aksarantara.org — gratis, dapat dicari, dan dapat diakses oleh siapa saja di seluruh dunia. Setiap entri dilengkapi atribusi penutur, konteks budaya, dan audio.',
    detail: 'Gratis selamanya',
  },
  {
    n: '02',
    color: '#ff9600',
    title: 'Research Reference',
    body: 'Aksarantara dirancang untuk dapat dikutip. Linguis, akademisi, dan program pelestarian bahasa — termasuk institusi internasional — dapat menjadikan setiap entri sebagai sumber primer dengan URL stabil dan metadata terstruktur.',
    detail: 'Dapat dikutip · Open license',
  },
  {
    n: '03',
    color: '#58cc02',
    title: 'Mobile & API',
    body: 'Mobile app dan API publik masuk dalam roadmap — memungkinkan kontributor lapangan merekam langsung dari ponsel, dan pengembang membangun alat di atas arsip ini. Data terbuka, infrastruktur terbuka.',
    detail: 'Roadmap · Phase 03',
  },
];

export default function Disseminasi() {
  return (
    <section className="section disseminasi" id="disseminasi">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="kicker">Diseminasi</div>
          <h2 className="section-title">
            Dibuat untuk <span className="hl-blue">dibagikan, dikutip, dan dikembangkan</span>.
          </h2>
          <p className="section-sub">
            Aksarantara bukan sekadar alat dokumentasi — ini adalah arsip budaya
            hidup yang dirancang untuk jangka panjang. Akses terbuka, lisensi
            terbuka, dan infrastruktur terbuka agar karya ini menjangkau peneliti,
            komunitas, dan pengembang di mana saja.
          </p>
        </motion.div>

        <motion.div
          className="method-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {CHANNELS.map(ch => (
            <motion.article
              key={ch.n}
              className="method-step"
              style={{ '--step-color': ch.color }}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.55 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="ms-num" style={{ color: ch.color }}>{ch.n}</div>
              <h3 className="ms-title">{ch.title}</h3>
              <p className="ms-body">{ch.body}</p>
              <div className="ms-detail">{ch.detail}</div>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="diss-footer"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="df-left">
            <Icon name="check" size={14} />
            <span>Seluruh karya didaftarkan ke <strong>DJKI Kemenkumham</strong> sebagai hak cipta proyek dalam 3 bulan sejak peluncuran.</span>
          </div>
          <div className="df-right">
            <span className="df-badge">CC BY-SA 4.0</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
