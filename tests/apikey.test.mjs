import { providerOf, looksLikeApiKey } from '../src/lib/apikey.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

// Shapes only: the characters are made up, the prefixes and lengths are real.
const CASES = [
  ['AQ.Ab8RN6' + 'x'.repeat(40), 'gemini', true, 'the key AI Studio issues now'],
  ['AIza' + 'B'.repeat(35), 'gemini', true, 'the long-standing Google key'],
  ['sk-ant-api03-' + 'c'.repeat(40), 'anthropic', true, 'an Anthropic key'],
  ['AQ.short', 'gemini', false, 'too short to be a key'],
  ['hello world', null, false, 'not a key at all'],
  ['', null, false, 'nothing pasted'],
];

for (const [key, provider, valid, label] of CASES) {
  check(label, providerOf(key) === provider && looksLikeApiKey(key) === valid,
    `${providerOf(key)} / ${looksLikeApiKey(key)}`);
}
