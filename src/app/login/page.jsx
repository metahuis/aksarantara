'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function LoginInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleMagicLink(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--n-500)', marginBottom: 8 }}>
              Aksarantara
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>
              Masuk ke Aksarantara
            </h1>
            <p style={{ color: 'var(--n-500)', marginTop: 8, marginBottom: 0, fontSize: 15 }}>
              Untuk merekam, berkontribusi, atau mengelola arsip.
            </p>
          </div>

          <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', padding: '28px 28px 24px', boxShadow: 'var(--shadow-card)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>Cek email kamu</p>
                <p style={{ color: 'var(--n-500)', fontSize: 14, margin: 0 }}>
                  Kami kirim tautan masuk ke <strong>{email}</strong>. Klik tautan tersebut untuk melanjutkan.
                </p>
              </div>
            ) : (
              <>
                <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--n-700)' }}>
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="kamu@contoh.com"
                    required
                    style={{
                      height: 48,
                      padding: '0 16px',
                      borderRadius: 12,
                      border: '1.5px solid var(--n-100)',
                      fontSize: 15,
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                  {error && (
                    <p style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', marginTop: 4, opacity: loading ? 0.6 : 1 }}
                  >
                    {loading ? 'Mengirim…' : 'Kirim Magic Link'}
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--n-100)' }} />
                  <span style={{ fontSize: 12, color: 'var(--n-300)', fontWeight: 600 }}>atau</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--n-100)' }} />
                </div>

                <button
                  onClick={handleGoogle}
                  className="btn-ghost"
                  style={{ width: '100%', border: '1.5px solid var(--n-100)', gap: 10 }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Masuk dengan Google
                </button>
              </>
            )}
          </div>

        </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
