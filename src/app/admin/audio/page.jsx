'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { LANGUAGES } from '@/data';

const TYPE_LABELS = { word: 'Kata', phrase: 'Frasa', peribahasa: 'Peribahasa', story: 'Kisah', song: 'Lagu', pantun: 'Pantun' };

export default function AudioPage() {
  const [mode, setMode]           = useState('single'); // 'single' | 'bulk'
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [langFilter, setLangFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [done, setDone]           = useState({});

  // Bulk state
  const [bulkFiles, setBulkFiles]   = useState([]);
  const [bulkMatches, setBulkMatches] = useState(null); // null | { matched, unmatched }
  const [bulkProgress, setBulkProgress] = useState(null);
  const [bulkDone, setBulkDone]     = useState(null);
  const bulkInputRef = useRef(null);

  async function loadEntries() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from('entries').select('id, primary_text, lang, type, slug, audio_url').is('audio_url', null).eq('status', 'approved').order('lang').order('primary_text');
    if (langFilter !== 'all') q = q.eq('lang', langFilter);
    const { data } = await q;
    setEntries(data ?? []);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEntries(); }, [langFilter]);

  // ── Single upload ────────────────────────────────────────────
  async function handleSingleFile(entry, file) {
    setUploading(entry.id);
    const ext  = file.name.split('.').pop() || 'webm';
    const path = `${entry.lang}/admin/${entry.slug ?? entry.id}.${ext}`;
    const fd   = new FormData();
    fd.append('file', file);
    fd.append('path', path);
    fd.append('entryId', entry.id);
    const res  = await fetch('/api/admin/upload-audio', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) { alert(data.error); setUploading(null); return; }
    setDone(d => ({ ...d, [entry.id]: true }));
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    setExpandedId(null);
    setUploading(null);
  }

  // ── Bulk upload ──────────────────────────────────────────────
  function handleBulkSelect(e) {
    const files = Array.from(e.target.files ?? []);
    setBulkFiles(files);
    setBulkMatches(null);
    setBulkDone(null);
  }

  async function matchBulkFiles() {
    if (!bulkFiles.length) return;
    const supabase = createClient();
    const { data: allEntries } = await supabase
      .from('entries')
      .select('id, primary_text, lang, slug, audio_url')
      .eq('status', 'approved')
      .is('audio_url', null);

    const slugIndex = new Map((allEntries ?? []).map(e => [e.slug, e]));

    const matched = [];
    const unmatched = [];
    for (const file of bulkFiles) {
      const slug = file.name.replace(/\.[^.]+$/, ''); // strip extension
      const entry = slugIndex.get(slug);
      if (entry) matched.push({ file, entry, slug });
      else unmatched.push(file.name);
    }
    setBulkMatches({ matched, unmatched });
  }

  async function runBulkUpload() {
    if (!bulkMatches?.matched?.length) return;
    const total = bulkMatches.matched.length;
    let done = 0;
    const errors = [];

    setBulkProgress({ done: 0, total, errors: [] });

    for (const { file, entry } of bulkMatches.matched) {
      const ext  = file.name.split('.').pop() || 'webm';
      const path = `${entry.lang}/admin/${entry.slug ?? entry.id}.${ext}`;
      const fd   = new FormData();
      fd.append('file', file);
      fd.append('path', path);
      fd.append('entryId', entry.id);
      const res  = await fetch('/api/admin/upload-audio', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) { errors.push(`${file.name}: ${data.error}`); done++; setBulkProgress({ done, total, errors }); continue; }
      done++;
      setBulkProgress({ done, total, errors });
    }

    setBulkDone({ done, errors });
    setBulkMatches(null);
    setBulkFiles([]);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
    loadEntries();
  }

  const missingCount = entries.length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Kelola Audio</h1>
        <p style={{ color: 'var(--n-500)', fontSize: 14, margin: 0 }}>Lampirkan rekaman ke entri yang belum memiliki audio.</p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['single', 'Satu per Satu'], ['bulk', 'Unggah Massal']].map(([m, l]) => (
          <button key={m} onClick={() => { setMode(m); setBulkFiles([]); setBulkMatches(null); setBulkDone(null); }}
            style={{ padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: '1.5px solid', cursor: 'pointer', transition: 'all 120ms', background: mode === m ? 'var(--ink)' : 'var(--white)', color: mode === m ? 'var(--white)' : 'var(--n-500)', borderColor: mode === m ? 'var(--ink)' : 'var(--n-100)' }}>
            {l}
          </button>
        ))}
      </div>

      {mode === 'single' && (
        <>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setLangFilter('all')} className={`chip ${langFilter === 'all' ? 'active' : ''}`}>Semua</button>
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => setLangFilter(l.id)} className={`chip ${langFilter === l.id ? 'active' : ''}`}>{l.name}</button>
            ))}
          </div>

          <div style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--n-500)' }}>
            {loading ? 'Memuat…' : `${missingCount} entri belum memiliki audio`}
          </div>

          <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--n-300)' }}>Memuat…</div>
            ) : entries.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--n-300)' }}>
                {Object.keys(done).length > 0 ? '✅ Semua entri sudah memiliki audio.' : 'Tidak ada entri yang membutuhkan audio.'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--n-100)', background: 'var(--n-50)' }}>
                    {['Teks', 'Bahasa', 'Tipe', 'Slug', 'Upload'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const lang = LANGUAGES.find(l => l.id === e.lang);
                    const isExpanded = expandedId === e.id;
                    return (
                      <>
                        <tr key={e.id} style={{ borderBottom: isExpanded ? 'none' : (i < entries.length - 1 ? '1px solid var(--n-100)' : 'none') }}>
                          <td style={{ padding: '11px 16px', fontWeight: 600, fontSize: 14 }}>{e.primary_text}</td>
                          <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: lang?.color + '20', color: lang?.color }}>{lang?.name ?? e.lang}</span>
                          </td>
                          <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--n-500)', whiteSpace: 'nowrap' }}>{TYPE_LABELS[e.type] ?? e.type}</td>
                          <td style={{ padding: '11px 16px', fontSize: 11, color: 'var(--n-400)', fontFamily: 'var(--font-mono)' }}>{e.slug ?? '—'}</td>
                          <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : e.id)}
                              style={{ fontSize: 13, fontWeight: 600, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              {isExpanded ? 'Tutup' : 'Pilih File'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${e.id}-upload`} style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--n-100)' : 'none' }}>
                            <td colSpan={5} style={{ padding: '0 16px 14px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--n-50)', borderRadius: 10, cursor: 'pointer', border: '2px dashed var(--n-100)' }}>
                                <span style={{ fontSize: 13, color: 'var(--n-500)' }}>
                                  {uploading === e.id ? 'Mengunggah…' : 'Seret file audio ke sini, atau klik untuk memilih'}
                                </span>
                                <input
                                  type="file" accept="audio/*" style={{ display: 'none' }}
                                  disabled={uploading === e.id}
                                  onChange={ev => { const f = ev.target.files?.[0]; if (f) handleSingleFile(e, f); }}
                                />
                              </label>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {mode === 'bulk' && (
        <div style={{ maxWidth: 680 }}>
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-card)', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Cara penggunaan</div>
            <ol style={{ fontSize: 14, color: 'var(--n-700)', lineHeight: 2, margin: 0, paddingLeft: 20 }}>
              <li>Beri nama file audio sesuai <strong>slug entri</strong> — mis. <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--n-50)', padding: '1px 6px', borderRadius: 4 }}>madeceng.mp3</code></li>
              <li>Pilih semua file sekaligus menggunakan tombol di bawah</li>
              <li>Tinjau daftar kecocokan, lalu klik Unggah</li>
            </ol>
          </div>

          <input ref={bulkInputRef} type="file" accept="audio/*" multiple style={{ display: 'none' }} onChange={handleBulkSelect} />

          {!bulkFiles.length && !bulkDone && (
            <button onClick={() => bulkInputRef.current?.click()} className="btn-primary">
              Pilih File Audio
            </button>
          )}

          {bulkFiles.length > 0 && !bulkMatches && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: 'var(--n-700)' }}>{bulkFiles.length} file dipilih</span>
              <button onClick={matchBulkFiles} className="btn-primary">Cocokkan dengan Entri</button>
              <button onClick={() => { setBulkFiles([]); if (bulkInputRef.current) bulkInputRef.current.value = ''; }} className="btn-ghost">Batal</button>
            </div>
          )}

          {bulkMatches && (
            <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1, padding: '14px 18px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#166534' }}>{bulkMatches.matched.length}</div>
                  <div style={{ fontSize: 13, color: '#166534' }}>file cocok</div>
                </div>
                <div style={{ flex: 1, padding: '14px 18px', borderRadius: 10, background: '#fff1f2', border: '1px solid #fecdd3' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)' }}>{bulkMatches.unmatched.length}</div>
                  <div style={{ fontSize: 13, color: 'var(--red)' }}>tidak cocok</div>
                </div>
              </div>

              {bulkMatches.matched.length > 0 && (
                <>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--n-700)' }}>File yang akan diunggah:</div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                    {bulkMatches.matched.map(({ file, entry }) => (
                      <div key={file.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, fontSize: 13, color: 'var(--n-700)', borderBottom: '1px solid var(--n-50)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{file.name}</span>
                        <span style={{ color: 'var(--n-500)' }}>→ {entry.primary_text} ({entry.lang})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {bulkMatches.unmatched.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--red)' }}>Tidak cocok (akan diabaikan):</div>
                  <div style={{ fontSize: 12, color: 'var(--n-500)', fontFamily: 'var(--font-mono)', lineHeight: 1.8 }}>
                    {bulkMatches.unmatched.join(', ')}
                  </div>
                </div>
              )}

              {bulkProgress && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--n-100)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: 'var(--green)', transition: 'width 300ms', width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--n-500)' }}>{bulkProgress.done} / {bulkProgress.total}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {!bulkProgress && (
                  <button onClick={runBulkUpload} disabled={!bulkMatches.matched.length} className="btn-primary">
                    Unggah {bulkMatches.matched.length} File
                  </button>
                )}
                <button onClick={() => { setBulkFiles([]); setBulkMatches(null); setBulkProgress(null); if (bulkInputRef.current) bulkInputRef.current.value = ''; }} className="btn-ghost">
                  Batal
                </button>
              </div>
            </div>
          )}

          {bulkDone && (
            <div style={{ padding: '16px 20px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 14, color: '#166534' }}>
              ✅ {bulkDone.done - bulkDone.errors.length} file berhasil diunggah.
              {bulkDone.errors.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red)' }}>{bulkDone.errors.join('\n')}</div>}
              <button onClick={() => { setBulkDone(null); if (bulkInputRef.current) bulkInputRef.current.value = ''; }} style={{ marginTop: 10, display: 'block', fontSize: 13, color: '#166534', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                Unggah lagi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
