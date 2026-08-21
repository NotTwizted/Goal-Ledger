// What is stored in the account's single row.
//
// The row has one jsonb column, and originally it held the subject array
// directly. It now holds an object so the reader key can travel with it, which
// is what lets a key added on one device work on the next. Rows written before
// that are still plain arrays and are read as such, so nothing needed
// migrating and no SQL had to be run.

export function parseLedger(stored) {
  if (Array.isArray(stored)) return { subjects: stored, readerKey: '' };
  if (stored && typeof stored === 'object') {
    return {
      subjects: Array.isArray(stored.items) ? stored.items : [],
      readerKey: typeof stored.readerKey === 'string' ? stored.readerKey : '',
    };
  }
  return { subjects: [], readerKey: '' };
}

export function serialiseLedger(subjects, readerKey) {
  return { items: subjects, readerKey: readerKey || '' };
}
