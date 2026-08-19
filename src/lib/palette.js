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
];

const CATEGORY_ACCENTS = {
  study: '#3730a3',
  general: '#b45309',
};

function hashToSlot(id) {
  let hash = 0;
  for (let i = 0; i < (id || '').length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return SUBJECT_ACCENTS[hash % SUBJECT_ACCENTS.length];
}

// A subject's colour is stored on the subject itself, so removing one never
// repaints the others. Subjects created before colours existed fall back to a
// hash of their id, which is just as stable and needs no migration.
export function subjectAccent(subject) {
  if (!subject) return CATEGORY_ACCENTS.study;
  if (typeof subject.accent === 'string' && subject.accent.startsWith('#')) return subject.accent;
  return hashToSlot(subject.id);
}

// Hands a new subject the first unused hue, falling back to the least used one
// so that a ninth subject shares rather than repeats a neighbour.
export function nextSubjectAccent(subjects) {
  const counts = new Map(SUBJECT_ACCENTS.map(hex => [hex, 0]));
  subjects.forEach(s => {
    const hex = subjectAccent(s);
    if (counts.has(hex)) counts.set(hex, counts.get(hex) + 1);
  });
  let best = SUBJECT_ACCENTS[0];
  counts.forEach((count, hex) => {
    if (count < counts.get(best)) best = hex;
  });
  return best;
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
