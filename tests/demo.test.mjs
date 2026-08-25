// Using the app without an account.
//
// It is not a cut-down version and not a tour: the same ledger and the same
// pages, starting empty the way a new account does. The only difference is
// that nothing is written down — so these checks are about what must *not*
// happen, which is the half that rots quietly if nobody watches it.
import { readFileSync } from 'node:fs';
import { setEphemeralPapers, savePaperFile, getPaperFile, deletePaperFile } from '../src/lib/paperfiles.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const appSrc = read('../src/App.jsx');
const paperSrc = read('../src/pages/PaperPage.jsx');
const filesSrc = read('../src/lib/paperfiles.js');

// ── It starts with nothing, like a new account ───────────────────────────
check('a session without an account starts empty',
  /setSubjects\(\[\]\);\s*\n\s*setLoaded\(true\);/.test(appSrc));
check('and nothing seeds it with example data',
  !/buildDemoLedger|loadDemoLedger|saveDemoLedger/.test(appSrc));

// ── Saving reaches nothing ───────────────────────────────────────────────
// Inside the one function that writes, specifically — the table is named
// earlier in the file by the code that reads it, so position alone proves
// nothing.
const persist = appSrc.slice(appSrc.indexOf('const persist = useCallback'),
                             appSrc.indexOf('const updateSubjects'));
check('the guard sits inside persist, before the upsert',
  persist.indexOf('if (demo) return;') !== -1
    && persist.indexOf('if (demo) return;') < persist.indexOf('upsert'),
  `guard at ${persist.indexOf('if (demo) return;')}, upsert at ${persist.indexOf('upsert')}`);

check('the old browser copy is cleared rather than left lying about',
  /localStorage\.removeItem\('study-tracker:demo'\)/.test(appSrc));
check('and nothing writes a new one',
  !/setItem\('study-tracker:demo'/.test(appSrc));

// ── A paper uploaded in it works, and outlives nothing ───────────────────
check('uploading is not skipped — it works here like anywhere',
  /await savePaperFile\(record\.id, files\[i\], userId\);/.test(paperSrc));
check('the session store is switched on and off with the mode',
  /setEphemeralPapers\(demo\);/.test(appSrc));
check('turning it off empties it',
  /if \(!on\) memory\.clear\(\);/.test(filesSrc));

const file = new File([new Uint8Array([1, 2, 3])], 'paper.pdf', { type: 'application/pdf' });

setEphemeralPapers(true);
check('a paper saved without an account comes back',
  (await savePaperFile('p1', file, null)) === true && (await getPaperFile('p1', null)) === file);
check('and deleting it removes it', await (async () => {
  await deletePaperFile('p1', null);
  return (await getPaperFile('p1', null)) === null;
})());

await savePaperFile('p2', file, null);
setEphemeralPapers(false);
check('leaving the session takes its papers with it',
  await (async () => {
    setEphemeralPapers(true);
    const gone = (await getPaperFile('p2', null)) === null;
    setEphemeralPapers(false);
    return gone;
  })());
