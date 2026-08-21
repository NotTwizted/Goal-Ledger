// The marker's own total is the one thing on a paper that can check the rest.
// These cover the arithmetic around it, which is what decides whether a second
// reading is asked for and whether it is trusted when it comes back.
import { readFileSync } from 'node:fs';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const src = readFileSync(new URL('../src/lib/uploads.js', import.meta.url), 'utf8');

check('the reader is told never to guess a mark',
  /never 0 and never a guess/.test(src));
check('an unreadable mark comes back null, not zero',
  /give null for that question/.test(src));
check('the printed allocations are handed over rather than re-read',
  /Use them for "marksAvailable" rather than reading them off the page again/.test(src));
check('the marker\'s total is asked for separately from any sum',
  /Do not put your own sum there/.test(src));
check('a mismatch triggers a second reading',
  /scoredTotal\(questions\) !== target/.test(src));
check('which thinks harder than the first',
  /readParts\(parts, recheck, 8000, onProgress, 'high'\)/.test(src));
check('and is only taken if it reconciles',
  /scoredTotal\(reread\) === target/.test(src));
check('an unreconciled paper says so',
  /totalMismatch: \{ reported: target, read: scoredTotal\(questions\) \}/.test(src));
check('the parts are prepared once, not per pass',
  (src.match(/await prepareParts\(file\)/g) || []).length === 3,
  `${(src.match(/await prepareParts\(file\)/g) || []).length} calls`);

const api = readFileSync(new URL('../api/extract.js', import.meta.url), 'utf8');
check('the server honours a request to think harder',
  /thinkingLevel: body\?\.thinking === 'high' \? 'high' : 'low'/.test(api));

const page = readFileSync(new URL('../src/pages/PastPaperPage.jsx', import.meta.url), 'utf8');
check('a paper whose marks do not add up warns on its face',
  /These marks may not be right/.test(page));
