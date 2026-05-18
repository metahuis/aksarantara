'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Topbar from '../../../components/Topbar.jsx';
import Footer from '../../../components/Footer.jsx';
import Icon from '../../../components/Icon.jsx';
import { STATUS_COLORS } from '../../../data.js';
import { createClient } from '../../../lib/supabase.js';
import PlayBtn from './PlayBtn.jsx';

const TYPE_LABELS = { word: 'Kata', phrase: 'Frasa', peribahasa: 'Peribahasa', story: 'Kisah', song: 'Lagu', pantun: 'Pantun', mantra: 'Mantra' };

function shortLocation(village) {
  if (!village) return null;
  const parts = village.split(',').map(s => s.trim().replace(/^Kabupaten\s+/i, '').replace(/^Kota\s+/i, ''));
  return parts.slice(-2).join(', ');
}

const TABS = [
  { key: 'all',        label: 'Semua' },
  { key: 'word',       label: 'Kata' },
  { key: 'phrase',     label: 'Frasa' },
  { key: 'peribahasa', label: 'Peribahasa' },
  { key: 'kisah',      label: 'Kisah' },
  { key: 'song',       label: 'Lagu' },
];

const PAGE_SIZE = 12;

export default function LanguageContent({ lang, initialEntries, initialTotal, initialDialects, initialTypeCounts, totalAll }) {
  const router = useRouter();

  const [activeTab, setActiveTab]   = useState('all');
  const [entries, setEntries]       = useState(initialEntries);
  const [total, setTotal]           = useState(initialTotal);
  const [page, setPage]             = useState(1);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [filtering, setFiltering]   = useState(false);
  const [dialectFilter, setDialectFilter] = useState('all');
  const [typeCounts, setTypeCounts] = useState(initialTypeCounts);

  const entriesInit  = useRef(false);
  const countsInit   = useRef(false);

  // Reset page when tab or dialect changes
  useEffect(() => { setPage(1); }, [activeTab, dialectFilter]);

  // Re-fetch type counts when dialect filter changes (skip first mount)
  useEffect(() => {
    if (!countsInit.current) { countsInit.current = true; return; }
    const supabase = createClient();
    let q = supabase.from('entries').select('type').eq('lang', lang.id).eq('status', 'approved');
    if (dialectFilter !== 'all') q = q.eq('dialect', dialectFilter);
    q.then(({ data }) => {
      const c = {};
      (data ?? []).forEach(e => { c[e.type] = (c[e.type] || 0) + 1; });
      setTypeCounts(c);
    });
  }, [lang.id, dialectFilter]);

  // Re-fetch entries when tab / dialect / page changes (skip first mount)
  useEffect(() => {
    if (!entriesInit.current) { entriesInit.current = true; return; }
    let cancelled = false;
    setFiltering(true);
    const supabase = createClient();
    const from = (page - 1) * PAGE_SIZE;
    let q = supabase.from('entries')
      .select('*, speaker:speakers(*)', { count: 'exact' })
      .eq('lang', lang.id).eq('status', 'approved');
    if (activeTab === 'kisah') q = q.eq('type', 'story');
    else if (activeTab === 'song') q = q.in('type', ['song', 'pantun']);
    else if (activeTab !== 'all') q = q.eq('type', activeTab);
    if (dialectFilter !== 'all') q = q.eq('dialect', dialectFilter);
    q.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1)
      .then(({ data, count }) => {
        if (!cancelled) { setEntries(data ?? []); setTotal(count ?? 0); setFiltering(false); }
      });
    return () => { cancelled = true; };
  }, [lang.id, activeTab, dialectFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Topbar />
      <main>

        {/* ── Hero ──────────────────────────────────────────── */}
        <div className="lp2-hero">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

              <Link href="/#regions" className="lp2-back">
                <Icon name="arrow" size={12} style={{ transform: 'rotate(180deg)' }} /> Bahasa Daerah
              </Link>

              <div className="lp2-pills">
                <span className="lp2-lang-pill" style={{ background: lang.color }}>● {lang.name}</span>
                <span className="lp2-status-pill" style={{ background: STATUS_COLORS[lang.status]?.bg ?? 'var(--n-50)', color: STATUS_COLORS[lang.status]?.text ?? 'var(--n-700)' }}>
                  {lang.status}
                </span>
              </div>

              <h1 className="lp2-title">{lang.name}</h1>

              <div className="lp2-stats">
                <div className="lp2-stat">
                  <div className="lp2-stat-num">{lang.speakers}</div>
                  <div className="lp2-stat-lbl">Penutur</div>
                </div>
                <div className="lp2-stat">
                  <div className="lp2-stat-num">{initialDialects.length > 0 ? initialDialects.length : lang.dialects?.length ?? '—'}</div>
                  <div className="lp2-stat-lbl">Dialek</div>
                </div>
                <div className="lp2-stat">
                  <div className="lp2-stat-num">{totalAll > 0 ? totalAll : '—'}</div>
                  <div className="lp2-stat-lbl">Entri</div>
                </div>
                <div className="lp2-stat">
                  <div className="lp2-stat-num" style={{ color: lang.color, fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: STATUS_COLORS[lang.status]?.bg ?? 'var(--n-50)', letterSpacing: '0.02em' }}>
                    {lang.status}
                  </div>
                  <div className="lp2-stat-lbl">Status</div>
                </div>
              </div>

              <p className="lp2-desc">{lang.note}</p>

              {lang.narrative && (
                <div className="lp2-narrative-inline">
                  <div className="lp2-narrative-title">{lang.narrative.title}</div>
                  <p className="lp2-narrative-story">{lang.narrative.story}</p>
                  {lang.narrative.cultural_context && (
                    <blockquote className="lp2-narrative-context" style={{ borderLeftColor: lang.color }}>
                      {lang.narrative.cultural_context}
                    </blockquote>
                  )}
                </div>
              )}

            </motion.div>
          </div>
        </div>

        {/* ── Dialect chips ──────────────────────────────────── */}
        {(initialDialects.length > 0 || lang.dialects?.length > 0) && (
          <div className="lp2-dialect-bar">
            <div className="container">
              <div className="lp2-section-lbl">Jelajah dialek</div>
              <div className="lp2-dialect-scroll">
                <button
                  className={`lp2-dialect-chip${dialectFilter === 'all' ? ' active' : ''}`}
                  style={{ '--dc': lang.color }}
                  onClick={() => setDialectFilter('all')}
                >Semua</button>
                {(initialDialects.length > 0 ? initialDialects : lang.dialects ?? []).map(d => (
                  <button
                    key={d}
                    className={`lp2-dialect-chip${dialectFilter === d ? ' active' : ''}`}
                    style={{ '--dc': lang.color }}
                    onClick={() => setDialectFilter(d)}
                  >{d}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Type tabs + entries ────────────────────────────── */}
        <div className="container">
          <div className="lp2-type-tabs" style={{ '--tc': lang.color }}>
            {TABS.map(t => {
              const cnt = t.key === 'all'
                ? Object.values(typeCounts).reduce((a, b) => a + b, 0)
                : t.key === 'kisah' ? (typeCounts.story || 0)
                : t.key === 'song'  ? (typeCounts.song || 0) + (typeCounts.pantun || 0)
                : (typeCounts[t.key] || 0);
              return (
                <button
                  key={t.key}
                  className={`lp2-type-tab${activeTab === t.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  <span className="lp2-tab-label">{t.label}</span>
                  {cnt > 0 && <span className="lp2-tab-count">{cnt}</span>}
                </button>
              );
            })}
          </div>

          {loadingEntries ? (
            <div className="al-empty">Memuat…</div>
          ) : (
            <motion.div
              className="lp2-entry-list"
              animate={{ opacity: filtering ? 0.4 : 1 }}
              transition={{ duration: 0.15 }}
            >
              {entries.map((e, i) => (
                <div
                  key={e.id}
                  className="lp2-entry-row"
                  onClick={() => router.push(`/entry/${e.lang}/${e.slug ?? e.id}`)}
                >
                  <div onClick={ev => ev.stopPropagation()}>
                    <PlayBtn seed={`lang-entry-${i}-${e.id}`} color={lang.color} audioUrl={e.audio_url || null} />
                  </div>
                  <div className="lp2-entry-body">
                    <div className="lp2-entry-top">
                      <span className="lp2-entry-word">{e.primary_text}</span>
                      {e.phonetic && <span className="lp2-entry-phonetic">{e.phonetic}</span>}
                    </div>
                    <div className="lp2-entry-gloss">{e.gloss_id || e.gloss}</div>
                    <div className="lp2-entry-meta">
                      {[
                        TYPE_LABELS[e.type],
                        e.dialect || null,
                        e.speaker?.name || null,
                        e.speaker?.village ? shortLocation(e.speaker.village) : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <div className="al-empty">Tidak ada entri untuk kategori ini.</div>
              )}
            </motion.div>
          )}

          {/* Pagination */}
          <div className="lp2-pagination">
            <div className="lp2-pagination-info">
              <span>{total}</span> entri{totalPages > 1 && ` · hal ${page}/${totalPages}`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13, opacity: page <= 1 ? 0.4 : 1 }}>← Sebelumnya</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13, opacity: page >= totalPages ? 0.4 : 1 }}>Berikutnya →</button>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
