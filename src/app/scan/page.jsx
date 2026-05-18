'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from '../../components/Topbar.jsx';
import Footer from '../../components/Footer.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import RecognizedEntryRow from '../../components/lontara/RecognizedEntryRow.jsx';
import { LANGUAGES } from '../../data.js';
import { createClient } from '../../lib/supabase.js';

function slugify(text) {
  return text.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SCRIPT_LABELS = {
  lontara: 'Aksara Lontara',
  jawi:    'Aksara Jawi',
  mixed:   'Campuran',
  unknown: 'Tidak Dikenali',
};

const SUBNAV_TABS = ['Transliterasi', 'Romanisasi', 'Terjemahan', 'Entri'];

export default function ScanPage() {
  const [image, setImage]       = useState(null); // { url, base64, mimeType }
  const [lang, setLang]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [result, setResult]     = useState(null);
  const [saved, setSaved]       = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [thumbs, setThumbs]     = useState([]); // recent { url, base64, mimeType }[]
  const [attribution, setAttribution] = useState('');
  const [editingAttr, setEditingAttr] = useState(false);

  const fileRef   = useRef(null);
  const cameraRef = useRef(null);

  // Persist thumbnail history in localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('lontara_recent') || '[]');
      setThumbs(stored.slice(0, 3));
    } catch {}
  }, []);

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = { url: dataUrl, base64: dataUrl.split(',')[1], mimeType: file.type };
      setImage(img);
      setResult(null);
      setError('');
      setSaved({});
      setActiveTab(0);

      // persist thumb
      try {
        const stored = JSON.parse(localStorage.getItem('lontara_recent') || '[]');
        const next = [{ url: dataUrl, base64: img.base64, mimeType: img.mimeType }, ...stored].slice(0, 3);
        localStorage.setItem('lontara_recent', JSON.stringify(next));
        setThumbs(next);
      } catch {}
    };
    reader.readAsDataURL(file);
  }

  function removeThumb(i) {
    const next = thumbs.filter((_, idx) => idx !== i);
    setThumbs(next);
    try { localStorage.setItem('lontara_recent', JSON.stringify(next)); } catch {}
  }

  async function runOcr() {
    if (!image) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai/lontara-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image.base64, mimeType: image.mimeType, lang: lang || undefined }),
      });
      let data;
      try { data = await res.json(); } catch { throw new Error(`Error ${res.status}`); }
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setResult(data);
      setActiveTab(0);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function saveEntry(entry, idx, audioBlob) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Login diperlukan untuk menyimpan entri.'); return; }

    setSaved(s => ({ ...s, [idx]: 'saving' }));
    try {
      const entryLang = entry.lang || lang || 'bugis';
      const base = slugify(entry.primary_text || '').slice(0, 45);
      const root = base ? `${base}-${entryLang}` : `lontara-${Date.now().toString(36)}`;

      const { data: existing } = await supabase.from('entries').select('slug').like('slug', `${root}%`);
      const taken = new Set((existing ?? []).map(r => r.slug));
      const slug = !taken.has(root) ? root : `${root}-${taken.size + 2}`;

      let audioUrl = null;
      if (audioBlob) {
        const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
        const path = `lontara/${user.id}/${slug}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('recordings').upload(path, audioBlob, { contentType: audioBlob.type });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(path);
          audioUrl = urlData?.publicUrl ?? null;
        }
      }

      const { error: insertErr } = await supabase.from('entries').insert({
        lang:           entryLang,
        type:           'word',
        primary_text:   entry.primary_text,
        slug,
        phonetic:       entry.phonetic || null,
        gloss_id:       entry.gloss_id || null,
        audio_url:      audioUrl,
        contributor_id: user.id,
        status:         'pending',
      });
      if (insertErr) throw insertErr;
      setSaved(s => ({ ...s, [idx]: 'done' }));
    } catch {
      setSaved(s => ({ ...s, [idx]: 'error' }));
    }
  }

  const hasSaveableEntries = result?.entries?.length > 0;

  return (
    <>
      <Topbar />
      <main>
        <div className="container scan-content">

          {/* Hero strip */}
          <div className="lon-hero">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <div>
                <h1 className="lon-hero-title">Naskah yang akhirnya bisa dibaca</h1>
                <p className="lon-hero-sub">Manuscripts, finally legible.</p>
              </div>
              <AIBadge size="lg" />
            </div>
            <p className="lon-hero-why">
              Aksara Lontara dan Jawi diajarkan turun-temurun; banyak naskah yang sudah tidak bisa dibaca oleh keluarga pemiliknya sendiri. Upload satu halaman — Gemma 4 akan membaca tiga lapisan: transliterasi, romanisasi, dan terjemahan.
            </p>
          </div>

          <div className="lon-grid">

            {/* ── Left: upload panel ─────────────────────────── */}
            <div>
              {/* Drop zone */}
              <div
                className={`lon-dropzone${image ? ' has-image' : ''}`}
                onClick={() => !image && fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              >
                {loading && <div className="lon-scan-line" />}

                {image ? (
                  <>
                    <img src={image.url} alt="Manuskrip" className="lontara-preview" />
                    <button
                      className="lontara-remove"
                      onClick={e => { e.stopPropagation(); setImage(null); setResult(null); setError(''); }}
                      aria-label="Hapus gambar"
                    >✕</button>
                  </>
                ) : (
                  <div className="lontara-placeholder">
                    <div className="lontara-icon">📜</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Upload foto manuskrip</div>
                    <div style={{ fontSize: 13, color: 'var(--n-500)' }}>Titipkan naskah yang ingin Anda baca.<br />Foto satu halaman saja sudah cukup.</div>
                  </div>
                )}
              </div>

              <input ref={fileRef}   type="file" accept="image/*"                   style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />

              {/* Thumbnail history */}
              {thumbs.length > 0 && (
                <div className="lon-thumbs" style={{ marginTop: 8 }}>
                  {thumbs.map((t, i) => (
                    <div key={i} className="lon-thumb-wrap">
                      <img
                        src={t.url}
                        className="lon-thumb"
                        alt={`Riwayat ${i + 1}`}
                        onClick={() => { setImage(t); setResult(null); setError(''); }}
                      />
                      <button
                        className="lon-thumb-remove"
                        onClick={e => { e.stopPropagation(); removeThumb(i); }}
                        aria-label="Hapus dari riwayat"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>Pilih file</button>
                <button className="btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => cameraRef.current?.click()}>📷 Kamera</button>
              </div>

              {/* Language hint */}
              <div className="scan-script-row">
                <span className="scan-script-label">
                  Aksara yang dipakai <span className="scan-script-opt">(opsional)</span>
                </span>
                <div className="scan-script-options">
                  {['', 'bugis', 'jawi'].map((v) => (
                    <label key={v} className="scan-script-option">
                      <input type="radio" name="script" checked={lang === v} onChange={() => setLang(v)} />
                      {v === '' ? 'Deteksi otomatis' : v === 'bugis' ? 'Lontara' : 'Jawi'}
                    </label>
                  ))}
                </div>
              </div>

              {/* OCR button */}
              <button
                className="btn-ai-draft"
                onClick={runOcr}
                disabled={!image || loading}
                style={{ marginTop: 16 }}
              >
                {loading ? '⏳ Membaca manuskrip…' : '✦ Baca Manuskrip'}
              </button>

              {error && <div className="ai-draft-error" style={{ marginTop: 12 }}>{error}</div>}

              {/* Attribution */}
              <div className="lon-attribution" style={{ marginTop: 12 }}>
                <span style={{ opacity: 0.5 }}>📍</span>
                {editingAttr ? (
                  <input
                    autoFocus
                    value={attribution}
                    onChange={e => setAttribution(e.target.value)}
                    onBlur={() => setEditingAttr(false)}
                    placeholder="Nama kontributor · Desa / Koleksi"
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: 'var(--font-mono)', flex: 1, color: 'var(--n-700)' }}
                  />
                ) : (
                  <span style={{ flex: 1, color: attribution ? 'var(--n-700)' : 'var(--n-500)' }}>
                    {attribution || 'Tambahkan atribusi foto…'}
                  </span>
                )}
                <button onClick={() => setEditingAttr(e => !e)}>✎</button>
              </div>
            </div>

            {/* ── Right: results ─────────────────────────────── */}
            <div>
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div key="loading" className="lon-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="ai-listen-wave" style={{ height: 28, marginBottom: 6 }}>
                      <i /><i /><i /><i /><i /><i /><i /><i /><i />
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--indigo)' }}>Gemma sedang membaca naskah ini…</div>
                    <div style={{ fontSize: 13, color: 'var(--n-500)' }}>Ini mungkin memerlukan beberapa detik</div>
                  </motion.div>
                )}

                {!loading && !result && (
                  <motion.div key="empty" className="lon-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Hasil pembacaan manuskrip akan muncul di sini
                  </motion.div>
                )}

                {!loading && result && (
                  <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {/* Result header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                      <span className="ai-badge">{SCRIPT_LABELS[result.script] ?? result.script ?? 'Lontara'}</span>
                      {result.confidence != null && (
                        <span className={`lon-conf ${result.confidence >= 0.75 ? 'lon-conf--high' : result.confidence >= 0.5 ? 'lon-conf--med' : 'lon-conf--low'}`}>
                          {Math.round(result.confidence * 100)}% yakin
                        </span>
                      )}
                    </div>

                    {/* Sub-nav (desktop visible, mobile scrollable) */}
                    <div className="lon-subnav">
                      {SUBNAV_TABS.map((tab, i) => (
                        <button key={tab} className={activeTab === i ? 'active' : ''} onClick={() => setActiveTab(i)}>
                          {tab}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {activeTab === 0 && result.transcription && (
                        <motion.div key="translit" className="lon-result-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="lon-result-label">Transliterasi</div>
                          <div className="lon-result-text">{result.transcription}</div>
                        </motion.div>
                      )}
                      {activeTab === 1 && result.romanization && (
                        <motion.div key="roman" className="lon-result-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="lon-result-label">Romanisasi</div>
                          <div className="lon-result-text">{result.romanization}</div>
                        </motion.div>
                      )}
                      {activeTab === 2 && (result.notes || result.translation) && (
                        <motion.div key="trans" className="lon-result-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="lon-result-label">Terjemahan</div>
                          <div className="lon-result-text" style={{ fontSize: 15 }}>{result.notes || result.translation}</div>
                        </motion.div>
                      )}
                      {activeTab === 3 && (
                        <motion.div key="entries" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {hasSaveableEntries ? (
                            <>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--ink)' }}>
                                Kata Dikenali ({result.entries.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {result.entries.map((entry, idx) => (
                                  <RecognizedEntryRow
                                    key={idx}
                                    entry={entry}
                                    savedState={saved[idx] ?? null}
                                    onSave={(e, audioBlob) => saveEntry(e, idx, audioBlob)}
                                  />
                                ))}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 10, lineHeight: 1.5 }}>
                                Entri disimpan sebagai <em>pending</em> — koordinator akan mereviu sebelum dipublikasikan.
                              </div>
                            </>
                          ) : (
                            <div className="lon-empty" style={{ minHeight: 120 }}>
                              Belum ada entri yang dikenali secara eksplisit.
                              <a href="/contribute" style={{ marginTop: 8, color: 'var(--indigo)', fontWeight: 600, fontSize: 13 }}>+ Tambahkan entri baru</a>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Show all result sections on mobile (no subnav needed for small screen) */}
                    <div className="lon-result-mobile-stack">
                      {result.transcription && (
                        <div className="lon-result-section" style={{ marginTop: 8 }}>
                          <div className="lon-result-label">Transliterasi</div>
                          <div className="lon-result-text">{result.transcription}</div>
                        </div>
                      )}
                      {result.romanization && (
                        <div className="lon-result-section">
                          <div className="lon-result-label">Romanisasi</div>
                          <div className="lon-result-text">{result.romanization}</div>
                        </div>
                      )}
                      {(result.notes || result.translation) && (
                        <div className="lon-result-section">
                          <div className="lon-result-label">Terjemahan</div>
                          <div className="lon-result-text" style={{ fontSize: 15 }}>{result.notes || result.translation}</div>
                        </div>
                      )}
                      {hasSaveableEntries && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Kata Dikenali ({result.entries.length})</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {result.entries.map((entry, idx) => (
                              <RecognizedEntryRow
                                key={`m-${idx}`}
                                entry={entry}
                                savedState={saved[idx] ?? null}
                                onSave={(e, audioBlob) => saveEntry(e, idx, audioBlob)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
