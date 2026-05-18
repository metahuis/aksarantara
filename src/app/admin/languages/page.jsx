'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

const BLANK = { slug: '', name: '', region: '', speakers: '', status: 'Rentan', color: '#58cc02', note: '', dialects: '', target: 250 };
const STATUS_OPTS = ['Aman', 'Rentan', 'Terancam Punah', 'Kritis', 'Punah'];

function LangForm({ initial, onSave, onCancel, saving }) {
  const [f, setF] = useState(initial);
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {[
        { key: 'slug',     label: 'Slug (ID)',  placeholder: 'bugis', hint: 'huruf kecil, tanpa spasi' },
        { key: 'name',     label: 'Nama',        placeholder: 'Bugis' },
        { key: 'region',   label: 'Wilayah',     placeholder: 'Sulawesi Selatan' },
        { key: 'speakers', label: 'Jumlah Penutur', placeholder: '5 juta' },
        { key: 'target',   label: 'Target Entri', placeholder: '250', hint: 'target entri untuk progress bar' },
      ].map(({ key, label, placeholder, hint }) => (
        <div key={key}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </label>
          <input
            value={f[key]} onChange={e => upd(key, e.target.value)}
            placeholder={placeholder}
            style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          {hint && <div style={{ fontSize: 11, color: 'var(--n-400)', marginTop: 3 }}>{hint}</div>}
        </div>
      ))}

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</label>
        <select value={f.status} onChange={e => upd('status', e.target.value)}
          style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 14, background: 'var(--white)', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Warna</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="color" value={f.color} onChange={e => upd('color', e.target.value)}
            style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px solid var(--n-100)', cursor: 'pointer', padding: 2 }} />
          <input value={f.color} onChange={e => upd('color', e.target.value)} placeholder="#58cc02"
            style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-mono)' }} />
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dialek <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(pisahkan dengan koma)</span></label>
        <input value={f.dialects} onChange={e => upd('dialects', e.target.value)}
          placeholder="Sinjai, Bone, Wajo, Pangkep"
          style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Catatan</label>
        <textarea value={f.note} onChange={e => upd('note', e.target.value)} rows={2}
          placeholder="Deskripsi singkat tentang bahasa ini…"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }} />
      </div>

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="btn-ghost" type="button">Batal</button>
        <button onClick={() => onSave(f)} disabled={saving || !f.slug || !f.name} className="btn-primary" type="button" style={{ opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState([]);
  const [entryCounts, setEntryCounts] = useState({});
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: langs }, { data: counts }] = await Promise.all([
      supabase.from('languages').select('*').order('name'),
      supabase.from('entries').select('lang').eq('status', 'approved'),
    ]);
    setLanguages(langs ?? []);
    const cm = {};
    (counts ?? []).forEach(e => { cm[e.lang] = (cm[e.lang] ?? 0) + 1; });
    setEntryCounts(cm);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  async function handleSave(formData, existingId) {
    setSaving(true);
    setError('');
    const supabase = createClient();
    const payload = {
      slug:     formData.slug.trim(),
      name:     formData.name.trim(),
      region:   formData.region.trim() || null,
      speakers: formData.speakers.trim() || null,
      status:   formData.status,
      color:    formData.color,
      note:     formData.note.trim() || null,
      dialects: formData.dialects ? formData.dialects.split(',').map(d => d.trim()).filter(Boolean) : [],
      target:   parseInt(formData.target, 10) || 250,
    };

    const { error: err } = existingId
      ? await supabase.from('languages').update(payload).eq('id', existingId)
      : await supabase.from('languages').insert(payload);

    if (err) { setError(err.message); setSaving(false); return; }
    setShowAdd(false);
    setEditId(null);
    load();
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Bahasa</h1>
          <p style={{ color: 'var(--n-500)', fontSize: 14, margin: 0 }}>{languages.length} bahasa terdaftar</p>
        </div>
        <button onClick={() => { setShowAdd(o => !o); setEditId(null); setError(''); }} className="btn-primary">
          + Tambah Bahasa
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#fff1f2', color: 'var(--red)', border: '1px solid #fecdd3', marginBottom: 16 }}>{error}</div>
      )}

      {showAdd && (
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Tambah Bahasa Baru</h3>
          <LangForm initial={{ ...BLANK }} onSave={f => handleSave(f, null)} onCancel={() => setShowAdd(false)} saving={saving} />
        </div>
      )}

      <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--n-300)' }}>Memuat…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--n-100)', background: 'var(--n-50)' }}>
                {['Bahasa', 'Wilayah', 'Status', 'Entri', 'Dialek', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {languages.map((lang, i) => (
                <>
                  <tr key={lang.id} style={{ borderBottom: editId === lang.id ? 'none' : (i < languages.length - 1 ? '1px solid var(--n-100)' : 'none') }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: lang.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{lang.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--n-400)', fontFamily: 'var(--font-mono)' }}>{lang.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--n-500)' }}>{lang.region ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'var(--n-50)', color: 'var(--n-600)' }}>
                        {lang.status ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                      {entryCounts[lang.slug] ?? 0}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--n-400)' }}>
                      {lang.dialects?.length ?? 0} dialek
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => { setEditId(editId === lang.id ? null : lang.id); setShowAdd(false); setError(''); }}
                        style={{ fontSize: 13, fontWeight: 600, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {editId === lang.id ? 'Tutup' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                  {editId === lang.id && (
                    <tr key={`${lang.id}-edit`} style={{ borderBottom: i < languages.length - 1 ? '1px solid var(--n-100)' : 'none' }}>
                      <td colSpan={6} style={{ padding: '0 16px 20px' }}>
                        <div style={{ background: 'var(--n-50)', borderRadius: 'var(--radius)', padding: 20, marginTop: 4 }}>
                          <LangForm
                            initial={{
                              slug:     lang.slug ?? '',
                              name:     lang.name ?? '',
                              region:   lang.region ?? '',
                              speakers: lang.speakers ?? '',
                              status:   lang.status ?? 'Rentan',
                              color:    lang.color ?? '#58cc02',
                              note:     lang.note ?? '',
                              dialects: (lang.dialects ?? []).join(', '),
                              target:   lang.target ?? 250,
                            }}
                            onSave={f => handleSave(f, lang.id)}
                            onCancel={() => setEditId(null)}
                            saving={saving}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {languages.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--n-300)', fontSize: 14 }}>Belum ada bahasa.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
