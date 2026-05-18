'use client';
import { useState, useEffect, useRef, use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Topbar from '../../../components/Topbar.jsx';
import Footer from '../../../components/Footer.jsx';
import Icon from '../../../components/Icon.jsx';
import { LANGUAGES } from '../../../data.js';
import { createClient } from '../../../lib/supabase.js';
import { audioMgr } from '../../../audio.js';
import PROVINCES from '../../area/provinces.json';
import CITIES from '../../area/cities.json';

const TYPE_LABELS = { word: 'Kata', phrase: 'Frasa', peribahasa: 'Peribahasa', story: 'Kisah', song: 'Lagu', pantun: 'Pantun', mantra: 'Mantra' };

function PlayBtn({ seed, color, audioUrl = null }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return audioMgr.subscribe(cur => setPlaying(cur?.seed === seed));
    const el = new Audio(audioUrl);
    audioRef.current = el;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    el.addEventListener('play', onPlay); el.addEventListener('pause', onPause); el.addEventListener('ended', onEnded);
    return () => { el.pause(); el.removeEventListener('play', onPlay); el.removeEventListener('pause', onPause); el.removeEventListener('ended', onEnded); };
  }, [seed, audioUrl]);

  function toggle(e) {
    e.preventDefault(); e.stopPropagation();
    if (audioUrl) { const el = audioRef.current; if (!el) return; el.paused ? el.play() : el.pause(); }
    else { playing ? audioMgr.stop() : audioMgr.play(seed, 1.2); }
  }

  if (!audioUrl) return (
    <button className="lpc-play" disabled style={{ background: 'transparent', borderColor: 'var(--n-100)', color: 'var(--n-300)', cursor: 'not-allowed', opacity: 0.5 }}>
      <Icon name="play" size={14} />
    </button>
  );
  return (
    <button className="lpc-play" style={{ background: playing ? color : 'transparent', borderColor: playing ? color : 'var(--n-100)', color: playing ? '#fff' : color }} onClick={toggle}>
      <Icon name={playing ? 'pause' : 'play'} size={14} />
    </button>
  );
}

const SI = ({ d, size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;

const SOCIAL_ICONS = {
  instagram: { icon: <SI d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />, color: '#E1306C', label: 'Instagram', toUrl: v => `https://instagram.com/${v.replace('@','')}` },
  twitter:   { icon: <SI d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />, color: '#000000', label: 'Twitter / X', toUrl: v => `https://twitter.com/${v.replace('@','')}` },
  tiktok:    { icon: <SI d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.52V6.74a4.85 4.85 0 0 1-1.02-.05z" />, color: '#010101', label: 'TikTok', toUrl: v => `https://tiktok.com/@${v.replace('@','')}` },
  youtube:   { icon: <SI d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />, color: '#FF0000', label: 'YouTube', toUrl: v => `https://youtube.com/@${v}` },
  facebook:  { icon: <SI d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />, color: '#1877F2', label: 'Facebook', toUrl: v => `https://facebook.com/${v}` },
  linkedin:  { icon: <SI d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />, color: '#0A66C2', label: 'LinkedIn', toUrl: v => `https://linkedin.com/in/${v}` },
  whatsapp:  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.122 1.529 5.855L0 24l6.335-1.509A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.5-5.197-1.378l-.372-.22-3.763.896.951-3.67-.242-.381A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>, color: '#25D366', label: 'WhatsApp', toUrl: v => `https://wa.me/${v.replace(/\D/g,'')}` },
  website:   { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, color: '#6B7280', label: 'Website', toUrl: v => v.startsWith('http') ? v : `https://${v}` },
};

function Avatar({ url, name, size = 200 }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 'var(--radius-lg)', objectFit: 'cover', border: '1.5px solid var(--n-100)', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: 'var(--radius-lg)', background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 800, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
      {initial}
    </div>
  );
}

export default function ProfilePage({ params: rawParams }) {
  const params = use(rawParams);
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', params.username)
        .single();
      if (error || !prof) { setMissing(true); setLoading(false); return; }
      setProfile(prof);

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === prof.id) setIsOwner(true);

      const { data: ents } = await supabase
        .from('entries')
        .select('*, speaker:speakers(*)')
        .eq('contributor_id', prof.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      setEntries(ents ?? []);
      setLoading(false);
    }
    load();
  }, [params.username]);

  if (missing) notFound();

  if (loading) return (
    <>
      <Topbar />
      <main>
        <section className="section">
          <div className="container">
            <div className="profile-card">
              <div className="profile-avatar-wrapper">
                <div className="sk sk-circle" style={{ width: 200, height: 200 }} />
              </div>
              <div className="profile-info" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="sk" style={{ width: 180, height: 28 }} />
                <div className="sk" style={{ width: 120, height: 16 }} />
                <div className="sk" style={{ width: 110, height: 14 }} />
                <div className="sk" style={{ width: '100%', height: 56, marginTop: 4 }} />
              </div>
              <div className="profile-stats">
                {[0,1].map(i => (
                  <div key={i} className="pst-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="sk" style={{ width: 44, height: 28 }} />
                    <div className="sk" style={{ width: 68, height: 12 }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-grid" style={{ marginTop: 32 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="lp-card">
                  <div className="sk" style={{ width: 56, height: 22, borderRadius: 999, marginBottom: 14 }} />
                  <div className="sk" style={{ width: '75%', height: 22, marginBottom: 8 }} />
                  <div className="sk" style={{ width: '55%', height: 14 }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );

  const provinceName = PROVINCES.find(p => p.code === profile.origin_province)?.name;
  const cityName = CITIES.find(c => c.code === profile.origin_city)?.name;
  const origin = [cityName, provinceName].filter(Boolean).join(', ');

  const langTabs = [...new Set(entries.map(e => e.lang))];
  const filtered = activeTab === 'all' ? entries : entries.filter(e => e.lang === activeTab);

  return (
    <>
      <Topbar />
      <main>
        <section className="section">
          <div className="container">

            <motion.div
              className="profile-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="profile-avatar-wrapper">
                <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size={200} />
              </div>

              <div className="profile-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="profile-name">{profile.display_name || profile.username}</div>
                  {isOwner && (
                    <Link href="/settings" title="Edit profil" className="profile-edit-btn" style={{ color: 'var(--n-300)', display: 'flex', alignItems: 'center' }}>
                      <Icon name="settings" size={18} />
                    </Link>
                  )}
                </div>
                <div className="profile-username">@{profile.username}</div>
                {origin && (
                  <div className="profile-origin">
                    <Icon name="pin" size={12} /> {origin}
                  </div>
                )}
                {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                {Object.entries(SOCIAL_ICONS).some(([k]) => profile[k]) && (
                  <div className="profile-socials profile-socials-desktop">
                    {Object.entries(SOCIAL_ICONS).map(([key, { icon, color, label, toUrl }]) =>
                      profile[key] ? (
                        <a key={key} href={toUrl(profile[key])} target="_blank" rel="noopener noreferrer"
                          className="profile-social-icon-btn" title={label} style={{ color }}>
                          {icon}
                        </a>
                      ) : null
                    )}
                  </div>
                )}
              </div>

              {Object.entries(SOCIAL_ICONS).some(([k]) => profile[k]) && (
                <div className="profile-socials profile-socials-mobile">
                  {Object.entries(SOCIAL_ICONS).map(([key, { icon, color, label, toUrl }]) =>
                    profile[key] ? (
                      <a key={key} href={toUrl(profile[key])} target="_blank" rel="noopener noreferrer"
                        className="profile-social-icon-btn" title={label} style={{ color }}>
                        {icon}
                      </a>
                    ) : null
                  )}
                </div>
              )}

              <div className="profile-stats">
                <div className="pst-item">
                  <span className="pst-num">{entries.length}</span>
                  <span className="pst-lbl">Kontribusi</span>
                </div>
                <div className="pst-divider" />
                <div className="pst-item">
                  <span className="pst-num">{langTabs.length}</span>
                  <span className="pst-lbl">Bahasa</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {entries.length > 0 && (
                <div className="profile-tabs">
                  <button className={`chip ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Semua</button>
                  {langTabs.map(lid => {
                    const l = LANGUAGES.find(x => x.id === lid);
                    return (
                      <button key={lid} className={`chip ${activeTab === lid ? 'active' : ''}`} onClick={() => setActiveTab(lid)}>
                        {l?.name ?? lid}
                      </button>
                    );
                  })}
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="al-empty">Belum ada kontribusi yang dipublikasikan.</div>
              ) : (
                <div className="lp-grid">
                  {filtered.map(e => {
                    const lang = LANGUAGES.find(l => l.id === e.lang);
                    return (
                      <Link key={e.id} href={`/entry/${e.lang}/${e.slug ?? e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="lp-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div className="lpc-tag" style={{ background: lang?.color ?? 'var(--n-300)', margin: 0 }}>{TYPE_LABELS[e.type]}</div>
                            <div onClick={ev => ev.stopPropagation()}>
                              <PlayBtn seed={`profile-entry-${e.id}`} color={lang?.color ?? '#888'} audioUrl={e.audio_url || null} />
                            </div>
                          </div>
                          <div className="lpc-primary">{e.primary_text}</div>
                          <div className="lpc-translations">
                            <div className="lpc-tr"><span className="lpc-tr-lang">ID</span>{e.gloss_id || e.gloss}</div>
                            {e.gloss && e.gloss_id && <div className="lpc-tr"><span className="lpc-tr-lang">EN</span>{e.gloss}</div>}
                          </div>
                          {e.speaker && (
                            <div className="lpc-meta" style={{ marginTop: 'auto', paddingTop: 10 }}>
                              <div>{e.speaker.name}</div>
                              {e.speaker.village && <div>{e.speaker.village}</div>}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
