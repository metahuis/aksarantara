'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon.jsx';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if already dismissed in this session
    if (sessionStorage.getItem('a2hs-dismissed')) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show after 30 seconds on second visit
      const visitCount = parseInt(localStorage.getItem('aksa-visits') || '0', 10);
      localStorage.setItem('aksa-visits', String(visitCount + 1));

      if (visitCount > 0) {
        setTimeout(() => {
          setShow(true);
        }, 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShow(false);
    sessionStorage.setItem('a2hs-dismissed', 'true');
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('a2hs-dismissed', 'true');
  };

  if (!deferredPrompt) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            bottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
            left: 'var(--pad)',
            right: 'var(--pad)',
            background: 'var(--white)',
            border: '2px solid var(--green)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: 'var(--shadow-pop)',
            zIndex: 150,
            maxWidth: 'calc(100% - 2 * var(--pad))',
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name="download" size={20} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                Instal Aksarantara
              </div>
              <div style={{ fontSize: 12, color: 'var(--n-700)', lineHeight: 1.5, marginBottom: 10 }}>
                Akses offline dari perangkat Anda. Akses arsip dimana saja, kapan saja.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleInstall}
                  style={{
                    background: 'var(--green)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  Instal
                </button>
                <button
                  onClick={handleDismiss}
                  style={{
                    background: 'transparent',
                    color: 'var(--n-500)',
                    border: '1px solid var(--n-200)',
                    borderRadius: 'var(--radius)',
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
