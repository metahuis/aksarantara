'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIBadge from '../AIBadge.jsx';
import { useMediaQuery } from '../../lib/useMediaQuery.js';

/**
 * Field setup sheet — mobile drawer / desktop modal.
 * Currently a roadmap preview; the offline model download is mocked.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function FieldSetupSheet({ open, onClose }) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'downloading' | 'done'
  const [pct, setPct]     = useState(0);
  const isMobile = useMediaQuery('(max-width: 720px)');

  function startDownload() {
    setPhase('downloading');
    setPct(0);
    const interval = setInterval(() => {
      setPct(p => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase('done');
          return 100;
        }
        return p + 2;
      });
    }, 120);
  }

  function handleClose() {
    setPhase('idle');
    setPct(0);
    onClose();
  }

  const sheetStyle = isMobile
    ? {
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderRadius: '20px 20px 0 0',
        zIndex: 201,
        maxWidth: 560,
        margin: '0 auto',
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        background: '#fff',
        borderRadius: 20,
        zIndex: 201,
        width: 'calc(100% - 32px)',
        maxWidth: 480,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      };

  const initialAnim = isMobile ? { y: '100%' }       : { opacity: 0, scale: 0.94, x: '-50%', y: '-50%' };
  const animateAnim = isMobile ? { y: 0 }            : { opacity: 1, scale: 1,    x: '-50%', y: '-50%' };
  const exitAnim    = isMobile ? { y: '100%' }       : { opacity: 0, scale: 0.94, x: '-50%', y: '-50%' };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            style={sheetStyle}
            initial={initialAnim}
            animate={animateAnim}
            exit={exitAnim}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            {isMobile && (
              <div style={{ width: 40, height: 4, background: 'var(--n-300)', borderRadius: 99, margin: '12px auto 0' }} />
            )}

            {!isMobile && (
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 14, right: 14,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 22,
                  color: 'var(--n-500)',
                  cursor: 'pointer',
                  width: 32, height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >×</button>
            )}

            <div className="dl-card">
              {/* Roadmap preview banner */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%)',
                border: '1px solid #fcd34d',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 16,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>📍</span>
                <div style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.55 }}>
                  <strong style={{ display: 'block', marginBottom: 2 }}>Roadmap Preview</strong>
                  Offline field mode is a post-hackathon feature. This UI shows the final design for coordinators working in villages without internet — Gemma 4 E2B will run on-device.
                </div>
              </div>

              {phase === 'done' ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>
                    Siap untuk lapangan
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--n-500)', lineHeight: 1.6 }}>
                    Anda bisa bekerja tanpa sinyal sekarang. Entri akan disinkronkan saat Wi-Fi tersedia.
                  </p>
                  <button className="btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={handleClose}>
                    Mulai
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <AIBadge variant="outline" label="Gemma E2B · Perangkat" />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>
                    Unduh Aksarantara untuk lapangan
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--n-700)', lineHeight: 1.65, marginBottom: 16 }}>
                    Sekali unduh, bekerja tanpa sinyal. Cocok untuk perjalanan ke desa atau lokasi tanpa jaringan.
                  </p>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    {[['📦', '1.2 GB', 'Ukuran model'], ['📵', 'Tanpa sinyal', 'Setelah unduh'], ['🔄', 'Otomatis', 'Sinkronisasi']].map(([icon, val, label]) => (
                      <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{val}</div>
                        <div style={{ fontSize: 11, color: 'var(--n-500)' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {phase === 'downloading' && (
                    <>
                      <div className="dl-bar"><i style={{ width: `${pct}%` }} /></div>
                      <div className="dl-meta">{pct}% · {Math.round(pct * 12)} MB dari 1.2 GB</div>
                      <button className="btn-secondary" style={{ width: '100%', marginTop: 14 }} onClick={handleClose}>
                        Batalkan unduhan
                      </button>
                    </>
                  )}

                  {phase === 'idle' && (
                    <button className="btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={startDownload}>
                      Pratinjau alur unduhan
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
