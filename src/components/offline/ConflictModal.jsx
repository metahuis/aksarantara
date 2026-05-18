'use client';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal for resolving an offline queue conflict (local vs server version).
 * @param {{ open: boolean, item: object|null, onResolve: (choice:'local'|'server') => void, onClose: () => void }} props
 */
export default function ConflictModal({ open, item, onResolve, onClose }) {
  if (!item) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              background: '#fff',
              borderRadius: 'var(--radius-xl, 20px)',
              padding: 28,
              width: 'min(90vw, 420px)',
              zIndex: 301,
              boxShadow: 'var(--shadow-pop)',
            }}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ marginBottom: 6 }}>
              <span className="queue-row-badge queue-row-badge--conflict">Konflik</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '8px 0 6px' }}>
              Dua versi ditemukan
            </h3>
            <p style={{ fontSize: 13, color: 'var(--n-500)', lineHeight: 1.6, marginBottom: 20 }}>
              Entri <strong style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                {item.entry?.primary_text || '—'}
              </strong> sudah ada di server. Pilih versi mana yang ingin disimpan:
            </p>

            {/* Side-by-side preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Lokal (rekaman Anda)', data: item.entry, key: 'local' },
                { label: 'Server (sudah ada)', data: item.serverEntry, key: 'server' },
              ].map(({ label, data, key }) => (
                <div key={key} style={{ border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius)', padding: '10px 12px', background: 'var(--n-50)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{data?.primary_text || '—'}</div>
                  {data?.phonetic && <div style={{ fontSize: 11, color: 'var(--n-500)' }}>/{data.phonetic}/</div>}
                  {data?.gloss_id && <div style={{ fontSize: 12, color: 'var(--n-700)', marginTop: 2 }}>{data.gloss_id}</div>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={() => onResolve('local')}
              >
                Gunakan rekaman saya
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={() => onResolve('server')}
              >
                Gunakan versi server
              </button>
              <button
                className="btn-ghost"
                style={{ width: '100%', fontSize: 13 }}
                onClick={onClose}
              >
                Tunda — putuskan nanti
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
