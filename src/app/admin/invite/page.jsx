'use client';

import { useState } from 'react';

export default function InvitePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal mengirim undangan');
      setResult({ ok: true, msg: `Undangan berhasil dikirim ke ${email}` });
      setEmail('');
    } catch (err) {
      setResult({ ok: false, msg: err.message });
    }
    setLoading(false);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
        Undang Moderator
      </h1>
      <p style={{ color: 'var(--n-500)', fontSize: 14, margin: '0 0 32px' }}>
        Moderator dapat menyetujui atau menolak entri yang masuk.
      </p>

      <div style={{ maxWidth: 440, background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-card)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--n-700)', marginBottom: 6 }}>
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="moderator@contoh.com"
              required
              style={{
                width: '100%', height: 48, padding: '0 16px',
                borderRadius: 12, border: '1.5px solid var(--n-100)',
                fontSize: 15, fontFamily: 'var(--font-sans)', outline: 'none',
              }}
            />
          </div>

          {result && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13,
              background: result.ok ? '#f0fdf4' : '#fff1f2',
              color: result.ok ? '#166534' : 'var(--red)',
              border: `1px solid ${result.ok ? '#bbf7d0' : '#fecdd3'}`,
            }}>
              {result.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Mengirim…' : 'Kirim Undangan'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--n-50)', borderRadius: 10, fontSize: 13, color: 'var(--n-500)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--n-700)' }}>Catatan:</strong> Calon moderator akan menerima email dengan tautan untuk mengaktifkan akun mereka. Peran moderator ditambahkan secara otomatis.
        </div>
      </div>
    </div>
  );
}
