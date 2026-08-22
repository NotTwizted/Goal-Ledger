// Getting from a name on the weekly report back to the page a question is
// printed on. The page numbers come from the paper's own total lines, which
// the browser reads before anything is uploaded.
import { questionsFor } from '../src/lib/questionpages.js';
import { paperRecordFromScan } from '../src/lib/uploads.js';
import { scanLines } from '../src/lib/pdfscan.js';
import { getSeedData } from '../src/lib/syllabus.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const subject = {
  id: 's1', name: 'Maths', category: 'study',
  topics: [],
  pastPapers: [
    { id: 'old', paper: 'Paper 1', session: 'Jan', year: '2024', uploadedAt: '2024-01-10T09:00:00Z',
      questions: [{ question: '3', topic: 'Quadratics', subtopic: 'Completing the square', page: 7, marksScored: 2, marksAvailable: 5 }] },
    { id: 'new', paper: 'Paper 1', session: 'Oct/Nov', year: '2025', uploadedAt: '2025-10-09T09:00:00Z',
      questions: [
        { question: '5a', topic: 'Quadratics', subtopic: 'Completing the square', page: 15, marksScored: 3, marksAvailable: 3 },
        { question: '5b', topic: 'Quadratics', subtopic: 'The discriminant', page: 15, marksScored: 1, marksAvailable: 5 },
        { question: '9', topic: 'Radians', subtopic: null, page: 23, marksScored: 6, marksAvailable: 6 },
        { question: '2', topic: 'Integration', subtopic: 'Indefinite integrals', marksScored: 4, marksAvailable: 5 },
      ] },
  ],
};

const square = questionsFor(subject, 'Quadratics', 'Completing the square');
check('a subtopic finds every question that tested it', square.length === 2, String(square.length));
check('newest paper first', square[0].paperLabel === 'Oct/Nov 2025', square.map(q => q.paperLabel).join(' then '));
check('with the page it is printed on', square[0].page === 15 && square[1].page === 7,
  square.map(q => `p${q.page}`).join(', '));
check('and the marks alongside', square[0].marksScored === 3 && square[0].marksAvailable === 3);

const disc = questionsFor(subject, 'Quadratics', 'The discriminant');
check('a sibling subtopic finds only its own', disc.length === 1 && disc[0].question === '5b',
  disc.map(q => q.question).join(','));

const radians = questionsFor(subject, 'Radians', null);
check('a whole topic finds a question labelled with the topic', radians.length === 1 && radians[0].page === 23);

check('a question with no page is not offered',
  questionsFor(subject, 'Integration', 'Indefinite integrals').length === 0);
check('a topic nothing tested finds nothing',
  questionsFor(subject, 'Vectors', null).length === 0);
check('a subject with no papers finds nothing',
  questionsFor({ id: 'x' }, 'Quadratics', 'Completing the square').length === 0);
check('and neither does no subject at all',
  questionsFor(undefined, 'Quadratics', null).length === 0);

// The real paper: every question should carry the page its total line is on.
let LINES;
try {
  ({ LINES } = await import('./fixtures.mjs'));
} catch {
  console.log(' -- skipped the real paper: no tests/fixtures.mjs');
}

if (LINES) {
  const seed = getSeedData({ name: 'Maths', level: 'AS', board: 'Edexcel International', components: ['Pure'] });
  const topics = seed['Paper 1'].map((t, i) => ({
    id: `t${i}`, name: t.name,
    subtopics: (t.subtopics || []).map((n, j) => ({ id: `s${i}-${j}`, name: n })),
  }));
  const record = paperRecordFromScan(scanLines(LINES, topics), 'Paper 1', 'IAL_MATHS_2025_Oct_P1_QP.pdf');

  check('every question on the real paper knows its page',
    record.questions.every(q => q.page > 0),
    record.questions.map(q => `Q${q.question}:p${q.page}`).join(' '));
  check('and the pages climb with the question numbers',
    record.questions.every((q, i) => i === 0 || q.page >= record.questions[i - 1].page));

  const found = questionsFor({ pastPapers: [{ ...record, uploadedAt: new Date().toISOString() }] },
    'Quadratics', 'Completing the square');
  check('so the report can find question 5 on page 15',
    found.length === 1 && found[0].question === '5' && found[0].page === 15,
    found.map(q => `Q${q.question} p${q.page}`).join(', ') || 'nothing');
}
