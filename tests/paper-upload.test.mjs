// The whole no-reader path on a real paper: the PDF's own text in, a stored
// past paper and moved topic mastery out, with nothing typed but the marks.
import { scanLines } from '../src/lib/pdfscan.js';
import { getSeedData } from '../src/lib/syllabus.js';
import { paperRecordFromScan } from '../src/lib/uploads.js';
import * as mutate from '../src/lib/mutations.js';
import { unitScores, computeProgress } from '../src/lib/helpers.js';
import { paperScore } from '../src/lib/feedback.js';
import { LINES } from './fixtures.mjs';

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
const record = paperRecordFromScan(scanned, 'Paper 1', 'WMA11_01_2025_Oct.pdf');

check('the paper identifies itself', record.session === 'Oct/Nov' && record.year === '2025',
  `${record.session} ${record.year}`);
check('every question is there', record.questions.length === 10);
check('marks available are read', record.questions.reduce((s, q) => s + q.marksAvailable, 0) === 75,
  String(record.questions.reduce((s, q) => s + q.marksAvailable, 0)));
check('topics are attached', record.questions.filter(q => q.topic).length === 9,
  `${record.questions.filter(q => q.topic).length} of 10`);
check('subtopics too where the wording allowed',
  record.questions.filter(q => q.subtopic).length === 5,
  String(record.questions.filter(q => q.subtopic).length));
check('it is flagged as needing marks', record.needsMarks === true);

const before = computeProgress(topics);
let next = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', record);
check('completion has not moved on an unmarked paper',
  computeProgress(next[0].topics) === before, `${before}% → ${computeProgress(next[0].topics)}%`);
check('and it is listed', next[0].pastPapers.length === 1);

// The student fills in what they scored: 62/75, dropping marks on Q5 and Q10.
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
check('mastery moved on the topics the paper tested', moved.length >= 5,
  moved.map(t => `${t.name} ${unitScores(t)[0].percent}%`).join(', '));

const quad = next[0].topics.find(t => /Quadratic/i.test(t.name));
check('Q5 cost Quadratics its mastery', unitScores(quad)[0].percent === 60,
  `${unitScores(quad)[0].scored}/${unitScores(quad)[0].total}`);

const diff = next[0].topics.find(t => /Differentiation/i.test(t.name));
check('Differentiation is marked over all three of its questions',
  unitScores(diff)[0].total === 24 && unitScores(diff)[0].scored === 17,
  `${unitScores(diff)[0].scored}/${unitScores(diff)[0].total}`);

check('completion moved once the marks were in',
  computeProgress(next[0].topics) > before, `${before}% → ${computeProgress(next[0].topics)}%`);
check('the mistakes are recorded', saved.mistakes.length === 2,
  saved.mistakes.map(m => `Q${m.question} −${m.marksLost}`).join(', '));
