// The whole no-reader path on a real paper: the PDF's own text in, a stored
// past paper and moved topic mastery out. The fixture is the October 2025
// WMA11/01 as pdf.js actually extracts it, page furniture and broken formulae
// included — a retyped version of it hid three bugs that this did not.
import { scanLines } from '../src/lib/pdfscan.js';
import { getSeedData } from '../src/lib/syllabus.js';
import { paperRecordFromScan } from '../src/lib/uploads.js';
import * as mutate from '../src/lib/mutations.js';
import { unitScores, computeProgress } from '../src/lib/helpers.js';
import { paperScore } from '../src/lib/feedback.js';

// The fixture is a real exam paper's text and is not kept in the repo. Make it
// with: npm run fixture -- path/to/paper.pdf
let LINES;
try {
  ({ LINES } = await import('./fixtures.mjs'));
} catch {
  console.log(' -- skipped: no tests/fixtures.mjs. Build one with: npm run fixture -- <IAL_MATHS_2025_Oct_P1_QP.pdf>');
}


if (LINES) {
const seed = getSeedData({ name: 'Maths', level: 'AS', board: 'Edexcel International', components: ['Pure'] });
const topics = seed['Paper 1'].map((t, i) => ({
  id: `t${i}`,
  name: t.name,
  paper: 'Paper 1',
  status: 'not-started',
  subtopics: (t.subtopics || []).map((n, j) => ({ id: `s${i}-${j}`, name: n, status: 'not-started' })),
}));
const subjects = [{ id: 'sub1', name: 'Maths', category: 'study', level: 'AS', topics, pastPapers: [] }];

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const scanned = scanLines(LINES, topics);
const record = paperRecordFromScan(scanned, 'Paper 1', 'IAL_MATHS_2025_Oct_P1_QP.pdf');
const byNumber = Object.fromEntries(record.questions.map(q => [q.question, q]));

check('the paper identifies itself', record.session === 'Oct/Nov' && record.year === '2025',
  `${record.session} ${record.year}`);
check('every question is there', record.questions.length === 10, String(record.questions.length));
check('marks available are read', record.questions.reduce((s, q) => s + q.marksAvailable, 0) === 75,
  String(record.questions.reduce((s, q) => s + q.marksAvailable, 0)));

// What each question is on, read off the paper itself.
const EXPECTED = {
  1: 'Differentiation', 2: 'Integration', 3: 'Trigonometric ratios',
  4: 'Algebraic expressions', 5: 'Quadratics', 6: 'Graphs and transformations',
  7: 'Radians', 8: 'Differentiation', 9: 'Trigonometric ratios', 10: 'Differentiation',
};
const wrong = Object.entries(EXPECTED).filter(([n, want]) => byNumber[n]?.topic !== want);
check('every question is filed under the right topic', wrong.length === 0,
  wrong.length ? wrong.map(([n, want]) => `Q${n} wanted ${want}, got ${byNumber[n]?.topic || 'none'}`).join('; ')
    : Object.keys(EXPECTED).length + ' of 10');

// The two the page furniture used to break.
check('the margin watermark does not file Q1 under "Area under a curve"',
  byNumber['1'].topic === 'Differentiation' && byNumber['1'].subtopic === null,
  `${byNumber['1'].topic}${byNumber['1'].subtopic ? ` | ${byNumber['1'].subtopic}` : ''}`);
check('a broken "a(x + b)² + c" is still completing the square',
  byNumber['5'].subtopic === 'Completing the square', String(byNumber['5'].subtopic));
check('an integral with its sign dropped is still integration',
  byNumber['2'].topic === 'Integration', String(byNumber['2'].topic));

check('it is flagged as needing marks', record.needsMarks === true);

const before = computeProgress(topics);
let next = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', record);
check('completion has not moved on an unmarked paper',
  computeProgress(next[0].topics) === before, `${before}% → ${computeProgress(next[0].topics)}%`);
check('and it is listed', next[0].pastPapers.length === 1);

// The student fills in what they scored: dropping 4 on Q5 and 7 on Q10.
const scores = record.questions.map(q => {
  if (q.question === '5') return '6';
  if (q.question === '10') return '3';
  return String(q.marksAvailable);
});
next = mutate.recordPaperMarks(next, 'sub1', 'pp-any', scores);
check('an unknown paper id changes nothing', next[0].pastPapers[0].needsMarks === true);

next = mutate.recordPaperMarks(next, 'sub1', record.id, scores);
const saved = next[0].pastPapers[0];
check('the marks are in', saved.needsMarks === false && paperScore(saved).scored === 64,
  JSON.stringify(paperScore(saved)));

const moved = next[0].topics.filter(t => unitScores(t).length > 0);
check('mastery moved on every topic the paper tested', moved.length === 7,
  moved.map(t => `${t.name} ${unitScores(t)[0].percent}%`).join(', '));

const quad = next[0].topics.find(t => t.name === 'Quadratics');
check('Q5 cost Quadratics its mastery', unitScores(quad)[0].percent === 60,
  `${unitScores(quad)[0].scored}/${unitScores(quad)[0].total}`);

const diff = next[0].topics.find(t => t.name === 'Differentiation');
check('Differentiation is marked over all three of its questions, and only those',
  unitScores(diff)[0].total === 24 && unitScores(diff)[0].scored === 17,
  `${unitScores(diff)[0].scored}/${unitScores(diff)[0].total}`);

check('completion moved once the marks were in',
  computeProgress(next[0].topics) > before, `${before}% → ${computeProgress(next[0].topics)}%`);
check('the mistakes are recorded', saved.mistakes.length === 2,
  saved.mistakes.map(m => `Q${m.question} −${m.marksLost}`).join(', '));
}
