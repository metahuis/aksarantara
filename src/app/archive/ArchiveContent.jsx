'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import Icon from '../../components/Icon.jsx';
import { LANGUAGES } from '../../data.js';
import { getEntries } from '../../lib/db/entries.js';
import { createClient } from '../../lib/supabase.js';

const TYPE_LABELS = { word: 'Kata', phrase: 'Frasa', peribahasa: 'Peribahasa', story: 'Kisah', song: 'Lagu', pantun: 'Pantun', mantra: 'Mantra' };
const POPULAR_SEARCHES = ['madeceng', 'passompe', 'elok', 'adat', 'pappaseng', 'maloppo', 'aga kareba'];
const PAGE_SIZE = 10;

function highlightText(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="search-mark">{part}</mark>
      : part
  );
}

export default function ArchiveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery]           = useState(searchParams.get('q') || '');
  const [activeType, setActiveType] = useState(searchParams.get('type') || 'all');
  const [activeLang, setActiveLang] = useState(searchParams.get('lang') || 'all');
  const [page, setPage]             = useState(parseInt(searchParams.get('page') || '1', 10));
  const [entries, setEntries]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [globalStats, setGlobalStats] = useState({ entries: null, speakers: null, wilayah: null });
  const audioRef = useRef(null);

  function togglePlay(ev, entry) {
    ev.stopPropagation();
    if (!entry.audio_url) return;
    if (playingId === entry.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const a = new Audio(entry.audio_url);
    audioRef.current = a;
    setPlayingId(entry.id);
    a.play();
    a.onended = () => { audioRef.current = null; setPlayingId(null); };
  }

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // Global stats — fetched once, independent of filters
  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('entries').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('speakers').select('*', { count: 'exact', head: true }),
      supabase.from('speakers').select('village').not('village', 'is', null),
    ]).then(([{ count: eCount }, { count: sCount }, { data: villages }]) => {
      const wilayah = new Set((villages ?? []).map(s => s.village).filter(Boolean)).size;
      setGlobalStats({ entries: eCount ?? 0, speakers: sCount ?? 0, wilayah });
    });
  }, []);

  // Open filter sheet from topbar filter button
  useEffect(() => {
    const handler = () => setFilterSheetOpen(true);
    window.addEventListener('aksarantara:filter', handler);
    return () => window.removeEventListener('aksarantara:filter', handler);
  }, []);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedQuery, activeType, activeLang]);

  // Sync state → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (activeType !== 'all') params.set('type', activeType);
    if (activeLang !== 'all') params.set('lang', activeLang);
    if (page > 1) params.set('page', String(page));
    const newUrl = `/archive${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [query, activeType, activeLang, page]);

  // Fetch entries
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEntries({
      lang:   activeLang !== 'all' ? activeLang : undefined,
      type:   activeType !== 'all' ? activeType : undefined,
      search: debouncedQuery || undefined,
      page,
      limit:  PAGE_SIZE,
    }).then(({ data, count }) => {
      if (!cancelled) { setEntries(data ?? []); setTotal(count ?? 0); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery, activeType, activeLang, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="section archive">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="kicker"><span className="k-num" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.16em' }}>ARSIP</span></div>
          <h1 className="section-title" style={{ marginTop: 4 }}>
            Cari sebuah{' '}
            <em style={{ fontFamily: 'var(--font-editorial)', fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(28px, 5vw, 48px)' }}>kata.</em>
          </h1>
          <p className="section-sub">
            Arsip terbuka — peneliti, pendidik, dan komunitas. Semua entri
            diverifikasi koordinator wilayah. Tidak ada terjemahan otomatis.
          </p>
        </motion.div>

        <div className="archive-pipeline">
          <div className="ap-step ap-done">
            <span className="ap-num">{globalStats.entries ?? '…'}</span>
            <span className="ap-lbl">Total Entri</span>
          </div>
          <div className="ap-arrow">·</div>
          <div className="ap-step ap-review">
            <span className="ap-num">{globalStats.speakers ?? '…'}</span>
            <span className="ap-lbl">Total Penutur</span>
          </div>
          <div className="ap-arrow">·</div>
          <div className="ap-step ap-field">
            <span className="ap-num">{globalStats.wilayah ?? '…'}</span>
            <span className="ap-lbl">Total Wilayah</span>
          </div>
        </div>

        <motion.div
          className="archive-controls"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="search-wrap">
            <span className="search-ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              className="search"
              placeholder="cari kata, arti, atau nama penutur…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')}>
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          {/* Desktop filter chips */}
          <div className="filter-block">
            <div className="filter-row">
              <span className="filter-label">TIPE</span>
              {['all', 'word', 'phrase', 'peribahasa', 'story', 'song', 'pantun'].map(t => (
                <button key={t} className={`chip ${activeType === t ? 'active' : ''}`} onClick={() => setActiveType(t)}>
                  {t === 'all' ? 'semua' : TYPE_LABELS[t]}
                </button>
              ))}
              <button className="chip chip-soon" disabled>
                mantra <span className="chip-soon-badge">Segera</span>
              </button>
            </div>
            <div className="filter-row">
              <span className="filter-label">BAHASA</span>
              <button className={`chip ${activeLang === 'all' ? 'active' : ''}`} onClick={() => setActiveLang('all')}>semua</button>
              {LANGUAGES.map(l => (
                <button key={l.id} className={`chip ${activeLang === l.id ? 'active' : ''}`} onClick={() => setActiveLang(l.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {activeLang === l.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, flexShrink: 0, display: 'inline-block' }} />}
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile type chips */}
          <div className="archive-mobile-bar">
            <div className="archive-mobile-types">
              {['all', 'word', 'phrase', 'peribahasa', 'story', 'song'].map(t => (
                <button key={t} className={`chip ${activeType === t ? 'active' : ''}`} onClick={() => setActiveType(t)}>
                  {t === 'all' ? 'Semua' : TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            {activeLang !== 'all' && (
              <span className="archive-lang-active-pill" style={{ background: LANGUAGES.find(l => l.id === activeLang)?.color }}>
                {LANGUAGES.find(l => l.id === activeLang)?.name}
              </span>
            )}
          </div>
        </motion.div>

        {/* Filter bottom sheet */}
        <AnimatePresence>
          {filterSheetOpen && (
            <>
              <motion.div
                className="filter-sheet-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setFilterSheetOpen(false)}
              />
              <motion.div
                className="filter-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, { offset, velocity }) => {
                  if (offset.y > 80 && velocity.y > 200) setFilterSheetOpen(false);
                }}
                transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              >
                <div className="filter-sheet-handle" />
                <div className="filter-sheet-head">
                  <span className="filter-sheet-title">Saring arsip</span>
                  {(activeLang !== 'all' || activeType !== 'all') && (
                    <button className="filter-sheet-reset" onClick={() => { setActiveLang('all'); setActiveType('all'); }}>
                      Atur ulang
                    </button>
                  )}
                </div>

                <div className="filter-sheet-label">Bahasa</div>
                <div className="filter-sheet-pills">
                  <button className={`fsp ${activeLang === 'all' ? 'fsp-active' : ''}`} onClick={() => setActiveLang('all')}>
                    {activeLang === 'all' && '✓ '}Semua
                  </button>
                  {LANGUAGES.map(l => (
                    <button
                      key={l.id}
                      className={`fsp ${activeLang === l.id ? 'fsp-active' : ''}`}
                      style={activeLang === l.id ? { background: l.color } : undefined}
                      onClick={() => setActiveLang(activeLang === l.id ? 'all' : l.id)}
                    >
                      {activeLang === l.id && '✓ '}{l.name}
                    </button>
                  ))}
                </div>

                <div className="filter-sheet-label">Tipe</div>
                <div className="filter-sheet-pills">
                  {['all', 'word', 'phrase', 'peribahasa', 'story', 'song', 'pantun'].map(t => (
                    <button
                      key={t}
                      className={`fsp ${activeType === t ? 'fsp-ink' : ''}`}
                      onClick={() => setActiveType(t)}
                    >
                      {t === 'all' ? 'Semua' : TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>

                <div className="filter-sheet-actions">
                  <button className="filter-sheet-cancel" onClick={() => setFilterSheetOpen(false)}>Batal</button>
                  <button className="filter-sheet-apply" onClick={() => setFilterSheetOpen(false)}>
                    Lihat {total > 0 ? total : '…'} entri
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {!loading && debouncedQuery && (
          <div className="al-result-count">
            {total} hasil untuk &ldquo;{debouncedQuery}&rdquo;
          </div>
        )}

        <div className="archive-list">
          {loading ? (
            <div className="al-empty">Memuat…</div>
          ) : entries.length === 0 ? (
            <div className="al-empty">tidak ada entri yang cocok.</div>
          ) : entries.map((e) => {
            const lang = LANGUAGES.find(l => l.id === e.lang);
            return (
              <div key={e.id} className="al-row" onClick={() => router.push(`/entry/${e.lang}/${e.slug ?? e.id}`)}>
                <div className="al-content">
                  <div className="al-row-tags">
                    <span className="al-lang-tag" style={{ background: lang?.color ?? 'var(--n-300)' }}>{lang?.name}</span>
                    <span className="al-type-tag">{TYPE_LABELS[e.type]}</span>
                  </div>
                  <div className="al-primary">{highlightText(e.primary_text, debouncedQuery)}</div>
                  <div className="al-gloss">{e.gloss_id || e.gloss}</div>
                </div>
                <button
                  className={`al-play-btn${playingId === e.id ? ' playing' : ''}${!e.audio_url ? ' disabled' : ''}`}
                  onClick={ev => togglePlay(ev, e)}
                  disabled={!e.audio_url}
                  style={{ borderColor: `${lang?.color ?? '#999'}55`, color: e.audio_url ? (lang?.color ?? 'var(--n-400)') : 'var(--n-200)' }}
                  aria-label={playingId === e.id ? 'Jeda' : 'Putar'}
                >
                  {playingId === e.id
                    ? <Icon name="pause" size={14} />
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>
              </div>
            );
          })}
        </div>

        {!loading && debouncedQuery === '' && entries.length > 0 && (
          <div className="archive-popular">
            <div className="archive-popular-label">Pencarian Populer</div>
            <div className="archive-popular-tags">
              {POPULAR_SEARCHES.map(s => (
                <button key={s} className="archive-popular-tag" onClick={() => setQuery(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        <div className="archive-footer" style={{ flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div className="af-count">
            <span className="af-num">{total > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)}` : '0'}</span> dari <span className="af-num">{total}</span> entri
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
                className="btn-ghost"
                style={{ height: 40, padding: '0 18px', fontSize: 13, opacity: page === 1 ? 0.35 : 1 }}
              >
                ← Sebelumnya
              </button>
              <span style={{ fontSize: 13, color: 'var(--n-500)', minWidth: 80, textAlign: 'center' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === totalPages}
                className="btn-ghost"
                style={{ height: 40, padding: '0 18px', fontSize: 13, opacity: page === totalPages ? 0.35 : 1 }}
              >
                Berikutnya →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
