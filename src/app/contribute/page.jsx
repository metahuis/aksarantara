'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from '../../components/Topbar.jsx';
import Footer from '../../components/Footer.jsx';
import Icon from '../../components/Icon.jsx';
import Select from '../../components/Select.jsx';
import Waveform from '../../components/Waveform.jsx';
import Link from 'next/link';
import { LANGUAGES } from '../../data.js';
import PROVINCES from '../area/provinces.json';
import CITIES from '../area/cities.json';
import DISTRICTS from '../area/districts.json';
import { createClient } from '../../lib/supabase.js';
import AIDraftField from '../../components/ai/AIDraftField.jsx';
import WhyThisDraft from '../../components/ai/WhyThisDraft.jsx';
import DraftFeedbackRow from '../../components/ai/DraftFeedbackRow.jsx';

function slugify(text) {
  return text.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(supabase, text, language, dialect) {
  const base       = slugify(text).slice(0, 45);
  if (!base) return `${language}-${Date.now().toString(36)}`;
  const withLang   = `${base}-${language}`;
  const withDialect = dialect ? `${withLang}-${slugify(dialect)}` : null;
  const root       = withDialect || withLang;
  const candidates = [base, withLang, ...(withDialect ? [withDialect] : []), ...Array.from({ length: 5 }, (_, i) => `${root}-${i + 2}`)];
  const { data } = await supabase.from('entries').select('slug').in('slug', candidates);
  const taken = new Set((data ?? []).map(r => r.slug));
  return candidates.find(c => !taken.has(c)) ?? `${base}-${Date.now().toString(36)}`;
}

const DEMO_WAVE = [0.3,0.5,0.7,0.9,0.6,0.4,0.5,0.75,0.85,0.6,0.35,0.5,0.7,0.85,0.55,0.3,0.45,0.65,0.8,0.5,0.3,0.45,0.65,0.8,0.55,0.3,0.4,0.6];
const STEPS = ['Kata & Arti', 'Rekaman', 'Penutur', 'Kirim'];
const ENTRY_TYPES = [
  { value: 'word',       label: 'Kata' },
  { value: 'phrase',     label: 'Frasa' },
  { value: 'peribahasa', label: 'Peribahasa' },
  { value: 'story',      label: 'Kisah' },
  { value: 'song',       label: 'Lagu' },
];
const POS_TYPES = [
  { value: 'noun',      label: 'Kata Benda (Nomina)' },
  { value: 'verb',      label: 'Kata Kerja (Verba)' },
  { value: 'adjective', label: 'Kata Sifat (Adjektiva)' },
  { value: 'numeral',   label: 'Kata Bilangan (Numeralia)' },
  { value: 'other',     label: 'Lainnya (Pronomina, Adverbia, dll.)' },
];

export default function ContributePage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ word: '', meaning: '', meaning_en: '', type: 'word', pos: 'noun', phonetic: '', meaning_ctx: '', usage: '', language: 'bugis', dialect: '', dialectCustom: '', speaker: '', age: '', province: '', city: '', district: '', village: '' });
  const [recMode, setRecMode] = useState('record'); // 'record' | 'upload' | 'none'
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedWord, setSubmittedWord] = useState('');
  const [speakerType, setSpeakerType] = useState('other');
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [aiDraft, setAiDraft] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [listenPhase, setListenPhase] = useState('idle'); // 'idle'|'listening'|'done'
  const [draftedFields, setDraftedFields] = useState({ phonetic: false, meaning: false });
  const [draftId, setDraftId] = useState(null);

  const recorderRef = useRef(null);
  const timerRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  useEffect(() => {
    const source = audioBlob || uploadFile;
    if (!source) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(source);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBlob, uploadFile]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setAuthUser(user);
      supabase.from('profiles')
        .select('display_name, username, origin_province, origin_city, birth_year')
        .eq('id', user.id).single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleSpeakerTypeChange(type) {
    setSpeakerType(type);
    if (type === 'self' && profile) {
      const age = profile.birth_year ? String(new Date().getFullYear() - profile.birth_year) : '';
      setForm(f => ({
        ...f,
        speaker:  profile.display_name || profile.username || '',
        age,
        province: profile.origin_province || '',
        city:     profile.origin_city || '',
        district: '',
        village:  '',
      }));
    } else {
      setForm(f => ({ ...f, speaker: '', age: '', province: '', city: '', district: '', village: '' }));
    }
  }

  const filteredCities    = form.province ? CITIES.filter(c => c.province_code === form.province) : [];
  const filteredDistricts = form.city ? DISTRICTS.filter(d => d.city_code === form.city) : [];
  const provinceName  = PROVINCES.find(p => p.code === form.province)?.name ?? '';
  const cityName      = CITIES.find(c => c.code === form.city)?.name ?? '';
  const districtName  = DISTRICTS.find(d => d.code === form.district)?.name ?? '';
  const locationLabel = [form.village, districtName, cityName, provinceName].filter(Boolean).join(', ');

  // ── Recording ────────────────────────────────────────────────
  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setRecorded(true);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start(100);
      recorderRef.current = recorder;
      setRecording(true);
      setRecDuration(0);
      timerRef.current = setInterval(() => setRecDuration(d => d + 1), 1000);
    } catch (err) {
      alert('Tidak dapat mengakses mikrofon: ' + err.message);
    }
  }

  function stopRec() {
    recorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  }

  function resetAudio() {
    setRecorded(false);
    setAudioBlob(null);
    setUploadFile(null);
    setRecDuration(0);
    setAiDraft(null);
    setAiError('');
  }

  async function generateAiDraft() {
    if (!form.word) return;
    setAiLoading(true);
    setListenPhase('listening');
    setAiError('');
    setAiDraft(null);
    setDraftId(`draft-${Date.now()}`);
    try {
      const source = audioBlob || uploadFile;
      let payload = { lang: form.language };
      if (source) {
        const audioBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(source);
        });
        payload = { ...payload, audioBase64, mimeType: source.type || 'audio/webm' };
      } else {
        payload = { ...payload, word: form.word };
      }
      const res = await fetch('/api/ai/transcribe-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data;
      try { data = await res.json(); } catch { throw new Error(`Server error ${res.status}`); }
      if (!res.ok || data.error) throw new Error(data?.error || `Server error ${res.status}`);
      setAiDraft(data);
      setListenPhase('done');
    } catch (err) {
      setAiError(err.message || 'Gagal menghasilkan draft. Coba lagi.');
      setListenPhase('idle');
    }
    setAiLoading(false);
  }

  function applyAiDraft() {
    if (!aiDraft) return;
    if (aiDraft.phonetic) update('phonetic', aiDraft.phonetic);
    if (aiDraft.gloss_id) update('meaning', aiDraft.gloss_id);
    setDraftedFields({ phonetic: !!aiDraft.phonetic, meaning: !!aiDraft.gloss_id });
    setAiDraft(null);
    setAiError('');
    setListenPhase('idle');
  }

  function fmtDuration(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  // ── Submit ───────────────────────────────────────────────────
  async function submit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let audioUrl = null;
      let uploadedPath = null;

      const audioSource = audioBlob || uploadFile;
      if (audioSource) {
        const ext = uploadFile ? (uploadFile.name.split('.').pop() || 'wav') : 'webm';
        uploadedPath = `${form.language}/user/${Date.now().toString(36)}.${ext}`;
        const fd = new FormData();
        fd.append('file', audioSource, `audio.${ext}`);
        fd.append('path', uploadedPath);
        const uploadRes  = await fetch('/api/contribute/upload-audio', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (uploadData.error) throw new Error(uploadData.error);
        audioUrl = uploadData.url;
      }

      const resolvedDialect = form.dialect === '__custom' ? form.dialectCustom : form.dialect;

      const speakerName = form.speaker || 'Anonim';
      const baseSlug = speakerName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      const speakerSlug = `${baseSlug}-${Date.now().toString(36)}`;

      const { data: speakerData, error: speakerErr } = await supabase.from('speakers').insert({
        name:        speakerName,
        slug:        speakerSlug,
        age:         form.age ? parseInt(form.age) : null,
        village:     form.village || null,
        district:    districtName || null,
        city:        cityName || null,
        province:    provinceName || null,
        language_id: form.language,
        dialect:     resolvedDialect || null,
        profile_id:  speakerType === 'self' ? (user?.id ?? null) : null,
      }).select('id').single();
      if (speakerErr) throw speakerErr;

      const entrySlug = await generateUniqueSlug(supabase, form.word, form.language, resolvedDialect);

      const { error: insertErr } = await supabase.from('entries').insert({
        lang:               form.language,
        type:               form.type,
        pos:                form.type === 'word' ? (form.pos || null) : null,
        primary_text:       form.word,
        slug:               entrySlug,
        phonetic:           form.phonetic || null,
        gloss_id:           form.meaning,
        gloss:              form.meaning_en || null,
        dialect:            resolvedDialect || null,
        speaker_id:         speakerData.id,
        contextual_meaning: form.meaning_ctx || null,
        usage_example:      form.usage || null,
        audio_url:          audioUrl,
        contributor_id:     user?.id ?? null,
        status:             'pending',
      });
      if (insertErr) {
        await supabase.from('speakers').delete().eq('id', speakerData.id);
        throw insertErr;
      }

      setSubmittedWord(form.word);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Gagal mengirim. Coba lagi.');
    }
    setSubmitting(false);
  }

  function reset() {
    setSubmitted(false);
    setRecorded(false);
    setAudioBlob(null);
    setUploadFile(null);
    setRecDuration(0);
    setSubmitError('');
    setSpeakerType('other');
    setDraftedFields({ phonetic: false, meaning: false });
    setListenPhase('idle');
    setAiDraft(null);
    setAiError('');
    setForm({ word: '', meaning: '', meaning_en: '', type: 'word', pos: 'noun', phonetic: '', meaning_ctx: '', usage: '', language: 'bugis', dialect: '', dialectCustom: '', speaker: '', age: '', province: '', city: '', district: '', village: '' });
    setStep(0);
  }

  const audioReady = recMode === 'none' || (recMode === 'record' && recorded) || (recMode === 'upload' && !!uploadFile);
  const hasAudioCapture = (recMode === 'record' && recorded) || (recMode === 'upload' && !!uploadFile);
  const showAiDraft = !!form.word && (form.type === 'word' || form.type === 'phrase');

  const aiDraftUI = showAiDraft ? (
    <div className="ai-draft-section">
      {/* Listening animation — replaces old spinner */}
      <AnimatePresence mode="wait">
        {listenPhase === 'listening' && (
          <motion.div
            key="listen"
            className="ai-listen-card"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <span className="ai-badge">Gemma 4</span>
            <div className="ai-listen-wave">
              <i /><i /><i /><i /><i /><i /><i /><i /><i />
            </div>
            <span className="ai-listen-label">
              {hasAudioCapture ? 'Gemma sedang membaca rekaman…' : 'Gemma sedang menganalisis…'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA button — visible when idle and no draft yet */}
      {listenPhase === 'idle' && !aiDraft && (
        <button className="btn-ai-draft" onClick={generateAiDraft} disabled={aiLoading}>
          <span>✦ {hasAudioCapture ? 'Analisis Rekaman' : 'Buat Draft AI'}</span>
          <span className="ai-badge">Gemma 4</span>
        </button>
      )}

      {/* Draft result card with WhyThisDraft + feedback */}
      <AnimatePresence>
        {aiDraft && (
          <motion.div
            key="draft"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="ai-draft-card">
              <div className="ai-draft-header">
                <span className="ai-badge">Draft AI · Gemma 4</span>
                {aiDraft.confidence != null && (
                  <span className="ai-confidence">{Math.round(aiDraft.confidence * 100)}% yakin</span>
                )}
              </div>
              {aiDraft.phonetic && (
                <div className="ai-draft-row">
                  <span>Pelafalan (IPA)</span>
                  <strong>{aiDraft.phonetic}</strong>
                </div>
              )}
              {aiDraft.gloss_id && (
                <div className="ai-draft-row">
                  <span>Arti (Indonesia)</span>
                  <strong style={{ fontFamily: 'var(--font-sans)' }}>{aiDraft.gloss_id}</strong>
                </div>
              )}
              <div style={{ marginTop: 10 }}>
                <WhyThisDraft transcription={aiDraft.transcription} confidence={aiDraft.confidence} />
              </div>
              <div className="ai-draft-actions">
                <button className="btn-primary btn-sm" onClick={applyAiDraft}>Gunakan Draft</button>
                <button className="btn-ghost btn-sm" onClick={() => { setAiDraft(null); setAiError(''); setListenPhase('idle'); }}>Abaikan</button>
              </div>
            </div>
            <DraftFeedbackRow draftId={draftId} />
          </motion.div>
        )}
      </AnimatePresence>

      {aiError && <div className="ai-draft-error">{aiError}</div>}
    </div>
  ) : null;

  return (
    <>
      <Topbar />
      <main>
        <section className="section contribute" id="contribute">
          <div className="container">
            <motion.div className="section-head center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="kicker center"><span className="dot" style={{ background: 'var(--green)', boxShadow: '0 0 0 3px rgba(88,204,2,0.18)' }} /> Kontribusi</div>
              <h2 className="section-title">Suara Anda adalah <span className="hl-green">arsip</span>.</h2>
              <p className="section-sub center" style={{ maxWidth: 520, margin: '0 auto' }}>
                Rekam satu kata. Satu suara sudah cukup untuk memulai.
                Setiap kontribusi ditinjau koordinator wilayah sebelum masuk arsip permanen.
              </p>
            </motion.div>

            <motion.div className="contrib-box" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              {/* Desktop step bar */}
              <div className="cp-bar">
                {STEPS.map((t, i) => (
                  <div key={i} className={`cp-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                    <div className="cp-dot">{i < step ? <Icon name="check" size={12} /> : i + 1}</div>
                    <div className="cp-lbl">{t}</div>
                  </div>
                ))}
              </div>
              {/* Mobile step pill */}
              <div className="cp-pill">
                <div className="cpp-dots">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`cpp-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} />
                  ))}
                </div>
                <span className="cpp-label">{step + 1} / {STEPS.length} · {STEPS[step].toUpperCase()}</span>
              </div>

              <div className="cb-body">
                <AnimatePresence mode="wait" initial={false}>
                {submitted ? (
                  <motion.div key="done" className="cb-done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="done-check">
                      <svg viewBox="0 0 64 64" width="64" height="64">
                        <circle cx="32" cy="32" r="30" fill="#58cc02" />
                        <motion.polyline points="20 33 28 41 44 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
                      </svg>
                    </div>
                    <h3>Terima kasih.</h3>
                    <p>Kontribusi <strong>{submittedWord || '—'}</strong> telah masuk antrian tinjauan.</p>
                    <div className="cd-id">ID · #{Date.now().toString(36).slice(-6).toUpperCase()}</div>
                    <button className="btn-ghost" onClick={reset}>Kirim entri lain</button>
                  </motion.div>

                ) : step === 0 ? (
                  <motion.div key="step-0" className="cb-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                    <label className="cf-label">Tipe Entri</label>
                    <Select value={form.type} onChange={val => { update('type', val); if (val !== 'word') update('pos', ''); else update('pos', 'noun'); }} options={ENTRY_TYPES} />

                    <label className="cf-label">
                      {form.type === 'story' ? 'Judul Kisah' : form.type === 'song' ? 'Judul Lagu' : form.type === 'phrase' ? 'Frasa' : form.type === 'peribahasa' ? 'Peribahasa' : 'Kata'}
                      {' '}<span>dalam bahasa daerah</span>
                    </label>
                    <input className="cf-input" placeholder={
                      form.type === 'story'      ? 'mis. I Lagaligo' :
                      form.type === 'song'       ? 'mis. Anging Mamiri' :
                      form.type === 'phrase'     ? "mis. narekko de'na isseng siri'" :
                      form.type === 'peribahasa' ? "mis. Mali' siparappe', rebba sipatokkong" :
                      'mis. mappoji'
                    } value={form.word} onChange={e => update('word', e.target.value)} />

                    {(form.type === 'story' || form.type === 'song') && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                        <label className="cf-label">{form.type === 'story' ? 'Isi Kisah' : 'Lirik'} <span>dalam bahasa daerah</span></label>
                        <textarea className="cf-textarea" rows={6} placeholder={form.type === 'story' ? 'Tulis teks kisah di sini…' : 'Tulis lirik lagu di sini…'} value={form.meaning_ctx} onChange={e => update('meaning_ctx', e.target.value)} />
                      </motion.div>
                    )}

                    {form.type === 'word' && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                        <label className="cf-label">Kelas Kata <span>jenis kata dalam tata bahasa</span></label>
                        <Select value={form.pos} onChange={val => update('pos', val)} options={POS_TYPES} />
                      </motion.div>
                    )}

                    {form.type !== 'story' && form.type !== 'song' ? (
                      <>
                        <label className="cf-label">Arti <span>dalam Bahasa Indonesia</span></label>
                        {draftedFields.meaning ? (
                          <AIDraftField
                            label="Arti (Indonesia)"
                            value={form.meaning}
                            onChange={v => { update('meaning', v); setDraftedFields(f => ({ ...f, meaning: false })); }}
                            isDraft={true}
                            placeholder="mis. makan"
                          />
                        ) : (
                          <input className="cf-input" placeholder="mis. makan" value={form.meaning} onChange={e => update('meaning', e.target.value)} />
                        )}
                        <label className="cf-label">Arti <span>dalam Bahasa Inggris <span className="cf-opt">opsional</span></span></label>
                        <textarea className="cf-textarea" rows={2} placeholder="e.g. to eat" value={form.meaning_en} onChange={e => update('meaning_en', e.target.value)} />
                      </>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                        <label className="cf-label">Ringkasan <span>Bahasa Indonesia <span className="cf-opt">opsional</span></span></label>
                        <textarea className="cf-textarea" rows={3} placeholder={form.type === 'story' ? 'mis. Kisah tentang seorang pemuda Bugis yang mempertahankan kehormatan keluarganya.' : 'mis. Lagu tentang rindu kampung halaman dan keindahan alam Sulawesi.'} value={form.meaning} onChange={e => update('meaning', e.target.value)} />
                      </motion.div>
                    )}

                    <label className="cf-label">Bahasa</label>
                    <Select value={form.language} onChange={val => { update('language', val); update('dialect', ''); update('dialectCustom', ''); }} options={LANGUAGES.map(l => ({ value: l.id, label: l.name }))} />
                    <label className="cf-label">Dialek</label>
                    <Select value={form.dialect} onChange={val => { update('dialect', val); update('dialectCustom', ''); }} options={[ ...(LANGUAGES.find(l => l.id === form.language)?.dialects ?? []).map(d => ({ value: d, label: d })), { value: '__custom', label: 'Lainnya…' } ]} placeholder="— Pilih Dialek —" />
                    {form.dialect === '__custom' && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                        <input className="cf-input" placeholder="Tulis nama dialek" value={form.dialectCustom} onChange={e => update('dialectCustom', e.target.value)} autoFocus />
                      </motion.div>
                    )}

                    {form.type === 'word' && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                        <label className="cf-label">Pelafalan <span className="cf-opt">opsional · IPA atau cara baca · <Link href="/glossary#ipa" target="_blank" style={{ color: 'var(--purple)', textDecoration: 'none', borderBottom: '1px solid var(--purple)' }}>Panduan IPA ↗</Link></span></label>
                        {draftedFields.phonetic ? (
                          <AIDraftField
                            label="Pelafalan (IPA)"
                            value={form.phonetic}
                            onChange={v => { update('phonetic', v); setDraftedFields(f => ({ ...f, phonetic: false })); }}
                            isDraft={true}
                            placeholder="mis. /mapˈpod͡ʒi/"
                          />
                        ) : (
                          <input className="cf-input" placeholder="mis. /mapˈpod͡ʒi/ atau (map-PO-ji)" value={form.phonetic} onChange={e => update('phonetic', e.target.value)} />
                        )}
                        {aiDraftUI}
                      </motion.div>
                    )}

                    {form.type !== 'story' && form.type !== 'song' && (
                      <>
                        <label className="cf-label">Makna Kontekstual <span className="cf-opt">opsional</span></label>
                        <textarea className="cf-textarea" rows={3} placeholder={"mis. \"siri'\" tidak cukup diterjemahkan sebagai \"malu\" — ia mencakup kehormatan dan tanggung jawab sosial."} value={form.meaning_ctx} onChange={e => update('meaning_ctx', e.target.value)} />
                        <label className="cf-label">Contoh Penggunaan <span className="cf-opt">opsional</span></label>
                        <textarea className="cf-textarea" rows={2} placeholder={"mis. \"Narekko de'na isseng siri', de'na tauwe.\""} value={form.usage} onChange={e => update('usage', e.target.value)} />
                      </>
                    )}

                    <div className="cf-actions">
                      <button className="btn-primary" disabled={
                        !form.word || !form.dialect || (form.dialect === '__custom' && !form.dialectCustom) ||
                        ((form.type === 'story' || form.type === 'song') ? !form.meaning_ctx : !form.meaning)
                      } onClick={() => setStep(1)}>
                        Lanjut <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </motion.div>

                ) : step === 1 ? (
                  <motion.div key="step-1" className="cb-step rec-desktop-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                    {/* Mode selector */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                      {[['record', 'Rekam Langsung'], ['upload', 'Unggah File'], ['none', 'Teks Saja']].map(([mode, label]) => (
                        <button key={mode} onClick={() => { setRecMode(mode); resetAudio(); }} style={{ flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1.5px solid', borderColor: recMode === mode ? 'var(--ink)' : 'var(--n-100)', background: recMode === mode ? 'var(--ink)' : 'var(--white)', color: recMode === mode ? 'var(--white)' : 'var(--n-500)', cursor: 'pointer', transition: 'all 120ms' }}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {recMode === 'record' && (
                      <div className="cf-rec">
                        <div className="cfr-target">
                          <div className="cfr-kicker">{LANGUAGES.find(l => l.id === form.language)?.name?.toUpperCase()} · KATA TARGET</div>
                          <div className="cfr-word">{form.word}</div>
                          {form.phonetic && <div className="cfr-phonetic">{form.phonetic}</div>}
                          {form.meaning  && <div className="cfr-gloss">Indonesia: {form.meaning}</div>}
                        </div>

                        {!recorded ? (
                          <>
                            <div className="rec-circle-wrap">
                              {recording && <><div className="rec-pulse-1" /><div className="rec-pulse-2" /></>}
                              <motion.button
                                className={`rec-circle-btn${recording ? ' rec' : ''}`}
                                onClick={recording ? stopRec : startRec}
                                whileTap={{ scale: 0.93 }}
                              >
                                {recording
                                  ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>
                                  : <Icon name="mic" size={26} />
                                }
                              </motion.button>
                            </div>
                            {recording ? (
                              <div className="rec-timer active">
                                <span className="rec-timer-dot" />
                                <span>{fmtDuration(recDuration)}</span>
                              </div>
                            ) : (
                              <div className="cfr-hint">ucapkan perlahan, alami</div>
                            )}
                            {recording && (
                              <motion.div className="cfr-wave cfr-wave-live" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Waveform seed={`rec-live-${recDuration}`} data={DEMO_WAVE} height={40} duration={0.6} color="#FF4B4B" />
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <motion.div className="cfr-wave" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <Waveform seed={`contrib-${form.word}`} data={DEMO_WAVE} height={48} duration={1.4} color="#1cb0f6" />
                            {previewUrl && <audio controls src={previewUrl} style={{ width: '100%', marginTop: 8, borderRadius: 8 }} />}
                            <div className="cfr-meta">{fmtDuration(recDuration)} · rekaman tersimpan</div>
                            <button onClick={resetAudio} style={{ marginTop: 10, fontSize: 12, color: 'var(--n-500)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                              rekam ulang
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {recMode === 'upload' && (
                      <div className="cf-rec">
                        <div className="cfr-word">{form.word}</div>
                        {!uploadFile ? (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 24px', border: '2px dashed var(--n-100)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'border-color 160ms' }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('audio/')) setUploadFile(f); }}>
                            <Icon name="upload" size={24} style={{ color: 'var(--n-300)' }} />
                            <span style={{ fontSize: 14, color: 'var(--n-500)' }}>Seret file audio ke sini, atau klik untuk memilih</span>
                            <span style={{ fontSize: 12, color: 'var(--n-300)' }}>WAV, MP3, M4A, OGG · maks 50MB</span>
                            <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files[0] || null)} />
                          </label>
                        ) : (
                          <motion.div className="cfr-wave" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <Waveform seed={`upload-${uploadFile.name}`} data={DEMO_WAVE} height={48} duration={1.4} color="#1cb0f6" />
                            {previewUrl && <audio controls src={previewUrl} style={{ width: '100%', marginTop: 8, borderRadius: 8 }} />}
                            <div className="cfr-meta">{uploadFile.name} · {(uploadFile.size / 1024).toFixed(0)} KB</div>
                            <button onClick={resetAudio} style={{ marginTop: 10, fontSize: 12, color: 'var(--n-500)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                              ganti file
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {recMode === 'none' && (
                      <div style={{ textAlign: 'center', padding: '32px 24px', background: 'var(--n-50)', borderRadius: 'var(--radius)' }}>
                        <div style={{ fontSize: 28, marginBottom: 10 }}>📝</div>
                        <p style={{ fontSize: 14, color: 'var(--n-500)', margin: 0 }}>Entri tanpa audio. Koordinator wilayah akan menambahkan rekaman di tahap verifikasi.</p>
                      </div>
                    )}

                    {aiDraftUI}

                    <div className="cf-actions">
                      <button className="btn-ghost" onClick={() => setStep(0)}>Kembali</button>
                      <button className="btn-primary" disabled={!audioReady} onClick={() => setStep(2)}>
                        Lanjut <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </motion.div>

                ) : step === 2 ? (
                  <motion.div key="step-2" className="cb-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                    {authUser && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                        {[['self', 'Saya sendiri'], ['other', 'Penutur lain']].map(([type, label]) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleSpeakerTypeChange(type)}
                            style={{ flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1.5px solid', borderColor: speakerType === type ? 'var(--ink)' : 'var(--n-100)', background: speakerType === type ? 'var(--ink)' : 'var(--white)', color: speakerType === type ? 'var(--white)' : 'var(--n-500)', cursor: 'pointer', transition: 'all 120ms' }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    <label className="cf-label">Nama Penutur</label>
                    <div className="cf-row">
                      <input className="cf-input" placeholder="mis. Hj. Andi Tenri" value={form.speaker} onChange={e => update('speaker', e.target.value)} />
                      <input className="cf-input cf-age" type="number" min="1" max="120" placeholder="Usia" value={form.age} onChange={e => update('age', e.target.value)} />
                    </div>
                    <label className="cf-label">Asal Penutur</label>
                    <div className="cf-location">
                      <Select value={form.province} onChange={val => { update('province', val); update('city', ''); update('district', ''); }} options={PROVINCES.map(p => ({ value: p.code, label: p.name }))} placeholder="— Provinsi —" />
                      <Select value={form.city} disabled={!form.province} onChange={val => { update('city', val); update('district', ''); }} options={filteredCities.map(c => ({ value: c.code, label: c.name }))} placeholder="— Kabupaten / Kota —" />
                      <Select value={form.district} disabled={!form.city} onChange={val => update('district', val)} options={filteredDistricts.map(d => ({ value: d.code, label: d.name }))} placeholder="— Kecamatan —" />
                      <input className="cf-input" placeholder="Desa / Kelurahan" value={form.village} onChange={e => update('village', e.target.value)} />
                    </div>
                    <div className="cf-consent">
                      <input type="checkbox" id="consent" defaultChecked />
                      <label htmlFor="consent">Saya telah memperoleh izin lisan dari penutur untuk mendokumentasikan dan membagikan rekaman ini di bawah CC-BY-SA.</label>
                    </div>
                    <div className="cf-actions">
                      <button className="btn-ghost" onClick={() => setStep(1)}>Kembali</button>
                      <button className="btn-primary" disabled={!form.speaker || !form.province} onClick={() => setStep(3)}>
                        Tinjau <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </motion.div>

                ) : (
                  <motion.div key="step-3" className="cb-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                    <div className="cf-review">
                      <div className="cfrv-row"><span>Tipe</span><strong>{ENTRY_TYPES.find(t => t.value === form.type)?.label}</strong></div>
                      <div className="cfrv-row"><span>{form.type === 'story' ? 'Judul Kisah' : form.type === 'song' ? 'Judul Lagu' : 'Kata'}</span><strong>{form.word}</strong></div>
                      {(form.type === 'story' || form.type === 'song') ? (
                        <>
                          {form.meaning_ctx && <div className="cfrv-row cfrv-wrap"><span>{form.type === 'story' ? 'Isi Kisah' : 'Lirik'}</span><strong>{form.meaning_ctx}</strong></div>}
                          {form.meaning     && <div className="cfrv-row cfrv-wrap"><span>Ringkasan</span><strong>{form.meaning}</strong></div>}
                        </>
                      ) : (
                        <>
                          {form.type === 'word' && form.pos && <div className="cfrv-row"><span>Kelas Kata</span><strong>{POS_TYPES.find(p => p.value === form.pos)?.label}</strong></div>}
                          <div className="cfrv-row"><span>Arti</span><strong>{form.meaning}</strong></div>
                          {form.meaning_en  && <div className="cfrv-row"><span>Arti (EN)</span><strong>{form.meaning_en}</strong></div>}
                          {form.phonetic    && <div className="cfrv-row"><span>Pelafalan</span><strong>{form.phonetic}</strong></div>}
                          {form.meaning_ctx && <div className="cfrv-row cfrv-wrap"><span>Kontekstual</span><strong>{form.meaning_ctx}</strong></div>}
                          {form.usage       && <div className="cfrv-row cfrv-wrap"><span>Contoh</span><strong>{form.usage}</strong></div>}
                        </>
                      )}
                      <div className="cfrv-row"><span>Bahasa</span><strong>{LANGUAGES.find(l => l.id === form.language)?.name}</strong></div>
                      <div className="cfrv-row"><span>Dialek</span><strong>{form.dialect === '__custom' ? form.dialectCustom : form.dialect}</strong></div>
                      <div className="cfrv-row"><span>Penutur</span><strong>{form.speaker}{form.age ? `, ${form.age} thn` : ''}</strong></div>
                      <div className="cfrv-row"><span>Asal</span><strong>{locationLabel || '—'}</strong></div>
                      <div className="cfrv-row"><span>Audio</span><strong>{recMode === 'none' ? 'Tanpa audio' : recMode === 'upload' ? uploadFile?.name ?? '—' : `Rekaman · ${fmtDuration(recDuration)}`}</strong></div>
                    </div>
                    {submitError && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fff1f2', color: 'var(--red)', border: '1px solid #fecdd3', fontSize: 13, marginBottom: 12 }}>
                        {submitError}
                      </div>
                    )}
                    <div className="cf-actions">
                      <button className="btn-ghost" onClick={() => setStep(2)} disabled={submitting}>Ubah</button>
                      <button className="btn-primary" onClick={submit} disabled={submitting}>
                        {submitting ? 'Mengirim…' : <><Icon name="upload" size={14} /> Kirim ke arsip</>}
                      </button>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />

      {/* ── Mobile recording fullscreen ──────────────────── */}
      <AnimatePresence>
        {step === 1 && (
          <motion.div
            className="rec-fullscreen"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {/* Header */}
            <div className="rec-fs-header">
              <button className="icon-btn" onClick={() => setStep(0)} aria-label="Kembali">
                <Icon name="arrow" size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <div className="rec-fs-pill">
                <div className="cpp-dots">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`cpp-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} />
                  ))}
                </div>
                <span className="cpp-label">{step + 1} / {STEPS.length} · {STEPS[step].toUpperCase()}</span>
              </div>
              <div style={{ width: 38 }} />
            </div>

            {/* Mode tabs */}
            <div className="rec-fs-modes">
              {[['record', 'Rekam Langsung'], ['upload', 'Unggah File'], ['none', 'Teks Saja']].map(([mode, label]) => (
                <button key={mode} className={`rec-fs-mode-btn${recMode === mode ? ' active' : ''}`} onClick={() => { setRecMode(mode); resetAudio(); }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="rec-fs-body">
              {recMode === 'record' && (
                <>
                  <div className="cfr-target">
                    <div className="cfr-kicker">{LANGUAGES.find(l => l.id === form.language)?.name?.toUpperCase()} · KATA TARGET</div>
                    <div className="cfr-word">{form.word}</div>
                    {form.phonetic && <div className="cfr-phonetic">{form.phonetic}</div>}
                    {form.meaning  && <div className="cfr-gloss">Indonesia: {form.meaning}</div>}
                  </div>

                  {!recorded ? (
                    <>
                      <div className="rec-circle-wrap">
                        {recording && <><div className="rec-pulse-1" /><div className="rec-pulse-2" /></>}
                        <motion.button
                          className={`rec-circle-btn${recording ? ' rec' : ''}`}
                          onClick={recording ? stopRec : startRec}
                          whileTap={{ scale: 0.93 }}
                        >
                          {recording
                            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>
                            : <Icon name="mic" size={26} />
                          }
                        </motion.button>
                      </div>
                      {recording ? (
                        <div className="rec-timer active">
                          <span className="rec-timer-dot" />
                          <span>{fmtDuration(recDuration)}</span>
                        </div>
                      ) : (
                        <div className="cfr-hint">ucapkan perlahan, alami</div>
                      )}
                      {recording && (
                        <motion.div className="cfr-wave cfr-wave-live" style={{ width: '100%' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <Waveform seed={`rec-live-${recDuration}`} data={DEMO_WAVE} height={44} duration={0.6} color="#FF4B4B" />
                        </motion.div>
                      )}
                      {!recording && (
                        <div className="rec-fs-hint">
                          Entri akan ditinjau koordinator wilayah sebelum dipublikasikan
                        </div>
                      )}
                    </>
                  ) : (
                    <motion.div className="cfr-wave" style={{ width: '100%' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Waveform seed={`contrib-${form.word}`} data={DEMO_WAVE} height={52} duration={1.4} color="#1cb0f6" />
                      {previewUrl && <audio controls src={previewUrl} style={{ width: '100%', marginTop: 10, borderRadius: 10 }} />}
                      <div className="cfr-meta" style={{ marginTop: 10 }}>{fmtDuration(recDuration)} · rekaman tersimpan</div>
                      <button onClick={resetAudio} style={{ marginTop: 12, fontSize: 13, color: 'var(--n-500)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        rekam ulang
                      </button>
                    </motion.div>
                  )}
                </>
              )}

              {recMode === 'upload' && (
                <div style={{ width: '100%' }}>
                  {!uploadFile ? (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 20px', border: '2px dashed var(--n-100)', borderRadius: 'var(--radius)', cursor: 'pointer' }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('audio/')) setUploadFile(f); }}>
                      <Icon name="upload" size={28} style={{ color: 'var(--n-300)' }} />
                      <span style={{ fontSize: 14, color: 'var(--n-500)' }}>Seret file audio ke sini, atau klik untuk memilih</span>
                      <span style={{ fontSize: 12, color: 'var(--n-300)' }}>WAV · MP3 · M4A · OGG · maks 50MB</span>
                      <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files[0] || null)} />
                    </label>
                  ) : (
                    <motion.div className="cfr-wave" style={{ width: '100%' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Waveform seed={`upload-${uploadFile.name}`} data={DEMO_WAVE} height={52} duration={1.4} color="#1cb0f6" />
                      {previewUrl && <audio controls src={previewUrl} style={{ width: '100%', marginTop: 10, borderRadius: 10 }} />}
                      <div className="cfr-meta" style={{ marginTop: 10 }}>{uploadFile.name} · {(uploadFile.size / 1024).toFixed(0)} KB</div>
                      <button onClick={resetAudio} style={{ marginTop: 12, fontSize: 13, color: 'var(--n-500)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        ganti file
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {recMode === 'none' && (
                <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--paper-alt)', borderRadius: 16, width: '100%' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
                  <p style={{ fontSize: 14, color: 'var(--n-500)', margin: 0, lineHeight: 1.6 }}>Entri tanpa audio. Koordinator wilayah akan menambahkan rekaman di tahap verifikasi.</p>
                </div>
              )}
              {aiDraftUI}
            </div>

            {/* Footer */}
            <div className="rec-fs-footer">
              <button className="btn-ghost" onClick={() => setStep(0)}>Kembali</button>
              <button className="btn-primary" disabled={!audioReady} onClick={() => setStep(2)}>
                Lanjut <Icon name="arrow" size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
