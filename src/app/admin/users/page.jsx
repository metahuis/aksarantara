'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import { Dialog, DialogContent, DialogFooter, DialogClose } from '@/components/ui/Dialog';

const ROLES = ['contributor', 'moderator', 'superadmin'];

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [search, setSearch]     = useState('');
  const [addForm, setAddForm]   = useState({ email: '', role: 'contributor' });
  const [addLoading, setAddLoading] = useState(false);
  const [removeRoleFor, setRemoveRoleFor] = useState(null); // { user, currentRole } | null

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, created_at, user_roles(role)')
      .order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateRole(userId, role) {
    setActing(userId);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role: role || null }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, user_roles: role ? [{ role }] : [] } : u
      ));
      toast.success(role ? `Peran diubah ke ${role}` : 'Peran dihapus');
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Gagal mengubah peran.');
    }
    setActing(null);
  }

  function onRoleSelect(user, newRole) {
    const currentRole = user.user_roles?.[0]?.role;
    // Destructive path: removing an existing role → confirm via Dialog.
    if (currentRole && !newRole) {
      setRemoveRoleFor({ user, currentRole });
      return;
    }
    updateRole(user.id, newRole);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAddLoading(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success(`Undangan dikirim ke ${addForm.email}`);
      setAddForm({ email: '', role: 'contributor' });
      load();
    } else {
      toast.error(data.error || 'Gagal mengundang pengguna.');
    }
    setAddLoading(false);
  }

  const filtered = users.filter(u =>
    !search ||
    (u.username  ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Pengguna</h1>
          <p className="admin-page-subtitle">{users.length} akun terdaftar</p>
        </div>
        <button
          onClick={() => setShowAdd(o => !o)}
          className="btn-primary"
        >
          + Tambah Pengguna
        </button>
      </header>

      {showAdd && (
        <section className="admin-panel">
          <h3 className="admin-panel-title">Undang Pengguna Baru</h3>
          <form onSubmit={handleAdd} className="admin-form-row">
            <div className="admin-form-field admin-form-field-grow">
              <label className="admin-label">Email</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="pengguna@contoh.com"
                className="admin-input"
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Peran</label>
              <select
                value={addForm.role}
                onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                className="admin-select-native"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="btn-primary sm"
            >
              {addLoading ? 'Mengirim…' : 'Kirim Undangan'}
            </button>
          </form>
        </section>
      )}

      <div className="admin-search-bar">
        <input
          placeholder="Cari username atau nama…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="admin-input admin-search"
        />
      </div>

      <section className="admin-panel admin-panel-flat">
        {loading ? (
          <div className="admin-empty">Memuat…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                {['Pengguna', 'Peran', 'Bergabung', 'Ubah Peran'].map(h => (
                  <th key={h} className="admin-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const role = u.user_roles?.[0]?.role ?? null;
                const initial = (u.display_name || u.username || '?').charAt(0).toUpperCase();
                return (
                  <tr key={u.id} className="admin-tr" data-acting={acting === u.id ? 'true' : undefined}>
                    <td className="admin-td">
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">{initial}</div>
                        <div>
                          <div className="admin-user-name">{u.display_name || u.username || '—'}</div>
                          {u.username && <div className="admin-user-handle">@{u.username}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="admin-td">
                      {role
                        ? <span className="admin-role-badge" data-role={role}>{role}</span>
                        : <span className="admin-role-none">publik</span>
                      }
                    </td>
                    <td className="admin-td admin-td-muted">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="admin-td">
                      <select
                        value={role ?? ''}
                        disabled={acting === u.id}
                        onChange={e => onRoleSelect(u, e.target.value)}
                        className="admin-select-native sm"
                      >
                        <option value="">— tanpa peran —</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty">Tidak ada pengguna.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      <Dialog
        open={!!removeRoleFor}
        onOpenChange={(o) => { if (!o) setRemoveRoleFor(null); }}
      >
        <DialogContent
          title="Hapus peran?"
          description={
            removeRoleFor
              ? `Pengguna ${removeRoleFor.user.display_name || removeRoleFor.user.username || 'tanpa nama'} akan kehilangan peran ${removeRoleFor.currentRole}.`
              : undefined
          }
        >
          <DialogFooter>
            <DialogClose asChild>
              <button className="btn-ghost sm">Batal</button>
            </DialogClose>
            <button
              className="btn-primary sm akr-btn-destructive"
              onClick={() => {
                const u = removeRoleFor.user;
                setRemoveRoleFor(null);
                updateRole(u.id, '');
              }}
            >
              Hapus peran
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
