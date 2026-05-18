'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'done'
  const prevPath = useRef(pathname);

  // Detect navigation intent: any internal anchor click
  useEffect(() => {
    function onLinkClick(e) {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http')) return;
      // Same page — no progress
      if (href === pathname) return;
      setState('loading');
    }
    document.addEventListener('click', onLinkClick, true);
    return () => document.removeEventListener('click', onLinkClick, true);
  }, [pathname]);

  // Navigation completed
  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    setState('done');
    const t = setTimeout(() => setState('idle'), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  if (state === 'idle') return null;
  return <div className={`nav-progress nav-progress--${state}`} aria-hidden="true" />;
}
