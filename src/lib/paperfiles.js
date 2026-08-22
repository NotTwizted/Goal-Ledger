// The uploaded paper itself, kept so a question can be looked at again.
//
// It stays on the device that uploaded it, in IndexedDB. The account's row
// holds what was read off the paper — questions, marks, topics — and that is
// small enough to travel. A paper is eight megabytes, which is not: putting it
// in the row would make every page load carry it, and a store bucket would
// mean another trip through a console to set up. So the marks sync and the
// picture does not, and a device that never saw the file says so plainly.

const DB_NAME = 'goal-ledger-papers';
const STORE = 'files';

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
// the picture is a convenience. Every failure is swallowed and reported as
// "not on this device", which is what it amounts to.
export async function savePaperFile(id, file) {
  try {
    await run('readwrite', store => store.put({
      id,
      blob: file,
      name: file.name,
      type: file.type,
      savedAt: Date.now(),
    }));
    await prune();
    return true;
  } catch (e) {
    return false;
  }
}

export async function getPaperFile(id) {
  try {
    const row = await run('readonly', store => store.get(id));
    return row?.blob || null;
  } catch (e) {
    return null;
  }
}

export async function deletePaperFile(id) {
  try {
    await run('readwrite', store => store.delete(id));
  } catch (e) {
    // Already gone, or never here.
  }
}

async function prune() {
  try {
    const rows = await run('readonly', store => store.getAll());
    if (!Array.isArray(rows) || rows.length <= KEEP) return;
    const oldest = rows.sort((a, b) => a.savedAt - b.savedAt).slice(0, rows.length - KEEP);
    await Promise.all(oldest.map(row => deletePaperFile(row.id)));
  } catch (e) {
    // Storage is full or unavailable; the newest paper is still saved.
  }
}
