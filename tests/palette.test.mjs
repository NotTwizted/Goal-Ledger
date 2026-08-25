// Colours are checked, not eyeballed. Two rules: every subject hue is far
// enough from every other to be told apart, and far enough from the header's
// indigo and amber that neither reads as the other.
import { SUBJECT_ACCENTS } from '../src/lib/palette.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const srgb = v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function oklab(hex) {
  const [r, g, b] = [1, 3, 5].map(i => srgb(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b);
  const m = Math.cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b);
  const s = Math.cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b);
  return [0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
          1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
          0.0259040371*l + 0.7827717662*m - 0.8086757660*s];
}
const dE = (a, b) => {
  const [x, y, z] = oklab(a), [p, q, r] = oklab(b);
  return Math.hypot(x - p, y - q, z - r) * 100;
};

const HEADER = { 'Studies indigo': '#3730a3', 'Goals amber': '#b45309' };
const APART = 12;
const CLEAR = 9;

check('every hue is a six-digit hex', SUBJECT_ACCENTS.every(h => /^#[0-9a-f]{6}$/.test(h)),
  SUBJECT_ACCENTS.join(' '));
check('none is listed twice', new Set(SUBJECT_ACCENTS).size === SUBJECT_ACCENTS.length);

let closest = { d: 999 };
for (let i = 0; i < SUBJECT_ACCENTS.length; i++) {
  for (let j = i + 1; j < SUBJECT_ACCENTS.length; j++) {
    const d = dE(SUBJECT_ACCENTS[i], SUBJECT_ACCENTS[j]);
    if (d < closest.d) closest = { d, a: SUBJECT_ACCENTS[i], b: SUBJECT_ACCENTS[j] };
  }
}
check(`no two subjects are within ${APART}`, closest.d >= APART,
  `closest ${closest.a}/${closest.b} = ${closest.d.toFixed(1)}`);

for (const [name, hex] of Object.entries(HEADER)) {
  const near = SUBJECT_ACCENTS
    .map(h => ({ h, d: dE(h, hex) }))
    .sort((a, b) => a.d - b.d)[0];
  check(`nothing is within ${CLEAR} of the ${name}`, near.d >= CLEAR,
    `${near.h} at ${near.d.toFixed(1)}`);
}

// Deep enough to read as a document rather than a toy, and not so dark that
// two of them become the same near-black.
const light = SUBJECT_ACCENTS.map(h => oklab(h)[0]);
check('none is bright', Math.max(...light) <= 0.60, `lightest ${Math.max(...light).toFixed(2)}`);
check('none is nearly black', Math.min(...light) >= 0.35, `darkest ${Math.min(...light).toFixed(2)}`);
