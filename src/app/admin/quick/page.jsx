'use client';
import { useState, useEffect, useRef } from 'react';
import { LANGUAGES } from '@/data';
import { createClient } from '@/lib/supabase';
import SelectInput from '@/components/Select';

const TYPES     = ['word', 'phrase', 'peribahasa', 'pantun', 'story', 'song'];
const POS_OPS   = ['', 'noun', 'verb', 'adjective', 'numeral', 'other'];
const TYPE_LABELS = { word: 'Kata', phrase: 'Frasa', peribahasa: 'Peribahasa', story: 'Kisah', song: 'Lagu', mantra: 'Mantra', pantun: 'Pantun' };
const POS_LABELS  = { noun: 'Kata Benda', verb: 'Kata Kerja', adjective: 'Kata Sifat', numeral: 'Kata Bilangan', other: 'Lainnya' };

const LANG_OPTS = LANGUAGES.map(l => ({ value: l.id, label: l.name }));
const TYPE_OPTS = TYPES.map(t => ({ value: t, label: TYPE_LABELS[t] }));
const POS_OPTS  = [{ value: '', label: '— tidak diisi —' }, ...POS_OPS.filter(Boolean).map(p => ({ value: p, label: POS_LABELS[p] }))];

function slugify(text) {
  return text.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugLengthInfo(slug) {
  const len = slug.length;
  if (len === 0)   return null;
  if (len < 3)     return { label: 'terlalu singkat',  color: 'var(--red)',  block: false };
  if (len <= 60)   return { label: 'ideal',            color: '#166534',    block: false };
  if (len <= 80)   return { label: 'panjang',          color: '#b45309',    block: false };
  if (len <= 100)  return { label: 'sangat panjang',   color: 'var(--red)', block: false };
  return           { label: 'melebihi batas (maks 100)', color: 'var(--red)', block: true };
}

const BLANK = {
  lang: '', type: 'word', primary_text: '', slug: '', gloss_id: '', gloss: '',
  pos: '', phonetic: '', dialect: '', contextual_meaning: '', usage_example: '',
  speaker_id: '',
};

const INPUT = {
  fontSize: 14, padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid var(--n-100)', background: 'var(--white)',
  color: 'var(--ink)', outline: 'none', width: '100%',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

function Label({ children, optional }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--n-700)', display: 'block', marginBottom: 6 }}>
      {children}
      {optional
        ? <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--n-400)', marginLeft: 6 }}>opsional</span>
        : <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
    </label>
  );
}

function EntryPreview({ form, speakers }) {
  const lang    = LANGUAGES.find(l => l.id === form.lang);
  const speaker = form.speaker_id ? speakers.find(s => s.id === form.speaker_id) : null;
  const empty   = !form.primary_text && !form.gloss_id;

  return (
    <div style={{ width: 360, flexShrink: 0, position: 'sticky', top: 36 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--n-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Preview</div>

      <div style={{ position: 'relative', background: 'var(--white)', border: '2px solid var(--n-100)', borderRadius: 'var(--radius-xl)', padding: 24, boxShadow: 'var(--shadow-card)', overflow: 'hidden', opacity: empty ? 0.4 : 1, transition: 'opacity 200ms' }}>

        {/* Color bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: lang ? `linear-gradient(90deg, ${lang.color}, ${lang.color}88)` : 'var(--n-100)' }} />

        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', marginTop: 4 }}>
          {lang && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 5, background: lang.color, color: '#fff', letterSpacing: '0.06em' }}>
              {lang.name}
            </span>
          )}
          <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 5, background: 'var(--n-50)', color: 'var(--n-700)', letterSpacing: '0.06em' }}>
            {TYPE_LABELS[form.type] ?? form.type}
          </span>
          {form.type === 'word' && form.pos && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 5, background: (lang?.color ?? '#888') + '15', color: lang?.color ?? '#888', letterSpacing: '0.06em', border: `1.5px solid ${(lang?.color ?? '#888')}30` }}>
              {POS_LABELS[form.pos] ?? form.pos}
            </span>
          )}
          {form.dialect && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 5, background: 'var(--n-50)', color: 'var(--n-500)', letterSpacing: '0.06em' }}>
              {form.dialect}
            </span>
          )}
        </div>

        {/* Word */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, color: form.primary_text ? 'var(--ink)' : 'var(--n-200)', marginBottom: 6 }}>
          {form.primary_text || 'kata'}
        </div>
        {form.phonetic && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--n-500)', marginBottom: 12 }}>
            {form.phonetic}
          </div>
        )}

        {/* Meaning */}
        <div style={{ padding: '12px 0', borderTop: '2px dashed var(--n-100)', borderBottom: (form.contextual_meaning || form.usage_example) ? '2px dashed var(--n-100)' : 'none', marginBottom: (form.contextual_meaning || form.usage_example) ? 14 : 0, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Bahasa Indonesia</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: form.gloss_id ? 'var(--ink)' : 'var(--n-200)' }}>{form.gloss_id || 'terjemahan'}</div>
          </div>
          {form.gloss && form.gloss !== form.gloss_id && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>English</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{form.gloss}</div>
            </div>
          )}
        </div>

        {/* Contextual meaning / body */}
        {form.contextual_meaning && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {form.type === 'story' ? 'Isi Kisah' : form.type === 'song' ? 'Lirik' : 'Makna Kontekstual'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--n-700)', lineHeight: 1.7 }}>{form.contextual_meaning}</div>
          </div>
        )}

        {/* Usage example */}
        {form.usage_example && (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: (lang?.color ?? '#888') + '0d', borderLeft: `3px solid ${lang?.color ?? 'var(--n-200)'}` }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: lang?.color ?? 'var(--n-400)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Contoh Penggunaan</div>
            <div style={{ fontSize: 12, color: 'var(--n-700)', lineHeight: 1.7, fontStyle: 'italic' }}>{form.usage_example}</div>
          </div>
        )}

        {/* Speaker */}
        {speaker && (
          <div style={{ marginTop: 14, background: 'var(--n-50)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 7, background: lang?.color ?? 'var(--n-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
              {speaker.name[0]}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{speaker.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuickAddPage() {
  const [form, setForm]         = useState(BLANK);
  const [speakers, setSpeakers] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [result, setResult]     = useState(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState('idle'); // 'idle' | 'checking' | 'ok' | 'taken'
  const slugDebounce = useRef(null);

  useEffect(() => {
    createClient().from('speakers').select('id, name, language_id').order('name')
      .then(({ data }) => setSpeakers(data ?? []));
  }, []);

  useEffect(() => {
    const s = slugify(form.slug);
    if (!s) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    clearTimeout(slugDebounce.current);
    slugDebounce.current = setTimeout(async () => {
      const { count } = await createClient()
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('slug', s);
      setSlugStatus((count ?? 0) === 0 ? 'ok' : 'taken');
    }, 400);
    return () => clearTimeout(slugDebounce.current);
  }, [form.slug]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setResult(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    const isLong = form.type === 'story' || form.type === 'song';
    if (!form.lang || !form.type || !form.primary_text || (isLong && !form.contextual_meaning) || (!isLong && !form.gloss_id)) {
      setResult({ ok: false, message: isLong ? 'Bahasa, tipe, judul, dan isi wajib diisi.' : 'Bahasa, tipe, kata, dan terjemahan wajib diisi.' });
      return;
    }
    if (slugInfo?.block) {
      setResult({ ok: false, message: 'Slug terlalu panjang. Kurangi jadi maksimal 100 karakter.' });
      return;
    }
    if (slugStatus === 'taken') {
      setResult({ ok: false, message: 'Slug sudah digunakan entri lain. Ganti slug-nya.' });
      return;
    }
    if (slugStatus === 'checking') {
      setResult({ ok: false, message: 'Menunggu pengecekan slug selesai.' });
      return;
    }
    setSaving(true);
    setResult(null);

    const row = {
      lang: form.lang, type: form.type,
      primary_text: form.primary_text.trim(),
      slug: slugify(form.slug) || slugify(form.primary_text.trim()),
      gloss_id: form.gloss_id.trim() || null,
      gloss: form.gloss.trim() || null,
      pos: form.type === 'word' && form.pos ? form.pos : null,
      phonetic: form.phonetic.trim() || null,
      dialect: form.dialect.trim() || null,
      contextual_meaning: form.contextual_meaning.trim() || null,
      usage_example: form.usage_example.trim() || null,
      speaker_id: form.speaker_id || null,
    };

    const res  = await fetch('/api/admin/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: [row] }) });
    const data = await res.json();
    setSaving(false);

    if (data.inserted === 1) {
      setResult({ ok: true, message: `"${form.primary_text}" berhasil ditambahkan.` });
      setForm(BLANK);
      setSlugEdited(false);
      setSlugStatus('idle');
    } else {
      setResult({ ok: false, message: data.failed?.[0]?.error ?? 'Gagal menyimpan.' });
    }
  }

  const isLong          = form.type === 'story' || form.type === 'song';
  const langSpeakers    = form.lang ? speakers.filter(s => s.language_id === form.lang) : speakers;
  const slugInfo        = form.slug ? slugLengthInfo(form.slug) : null;
  const slugBorderColor = slugStatus === 'taken' || form.slug.length > 100 ? '#fca5a5'
    : form.slug.length > 80 ? '#fde68a'
    : slugStatus === 'ok'   ? '#86efac'
    : 'var(--n-100)';

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Tambah Entri Cepat</h1>
        <p style={{ color: 'var(--n-500)', fontSize: 14, margin: 0 }}>Tambah satu entri langsung ke database dengan status approved.</p>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* ── FORM ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {result && (
            <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 600, background: result.ok ? '#f0fdf4' : '#fff1f2', color: result.ok ? '#166534' : 'var(--red)', border: `1px solid ${result.ok ? '#bbf7d0' : '#fecdd3'}` }}>
              {result.ok ? '✅ ' : '⚠️ '}{result.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <Label>Bahasa</Label>
                  <SelectInput sm value={form.lang} onChange={v => set('lang', v)} options={LANG_OPTS} placeholder="Pilih bahasa…" />
                </div>
                <div>
                  <Label>Tipe</Label>
                  <SelectInput sm value={form.type} onChange={v => set('type', v)} options={TYPE_OPTS} />
                </div>
              </div>

              {isLong ? (
                <div>
                  <Label>Judul {form.type === 'story' ? 'Kisah' : 'Lagu'}</Label>
                  <input value={form.primary_text} onChange={e => { set('primary_text', e.target.value); if (!slugEdited) set('slug', slugify(e.target.value)); }} style={INPUT} placeholder={form.type === 'story' ? 'mis. I Lagaligo' : 'mis. Anging Mamiri'} required />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <Label>{form.type === 'phrase' ? 'Frasa' : form.type === 'peribahasa' ? 'Peribahasa' : form.type === 'pantun' ? 'Pantun' : 'Kata'}</Label>
                    <input value={form.primary_text} onChange={e => { set('primary_text', e.target.value); if (!slugEdited) set('slug', slugify(e.target.value)); }} style={INPUT} placeholder="mappoji" required />
                  </div>
                  <div>
                    <Label>Terjemahan Indonesia</Label>
                    <input value={form.gloss_id} onChange={e => set('gloss_id', e.target.value)} style={INPUT} placeholder="makan" required />
                  </div>
                </div>
              )}

              {isLong && (
                <div>
                  <Label>{form.type === 'story' ? 'Isi Kisah' : 'Lirik'}</Label>
                  <textarea value={form.contextual_meaning} onChange={e => set('contextual_meaning', e.target.value)} style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }} rows={6} placeholder={form.type === 'story' ? 'Tulis teks kisah di sini…' : 'Tulis lirik lagu di sini…'} required />
                </div>
              )}

              <div>
                <Label>Slug URL</Label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={form.slug}
                    onChange={e => { set('slug', slugify(e.target.value)); setSlugEdited(true); }}
                    style={{ ...INPUT, fontFamily: 'var(--font-mono)', fontSize: 13, paddingRight: 110, borderColor: slugBorderColor }}
                    placeholder="auto-dari-kata"
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, pointerEvents: 'none', color: slugStatus === 'ok' ? '#166534' : slugStatus === 'taken' ? 'var(--red)' : 'var(--n-400)' }}>
                    {slugStatus === 'checking' ? 'mengecek…' : slugStatus === 'ok' ? '✓ tersedia' : slugStatus === 'taken' ? '✗ sudah ada' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, minHeight: 16 }}>
                  {slugInfo && (
                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: slugInfo.color }}>
                      {form.slug.length} karakter · {slugInfo.label}
                    </span>
                  )}
                  {form.lang && form.slug && (
                    <span style={{ fontSize: 11, color: 'var(--n-400)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                      /entry/{form.lang}/{slugify(form.slug)}
                    </span>
                  )}
                </div>
              </div>

              {form.type === 'word' && (
                <div>
                  <Label optional>Kelas Kata</Label>
                  <SelectInput sm value={form.pos} onChange={v => set('pos', v)} options={POS_OPTS} />
                </div>
              )}

              {!isLong && (
                <div>
                  <Label optional>Terjemahan Inggris</Label>
                  <textarea value={form.gloss} onChange={e => set('gloss', e.target.value)} style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }} rows={2} placeholder="e.g. to eat" />
                </div>
              )}

              {isLong && (
                <div>
                  <Label optional>Ringkasan (Indonesia)</Label>
                  <textarea value={form.gloss_id} onChange={e => set('gloss_id', e.target.value)} style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }} rows={3} placeholder={form.type === 'story' ? 'mis. Kisah tentang seorang pemuda Bugis yang mempertahankan kehormatan keluarganya.' : 'mis. Lagu tentang rindu kampung halaman dan keindahan alam Sulawesi.'} />
                </div>
              )}

              {form.type === 'word' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <Label optional>Fonetik IPA</Label>
                    <input value={form.phonetic} onChange={e => set('phonetic', e.target.value)} style={INPUT} placeholder="/mapˈpod͡ʒi/" />
                  </div>
                  <div>
                    <Label optional>Dialek</Label>
                    <input value={form.dialect} onChange={e => set('dialect', e.target.value)} style={INPUT} placeholder="Sinjai" />
                  </div>
                </div>
              ) : (
                <div>
                  <Label optional>Dialek</Label>
                  <input value={form.dialect} onChange={e => set('dialect', e.target.value)} style={INPUT} placeholder="Sinjai" />
                </div>
              )}

              {!isLong && (
                <>
                  <div>
                    <Label optional>Makna Kontekstual</Label>
                    <textarea value={form.contextual_meaning} onChange={e => set('contextual_meaning', e.target.value)} style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }} rows={3} placeholder="Penjelasan makna lebih dalam…" />
                  </div>
                  <div>
                    <Label optional>Contoh Penggunaan</Label>
                    <textarea value={form.usage_example} onChange={e => set('usage_example', e.target.value)} style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }} rows={2} placeholder="Kalimat contoh…" />
                  </div>
                </>
              )}

              <div style={{ borderTop: '1px solid var(--n-100)', paddingTop: 4 }} />

              <div>
                <Label optional>Penutur</Label>
                <SelectInput sm value={form.speaker_id} onChange={v => set('speaker_id', v)}
                  options={[{ value: '', label: '— tanpa penutur —' }, ...langSpeakers.map(s => ({ value: s.id, label: s.name }))]} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.6 : 1, minWidth: 140 }}>
                  {saving ? 'Menyimpan…' : 'Simpan Entri'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── PREVIEW ── */}
        <EntryPreview form={form} speakers={speakers} />

      </div>
    </div>
  );
}
