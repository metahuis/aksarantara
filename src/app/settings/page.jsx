'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Topbar from '../../components/Topbar.jsx';
import Footer from '../../components/Footer.jsx';
import Select from '../../components/Select.jsx';
import Icon from '../../components/Icon.jsx';
import PROVINCES from '../area/provinces.json';
import CITIES from '../area/cities.json';
import { createClient } from '../../lib/supabase.js';
import { Globe } from 'lucide-react';

const PRESET_AVATARS = {
  boy:  Array.from({ length: 20 }, (_, i) => `/avatars/boy${i + 1}.webp`),
  girl: Array.from({ length: 20 }, (_, i) => `/avatars/girl${i + 1}.webp`),
};
const ALL_PRESETS = [...PRESET_AVATARS.boy, ...PRESET_AVATARS.girl];

const SI = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
);

const ICONS = {
  instagram: ({ size = 16 }) => <SI size={size} d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />,
  twitter:   ({ size = 16 }) => <SI size={size} d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  tiktok:    ({ size = 16 }) => <SI size={size} d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.52V6.74a4.85 4.85 0 0 1-1.02-.05z" />,
  youtube:   ({ size = 16 }) => <SI size={size} d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
  facebook:  ({ size = 16 }) => <SI size={size} d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
  linkedin:  ({ size = 16 }) => <SI size={size} d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
  whatsapp:  ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.122 1.529 5.855L0 24l6.335-1.509A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.5-5.197-1.378l-.372-.22-3.763.896.951-3.67-.242-.381A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  ),
  website:   ({ size = 16 }) => <Globe size={size} />,
};

const SOCIAL_META = {
  instagram: { prefix: '@',              placeholder: 'username',        color: '#E1306C' },
  twitter:   { prefix: '@',              placeholder: 'username',        color: '#000000' },
  tiktok:    { prefix: '@',              placeholder: 'username',        color: '#010101' },
  youtube:   { prefix: 'youtube.com/@',  placeholder: 'handle',          color: '#FF0000' },
  facebook:  { prefix: 'facebook.com/',  placeholder: 'username',        color: '#1877F2' },
  linkedin:  { prefix: 'linkedin.com/in/', placeholder: 'username',      color: '#0A66C2' },
  whatsapp:  { prefix: '+',              placeholder: '62 812 3456 7890', color: '#25D366' },
  website:   { prefix: '',              placeholder: 'https://situsmu.com', color: '#6B7280' },
};

function Field({ label, hint, required, children, span }) {
  return (
    <div className="stg-field" style={span ? { gridColumn: '1 / -1' } : {}}>
      <div className="stg-field-head">
        <span className="stg-label">
          {label}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
        </span>
        {hint && <span className="stg-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const fileRef   = useRef(null);
  const pickerRef = useRef(null);

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');
  const [userId, setUserId]       = useState(null);
  const [email, setEmail]         = useState('');
  const [isNew, setIsNew]         = useState(false);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showPicker, setShowPicker]       = useState(false);

  const [form, setForm] = useState({
    username: '', display_name: '', bio: '', birth_year: '', gender: '',
    origin_province: '', origin_city: '',
    instagram: '', twitter: '', tiktok: '', youtube: '', facebook: '', linkedin: '', whatsapp: '', website: '',
    avatar_url: '',
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filteredCities = form.origin_province
    ? CITIES.filter(c => c.province_code === form.origin_province)
    : [];

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login?next=/settings'); return; }
      setUserId(user.id);
      setEmail(user.email ?? '');

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();

      if (prof) {
        setIsNew(!prof.username);
        setForm({
          username:        prof.username        ?? '',
          display_name:    prof.display_name    ?? '',
          bio:             prof.bio             ?? '',
          birth_year:      prof.birth_year      ? String(prof.birth_year) : '',
          gender:          prof.gender          ?? '',
          origin_province: prof.origin_province ?? '',
          origin_city:     prof.origin_city     ?? '',
          instagram:       prof.instagram       ?? '',
          twitter:         prof.twitter         ?? '',
          tiktok:          prof.tiktok          ?? '',
          youtube:         prof.youtube         ?? '',
          facebook:        prof.facebook        ?? '',
          linkedin:        prof.linkedin        ?? '',
          whatsapp:        prof.whatsapp        ?? '',
          website:         prof.website         ?? '',
          avatar_url:      prof.avatar_url      ?? '',
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!showPicker) return;
    function handleOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showPicker]);

  function onAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSelectedPreset(null);
  }

  function pickPreset(path) {
    setSelectedPreset(path);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    setShowPicker(false);
  }

  async function save(e) {
    e.preventDefault();
    if (!form.username.trim()) { setError('Username wajib diisi.'); return; }
    if (!/^[a-z0-9_]{3,30}$/.test(form.username)) {
      setError('Username hanya boleh huruf kecil, angka, dan underscore (3–30 karakter).');
      return;
    }
    setSaving(true); setError(''); setSaved(false);
    try {
      const supabase = createClient();
      let avatar_url = form.avatar_url || null;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const path = `${userId}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      } else if (selectedPreset) {
        avatar_url = selectedPreset;
      } else if (!avatar_url) {
        avatar_url = ALL_PRESETS[Math.floor(Math.random() * ALL_PRESETS.length)];
      }

      const { error: updateErr } = await supabase.rpc('save_my_profile', {
        p_username:        form.username.trim(),
        p_display_name:    form.display_name.trim()  || null,
        p_bio:             form.bio.trim()            || null,
        p_birth_year:      form.birth_year ? parseInt(form.birth_year) : null,
        p_gender:          form.gender || null,
        p_origin_province: form.origin_province       || null,
        p_origin_city:     form.origin_city           || null,
        p_instagram:       form.instagram.trim()  || null,
        p_twitter:         form.twitter.trim()    || null,
        p_tiktok:          form.tiktok.trim()     || null,
        p_youtube:         form.youtube.trim()    || null,
        p_facebook:        form.facebook.trim()   || null,
        p_linkedin:        form.linkedin.trim()   || null,
        p_whatsapp:        form.whatsapp.trim()   || null,
        p_website:         form.website.trim()    || null,
        p_avatar_url:      avatar_url,
      });

      if (updateErr) {
        setError(updateErr.code === '23505'
          ? 'Username sudah digunakan. Pilih yang lain.'
          : updateErr.message);
      } else {
        setSaved(true);
        if (isNew) router.push(`/profile/${form.username.trim()}`);
      }
    } catch (err) {
      setError(err.message || 'Gagal menyimpan.');
    }
    setSaving(false);
  }

  const avatarSrc   = avatarPreview || selectedPreset || form.avatar_url || null;
  const avatarName  = form.display_name || form.username || '?';
  const avatarInit  = avatarName.charAt(0).toUpperCase();

  if (loading) return (
    <>
      <Topbar />
      <main>
        <section className="section" style={{ paddingBottom: 80 }}>
          <div className="container">
            <div style={{ marginBottom: 32 }}>
              <div className="sk" style={{ width: 80, height: 12, marginBottom: 12 }} />
              <div className="sk" style={{ width: 240, height: 34 }} />
            </div>
            <div className="stg-card">
              <div className="stg-profile-top">
                <div className="stg-avatar-col" style={{ alignItems: 'center', gap: 10 }}>
                  <div className="sk sk-circle" style={{ width: 88, height: 88 }} />
                  <div className="sk" style={{ width: 72, height: 12 }} />
                </div>
                <div className="stg-profile-fields">
                  <div className="stg-grid">
                    {[0,1,2,3,4,5].map(i => (
                      <div key={i} className="stg-field" style={i === 0 || i === 5 ? { gridColumn: '1 / -1' } : {}}>
                        <div className="sk" style={{ width: 90, height: 12, marginBottom: 8 }} />
                        <div className="sk" style={{ height: 44, borderRadius: 'var(--radius)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );

  return (
    <>
      <Topbar />
      <main>
        <section className="section" style={{ paddingBottom: 80 }}>
          <div className="container">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ marginBottom: 32 }}
            >
              <div className="kicker">
                <span className="k-num">{isNew ? 'Selamat datang' : 'Akun'}</span>
              </div>
              <h1 className="section-title">
                {isNew ? 'Lengkapi profil Anda' : 'Pengaturan Profil'}
              </h1>
              {isNew && (
                <p className="section-sub">
                  Atur profil sebelum mulai berkontribusi ke arsip.
                </p>
              )}
            </motion.div>

            <motion.form
              onSubmit={save}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              <div className="stg-card">

                {/* ── Avatar + Identitas ── */}
                <div className="stg-profile-top">
                  <div className="stg-avatar-col">
                    <button type="button" className="stg-avatar-btn" onClick={() => fileRef.current?.click()} title="Upload foto profil">
                      {avatarSrc
                        ? <img src={avatarSrc} alt="avatar" className="stg-avatar-img" />
                        : <div className="stg-avatar-init">{avatarInit}</div>
                      }
                      <div className="stg-avatar-overlay">
                        <Icon name="upload" size={18} />
                      </div>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarChange} />
                    <div style={{ textAlign: 'center' }}>
                      <div className="stg-avatar-label">Foto Profil</div>
                      <div className="stg-avatar-sub">JPG, PNG · maks 2MB</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPicker(v => !v)}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: 2 }}
                    >
                      Pilih avatar
                    </button>

                    {showPicker && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.3)' }}
                          onClick={() => setShowPicker(false)}
                        />
                        <div
                          ref={pickerRef}
                          style={{
                            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            zIndex: 50, width: 500,
                            background: 'var(--white)', border: '1.5px solid var(--n-100)',
                            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-pop)',
                            padding: 20,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Pilih Avatar</span>
                            <button type="button" onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--n-400)', lineHeight: 1, padding: '2px 6px' }}>×</button>
                          </div>
                          {['boy', 'girl'].map(group => (
                            <div key={group} style={{ marginBottom: group === 'boy' ? 16 : 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                {group === 'boy' ? 'Laki-laki' : 'Perempuan'}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                {PRESET_AVATARS[group].map(path => {
                                  const active = (selectedPreset || form.avatar_url) === path;
                                  return (
                                    <button
                                      key={path}
                                      type="button"
                                      onClick={() => pickPreset(path)}
                                      style={{
                                        width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
                                        padding: 0, flexShrink: 0, cursor: 'pointer', background: 'none',
                                        border: `2.5px solid ${active ? 'var(--green)' : 'var(--n-100)'}`,
                                        boxShadow: active ? '0 0 0 2px var(--green-d)' : 'none',
                                        transition: 'border-color 100ms, box-shadow 100ms',
                                      }}
                                    >
                                      <img src={path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="stg-profile-fields">
                    <div className="stg-grid">
                      <Field label="Nama Tampilan" hint="opsional" span>
                        <input
                          className="cf-input"
                          placeholder="mis. Andi Tenri"
                          value={form.display_name}
                          onChange={e => update('display_name', e.target.value)}
                          maxLength={60}
                        />
                      </Field>
                      <Field label="Email" hint="tidak dapat diubah">
                        <input className="cf-input stg-locked-input" value={email} readOnly onChange={() => {}} />
                      </Field>
                      <Field label="Username" hint="huruf kecil, angka, underscore" required>
                        <div className="stg-prefix-wrap">
                          <span className="stg-prefix">@</span>
                          <input
                            className="cf-input stg-prefix-input"
                            placeholder="namakamu"
                            value={form.username}
                            onChange={e => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            maxLength={30}
                            required
                            autoComplete="off"
                          />
                        </div>
                      </Field>
                      <Field label="Tahun Lahir" hint="opsional">
                        <input
                          className="cf-input"
                          type="number"
                          placeholder={`mis. ${new Date().getFullYear() - 25}`}
                          value={form.birth_year}
                          onChange={e => update('birth_year', e.target.value)}
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </Field>
                      <Field label="Jenis Kelamin" hint="opsional">
                        <Select
                          value={form.gender}
                          onChange={val => update('gender', val)}
                          options={[
                            { value: 'male',          label: 'Laki-laki' },
                            { value: 'female',        label: 'Perempuan' },
                            { value: 'not_mentioned', label: 'Tidak disebutkan' },
                          ]}
                          placeholder="— Pilih —"
                        />
                      </Field>
                      <Field label="Bio" hint="maks 200 karakter" span>
                        <textarea
                          className="cf-textarea"
                          rows={3}
                          placeholder="Ceritakan sedikit tentang dirimu…"
                          value={form.bio}
                          onChange={e => update('bio', e.target.value)}
                          maxLength={200}
                          style={{ resize: 'vertical' }}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="stg-divider" />

                {/* ── Asal Daerah ── */}
                <div className="stg-section-label">Asal Daerah <span className="stg-section-opt">opsional</span></div>
                <div className="stg-grid">
                  <Field label="Provinsi">
                    <Select
                      value={form.origin_province}
                      onChange={val => { update('origin_province', val); update('origin_city', ''); }}
                      options={PROVINCES.map(p => ({ value: p.code, label: p.name }))}
                      placeholder="— Pilih Provinsi —"
                    />
                  </Field>
                  <Field label="Kabupaten / Kota">
                    <Select
                      value={form.origin_city}
                      disabled={!form.origin_province}
                      onChange={val => update('origin_city', val)}
                      options={filteredCities.map(c => ({ value: c.code, label: c.name }))}
                      placeholder="— Pilih Kabupaten / Kota —"
                    />
                  </Field>
                </div>

                <div className="stg-divider" />

                {/* ── Media Sosial ── */}
                <div className="stg-section-label">Media Sosial <span className="stg-section-opt">opsional</span></div>
                <div className="stg-socials-grid">
                  {Object.entries(SOCIAL_META).map(([key, { prefix, placeholder, color }]) => {
                    const SocialIcon = ICONS[key];
                    return (
                    <div key={key} className="stg-social-item">
                      <div className="stg-social-icon" style={{ color }}>
                        <SocialIcon size={16} />
                      </div>
                      {prefix && <span className="stg-social-prefix">{prefix}</span>}
                      <input
                        className="stg-social-input"
                        placeholder={placeholder}
                        value={form[key]}
                        onChange={e => update(key, e.target.value)}
                      />
                    </div>
                    );
                  })}
                </div>

                {/* ── Feedback & Actions ── */}
                {error && (
                  <div className="stg-alert stg-alert-error" style={{ marginTop: 8 }}>{error}</div>
                )}
                {saved && !isNew && (
                  <div className="stg-alert stg-alert-success" style={{ marginTop: 8 }}>
                    <Icon name="check" size={14} /> Profil berhasil disimpan.
                  </div>
                )}

                <div className="stg-actions">
                  <button type="button" className="btn-ghost" style={{ color: 'var(--n-300)', marginRight: 'auto' }} onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = '/'; }}>
                    Keluar
                  </button>
                  {!isNew && (
                    <button type="button" className="btn-ghost" onClick={() => router.back()}>Batal</button>
                  )}
                  <button type="submit" className="btn-primary" disabled={saving || !form.username}>
                    {saving ? 'Menyimpan…' : isNew
                      ? <><span>Simpan &amp; mulai</span> <Icon name="arrow" size={14} /></>
                      : 'Simpan perubahan'}
                  </button>
                </div>

              </div>
            </motion.form>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
