'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

const QUICK_LINKS = [
  { href: '/admin/entries',   label: 'Antrian Entri',  desc: 'Review & setujui kontribusi',    icon: '📋', color: 'var(--indigo)' },
  { href: '/admin/audio',     label: 'Kelola Audio',   desc: 'Upload audio single atau massal', icon: '🎵', color: 'var(--blue)'   },
  { href: '/admin/bulk',      label: 'Unggah Massal',  desc: 'Import entri dari file CSV',      icon: '📤', color: 'var(--green)'  },
  { href: '/admin/languages', label: 'Bahasa',         desc: 'Tambah & edit data bahasa',       icon: '🌐', color: 'var(--orange)' },
  { href: '/admin/users',     label: 'Pengguna',       desc: 'Undang & kelola akun',            icon: '👥', color: 'var(--purple)' },
];

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [audioCov, setAudioCov] = useState([]);
  const [recent, setRecent]     = useState([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [
        { count: total },
        { count: pending },
        { count: languages },
        { count: users },
        { data: recentEntries },
        { data: audioData },
      ] = await Promise.all([
        supabase.from('entries').select('*', { count: 'exact', head: true }),
        supabase.from('entries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('languages').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('entries').select('id,primary_text,lang,type,status,created_at').eq('status', 'pending').order('created_at').limit(5),
        supabase.from('entries').select('lang,audio_url').eq('status', 'approved'),
      ]);

      setStats({ total: total ?? 0, pending: pending ?? 0, languages: languages ?? 0, users: users ?? 0 });
      setRecent(recentEntries ?? []);

      // Compute audio coverage per language
      const map = {};
      for (const e of (audioData ?? [])) {
        if (!map[e.lang]) map[e.lang] = { total: 0, withAudio: 0 };
        map[e.lang].total++;
        if (e.audio_url) map[e.lang].withAudio++;
      }
      const sorted = Object.entries(map)
        .map(([lang, v]) => ({ lang, ...v, pct: Math.round((v.withAudio / v.total) * 100) }))
        .sort((a, b) => a.pct - b.pct);
      setAudioCov(sorted);
    }
    load();
  }, []);

  const STAT_CARDS = stats ? [
    { label: 'Total Entri',     value: stats.total,     color: 'var(--indigo)' },
    { label: 'Menunggu Review', value: stats.pending,   color: 'var(--orange)' },
    { label: 'Bahasa',          value: stats.languages, color: 'var(--green)'  },
    { label: 'Pengguna',        value: stats.users,     color: 'var(--purple)' },
  ] : [];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
        Dasbor
      </h1>
      <p style={{ color: 'var(--n-500)', fontSize: 14, margin: '0 0 32px' }}>
        Selamat datang di panel admin Aksarantara.
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {STAT_CARDS.map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius)', padding: '20px 24px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--n-500)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 32 }}>
        {QUICK_LINKS.map(({ href, label, desc, icon, color }) => (
          <Link key={href} href={href} style={{ display: 'block', textDecoration: 'none', background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius)', padding: '18px 16px', boxShadow: 'var(--shadow-card)', transition: 'box-shadow 120ms' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--n-400)', lineHeight: 1.4 }}>{desc}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent pending */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--n-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Menunggu Review</h2>
            <Link href="/admin/entries" style={{ fontSize: 12, color: 'var(--indigo)', fontWeight: 600 }}>Lihat semua →</Link>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: '28px 24px', textAlign: 'center', color: 'var(--n-300)', fontSize: 13 }}>
              Tidak ada entri yang menunggu review.
            </div>
          ) : (
            <div>
              {recent.map((entry, i) => (
                <div key={entry.id} style={{ padding: '12px 24px', borderBottom: i < recent.length - 1 ? '1px solid var(--n-100)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'var(--n-50)', color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                    {entry.type}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.primary_text}</span>
                  <span style={{ fontSize: 11, color: 'var(--n-300)', flexShrink: 0 }}>{entry.lang}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audio coverage */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--n-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Cakupan Audio</h2>
            <Link href="/admin/audio" style={{ fontSize: 12, color: 'var(--indigo)', fontWeight: 600 }}>Upload →</Link>
          </div>
          {!stats ? (
            <div style={{ padding: '28px 24px', textAlign: 'center', color: 'var(--n-300)', fontSize: 13 }}>Memuat…</div>
          ) : audioCov.length === 0 ? (
            <div style={{ padding: '28px 24px', textAlign: 'center', color: 'var(--n-300)', fontSize: 13 }}>Belum ada entri dengan audio.</div>
          ) : (
            <div style={{ padding: '12px 24px' }}>
              {audioCov.map(({ lang, withAudio, total, pct }) => (
                <div key={lang} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{lang}</span>
                    <span style={{ fontSize: 11, color: 'var(--n-500)' }}>{withAudio}/{total} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--n-100)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct >= 80 ? 'var(--green)' : pct >= 40 ? 'var(--orange)' : 'var(--red)', transition: 'width 400ms' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
