'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Topbar from '../../components/Topbar.jsx';
import Footer from '../../components/Footer.jsx';
import Select from '../../components/Select.jsx';
import Icon from '../../components/Icon.jsx';
import ConflictModal from '../../components/offline/ConflictModal.jsx';
import { createClient } from '../../lib/supabase.js';
import { getUserEntries, updateEntry, deleteEntry } from '../../lib/db/entries.js';
import { LANGUAGES } from '../../data.js';
import { listQueue, dequeue, syncQueue } from '../../lib/offlineStore.js';

const ENTRY_TYPES = ['word', 'phrase', 'peribahasa', 'pantun', 'story', 'song', 'mantra'];
const POS_TYPES = [
  { value: 'noun', label: 'Nomina (Kata Benda)' },
  { value: 'verb', label: 'Verba (Kata Kerja)' },
  { value: 'adjective', label: 'Adjektiva (Kata Sifat)' },
  { value: 'numeral', label: 'Numeral (Angka)' },
  { value: 'other', label: 'Lainnya' },
];

function EntryForm({ entry, onSave, onCancel, supabase, userId }) {
  const [form, setForm] = useState(entry || {
    lang: '', type: '', primary_text: '', gloss_id: '', gloss: '',
    phonetic: '', dialect: '', contextual_meaning: '', usage_example: '', pos: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isStory = form.type === 'story' || form.type === 'song';
  const lang = LANGUAGES.find(l => l.id === form.lang);
  const canSave = form.lang && form.type && form.primary_text && form.gloss_id && (isStory ? form.primary_text : true) && form.dialect;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      if (entry?.id) {
        await updateEntry(supabase, entry.id, {
          lang: form.lang,
          type: form.type,
          primary_text: form.primary_text,
          gloss_id: form.gloss_id,
          gloss: form.gloss || null,
          phonetic: form.phonetic || null,
          dialect: form.dialect,
          contextual_meaning: form.contextual_meaning || null,
          usage_example: form.usage_example || null,
          pos: form.type === 'word' ? form.pos : null,
        });
      } else {
        await supabase.from('entries').insert({
          lang: form.lang,
          type: form.type,
          primary_text: form.primary_text,
          gloss_id: form.gloss_id,
          gloss: form.gloss || null,
          phonetic: form.phonetic || null,
          dialect: form.dialect,
          contextual_meaning: form.contextual_meaning || null,
          usage_example: form.usage_example || null,
          pos: form.type === 'word' ? form.pos : null,
          contributor_id: userId,
          status: 'pending',
        });
      }
      onSave();
    } catch (err) {
      setError(err.message || 'Error saving entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <div style={{ background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.3)', borderRadius: 'var(--radius)', padding: 12, color: 'var(--red)', fontSize: 13 }}>{error}</div>}

      <div>
        <div className="cf-label">Bahasa <span style={{ color: 'var(--red)' }}>*</span></div>
        <Select
          value={form.lang}
          onChange={(v) => setForm(f => ({ ...f, lang: v, dialect: '' }))}
          options={LANGUAGES.map(l => ({ value: l.id, label: l.name }))}
          placeholder="Pilih bahasa"
        />
      </div>

      <div>
        <div className="cf-label">Tipe <span style={{ color: 'var(--red)' }}>*</span></div>
        <Select
          value={form.type}
          onChange={(v) => setForm(f => ({ ...f, type: v, pos: '' }))}
          options={ENTRY_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          placeholder="Pilih tipe"
        />
      </div>

      {form.type === 'word' && (
        <div>
          <div className="cf-label">Bagian Tutur</div>
          <Select
            value={form.pos || ''}
            onChange={(v) => setForm(f => ({ ...f, pos: v }))}
            options={POS_TYPES}
            placeholder="Pilih (opsional)"
          />
        </div>
      )}

      <div>
        <div className="cf-label">{isStory ? 'Teks Lengkap' : 'Kata'} <span style={{ color: 'var(--red)' }}>*</span></div>
        {isStory ? (
          <textarea
            className="cf-textarea"
            placeholder={isStory ? 'Cerita atau lagu lengkap...' : ''}
            value={form.primary_text}
            onChange={(e) => setForm(f => ({ ...f, primary_text: e.target.value }))}
            rows={6}
          />
        ) : (
          <input
            type="text"
            className="cf-input"
            placeholder="Kata dalam bahasa daerah"
            value={form.primary_text}
            onChange={(e) => setForm(f => ({ ...f, primary_text: e.target.value }))}
          />
        )}
      </div>

      <div>
        <div className="cf-label">Arti (Indonesia) <span style={{ color: 'var(--red)' }}>*</span></div>
        <input
          type="text"
          className="cf-input"
          placeholder="Arti dalam bahasa Indonesia"
          value={form.gloss_id}
          onChange={(e) => setForm(f => ({ ...f, gloss_id: e.target.value }))}
        />
      </div>

      <div>
        <div className="cf-label">Arti (Inggris)</div>
        <textarea
          className="cf-textarea"
          placeholder="Arti dalam bahasa Inggris (opsional)"
          value={form.gloss || ''}
          onChange={(e) => setForm(f => ({ ...f, gloss: e.target.value }))}
          rows={2}
        />
      </div>

      {form.type === 'word' && (
        <div>
          <div className="cf-label">Cara Baca</div>
          <input
            type="text"
            className="cf-input"
            placeholder="IPA atau panduan pelafalan"
            value={form.phonetic || ''}
            onChange={(e) => setForm(f => ({ ...f, phonetic: e.target.value }))}
          />
        </div>
      )}

      {lang && (
        <div>
          <div className="cf-label">Dialek <span style={{ color: 'var(--red)' }}>*</span></div>
          <Select
            value={form.dialect || ''}
            onChange={(v) => setForm(f => ({ ...f, dialect: v }))}
            options={(lang.dialects || []).map(d => ({ value: d, label: d }))}
            placeholder="Pilih dialek"
          />
        </div>
      )}

      <div>
        <div className="cf-label">Arti Kontekstual</div>
        <textarea
          className="cf-textarea"
          placeholder="Penjelasan lebih detail tentang arti (opsional)"
          value={form.contextual_meaning || ''}
          onChange={(e) => setForm(f => ({ ...f, contextual_meaning: e.target.value }))}
          rows={2}
        />
      </div>

      <div>
        <div className="cf-label">Contoh Penggunaan</div>
        <textarea
          className="cf-textarea"
          placeholder="Contoh kalimat atau cara penggunaan (opsional)"
          value={form.usage_example || ''}
          onChange={(e) => setForm(f => ({ ...f, usage_example: e.target.value }))}
          rows={2}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={onCancel}
          style={{ background: 'transparent', border: '1px solid var(--n-200)', borderRadius: 'var(--radius)', padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{ background: canSave ? 'var(--green)' : 'var(--n-200)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '10px 16px', cursor: canSave ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13 }}
        >
          {saving ? 'Menyimpan...' : entry ? 'Perbarui' : 'Tambah'}
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [activeStatusFilter, setActiveStatusFilter] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [supabase, setSupabase] = useState(null);
  const [queueItems, setQueueItems] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [conflictItem, setConflictItem] = useState(null);

  useEffect(() => {
    const init = async () => {
      const sb = createClient();
      setSupabase(sb);

      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        router.replace(`/login?next=/dashboard`);
        return;
      }

      setUserId(user.id);

      const { data: profileData } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      const entriesData = await getUserEntries(sb, user.id);
      setEntries(entriesData);

      const statsByStatus = {
        total: entriesData.length,
        approved: entriesData.filter(e => e.status === 'approved').length,
        pending: entriesData.filter(e => e.status === 'pending').length,
        rejected: entriesData.filter(e => e.status === 'rejected').length,
      };
      setStats(statsByStatus);
      setLoading(false);

      // Load offline queue
      try {
        const q = await listQueue();
        setQueueItems(q);
        window.dispatchEvent(new CustomEvent('aksarantara:queue', { detail: { count: q.length } }));
      } catch {
        // IndexedDB may not be available in SSR-like environments
      }
    };

    init();
  }, [router]);

  async function handleSync() {
    if (!supabase || !userId || syncing) return;
    setSyncing(true);
    try {
      const { synced } = await syncQueue(supabase, userId);
      const q = await listQueue();
      setQueueItems(q);
      window.dispatchEvent(new CustomEvent('aksarantara:queue', { detail: { count: q.length } }));
      if (synced > 0) setLastSync(new Date());
    } catch {}
    setSyncing(false);
  }

  async function handleConflictResolve(choice) {
    if (!conflictItem) return;
    if (choice === 'local') {
      await dequeue(conflictItem.id);
    } else {
      await dequeue(conflictItem.id);
    }
    setConflictItem(null);
    const q = await listQueue();
    setQueueItems(q);
    window.dispatchEvent(new CustomEvent('aksarantara:queue', { detail: { count: q.length } }));
  }

  const filteredEntries = activeStatusFilter
    ? entries.filter(e => e.status === activeStatusFilter)
    : entries;

  const handleDelete = async (entryId) => {
    if (!window.confirm('Hapus entri ini?')) return;
    try {
      await deleteEntry(supabase, entryId);
      setEntries(e => e.filter(en => en.id !== entryId));
    } catch (err) {
      alert('Error menghapus entri');
    }
  };

  const handleSaveForm = async () => {
    if (supabase && userId) {
      const entriesData = await getUserEntries(supabase, userId);
      setEntries(entriesData);
      setSheetOpen(false);
      setEditingEntry(null);
    }
  };

  if (loading) {
    return (
      <>
        <Topbar />
        <div className="db-layout">
          <div className="db-profile-card">
            <div className="db-profile-head" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div className="sk sk-circle" style={{ width: 80, height: 80 }} />
              <div className="sk" style={{ width: 140, height: 20 }} />
              <div className="sk" style={{ width: 100, height: 14 }} />
            </div>
            <div className="sk" style={{ height: 40, borderRadius: 'var(--radius)', margin: '16px 0' }} />
            <div className="db-stats">
              {[0,1,2,3].map(i => (
                <div key={i} className="db-stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div className="sk" style={{ width: 32, height: 26 }} />
                  <div className="sk" style={{ width: 52, height: 12 }} />
                </div>
              ))}
            </div>
          </div>
          <div className="db-entries-panel">
            <div className="db-entries-head">
              <div className="sk" style={{ width: 120, height: 20 }} />
              <div className="sk" style={{ width: 110, height: 36, borderRadius: 'var(--radius)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[80,90,80,72].map((w,i) => <div key={i} className="sk" style={{ width: w, height: 32, borderRadius: 999 }} />)}
            </div>
            {[0,1,2,3,4].map(i => (
              <div key={i} className="db-entry-row">
                <div className="db-entry-content">
                  <div className="sk" style={{ width: '55%', height: 16, marginBottom: 6 }} />
                  <div className="sk" style={{ width: '38%', height: 12 }} />
                </div>
                <div className="sk" style={{ width: 64, height: 24, borderRadius: 999 }} />
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!profile?.username) {
    return (
      <>
        <Topbar />
        <div className="db-layout">
          <div className="db-profile-card">
            <div className="db-warning">
              ⚠️ Lengkapi profil Anda terlebih dahulu untuk mulai berkontribusi.
            </div>
            <Link href="/settings" className="db-add-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Lengkapi Profil
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Topbar />
      <div className="db-layout">
        {/* Profile Card */}
        <div className="db-profile-card">
          <div className="db-profile-head">
            <div className="db-profile-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name || profile.username} />
              ) : (
                <div style={{ background: 'var(--green)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                  {(profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="db-profile-name">{profile?.display_name || profile?.username}</div>
            <div className="db-profile-username">@{profile?.username}</div>
            {profile?.bio && <div className="db-profile-bio">{profile.bio}</div>}
          </div>

          <Link href="/settings" className="db-add-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            Edit Profil
          </Link>

          <div className="db-stats">
            <div className="db-stat">
              <div className="db-stat-num">{stats.total}</div>
              <div className="db-stat-label">Total</div>
            </div>
            <div className="db-stat">
              <div className="db-stat-num">{stats.approved}</div>
              <div className="db-stat-label">Disetujui</div>
            </div>
            <div className="db-stat">
              <div className="db-stat-num">{stats.pending}</div>
              <div className="db-stat-label">Menunggu</div>
            </div>
            <div className="db-stat">
              <div className="db-stat-num">{stats.rejected}</div>
              <div className="db-stat-label">Ditolak</div>
            </div>
          </div>
        </div>

        {/* ── Offline Sync Queue ─────────────────────────── */}
        {queueItems.length > 0 && (
          <div className="db-entries-panel" style={{ marginBottom: 0 }}>
            <div className="db-entries-head">
              <div className="db-entries-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Antrian Offline</span>
                <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--indigo)', borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                  {queueItems.length}
                </span>
              </div>
              <button
                className="db-add-btn"
                onClick={handleSync}
                disabled={syncing || !navigator.onLine}
                style={{ opacity: !navigator.onLine ? 0.5 : 1 }}
              >
                {syncing ? 'Menyinkronkan…' : 'Sinkronkan sekarang'}
              </button>
            </div>

            {lastSync && (
              <div style={{ fontSize: 12, color: 'var(--n-500)', padding: '0 0 10px', fontFamily: 'var(--font-mono)' }}>
                Terakhir sinkron: {lastSync.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {queueItems.map(item => (
                <div
                  key={item.id}
                  className={`queue-row${item.status === 'conflict' ? ' queue-row--conflict' : ''}`}
                >
                  <div className="queue-row-icon">
                    {item.status === 'conflict' ? '⚠' : '↑'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="queue-row-word">{item.entry?.primary_text || '—'}</div>
                    <div className="queue-row-lang">
                      {LANGUAGES.find(l => l.id === item.entry?.lang)?.name || item.entry?.lang}
                    </div>
                  </div>
                  <span className={`queue-row-badge ${item.status === 'conflict' ? 'queue-row-badge--conflict' : 'queue-row-badge--queued'}`}>
                    {item.status === 'conflict' ? 'Konflik' : 'Antri'}
                  </span>
                  {item.status === 'conflict' ? (
                    <button
                      className="queue-row-retry"
                      onClick={() => setConflictItem(item)}
                    >
                      Selesaikan
                    </button>
                  ) : (
                    <button
                      className="queue-row-retry"
                      onClick={handleSync}
                      disabled={syncing}
                    >
                      ⟳
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 10, lineHeight: 1.5 }}>
              Akan otomatis disinkronkan saat koneksi tersedia.
            </div>
          </div>
        )}

        {/* Entries Panel */}
        <div className="db-entries-panel">
          <div className="db-entries-head">
            <div className="db-entries-title">Entri Saya</div>
            <button className="db-add-btn" onClick={() => { setEditingEntry(null); setSheetOpen(true); }}>
              + Tambah Entri
            </button>
          </div>

          <div className="db-filters">
            <button
              className={`chip${activeStatusFilter === '' ? ' active' : ''}`}
              onClick={() => setActiveStatusFilter('')}
            >
              Semua ({stats.total})
            </button>
            <button
              className={`chip${activeStatusFilter === 'pending' ? ' active' : ''}`}
              onClick={() => setActiveStatusFilter('pending')}
            >
              Menunggu ({stats.pending})
            </button>
            <button
              className={`chip${activeStatusFilter === 'approved' ? ' active' : ''}`}
              onClick={() => setActiveStatusFilter('approved')}
            >
              Disetujui ({stats.approved})
            </button>
            <button
              className={`chip${activeStatusFilter === 'rejected' ? ' active' : ''}`}
              onClick={() => setActiveStatusFilter('rejected')}
            >
              Ditolak ({stats.rejected})
            </button>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="db-empty">
              {activeStatusFilter ? 'Tidak ada entri dengan status ini' : 'Belum ada entri. Mulai tambah!'}
            </div>
          ) : (
            filteredEntries.map(e => {
              const lang = LANGUAGES.find(l => l.id === e.lang);
              return (
                <div key={e.id} className="db-entry-row">
                  <div className="db-entry-content">
                    <div className="db-entry-primary">{e.primary_text}</div>
                    <div className="db-entry-gloss">{e.gloss_id}</div>
                    <div className="db-entry-meta">
                      <span>{lang?.name}</span>
                      <span>·</span>
                      <span>{e.type}</span>
                    </div>
                  </div>
                  <div className={`db-status${e.status === 'approved' ? ' data-s="approved"' : e.status === 'pending' ? ' data-s="pending"' : ' data-s="rejected"'}`} style={{ background: e.status === 'approved' ? 'rgba(88, 204, 2, 0.12)' : e.status === 'pending' ? 'rgba(255, 180, 0, 0.12)' : 'rgba(255, 75, 75, 0.12)', color: e.status === 'approved' ? 'var(--green-d)' : e.status === 'pending' ? '#b08000' : 'var(--red)' }}>
                    {e.status === 'approved' ? 'Disetujui' : e.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                  </div>
                  <div className="db-actions">
                    <button
                      className="db-action-btn"
                      onClick={() => { setEditingEntry(e); setSheetOpen(true); }}
                      title="Edit"
                    >
                      <Icon name="search" size={14} />
                    </button>
                    <button
                      className="db-action-btn"
                      onClick={() => handleDelete(e.id)}
                      title="Hapus"
                      style={{ color: 'var(--red)' }}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="db-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSheetOpen(false); setEditingEntry(null); }}
            />
            <motion.div
              className="db-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="db-sheet-content">
                <div className="db-sheet-head">
                  <span>{editingEntry ? 'Edit Entri' : 'Tambah Entri Baru'}</span>
                  <button className="db-sheet-close" onClick={() => { setSheetOpen(false); setEditingEntry(null); }}>
                    <Icon name="close" size={18} />
                  </button>
                </div>
                {supabase && userId && (
                  <EntryForm
                    entry={editingEntry}
                    onSave={handleSaveForm}
                    onCancel={() => { setSheetOpen(false); setEditingEntry(null); }}
                    supabase={supabase}
                    userId={userId}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConflictModal
        open={!!conflictItem}
        item={conflictItem}
        onResolve={handleConflictResolve}
        onClose={() => setConflictItem(null)}
      />

      <Footer />
    </>
  );
}
