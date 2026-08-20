// Each subject owns a hue, and everything belonging to it — its card, its
// progress bars, its papers, its topic cards — is drawn in that hue.
//
// Deep tones only — the 700/800 end of each family. Nothing pastel, nothing
// fluorescent: the brightness is what read as childish, not the hue, so a
// purple or a pink is fine here where a lilac or a hot magenta was not.
const SUBJECT_ACCENTS = [
  '#0369a1', // steel blue
  '#15803d', // green
  '#7f1d1d', // maroon
  '#86198f', // plum
  '#57534e', // stone
  '#be185d', // deep pink
];

// The header's two buttons keep the indigo and amber they have always had,
// and the subject hues are chosen around them: every pair at least 13 apart
// and none within 14 of a header button — against the 12.1 of the orange
// that used to collide with the Goals button. Allowing
// deep purples and pinks back is what buys the extra slots: excluding whole
// families cost two colours, and depth turned out to be the property that
// mattered rather than which part of the wheel they came from.
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
  'Paper 5': 'color-mix(in oklab, ACCENT, white 14%)',
  'Paper 6': 'color-mix(in oklab, ACCENT, black 32%)',
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
