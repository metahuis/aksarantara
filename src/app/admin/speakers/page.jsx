'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { LANGUAGES } from '@/data';

export default function SpeakersPage() {
  const [speakers, setSpeakers]     = useState([]);
  const [profiles, setProfiles]     = useState([]);
  const [counts, setCounts]         = useState({});
  const [loading, setLoading]       = useState(true);
  const [editId, setEditId]         = useState(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: spk }, { data: profs }, { data: entryRows }] = await Promise.all([
      supabase.from('speakers').select('*').order('name'),
      supabase.from('profiles').select('id, username, display_name').order('display_name'),
      supabase.from('entries').select('speaker_id').eq('status', 'approved'),
    ]);
    setSpeakers(spk ?? []);
    setProfiles(profs ?? []);
    const cm = {};
    (entryRows ?? []).forEach(e => { if (e.speaker_id) cm[e.speaker_id] = (cm[e.speaker_id] ?? 0) + 1; });
    setCounts(cm);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(spk, form) {
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.from('speakers').update({
      slug:       form.slug.trim() || spk.slug,
      bio:        form.bio || null,
      photo_url:  form.photo_url || null,
      profile_id: form.profile_id || null,
    }).eq('id', spk.id);
    if (err) { setError(err.message); setSaving(false); return; }
    setEditId(null);
    load();
    setSaving(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Penutur</h1>
        <p style={{ color: 'var(--n-500)', fontSize: 14, margin: 0 }}>Kelola profil penutur asli dan tautkan ke akun jika ada.</p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#fff1f2', color: 'var(--red)', border: '1px solid #fecdd3', marginBottom: 16 }}>{error}</div>
      )}

      <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--n-300)' }}>Memuat…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--n-100)', background: 'var(--n-50)' }}>
                {['Penutur', 'Slug', 'Bahasa', 'Usia / Desa', 'Entri', 'Profil', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {speakers.map((spk, i) => {
                const lang = LANGUAGES.find(l => l.id === spk.language_id);
                const linkedProfile = profiles.find(p => p.id === spk.profile_id);
                const isEdit = editId === spk.id;
                return (
                  <>
                    <tr key={spk.id} style={{ borderBottom: isEdit ? 'none' : (i < speakers.length - 1 ? '1px solid var(--n-100)' : 'none') }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{spk.name}</div>
                        {spk.dialect && <div style={{ fontSize: 11, color: 'var(--n-400)', marginTop: 2 }}>Dialek: {spk.dialect}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--n-500)' }}>{spk.slug}</div>
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {lang ? (
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: lang.color + '20', color: lang.color }}>{lang.name}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--n-400)' }}>{spk.language_id}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--n-500)' }}>
                        {spk.age ? `${spk.age} thn` : '—'}
                        {spk.village && <div style={{ fontSize: 11, color: 'var(--n-400)' }}>{spk.village}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        {counts[spk.id] ?? 0}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        {linkedProfile ? (
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-d)' }}>
                            ✓ @{linkedProfile.username || linkedProfile.display_name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--n-300)' }}>Belum tertaut</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setEditId(isEdit ? null : spk.id)}
                          style={{ fontSize: 13, fontWeight: 600, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {isEdit ? 'Tutup' : 'Edit'}
                        </button>
                      </td>
                    </tr>

                    {isEdit && (
                      <EditRow
                        key={`${spk.id}-edit`}
                        spk={spk}
                        profiles={profiles}
                        saving={saving}
                        colSpan={7}
                        last={i === speakers.length - 1}
                        onSave={form => handleSave(spk, form)}
                        onCancel={() => setEditId(null)}
                      />
                    )}
                  </>
                );
              })}
              {speakers.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--n-300)', fontSize: 14 }}>Belum ada penutur.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EditRow({ spk, profiles, saving, colSpan, last, onSave, onCancel }) {
  const [f, setF] = useState({ slug: spk.slug ?? '', bio: spk.bio ?? '', photo_url: spk.photo_url ?? '', profile_id: spk.profile_id ?? '' });
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <tr style={{ borderBottom: last ? 'none' : '1px solid var(--n-100)' }}>
      <td colSpan={colSpan} style={{ padding: '0 16px 20px' }}>
        <div style={{ background: 'var(--n-50)', borderRadius: 'var(--radius)', padding: 20, marginTop: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Slug <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--n-400)' }}>(URL: /suara/...)</span></label>
            <input value={f.slug} onChange={e => upd('slug', e.target.value)}
              placeholder="la-akmale"
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>URL Foto</label>
            <input value={f.photo_url} onChange={e => upd('photo_url', e.target.value)}
              placeholder="https://…"
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bio</label>
            <textarea value={f.bio} onChange={e => upd('bio', e.target.value)} rows={2}
              placeholder="Deskripsi singkat tentang penutur ini…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tautkan ke Profil</label>
            <select value={f.profile_id} onChange={e => upd('profile_id', e.target.value)}
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--n-100)', fontSize: 14, background: 'var(--white)', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
              <option value="">— Tidak ada —</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.display_name || p.username || p.id}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} className="btn-ghost" type="button">Batal</button>
            <button onClick={() => onSave(f)} disabled={saving} className="btn-primary" type="button" style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
