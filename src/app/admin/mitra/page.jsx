'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

const EMPTY_PARTNER = { name: '', short_name: '', logo_url: '', role: '', region: '', website: '', active: true, sort_order: 0 };
const EMPTY_COORD   = { name: '', role: '', affiliation: '', languages: '', entries_curated: 0, color: '#1cb0f6', photo_url: '', region: '', active: true, sort_order: 0 };

function flash(setMsg, text) {
  setMsg(text);
  setTimeout(() => setMsg(''), 3000);
}

/* ── Partner form ──────────────────────────────────────────── */
function PartnerForm({ init, onSave, onCancel, saving }) {
  const [f, setF]               = useState(init);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(init.logo_url || null);
  const [uploading, setUploading]     = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function onLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    set('logo_url', '');
  }

  async function handleSave() {
    let logo_url = f.logo_url;
    if (logoFile) {
      setUploading(true);
      const supabase = createClient();
      const ext  = logoFile.name.split('.').pop() || 'png';
      const slug = (f.short_name || String(Date.now())).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const path = `${slug}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('logos')
        .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
      setUploading(false);
      if (error) { alert('Upload gagal: ' + error.message); return; }
      const { data } = supabase.storage.from('logos').getPublicUrl(path);
      logo_url = data.publicUrl;
    }
    onSave({ ...f, logo_url });
  }

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--n-200)', fontSize: 14, background: 'var(--white)' };
  const cap = { fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '20px', background: 'var(--n-50)', borderRadius: 12, marginBottom: 16 }}>

      {/* Logo upload */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Klik untuk unggah logo"
          style={{
            width: 64, height: 64, borderRadius: 10, flexShrink: 0, padding: 0,
            border: logoPreview ? '1.5px solid var(--n-200)' : '2px dashed var(--n-300)',
            cursor: 'pointer', overflow: 'hidden', background: 'var(--white)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {logoPreview
            ? <img src={logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
            : <span style={{ fontSize: 24, color: 'var(--n-300)', lineHeight: 1 }}>+</span>
          }
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onLogoChange} />
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={cap}>
            URL Logo{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--n-400)' }}>
              (atau klik kotak untuk unggah)
            </span>
          </span>
          <input
            type="url"
            value={f.logo_url}
            onChange={e => {
              set('logo_url', e.target.value);
              setLogoPreview(e.target.value || null);
              setLogoFile(null);
              if (fileRef.current) fileRef.current.value = '';
            }}
            placeholder="https://…"
            style={inp}
          />
        </label>
      </div>

      {[
        ['Nama Lengkap', 'name',      'text'],
        ['Singkatan',    'short_name','text'],
        ['Peran',        'role',      'text'],
        ['Wilayah',      'region',    'text'],
        ['Website',      'website',   'url'],
      ].map(([label, key, type]) => (
        <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={cap}>{label}</span>
          <input type={type} value={f[key]} onChange={e => set(key, e.target.value)} style={inp} />
        </label>
      ))}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)} />
        <span style={{ fontSize: 14 }}>Aktif (tampil di halaman)</span>
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={cap}>Urutan</span>
        <input type="number" value={f.sort_order} onChange={e => set('sort_order', Number(e.target.value))} style={{ ...inp, width: 80 }} />
      </label>

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--n-200)', background: 'var(--white)', fontSize: 14, cursor: 'pointer' }}>Batal</button>
        <button
          type="button"
          disabled={saving || uploading || !f.name || !f.short_name}
          onClick={handleSave}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: (saving || uploading) ? 0.6 : 1 }}
        >
          {uploading ? 'Mengunggah…' : saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}

/* ── Coordinator form ──────────────────────────────────────── */
function CoordForm({ init, onSave, onCancel, saving }) {
  const initLangs = Array.isArray(init.languages) ? init.languages.join(', ') : (init.languages ?? '');
  const [f, setF] = useState({ ...init, languages: initLangs });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '20px', background: 'var(--n-50)', borderRadius: 12, marginBottom: 16 }}>
      {[
        ['Nama',              'name',        'text'],
        ['Jabatan / Peran',   'role',        'text'],
        ['Institusi Afiliasi','affiliation', 'text'],
        ['Wilayah',           'region',      'text'],
        ['URL Foto',          'photo_url',   'url'],
      ].map(([label, key, type]) => (
        <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
          <input
            type={type}
            value={f[key] ?? ''}
            onChange={e => set(key, e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--n-200)', fontSize: 14, background: 'var(--white)' }}
          />
        </label>
      ))}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bahasa (pisahkan dengan koma)</span>
        <input
          type="text"
          placeholder="Bugis, Konjo, Massenrempulu"
          value={f.languages}
          onChange={e => set('languages', e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--n-200)', fontSize: 14, background: 'var(--white)' }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entri Dikurasi</span>
        <input type="number" value={f.entries_curated} onChange={e => set('entries_curated', Number(e.target.value))} style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--n-200)', fontSize: 14, background: 'var(--white)', width: 100 }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Warna Aksen</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="color" value={f.color} onChange={e => set('color', e.target.value)} style={{ width: 40, height: 36, borderRadius: 6, border: '1.5px solid var(--n-200)', cursor: 'pointer', padding: 2 }} />
          <input type="text" value={f.color} onChange={e => set('color', e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--n-200)', fontSize: 13, fontFamily: 'var(--font-mono)', width: 90, background: 'var(--white)' }} />
        </div>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: '1 / -1' }}>
        <input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)} />
        <span style={{ fontSize: 14 }}>Aktif (tampil di halaman)</span>
      </label>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--n-200)', background: 'var(--white)', fontSize: 14, cursor: 'pointer' }}>Batal</button>
        <button
          disabled={saving || !f.name || !f.role}
          onClick={() => onSave({ ...f, languages: f.languages.split(',').map(s => s.trim()).filter(Boolean) })}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function AdminMitraPage() {
  const [tab, setTab]                   = useState('partners');
  const [partners, setPartners]         = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [editingPartner, setEditingPartner] = useState(null);
  const [addingPartner, setAddingPartner]   = useState(false);
  const [editingCoord, setEditingCoord]     = useState(null);
  const [addingCoord, setAddingCoord]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [pDragOver, setPDragOver] = useState(null);
  const [cDragOver, setCDragOver] = useState(null);
  const dragSrc = useRef(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const supabase = createClient();
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('partners').select('*').order('sort_order'),
      supabase.from('coordinators').select('*').order('sort_order'),
    ]);
    setPartners(p ?? []);
    setCoordinators(c ?? []);
  }

  async function persistSortOrder(table, rows) {
    const supabase = createClient();
    await Promise.all(rows.map((r, i) => supabase.from(table).update({ sort_order: i }).eq('id', r.id)));
  }

  function reorder(list, setList, table, from, to, setOver) {
    setOver(null);
    if (from == null || from === to) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setList(next);
    persistSortOrder(table, next);
  }

  /* ── Partner CRUD ── */
  async function savePartner(form) {
    setSaving(true);
    const supabase = createClient();
    const payload = { name: form.name, short_name: form.short_name, logo_url: form.logo_url || null, role: form.role, region: form.region, website: form.website || null, active: form.active, sort_order: form.sort_order };
    const { error } = editingPartner
      ? await supabase.from('partners').update(payload).eq('id', editingPartner.id)
      : await supabase.from('partners').insert(payload);
    setSaving(false);
    if (error) { flash(setMsg, '❌ ' + error.message); return; }
    flash(setMsg, '✅ Mitra disimpan');
    setEditingPartner(null); setAddingPartner(false);
    loadAll();
  }

  async function deletePartner(id) {
    if (!confirm('Hapus mitra ini?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (error) { flash(setMsg, '❌ ' + error.message); return; }
    flash(setMsg, '✅ Mitra dihapus');
    loadAll();
  }

  /* ── Coordinator CRUD ── */
  async function saveCoord(form) {
    setSaving(true);
    const supabase = createClient();
    const payload = { name: form.name, role: form.role, affiliation: form.affiliation || null, languages: form.languages, entries_curated: form.entries_curated, color: form.color, photo_url: form.photo_url || null, region: form.region || null, active: form.active, sort_order: form.sort_order };
    const { error } = editingCoord
      ? await supabase.from('coordinators').update(payload).eq('id', editingCoord.id)
      : await supabase.from('coordinators').insert(payload);
    setSaving(false);
    if (error) { flash(setMsg, '❌ ' + error.message); return; }
    flash(setMsg, '✅ Koordinator disimpan');
    setEditingCoord(null); setAddingCoord(false);
    loadAll();
  }

  async function deleteCoord(id) {
    if (!confirm('Hapus koordinator ini?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('coordinators').delete().eq('id', id);
    if (error) { flash(setMsg, '❌ ' + error.message); return; }
    flash(setMsg, '✅ Koordinator dihapus');
    loadAll();
  }

  const cell  = { padding: '12px 14px', fontSize: 14, borderBottom: '1px solid var(--n-100)', verticalAlign: 'middle' };
  const th    = { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid var(--n-100)', textAlign: 'left' };
  const hCell = { ...cell, width: 32, color: 'var(--n-300)', fontSize: 18, textAlign: 'center', userSelect: 'none', cursor: 'grab', padding: '12px 8px' };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>Mitra & Koordinator</h1>
        <p style={{ fontSize: 14, color: 'var(--n-500)' }}>Kelola mitra institusional dan koordinator lapangan yang tampil di halaman utama.</p>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#166534' : '#991b1b', fontSize: 14, marginBottom: 16 }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--n-100)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['partners', 'Mitra Institusional'], ['coordinators', 'Koordinator Lapangan']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: tab === key ? 700 : 500, background: tab === key ? 'var(--white)' : 'transparent', color: tab === key ? 'var(--ink)' : 'var(--n-500)', cursor: 'pointer', boxShadow: tab === key ? 'var(--shadow-sm)' : 'none', transition: 'all 120ms' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Partners tab ── */}
      {tab === 'partners' && (
        <div>
          {addingPartner ? (
            <PartnerForm init={EMPTY_PARTNER} onSave={savePartner} onCancel={() => setAddingPartner(false)} saving={saving} />
          ) : (
            <button onClick={() => { setAddingPartner(true); setEditingPartner(null); }} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px dashed var(--n-300)', background: 'var(--white)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--n-500)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              + Tambah Mitra
            </button>
          )}

          <div style={{ background: 'var(--white)', borderRadius: 12, border: '1px solid var(--n-100)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 32, padding: '10px 8px' }}></th>
                  {['Singkatan', 'Nama', 'Peran', 'Wilayah', 'Status', ''].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 && (
                  <tr><td colSpan={7} style={{ ...cell, color: 'var(--n-300)', textAlign: 'center', padding: '32px' }}>Belum ada mitra. Tambah di atas.</td></tr>
                )}
                {partners.map((p, i) => (
                  <>
                    <tr
                      key={p.id}
                      draggable
                      onDragStart={() => { dragSrc.current = i; }}
                      onDragOver={e => { e.preventDefault(); setPDragOver(i); }}
                      onDrop={() => reorder(partners, setPartners, 'partners', dragSrc.current, i, setPDragOver)}
                      onDragEnd={() => setPDragOver(null)}
                      style={{
                        background: editingPartner?.id === p.id ? 'var(--n-50)' : 'transparent',
                        borderTop: pDragOver === i ? '2px solid var(--blue)' : undefined,
                      }}
                    >
                      <td style={hCell}>⠿</td>
                      <td style={cell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.logo_url
                            ? <img src={p.logo_url} alt={p.short_name} style={{ height: 28, width: 'auto', maxWidth: 80, objectFit: 'contain', borderRadius: 4 }} />
                            : <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--indigo)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>{p.short_name}</div>
                          }
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{p.short_name}</span>
                        </div>
                      </td>
                      <td style={cell}>{p.name}</td>
                      <td style={{ ...cell, color: 'var(--n-500)', fontSize: 13 }}>{p.role}</td>
                      <td style={{ ...cell, color: 'var(--n-500)', fontSize: 13 }}>{p.region}</td>
                      <td style={cell}>
                        <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.active ? '#dcfce7' : '#f3f4f6', color: p.active ? '#166534' : '#6b7280' }}>
                          {p.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td style={{ ...cell, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingPartner(editingPartner?.id === p.id ? null : p); setAddingPartner(false); }} style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid var(--n-200)', background: 'var(--white)', fontSize: 13, cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => deletePartner(p.id)} style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #fecaca', background: '#fff5f5', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                    {editingPartner?.id === p.id && (
                      <tr key={`edit-${p.id}`}>
                        <td colSpan={7} style={{ padding: '0 14px 14px' }}>
                          <PartnerForm init={editingPartner} onSave={savePartner} onCancel={() => setEditingPartner(null)} saving={saving} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Coordinators tab ── */}
      {tab === 'coordinators' && (
        <div>
          {addingCoord ? (
            <CoordForm init={EMPTY_COORD} onSave={saveCoord} onCancel={() => setAddingCoord(false)} saving={saving} />
          ) : (
            <button onClick={() => { setAddingCoord(true); setEditingCoord(null); }} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px dashed var(--n-300)', background: 'var(--white)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--n-500)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              + Tambah Koordinator
            </button>
          )}

          <div style={{ background: 'var(--white)', borderRadius: 12, border: '1px solid var(--n-100)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 32, padding: '10px 8px' }}></th>
                  {['Nama', 'Peran', 'Bahasa', 'Entri', 'Status', ''].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {coordinators.length === 0 && (
                  <tr><td colSpan={7} style={{ ...cell, color: 'var(--n-300)', textAlign: 'center', padding: '32px' }}>Belum ada koordinator. Tambah di atas.</td></tr>
                )}
                {coordinators.map((c, i) => (
                  <>
                    <tr
                      key={c.id}
                      draggable
                      onDragStart={() => { dragSrc.current = i; }}
                      onDragOver={e => { e.preventDefault(); setCDragOver(i); }}
                      onDrop={() => reorder(coordinators, setCoordinators, 'coordinators', dragSrc.current, i, setCDragOver)}
                      onDragEnd={() => setCDragOver(null)}
                      style={{
                        background: editingCoord?.id === c.id ? 'var(--n-50)' : 'transparent',
                        borderTop: cDragOver === i ? '2px solid var(--blue)' : undefined,
                      }}
                    >
                      <td style={hCell}>⠿</td>
                      <td style={cell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                        </div>
                      </td>
                      <td style={{ ...cell, fontSize: 13, color: 'var(--n-500)' }}>{c.role}</td>
                      <td style={cell}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(c.languages ?? []).map(l => (
                            <span key={l} style={{ padding: '2px 7px', borderRadius: 12, background: 'var(--n-100)', fontSize: 11, fontWeight: 600 }}>{l}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{c.entries_curated ?? 0}</td>
                      <td style={cell}>
                        <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.active ? '#dcfce7' : '#f3f4f6', color: c.active ? '#166534' : '#6b7280' }}>
                          {c.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td style={{ ...cell, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingCoord(editingCoord?.id === c.id ? null : c); setAddingCoord(false); }} style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid var(--n-200)', background: 'var(--white)', fontSize: 13, cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => deleteCoord(c.id)} style={{ padding: '5px 12px', borderRadius: 7, border: '1.5px solid #fecaca', background: '#fff5f5', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                    {editingCoord?.id === c.id && (
                      <tr key={`edit-${c.id}`}>
                        <td colSpan={7} style={{ padding: '0 14px 14px' }}>
                          <CoordForm init={{ ...editingCoord, languages: (editingCoord.languages ?? []).join(', ') }} onSave={saveCoord} onCancel={() => setEditingCoord(null)} saving={saving} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SQL hint */}
      <details style={{ marginTop: 32, fontSize: 12, color: 'var(--n-400)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>SQL migration (jalankan sekali di Supabase)</summary>
        <pre style={{ background: 'var(--n-50)', border: '1px solid var(--n-100)', borderRadius: 10, padding: 16, overflow: 'auto', fontSize: 12, lineHeight: 1.7 }}>{`CREATE TABLE IF NOT EXISTS partners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  logo_url    TEXT,
  role        TEXT NOT NULL DEFAULT '',
  region      TEXT NOT NULL DEFAULT '',
  website     TEXT,
  active      BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coordinators (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT '',
  affiliation      TEXT,
  languages        TEXT[] DEFAULT '{}',
  entries_curated  INTEGER DEFAULT 0,
  color            TEXT DEFAULT '#1cb0f6',
  photo_url        TEXT,
  region           TEXT,
  active           BOOLEAN DEFAULT true,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Public read
ALTER TABLE partners     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read partners"     ON partners     FOR SELECT USING (true);
CREATE POLICY "public read coordinators" ON coordinators FOR SELECT USING (true);`}</pre>
      </details>
    </div>
  );
}
