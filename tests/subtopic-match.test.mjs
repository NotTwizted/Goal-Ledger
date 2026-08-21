// The reader writes a subtopic in its own words. The prompt now hands it the
// student's actual subtopic list and asks for those names verbatim, but a
// paraphrase must still find its place — these are the labels a real paper
// came back with, against the syllabus names they should have landed on.
import * as mutate from '../src/lib/mutations.js';
import { getSeedData } from '../src/lib/syllabus.js';
import { unitScores } from '../src/lib/helpers.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const seed = getSeedData({ name: 'Maths', level: 'AS', board: 'Edexcel International', components: ['Pure'] });
const topics = seed['Paper 1'].map((t, i) => ({
  id: `t${i}`, name: t.name, paper: 'Paper 1', status: 'not-started',
  subtopics: (t.subtopics || []).map((n, j) => ({ id: `s${i}-${j}`, name: n, status: 'not-started' })),
}));
const subjects = [{ id: 'sub1', name: 'Maths', category: 'study', topics, pastPapers: [] }];

// Straight from the October 2025 upload: the reader's wording, the topic it
// named, and the subtopic it should reach.
const QUESTIONS = [
  ['1a', 'Differentiation', 'Polynomial differentiation', 3, 3, /Differentiating/],
  ['1b', 'Differentiation', 'Equation of tangent', 3, 3, /tangents/],
  ['4i', 'Algebraic expressions', 'Laws of indices', 3, 3, /indices/i],
  ['5a', 'Quadratics', 'Completing the square', 3, 3, /Completing/],
  ['6a', 'Graphs and transformations', 'Reciprocal graphs and axis intercepts', 3, 4, /Reciprocal/],
  ['8c', 'Integration', 'Indefinite integration and finding constant of integration', 4, 4, /integral|integration/i],
];

const after = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', {
  id: 'pp1', paper: 'Paper 1', session: 'Oct/Nov', year: '2025',
  uploadedAt: new Date().toISOString(), mistakes: [],
  questions: QUESTIONS.map(([question, topic, subtopic, marksScored, marksAvailable]) =>
    ({ question, topic, subtopic, marksScored, marksAvailable })),
});

// Where each one landed.
const landed = [];
after[0].topics.forEach(t => (t.subtopics || []).forEach(st => {
  if (unitScores(st).length) landed.push(`${t.name} | ${st.name}`);
}));

QUESTIONS.forEach(([question, topicName, wording, , , want]) => {
  const topic = after[0].topics.find(t => t.name === topicName);
  const hit = (topic?.subtopics || []).find(st => unitScores(st).length && want.test(st.name));
  check(`Q${question} "${wording}" reaches a subtopic`, Boolean(hit), hit ? hit.name : 'nowhere');
});

check('nothing landed on a subtopic no question was about', landed.length === QUESTIONS.length,
  `${landed.length} marked: ${landed.join(', ')}`);

// Full marks on a subtopic make it green; that is the whole point of placing it.
const diff = after[0].topics.find(t => t.name === 'Differentiation');
const green = (diff.subtopics || []).filter(st => st.status === 'done');
check('full marks turn those subtopics green', green.length === 2,
  green.map(st => st.name).join(', ') || 'none');

// And a label that means something else entirely must not be forced to fit.
const nonsense = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', {
  id: 'pp2', paper: 'Paper 1', uploadedAt: new Date().toISOString(), mistakes: [],
  questions: [{ question: '1', topic: 'Differentiation', subtopic: 'Photosynthesis in bright light', marksScored: 5, marksAvailable: 5 }],
});
const stray = (nonsense[0].topics.find(t => t.name === 'Differentiation').subtopics || [])
  .filter(st => unitScores(st).length);
check('an unrelated label is not forced onto a subtopic', stray.length === 0,
  stray.map(st => st.name).join(', '));
