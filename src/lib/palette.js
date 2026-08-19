// Categorical accents for the exam papers, assigned in fixed order and never
// cycled — Paper 2 is always teal, whichever papers a subject happens to use.
//
// Checked with the palette validator across every pair, not just adjacent ones,
// since all four papers can be on screen together: lightness band, chroma floor,
// colour-vision separation (worst pair ΔE 11.7 protan, 15.9 tritan), normal
// vision (20.0), and contrast against the page. Colour is decoration here — each
// card is titled "Paper 1", "Paper 2" and so on, so identity never rests on hue.
const PAPER_ACCENTS = {
  'Paper 1': '#4338ca',
  'Paper 2': '#0d9488',
  'Paper 3': '#c2410c',
  'Paper 4': '#a855f7',
};

const CATEGORY_ACCENTS = {
  study: '#3730a3',
  general: '#b45309',
};

export function paperAccent(paper) {
  return PAPER_ACCENTS[paper] || '#57534e';
}

export function categoryAccent(category) {
  return CATEGORY_ACCENTS[category] || CATEGORY_ACCENTS.general;
}

// Progress is a magnitude, so its bar keeps one hue and reads by length alone.
// Completed work is the exception: finishing everything is a state, and it gets
// the reserved "good" colour to mark it.
export function progressColor(percent, accent) {
  return percent >= 100 ? '#047857' : accent;
}
