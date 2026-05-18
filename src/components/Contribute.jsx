'use client';
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Icon from './Icon.jsx';

const Contribute = forwardRef(function Contribute(props, ref) {
  return (
    <section className="section contribute" id="contribute" ref={ref}>
      <div className="container">
        <motion.div
          className="section-head center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="kicker center"><span className="dot" style={{ background: 'var(--green)', boxShadow: '0 0 0 3px rgba(88,204,2,0.18)' }} /> Contribute</div>
          <h2 className="section-title">Suara Anda adalah <span className="hl-green">arsip</span>.</h2>
          <p className="section-sub center" style={{ maxWidth: 520, margin: '0 auto' }}>
            Rekam satu kata. Satu suara sudah cukup untuk memulai.
            Setiap kontribusi ditinjau koordinator wilayah sebelum masuk arsip permanen.
          </p>
        </motion.div>

        <motion.div
          style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/contribute">
            <motion.button
              className="btn-primary"
              style={{ fontSize: 16, padding: '14px 32px', gap: 10 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Icon name="mic" size={18} />
              Mulai Kontribusi
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
});

export default Contribute;
