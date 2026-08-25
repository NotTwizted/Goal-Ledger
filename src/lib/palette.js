// Each subject owns a hue, and everything belonging to it — its card, its
// progress bars, its papers, its topic cards — is drawn in that hue.
//
// Deep tones only, and nothing from the purple-to-rose arc. Brightness was
// what made earlier sets look childish and pinks what made them look twee,
// so the palette is bounded by lightness and by hue rather than by taste:
// nothing lighter than 0.55, nothing more saturated than 0.14, and the
// 282-8 degree arc excluded outright.
//
// The header's two buttons keep the indigo and amber they have always had,
// and these are chosen around them — every pair at least 13 apart, none
// within 14 of a header button, against the 12.1 of the orange that used to
// collide with Goals.
//
// Seven slots. The binding constraint is not taste but the header: indigo
// and amber sit in the blue-violet and orange sectors, so navy, royal blue,
// red, rust and aubergine are all unusable, whatever they look like.
const SUBJECT_ACCENTS = [
  '#8d2841', // wine
  '#007f84', // teal
  '#6d7700', // olive
  '#6163bb', // slate indigo
  '#115800', // dark green
  '#583408', // bronze
  '#004655', // deep petrol
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
const storedAccent = (subject) => (
  subject && typeof subject.accent === 'string' && subject.accent.startsWith('#')
    ? subject.accent
    : SUBJECT_ACCENTS[0]
);

// Every hue here was chosen deep enough to sit on paper. The same hue on a
// dark ground reads as mud, so it is lifted toward white — mixed in oklab,
// which lightens without letting the hue drift, so a subject is recognisably
// the same colour in either theme.
//
// Read from the document at the moment it is needed rather than passed down:
// changing the theme re-renders the whole tree, so every one of these is
// worked out again anyway.
const onDark = () => typeof document !== 'undefined'
  && document.documentElement.classList.contains('dark');

const forGround = (hex) => (onDark() ? `color-mix(in oklab, ${hex}, white 34%)` : hex);

export function subjectAccent(subject) {
  return forGround(storedAccent(subject));
}

export { SUBJECT_ACCENTS };

// Where a subject's colour sits in the palette, so a list can be ordered by
// it. Anything holding a retired hue sorts to the end rather than at random.
export function accentOrder(subject) {
  // The stored hue, not the displayed one — sorting must not depend on theme.
  const index = SUBJECT_ACCENTS.indexOf(storedAccent(subject));
  return index === -1 ? SUBJECT_ACCENTS.length : index;
}

export function nextSubjectAccent(subjects) {
  return freeAccent(accentCounts(subjects));
}

// Hands out a distinct colour to any subject that lacks one, or that holds a
// colour no longer in the palette — so trimming the palette re-homes the
// subjects that were using a retired hue rather than stranding them on it.
// Returns the same array untouched when there is nothing to fill in.
const inPalette = (hex) => SUBJECT_ACCENTS.includes(hex);

export function assignMissingAccents(subjects) {
  if (!Array.isArray(subjects)) return subjects;
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
  return forGround(CATEGORY_ACCENTS[category] || CATEGORY_ACCENTS.general);
}

// The same hue at a set transparency, for a button's resting fill. Written as
// a mix rather than an eight-digit hex because the accent may itself already
// be a mix once the theme has lifted it.
export function accentWash(hex, percent = 92) {
  return `color-mix(in oklab, ${hex}, transparent ${percent}%)`;
}

// Progress is a magnitude and reads by length, so its bar keeps one hue.
// Finishing is a state, and takes the reserved "good" colour to mark it.
export function progressColor(percent, accent) {
  return percent >= 100 ? forGround('#047857') : accent;
}
