'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

const NAV_GROUPS = [
  {
    label: 'Konten',
    items: [
      { href: '/admin',           label: 'Dasbor' },
      { href: '/admin/entries',   label: 'Antrian Entri' },
      { href: '/admin/audio',     label: 'Kelola Audio' },
      { href: '/admin/quick',      label: 'Tambah Cepat' },
      { href: '/admin/edit',       label: 'Edit Cepat' },
      { href: '/admin/bulk',      label: 'Unggah Massal' },
    ],
  },
  {
    label: 'Kelola',
    items: [
      { href: '/admin/users',     label: 'Pengguna' },
      { href: '/admin/languages', label: 'Bahasa' },
      { href: '/admin/speakers',  label: 'Penutur' },
      { href: '/admin/mitra',     label: 'Mitra & Koordinator' },
    ],
  },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--n-50)' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--white)',
        borderRight: '1.5px solid var(--n-100)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0',
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--n-100)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--green-d)' }}>
            Aksarantara
          </div>
          <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 2 }}>Admin Panel</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--n-300)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.map(({ href, label: itemLabel }) => {
                  const active = pathname === href;
                  return (
                    <Link key={href} href={href} style={{
                      display: 'block', padding: '9px 12px',
                      borderRadius: 10,
                      fontSize: 14, fontWeight: active ? 700 : 500,
                      color: active ? 'var(--ink)' : 'var(--n-500)',
                      background: active ? 'var(--n-50)' : 'transparent',
                      transition: 'background 120ms, color 120ms',
                    }}>
                      {itemLabel}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--n-100)' }}>
          {user && (
            <div style={{ fontSize: 12, color: 'var(--n-500)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          )}
          <button onClick={handleLogout} style={{
            fontSize: 13, fontWeight: 600, color: 'var(--n-500)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}>
            Keluar →
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '36px 40px', height: '100vh', overflowY: 'auto' }}>
        {children}
      </main>

    </div>
  );
}
