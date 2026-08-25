// The uploaded paper itself, kept so a question can be looked at again.
//
// Two places, and the order matters. IndexedDB on this device is written
// first, because it is instant and works with no signal; the account's storage
// bucket is written after, in the background, because eight megabytes is not
// something to make anybody wait for. Reading goes the other way round — this
// device first, then fetched once and cached if the paper was uploaded from
// somewhere else.
//
// A paper is stored under the reader's own id, and the bucket's policies allow
// nobody else near it.

import { isSupabaseConfigured, supabase } from '../supabase';

const BUCKET = 'papers';
const remotePath = (userId, id) => `${userId}/${id}.pdf`;

const DB_NAME = 'goal-ledger-papers';
const STORE = 'files';

// A signed-out session works exactly like a signed-in one and leaves exactly
// nothing behind, so its papers are held in a plain Map instead of the
// database. Uploading, reading a question, seeing the page it was printed on —
// all of it works until the tab closes, and then there is nothing to clean up.
let ephemeral = false;
const memory = new Map();

export function setEphemeralPapers(on) {
  ephemeral = Boolean(on);
  if (!on) memory.clear();
}

// Enough for a term's papers. Past this the oldest goes, since the marks —
// which are what matter — are on the account either way.
const KEEP = 25;

let opening = null;

function open() {
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser has no storage for papers.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('savedAt', 'savedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open storage.'));
  }).catch(e => { opening = null; throw e; });
  return opening;
}

const run = (mode, fn) => open().then(db => new Promise((resolve, reject) => {
  const tx = db.transaction(STORE, mode);
  const request = fn(tx.objectStore(STORE));
  tx.onerror = () => reject(tx.error || new Error('Storage failed.'));
  if (request) {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  } else {
    tx.oncomplete = () => resolve();
  }
}));

// Nothing here may take an upload down with it: the marks are the point and
// the picture is a convenience. Every failure is swallowed, and a picture that
// cannot be found says so rather than showing a broken frame.
async function putLocal(id, file) {
  try {
    await run('readwrite', store => store.put({
      id, blob: file, name: file.name, type: file.type, savedAt: Date.now(),
    }));
    await prune();
    return true;
  } catch (e) {
    return false;
  }
}

const getLocal = (id) => run('readonly', store => store.get(id))
  .then(row => row?.blob || null)
  .catch(() => null);

// Saved here at once, sent up afterwards. The upload is not waited for: the
// paper is already readable on this device, and a slow line should not hold up
// the page that is about to open.
export async function savePaperFile(id, file, userId) {
  if (ephemeral) {
    memory.set(id, file);
    return true;
  }
  const saved = await putLocal(id, file);
  if (userId && isSupabaseConfigured) {
    supabase.storage.from(BUCKET)
      .upload(remotePath(userId, id), file, { upsert: true, contentType: file.type || 'application/pdf' })
      .catch(() => {});
  }
  return saved;
}

export async function getPaperFile(id, userId) {
  if (ephemeral) return memory.get(id) || null;
  const local = await getLocal(id);
  if (local) return local;
  if (!userId || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(remotePath(userId, id));
    if (error || !data) return null;
    // Kept here now, so opening a second question on the same paper is instant.
    const file = new File([data], `${id}.pdf`, { type: data.type || 'application/pdf' });
    putLocal(id, file);
    return file;
  } catch (e) {
    return null;
  }
}

export async function deletePaperFile(id, userId) {
  if (ephemeral) {
    memory.delete(id);
    return;
  }
  try {
    await run('readwrite', store => store.delete(id));
  } catch (e) {
    // Already gone, or never here.
  }
  if (userId && isSupabaseConfigured) {
    try {
      await supabase.storage.from(BUCKET).remove([remotePath(userId, id)]);
    } catch (e) {
      // The row is what matters; an orphaned file costs a little space.
    }
  }
}

async function prune() {
  try {
    const rows = await run('readonly', store => store.getAll());
    if (!Array.isArray(rows) || rows.length <= KEEP) return;
    // Only the copy on this device. The account keeps its papers however long
    // this browser decides to hold them, and one dropped here is fetched again
    // the next time it is asked for.
    const oldest = rows.sort((a, b) => a.savedAt - b.savedAt).slice(0, rows.length - KEEP);
    await Promise.all(oldest.map(row => run('readwrite', store => store.delete(row.id))));
  } catch (e) {
    // Storage is full or unavailable; the newest paper is still saved.
  }
}
