// IndexedDB wrapper for offline entry queue + audio blobs

const DB_NAME = 'aksarantara-offline';
const DB_VER  = 1;
const STORE   = 'queue';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = () => reject(req.error);
  });
}

/** @returns {Promise<{ id: number, entry: object, audioBlob: Blob|null, status: 'pending'|'conflict', createdAt: string }[]>} */
export async function listQueue() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** @param {{ entry: object, audioBlob?: Blob|null }} item */
export async function enqueue(item) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add({ ...item, status: 'pending', createdAt: new Date().toISOString() });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** @param {number} id */
export async function dequeue(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** @param {number} id @param {'pending'|'conflict'} status */
export async function updateStatus(id, status) {
  const db = await openDb();
  const tx  = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  return new Promise((resolve, reject) => {
    const get = store.get(id);
    get.onsuccess = () => {
      const item = { ...get.result, status };
      const put  = store.put(item);
      put.onsuccess = () => resolve();
      put.onerror   = () => reject(put.error);
    };
    get.onerror = () => reject(get.error);
  });
}

/** Attempt to sync all pending items. Returns { synced, failed }. */
export async function syncQueue(supabase, userId) {
  const items = await listQueue();
  const pending = items.filter(i => i.status === 'pending');
  let synced = 0, failed = 0;

  for (const item of pending) {
    try {
      const { error } = await supabase.from('entries').insert({
        ...item.entry,
        contributor_id: userId,
        status: 'pending',
      });
      if (error) throw error;
      await dequeue(item.id);
      synced++;
    } catch {
      await updateStatus(item.id, 'conflict');
      failed++;
    }
  }

  return { synced, failed };
}
