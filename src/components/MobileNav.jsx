'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon.jsx';
import { createClient } from '../lib/supabase.js';

const BASE_NAV = [
  { href: '/',         icon: 'home',    solidIcon: 'home-solid',    label: 'Home'    },
  { href: '/archive',  icon: 'archive', solidIcon: 'archive-solid', label: 'Archive' },
  null,
  { href: '/glossary', icon: 'book',    solidIcon: 'book-solid',    label: 'Glossary' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileHref, setProfileHref] = useState('/login');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('username').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.username) setProfileHref(`/profile/${data.username}`);
          else setProfileHref('/settings');
        });
    });
  }, []);

  const navItems = [
    ...BASE_NAV,
    { href: profileHref, icon: 'user', solidIcon: 'user', label: 'Profile' },
  ];

  // Full-screen pages that own the bottom of the screen — hide the tab bar
  if (pathname.startsWith('/chat')) return null;

  const isActive = (href) => {
    const base = href.split('#')[0];
    if (base === '/') return pathname === '/';
    if (['/login', '/settings'].includes(base) || base.startsWith('/profile') || base.startsWith('/suara'))
      return ['/login', '/settings', '/profile/', '/suara/'].some(p => pathname.startsWith(p));
    return pathname.startsWith(base);
  };

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      <div className="bottom-nav-inner">
        {navItems.map((item) =>
          item === null ? (
            <motion.button
              key="fab"
              className="fab"
              onClick={() => router.push('/contribute')}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              aria-label="Rekam & kontribusi"
            >
              <span className="fab-pulse" aria-hidden="true" />
              <Icon name="mic" size={24} />
            </motion.button>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`bn-item${isActive(item.href) ? ' active' : ''}`}
              aria-label={item.label}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <span className="bn-icon">
                <Icon name={isActive(item.href) ? item.solidIcon : item.icon} size={22} />
              </span>
              <span className="bn-label">{item.label}</span>
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
