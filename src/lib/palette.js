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
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#0891b2', // cyan
  '#9333ea', // purple
  '#65a30d', // lime
  '#92400e', // brown
];

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

export function nextSubjectAccent(subjects) {
  return freeAccent(accentCounts(subjects));
}

// Subjects created before colours existed have none, and deriving one from the
// id would let two subjects collide on the same hue — which is exactly what
// happened. Hand each a distinct colour instead, once, and store it.
// Returns the same array untouched when there is nothing to fill in.
export function assignMissingAccents(subjects) {
  if (!subjects.some(s => !s.accent)) return subjects;
  const counts = accentCounts(subjects);
  return subjects.map(s => {
    if (s.accent) return s;
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
