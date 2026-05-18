'use client';
import { useState } from 'react';
import Link from 'next/link';
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import { LANGUAGES } from '@/data';

const TYPE_LABELS = { word: 'Kata', phrase: 'Frasa', peribahasa: 'Peribahasa', story: 'Kisah', song: 'Lagu', pantun: 'Pantun' };
const TYPE_ORDER  = ['word', 'phrase', 'peribahasa', 'story', 'song', 'pantun'];
const PAGE_SIZE   = 9;

export default function SuaraContent({ speaker, entries }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage]             = useState(1);

  const lang    = LANGUAGES.find(l => l.id === speaker.language_id);
  const bio     = speaker.bio || speaker.profile?.bio || null;
  const avatar  = speaker.photo_url || speaker.profile?.avatar_url || null;
  const initial = (speaker.name || '?').charAt(0).toUpperCase();

  const typeCounts = {};
  entries.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1; });

  const types      = TYPE_ORDER.filter(t => entries.some(e => e.type === t));
  const filtered   = typeFilter === 'all' ? entries : entries.filter(e => e.type === typeFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const location   = [speaker.village, speaker.city, speaker.province].filter(Boolean).join(', ');

  function handleTypeFilter(t) {
    setTypeFilter(t);
    setPage(1);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--n-50)' }}>
      <Topbar />

      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* Speaker card */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-xl)', padding: '36px 40px', boxShadow: 'var(--shadow-card)', marginBottom: 32, display: 'flex', gap: 36, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div className="profile-avatar-wrapper" style={{ flexShrink: 0 }}>
            {avatar ? (
              <img src={avatar} alt={speaker.name} style={{ width: 200, height: 200, borderRadius: 'var(--radius-lg)', objectFit: 'cover', border: '2px solid var(--n-100)', display: 'block' }} />
            ) : (
              <div style={{ width: 200, height: 200, borderRadius: 'var(--radius-lg)', background: lang?.color ?? 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                {initial}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 220, paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '-0.02em' }}>{speaker.name}</h1>
              {lang && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: lang.color + '20', color: lang.color, flexShrink: 0 }}>
                  {lang.name}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 13, color: 'var(--n-500)', marginBottom: 16, lineHeight: 1.6 }}>
              {speaker.age && <span>{speaker.age} tahun</span>}
              {speaker.dialect && <><span style={{ color: 'var(--n-200)' }}>·</span><span>Dialek {speaker.dialect}</span></>}
              {location && <><span style={{ color: 'var(--n-200)' }}>·</span><span>{location}</span></>}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: bio ? 20 : 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--n-600)', padding: '5px 12px', borderRadius: 99, background: 'var(--n-50)', border: '1.5px solid var(--n-100)' }}>
                {entries.length} entri
              </span>
              {TYPE_ORDER.filter(t => typeCounts[t]).map(t => (
                <span key={t} style={{ fontSize: 12, fontWeight: 600, color: 'var(--n-500)', padding: '5px 12px', borderRadius: 99, background: 'var(--n-50)', border: '1.5px solid var(--n-100)' }}>
                  {typeCounts[t]} {TYPE_LABELS[t]}
                </span>
              ))}
            </div>

            {bio && (
              <p style={{ fontSize: 14, color: 'var(--n-700)', margin: 0, lineHeight: 1.75, borderTop: '1px solid var(--n-100)', paddingTop: 16 }}>{bio}</p>
            )}
          </div>
        </div>

        {/* Type filter */}
        {types.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => handleTypeFilter('all')} className={`chip ${typeFilter === 'all' ? 'active' : ''}`}>Semua</button>
            {types.map(t => (
              <button key={t} onClick={() => handleTypeFilter(t)} className={`chip ${typeFilter === t ? 'active' : ''}`}>
                {TYPE_LABELS[t]} ({typeCounts[t]})
              </button>
            ))}
          </div>
        )}

        {/* Entries grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
          {paginated.map(entry => (
            <Link key={entry.id} href={`/entry/${entry.lang}/${entry.slug ?? entry.id}`}
              style={{ display: 'block', textDecoration: 'none', background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 120ms' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'var(--n-50)', color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {TYPE_LABELS[entry.type] ?? entry.type}
                </span>
                {entry.audio_url && <span style={{ fontSize: 12, color: 'var(--green)' }}>♪</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 3 }}>{entry.primary_text}</div>
              {entry.gloss_id && <div style={{ fontSize: 13, color: 'var(--n-500)' }}>{entry.gloss_id}</div>}
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--n-300)', fontSize: 14, padding: '48px 0' }}>Belum ada entri.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--n-500)' }}>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{filtered.length}</span> entri
              <span> · halaman {page} dari {totalPages}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-ghost"
                style={{ padding: '6px 14px', fontSize: 13, opacity: page <= 1 ? 0.4 : 1 }}>
                ← Sebelumnya
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn-ghost"
                style={{ padding: '6px 14px', fontSize: 13, opacity: page >= totalPages ? 0.4 : 1 }}>
                Berikutnya →
              </button>
            </div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
