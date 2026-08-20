// Each subject owns a hue, and everything belonging to it — its card, its
// progress bars, its papers, its topic cards — is drawn in that hue.
//
// The eight slots are the reference categorical order, taken as published
// rather than re-mixed by eye. They pass the lightness band, chroma floor,
// colour-vision separation (worst adjacent ΔE 9.1 protan) and normal-vision
// separation (19.6). Three of them fall below 3:1 against the page, which is
// allowed only where a visible label carries the meaning instead — every
// subject is captioned with its name everywhere it appears, so hue is never
// doing the identifying on its own.
const SUBJECT_ACCENTS = [
  '#a20081', // magenta
  '#00c756', // green
  '#0094ff', // blue
  '#346d26', // moss
  '#f771a0', // pink
  '#9657e8', // purple
  '#c5a300', // gold
  '#009690', // teal
  '#b093e5', // lavender
];

// The header's two buttons keep the indigo and amber they have always had.
// The subject hues above were then chosen around them: every one sits at
// least 20 in OKLab from both, five times the separation of the orange that
// used to collide with the Goals button, while staying at least 15 from each
// other so no two subjects look alike either.
const CATEGORY_ACCENTS = {
  study: '#3730a3',
  general: '#b45309',
};

function accentCounts(subjects) {
  const counts = new Map(SUBJECT_ACCENTS.map(hex => [hex, 0]));
  subjects.forEach(s => {
    if (counts.has(s.accent)) counts.set(s.accent, counts.get(s.accent) + 1);
  });
  return counts;
}

// The first unused hue, or the least used one once every hue is taken.
function freeAccent(counts) {
  const unused = SUBJECT_ACCENTS.find(hex => counts.get(hex) === 0);
  if (unused) return unused;
  return SUBJECT_ACCENTS.reduce((best, hex) => (counts.get(hex) < counts.get(best) ? hex : best), SUBJECT_ACCENTS[0]);
}

// A subject's colour is stored on the subject itself, so removing one never
// repaints the others. Anything without one yet shows the first slot until the
// backfill below has run and given it a colour of its own.
export function subjectAccent(subject) {
  if (subject && typeof subject.accent === 'string' && subject.accent.startsWith('#')) return subject.accent;
  return SUBJECT_ACCENTS[0];
}

export { SUBJECT_ACCENTS };

export function nextSubjectAccent(subjects) {
  return freeAccent(accentCounts(subjects));
}

// Hands out a distinct colour to any subject that lacks one, or that holds a
// colour no longer in the palette — so trimming the palette re-homes the
// subjects that were using a retired hue rather than stranding them on it.
// Returns the same array untouched when there is nothing to fill in.
const inPalette = (hex) => SUBJECT_ACCENTS.includes(hex);

export function assignMissingAccents(subjects) {
  if (!subjects.some(s => !inPalette(s.accent))) return subjects;
  const counts = accentCounts(subjects);
  return subjects.map(s => {
    if (inPalette(s.accent)) return s;
    const hex = freeAccent(counts);
    counts.set(hex, counts.get(hex) + 1);
    return { ...s, accent: hex };
  });
}

// Papers within a subject are steps of that subject's hue rather than hues of
// their own, so a paper still reads as belonging to its subject. Ordered light
// to dark, which separates them for colour-blind readers too.
const PAPER_STEPS = {
  'Paper 1': 'color-mix(in oklab, ACCENT, white 28%)',
  'Paper 2': 'ACCENT',
  'Paper 3': 'color-mix(in oklab, ACCENT, black 22%)',
  'Paper 4': 'color-mix(in oklab, ACCENT, black 42%)',
};

export function paperShade(accent, paper) {
  return (PAPER_STEPS[paper] || 'ACCENT').replace(/ACCENT/g, accent);
}

export function categoryAccent(category) {
  return CATEGORY_ACCENTS[category] || CATEGORY_ACCENTS.general;
}

// Progress is a magnitude and reads by length, so its bar keeps one hue.
// Finishing is a state, and takes the reserved "good" colour to mark it.
export function progressColor(percent, accent) {
  return percent >= 100 ? '#047857' : accent;
}
