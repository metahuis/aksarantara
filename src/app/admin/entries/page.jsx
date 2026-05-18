'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { LANGUAGES } from '@/data';

const STATUS_TABS = ['pending', 'approved', 'rejected'];
const TYPE_COLOR = {
  word:       { bg: '#e8f4ff', color: '#1a6fb5' },
  phrase:     { bg: '#fff3e0', color: '#b05e00' },
  story:      { bg: '#f3e8ff', color: '#7c3aed' },
  song:       { bg: '#e8fff0', color: '#166534' },
  peribahasa: { bg: '#fff8e1', color: '#7c5c00' },
  pantun:     { bg: '#fce4ec', color: '#880e4f' },
};

export default function EntriesPage() {
  const [status, setStatus]   = useState('pending');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(new Set());
  const [search, setSearch]   = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [selected, setSelected]     = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    const supabase = createClient();
    let q = supabase
      .from('entries')
      .select('id, primary_text, gloss_id, lang, type, status, created_at, speaker:speakers(name, village)')
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (langFilter) q = q.eq('lang', langFilter);
    const { data } = await q;
    setEntries(data ?? []);
    setLoading(false);
  }, [status, langFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function updateStatus(ids, newStatus) {
    const arr = Array.isArray(ids) ? ids : [ids];
    setActing(new Set(arr));
    const supabase = createClient();
    const { error } = await supabase.from('entries').update({ status: newStatus }).in('id', arr);
    if (error) {
      alert('Gagal mengubah status. Coba lagi.');
    } else {
      setEntries(prev => prev.filter(e => !arr.includes(e.id)));
      setSelected(new Set());
    }
    setActing(new Set());
  }

  const filtered = entries.filter(e =>
    !search ||
    e.primary_text?.toLowerCase().includes(search.toLowerCase()) ||
    e.gloss_id?.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected   = filtered.length > 0 && filtered.every(e => selected.has(e.id));
  const someSelected  = selected.size > 0;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(e => e.id)));
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '0 0 24px' }}>
        Antrian Entri
      </h1>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: status === s ? 'var(--ink)' : 'var(--white)',
            color: status === s ? 'var(--white)' : 'var(--n-500)',
            border: '1.5px solid', borderColor: status === s ? 'var(--ink)' : 'var(--n-100)',
            cursor: 'pointer', transition: 'all 120ms',
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Cari teks atau gloss…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ height: 38, padding: '0 13px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 13, width: 240, outline: 'none' }}
        />
        <select
          value={langFilter}
          onChange={e => setLangFilter(e.target.value)}
          style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">Semua bahasa</option>
          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        {someSelected && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--n-500)', alignSelf: 'center' }}>{selected.size} dipilih</span>
            {status === 'pending' && (
              <>
                <button onClick={() => updateStatus([...selected], 'approved')} disabled={acting.size > 0} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--green)', color: 'var(--white)', border: 'none', cursor: 'pointer', opacity: acting.size > 0 ? 0.5 : 1 }}>
                  Setujui Semua
                </button>
                <button onClick={() => updateStatus([...selected], 'rejected')} disabled={acting.size > 0} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--n-50)', color: 'var(--red)', border: '1.5px solid var(--n-100)', cursor: 'pointer', opacity: acting.size > 0 ? 0.5 : 1 }}>
                  Tolak Semua
                </button>
              </>
            )}
            {status === 'rejected' && (
              <button onClick={() => updateStatus([...selected], 'approved')} disabled={acting.size > 0} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--n-50)', color: 'var(--indigo)', border: '1.5px solid var(--n-100)', cursor: 'pointer', opacity: acting.size > 0 ? 0.5 : 1 }}>
                Pulihkan Semua
              </button>
            )}
            {status === 'approved' && (
              <button onClick={() => updateStatus([...selected], 'rejected')} disabled={acting.size > 0} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--n-50)', color: 'var(--red)', border: '1.5px solid var(--n-100)', cursor: 'pointer', opacity: acting.size > 0 ? 0.5 : 1 }}>
                Tarik Semua
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--n-300)' }}>Memuat…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--n-300)', fontSize: 14 }}>
            Tidak ada entri ditemukan.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--n-100)', background: 'var(--n-50)' }}>
                <th style={{ padding: '11px 12px 11px 16px', width: 32 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                </th>
                {['Tipe', 'Teks', 'Bahasa', 'Penutur', 'Tanggal', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const tc = TYPE_COLOR[entry.type] ?? { bg: 'var(--n-50)', color: 'var(--n-700)' };
                const isSelected = selected.has(entry.id);
                return (
                  <tr key={entry.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--n-100)' : 'none', background: isSelected ? '#f5f3ff' : 'transparent', opacity: acting.has(entry.id) ? 0.5 : 1 }}>
                    <td style={{ padding: '12px 12px 12px 16px' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(entry.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: tc.bg, color: tc.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {entry.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, maxWidth: 240 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.primary_text}</div>
                      {entry.gloss_id && <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 2 }}>{entry.gloss_id}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--n-700)', whiteSpace: 'nowrap' }}>{entry.lang}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--n-500)' }}>
                      {entry.speaker?.name ?? '—'}
                      {entry.speaker?.village && <div style={{ fontSize: 11, color: 'var(--n-400)' }}>{entry.speaker.village}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--n-300)', whiteSpace: 'nowrap' }}>
                      {new Date(entry.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button disabled={acting.size > 0} onClick={() => updateStatus(entry.id, 'approved')} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--green)', color: 'var(--white)', border: 'none', cursor: 'pointer', opacity: acting.size > 0 ? 0.5 : 1 }}>
                            Setujui
                          </button>
                          <button disabled={acting.size > 0} onClick={() => updateStatus(entry.id, 'rejected')} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--n-50)', color: 'var(--red)', border: '1.5px solid var(--n-100)', cursor: 'pointer', opacity: acting.size > 0 ? 0.5 : 1 }}>
                            Tolak
                          </button>
                        </div>
                      ) : status === 'rejected' ? (
                        <button disabled={acting.size > 0} onClick={() => updateStatus(entry.id, 'approved')} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--n-50)', color: 'var(--indigo)', border: '1.5px solid var(--n-100)', cursor: 'pointer' }}>
                          Pulihkan
                        </button>
                      ) : (
                        <button disabled={acting.size > 0} onClick={() => updateStatus(entry.id, 'rejected')} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--n-50)', color: 'var(--red)', border: '1.5px solid var(--n-100)', cursor: 'pointer' }}>
                          Tarik
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
