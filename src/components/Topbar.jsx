'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HiOutlineBars3BottomLeft, HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';
import Icon from './Icon.jsx';
import NowPlayingSheet from './NowPlayingSheet.jsx';
import { audioMgr } from '../audio.js';
import { createClient } from '../lib/supabase.js';
import { ARCHIVE_ENTRIES, LANGUAGES } from '../data.js';
import { useMediaQuery } from '../lib/useMediaQuery.js';

function TopbarAvatar({ url, name, size = 32 }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
      {initial}
    </div>
  );
}

function ProfilePopover({ profile, onClose }) {
  const ref = useRef(null);
  const isMobile = useMediaQuery('(max-width: 720px)');

  useEffect(() => {
    if (isMobile) return;
    function onClick(e) {
      if (ref.current && ref.current.offsetParent !== null && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [onClose, isMobile]);

  function navigate(href) {
    onClose();
    window.location.href = href;
  }

  async function logout() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = '/';
  }

  const menuItems = (
    <>
      <div className="tp-header">
        <TopbarAvatar url={profile.avatar_url} name={profile.display_name || profile.username} size={40} />
        <div>
          <div className="tp-name">{profile.display_name || profile.username}</div>
          <div className="tp-username">@{profile.username}</div>
        </div>
      </div>
      <div className="tp-divider" />
      <button className="tp-item" onClick={() => navigate(`/profile/${profile.username}`)}>
        <Icon name="user" size={15} /> My Profile
      </button>
      <button className="tp-item" onClick={() => navigate('/dashboard')}>
        <Icon name="star" size={15} /> Dashboard
      </button>
      <button className="tp-item" onClick={() => navigate('/settings')}>
        <Icon name="settings" size={15} /> Settings
      </button>
      <div className="tp-divider" />
      <button className="tp-item tp-logout" onClick={logout}>
        <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} /> Log Out
      </button>
    </>
  );

  if (isMobile) {
    return createPortal(
      <motion.div
        style={{ position: 'fixed', inset: 0, zIndex: 500 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="tp-sheet-backdrop" onClick={onClose} />
        <motion.div
          className="tp-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.3 }}
          onDragEnd={(_, { offset, velocity }) => {
            if (offset.y > 80 || velocity.y > 300) onClose();
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="tp-sheet-handle" />
          {menuItems}
          <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
        </motion.div>
      </motion.div>,
      document.body
    );
  }

  return (
    <div ref={ref} className="topbar-popover">
      {menuItems}
    </div>
  );
}

function getMobileTopbar(pathname) {
  if (pathname === '/') return null;

  if (pathname === '/archive')   return { kind: 'back', title: 'Arsip',    showShare: false, showFilter: true };
  if (pathname === '/glossary')  return { kind: 'back', title: 'Glossary',  showShare: false };
  if (pathname === '/about')     return { kind: 'back', title: 'About',     showShare: false };
  if (pathname === '/login')     return { kind: 'back', title: 'Sign In',   showShare: false };
  if (pathname === '/settings')  return { kind: 'back', title: 'Settings',  showShare: false };
  if (pathname === '/dashboard') return { kind: 'back', title: 'Dashboard', showShare: false };

  if (pathname.startsWith('/language/')) {
    const langId = pathname.split('/')[2];
    const lang = LANGUAGES.find(l => l.id === langId);
    return { kind: 'back', title: lang?.name ?? 'Bahasa', showShare: true };
  }

  if (pathname.startsWith('/entry/'))   return { kind: 'back', title: 'Entry',      showShare: true };
  if (pathname.startsWith('/contribute')) return { kind: 'close', title: 'Record',  showShare: false };
  if (pathname.startsWith('/scan'))      return { kind: 'back',  title: 'Manuskrip', showShare: false };
  if (pathname.startsWith('/chat'))      return { kind: 'back',  title: 'Ngobrol',   showShare: false };
  if (pathname.startsWith('/profile/')) return { kind: 'back', title: 'Profile',    showShare: false };
  if (pathname.startsWith('/suara/'))   return { kind: 'back', title: 'Speaker',    showShare: false };
  return { kind: 'back', title: '', showShare: false };
}

export default function Topbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [playing, setPlaying]       = useState(null);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [profile, setProfile]       = useState(null);
  const [popover, setPopover]       = useState(false);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    const unsub = audioMgr.subscribe((cur) => setPlaying(cur));
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase.from('profiles').select('username, display_name, avatar_url').eq('id', user.id).single()
          .then(({ data }) => { if (data) setProfile(data); });
      });
    }
    return () => { window.removeEventListener('scroll', onScroll); unsub(); };
  }, []);

  const isHome = pathname === '/';
  const mobCfg = mounted ? getMobileTopbar(pathname) : null;
  const isProfilePath = ['/login', '/settings', '/profile/', '/suara/'].some(p => pathname.startsWith(p));

  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: document.title, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  const links = [
    { h: '/about',    l: 'About' },
    { h: '/archive',  l: 'Archive' },
    { h: '/glossary', l: 'Glossary' },
    { h: '/scan',     l: 'Scan' },
    { h: '/chat',     l: 'Chat' },
  ];

  return (
    <>
      <header className={`topbar${scrolled ? ' scrolled' : ''}${!isHome ? ' topbar-inner' : ''}`} suppressHydrationWarning>
        <div className="topbar-inner-wrap">

          {/* ── Desktop brand (always) ───────────────────── */}
          <Link href="/" className="brand">
            <span className="brand-mark">
              <svg viewBox="0 0 32 32" width="32" height="32">
                <text x="16" y="24" textAnchor="middle" fill="#58cc02" fontSize="24" fontFamily="Lontara, serif">ᨋ</text>
              </svg>
            </span>
            <span className="brand-text">
              <span className="brand-name" translate="no">aksarantara</span>
            </span>
          </Link>

          {/* ── Desktop nav ──────────────────────────────── */}
          <nav className="nav">
            {links.map(l => <Link key={l.h} href={l.h} className={pathname === l.h ? 'active' : ''}>{l.l}</Link>)}
          </nav>

          {/* ── Desktop nav-cta ──────────────────────────── */}
          <div className="nav-cta">
            <Link href="/contribute" className="btn-primary sm">
              <Icon name="mic" size={14} /> Kontribusi
            </Link>
            {mounted ? (
              profile
                ? profile.username
                  ? <div style={{ position: 'relative' }}>
                      <button className={`topbar-avatar${isProfilePath ? ' active' : ''}`} onClick={() => setPopover(v => !v)} title={profile.display_name || profile.username}>
                        <TopbarAvatar url={profile.avatar_url} name={profile.display_name || profile.username} size={36} />
                      </button>
                      <AnimatePresence>
                        {popover && <ProfilePopover key="desktop-popover" profile={profile} onClose={() => setPopover(false)} />}
                      </AnimatePresence>
                    </div>
                  : <Link href="/settings" className="btn-ghost sm" style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }}>Lengkapi Profil</Link>
                : <Link href="/login" className={`topbar-avatar${isProfilePath ? ' active' : ''}`} title="Masuk">
                    <Icon name="user" size={20} style={{ color: 'var(--n-300)' }} />
                  </Link>
            ) : <div style={{ width: 40, height: 40 }} />}
          </div>

          {/* ── Mobile: home page — search + avatar right ── */}
          {isHome && (
            <div className="topbar-mobile-actions">
              <Link href="/archive" className="icon-btn" aria-label="Cari">
                <Icon name="search" size={18} />
              </Link>
              <div>
                {mounted && profile ? (
                  profile.avatar_url ? (
                    <button className="topbar-avatar" onClick={() => setPopover(v => !v)} title={profile.display_name || profile.username}>
                      <TopbarAvatar url={profile.avatar_url} name={profile.display_name || profile.username} size={36} />
                    </button>
                  ) : (
                    <button className="icon-btn dark" onClick={() => setPopover(v => !v)} title={profile.display_name || profile.username}>
                      {(profile.display_name || profile.username || 'A').charAt(0).toUpperCase()}
                    </button>
                  )
                ) : (
                  <Link href="/login" className="icon-btn dark" aria-label="Masuk">
                    <Icon name="user" size={18} />
                  </Link>
                )}
              </div>
              <AnimatePresence>
                {popover && profile && <ProfilePopover key="mobile-popover" profile={profile} onClose={() => setPopover(false)} />}
              </AnimatePresence>
            </div>
          )}

          {/* ── Mobile: hamburger — home left side ────────── */}
          <button className="mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <HiOutlineBars3BottomLeft size={24} />
          </button>

          {/* ── Mobile: non-home pages ───────────────────── */}
          {!isHome && (
            <div className="mob-topbar">
              {/* Left button */}
              <button
                className="icon-btn mob-topbar-left"
                style={{ visibility: mounted && mobCfg?.kind ? 'visible' : 'hidden' }}
                onClick={() => router.back()}
                aria-label={mounted && mobCfg?.kind === 'close' ? 'Close' : 'Back'}
              >
                {mounted && mobCfg?.kind === 'close' ? (
                  <Icon name="close" size={18} />
                ) : (
                  <Icon name="arrow" size={18} style={{ transform: 'rotate(180deg)' }} />
                )}
              </button>

              {/* Center title — absolutely positioned so it's always screen-centered */}
              <span className="mob-topbar-title" suppressHydrationWarning>
                {mounted ? (mobCfg?.title ?? '') : ''}
              </span>

              {/* Right actions */}
              <div className="mob-topbar-actions">
                {mounted && mobCfg?.showShare && (
                  <button className="icon-btn" onClick={handleShare} aria-label="Bagikan">
                    <Icon name="share" size={18} />
                  </button>
                )}
                {mounted && mobCfg?.showFilter && (
                  <button className="icon-btn" onClick={() => window.dispatchEvent(new CustomEvent('aksarantara:filter'))} aria-label="Filter">
                    <HiOutlineAdjustmentsHorizontal size={20} />
                  </button>
                )}
                {mounted && profile?.username && pathname === `/profile/${profile.username}` && (
                  <Link href="/settings" className="icon-btn" aria-label="Edit profil">
                    <Icon name="settings" size={18} />
                  </Link>
                )}
                {mounted && !mobCfg?.showShare && !mobCfg?.showFilter && pathname !== `/profile/${profile?.username}` && (
                  <div style={{ width: 38 }} />
                )}
              </div>
            </div>
          )}

        </div>

        {playing && (
          <div className="now-playing">
            <span className="np-dot" />
            <span className="np-label">SEDANG DIPUTAR</span>
            <span className="np-seed">{playing.seed}</span>
          </div>
        )}
      </header>

      {playing && (() => {
        const mpEntry = ARCHIVE_ENTRIES.find(e => playing.seed && playing.seed.includes(e.id));
        return (
          <button className="mini-player" aria-live="polite" onClick={() => setSheetOpen(true)} aria-label="Buka pemutar audio">
            <div className="mp-progress-strip"><div className="mp-progress-fill" style={{ width: '35%' }} /></div>
            <div className="mp-art" style={mpEntry ? { background: `linear-gradient(135deg, ${LANGUAGES.find(l => l.id === mpEntry.lang)?.color ?? 'var(--bugis-color)'} 0%, var(--jambi-color) 100%)` } : undefined} />
            <div className="mp-meta">
              <div className="mp-title">{mpEntry?.primary_text ?? playing.seed}</div>
              <div className="mp-sub">{mpEntry ? (mpEntry.speaker?.name ?? mpEntry.speaker ?? 'SEDANG DIPUTAR') : 'SEDANG DIPUTAR'}</div>
            </div>
            <button className="mp-play" onClick={ev => ev.stopPropagation()} aria-label="Jeda">
              <Icon name="pause" size={16} />
            </button>
          </button>
        );
      })()}

      <AnimatePresence>
        {sheetOpen && playing && <NowPlayingSheet playing={playing} onClose={() => setSheetOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="mobile-menu-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={() => setMobileOpen(false)} />
            <motion.div className="mobile-menu" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
              <div className="mm-head">
                <span className="brand-name">aksarantara</span>
                <motion.button className="mm-close" onClick={() => setMobileOpen(false)} whileTap={{ scale: 0.95 }}>
                  <Icon name="close" size={20} />
                </motion.button>
              </div>
              <div className="mm-links">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <Icon name="home" size={20} /> Home
                </Link>
                <Link href="/archive" onClick={() => setMobileOpen(false)}>
                  <Icon name="archive" size={20} /> Archive
                </Link>
                <Link href="/glossary" onClick={() => setMobileOpen(false)}>
                  <Icon name="book" size={20} /> Glossary
                </Link>
                <Link href="/scan" onClick={() => setMobileOpen(false)}>
                  <Icon name="search" size={20} /> Manuscript Scanner
                </Link>
                <Link href="/chat" onClick={() => setMobileOpen(false)}>
                  <Icon name="waveform" size={20} /> AI Chat
                </Link>
                <Link href="/about" onClick={() => setMobileOpen(false)}>
                  <Icon name="info" size={20} /> About
                </Link>
                {(!profile || !profile.username) && (
                  <>
                    <div className="mm-divider" />
                    {profile
                      ? <Link href="/settings" onClick={() => setMobileOpen(false)}>
                          <Icon name="settings" size={20} /> Complete Profile
                        </Link>
                      : <Link href="/login" onClick={() => setMobileOpen(false)}>
                          <Icon name="user" size={20} /> Log In
                        </Link>
                    }
                  </>
                )}
              </div>
              <div className="mm-ctas">
                <Link href="/contribute" className="btn-primary lg block" onClick={() => setMobileOpen(false)}>
                  <Icon name="mic" size={16} /> Contribute
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
