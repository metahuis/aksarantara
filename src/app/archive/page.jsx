import { Suspense } from 'react';
import Topbar from '../../components/Topbar.jsx';
import Footer from '../../components/Footer.jsx';
import ArchiveContent from './ArchiveContent.jsx';

export default function ArchivePage() {
  return (
    <>
      <Topbar />
      <main>
        <Suspense fallback={
        <div style={{ padding: '24px var(--pad)', maxWidth: 'var(--max)', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ padding: '16px 0', borderBottom: '1px solid var(--n-100)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="sk" style={{ width: 56, height: 20, borderRadius: 999 }} />
                  <div className="sk" style={{ width: 40, height: 20, borderRadius: 999 }} />
                </div>
                <div className="sk" style={{ width: `${55 + (i % 3) * 12}%`, height: 22 }} />
                <div className="sk" style={{ width: `${35 + (i % 4) * 8}%`, height: 14 }} />
              </div>
            ))}
          </div>
        </div>
      }>
          <ArchiveContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
