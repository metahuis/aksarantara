'use client';
import { useState, useEffect } from 'react';
import FieldSetupSheet from './FieldSetupSheet.jsx';

/**
 * Self-contained connection status pill — renders in Topbar nav-cta.
 * Manages its own FieldSetupSheet so callers need no extra state.
 */
export default function ConnectionPill() {
  const [connState, setConnState] = useState('online'); // 'online'|'offline'|'sync'
  const [queueCount, setQueueCount] = useState(0);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);

    function onOnline()  { setConnState(c => c === 'sync' ? 'sync' : 'online'); }
    function onOffline() { setConnState('offline'); }

    setConnState(navigator.onLine ? 'online' : 'offline');
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    function onQueue(e) {
      const count = e.detail?.count ?? 0;
      setQueueCount(count);
      if (navigator.onLine) setConnState(count > 0 ? 'sync' : 'online');
    }
    window.addEventListener('aksarantara:queue', onQueue);

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('aksarantara:queue', onQueue);
    };
  }, []);

  if (!mounted) return null;

  const labels = {
    online:  'Online',
    offline: 'Offline',
    sync:    queueCount > 0 ? `Sinkronisasi (${queueCount})` : 'Sinkronisasi',
  };

  return (
    <>
      <button
        className={`conn-pill conn-pill--${connState}`}
        onClick={() => setSheetOpen(true)}
        title="Status koneksi — tap untuk detail"
      >
        <span className="conn-pill-dot" />
        {labels[connState]}
      </button>

      <FieldSetupSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
