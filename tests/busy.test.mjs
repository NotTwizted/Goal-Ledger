// A reader that is merely busy must not be mistaken for one that cannot read
// the paper — the first wants a minute, the second wants a different file.
// Getting this wrong files a paper with no marks on it, to be deleted and
// uploaded again, when waiting was the whole of the fix.
import { readFileSync } from 'node:fs';
import { isBusy } from '../src/lib/uploads.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const BUSY = [
  'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
  'The model is overloaded. Please try again.',
  'Resource has been exhausted (e.g. check quota).',
  'Too Many Requests',
  'Service temporarily unavailable',
];

const NOT_BUSY = [
  'API key not valid. Please pass a valid API key.',
  'No questions could be read from that file',
  'That file is too large to send. Try a smaller PDF, or split it.',
  'The model returned nothing (SAFETY). Try a clearer scan.',
  'No API key. Add one under the three-dot menu — a free Google AI Studio key works.',
  '',
];

BUSY.forEach(m => check(`busy: "${m.slice(0, 44)}…"`, isBusy(m)));
NOT_BUSY.forEach(m => check(`not busy: "${(m || '(nothing)').slice(0, 44)}…"`, !isBusy(m)));

// And the server waits it out before the browser ever hears about it.
const api = readFileSync(new URL('../api/extract.js', import.meta.url), 'utf8');
check('a busy status is retried, not returned', /BUSY\.has\(upstream\.status\)/.test(api));
check('with a wait between attempts', /WAITS = \[\d+, \d+\]/.test(api));
check('503 counts as busy', /BUSY = new Set\(\[[^\]]*503/.test(api));
check('429 counts as busy', /BUSY = new Set\(\[[^\]]*429/.test(api));
