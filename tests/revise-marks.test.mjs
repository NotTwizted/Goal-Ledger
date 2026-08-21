// The reader is reading handwriting and gets marks wrong. Correcting one has
// to reach the topics as well as the paper — and must not count the paper
// twice, since it has already left its mark on everything it touched.
import * as mutate from '../src/lib/mutations.js';
import { unitScores, averageScore } from '../src/lib/helpers.js';
import { paperScore } from '../src/lib/feedback.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const base = () => [{
  id: 'sub1', name: 'Maths', category: 'study',
  topics: [
    { id: 't1', name: 'Trigonometric ratios', paper: 'Paper 1', status: 'not-started',
      subtopics: [{ id: 's1', name: 'Solving triangle problems', status: 'not-started' }] },
    { id: 't2', name: 'Differentiation', paper: 'Paper 1', status: 'not-started', subtopics: [] },
  ],
  pastPapers: [],
}];

const record = {
  id: 'pp1', paper: 'Paper 1', session: 'Oct/Nov', year: '2025',
  uploadedAt: new Date().toISOString(), mistakes: [],
  questions: [
    // The reader read a crossed-out 2 as a 0. It was 2.
    { question: '3a', topic: 'Trigonometric ratios', subtopic: 'Solving triangle problems', marksScored: 0, marksAvailable: 2 },
    { question: '3b', topic: 'Trigonometric ratios', subtopic: 'Solving triangle problems', marksScored: 2, marksAvailable: 3 },
    { question: '1', topic: 'Differentiation', subtopic: null, marksScored: 6, marksAvailable: 6 },
  ],
};

let subjects = mutate.addPastPaperRecord(base(), 'sub1', 'Paper 1', record);
const trig = () => subjects[0].topics[0];
const diff = () => subjects[0].topics[1];

check('the paper scores 8 of 11 as read', paperScore(subjects[0].pastPapers[0]).scored === 8,
  JSON.stringify(paperScore(subjects[0].pastPapers[0])));
check('trigonometry gets one mark, at 2 of 5', unitScores(trig())[0]?.scored === 2,
  `${unitScores(trig())[0]?.scored}/${unitScores(trig())[0]?.total}`);
check('and the mark says which paper left it', unitScores(trig())[0]?.sourceId === 'pp1',
  String(unitScores(trig())[0]?.sourceId));

// Correct Q3a from 0 to 2.
subjects = mutate.revisePaperMarks(subjects, 'sub1', 'pp1', ['2', '2', '6']);

check('the paper now scores 10 of 11', paperScore(subjects[0].pastPapers[0]).scored === 10,
  JSON.stringify(paperScore(subjects[0].pastPapers[0])));
check('trigonometry still holds exactly one mark', unitScores(trig()).length === 1,
  `${unitScores(trig()).length} marks: ${unitScores(trig()).map(s => `${s.scored}/${s.total}`).join(', ')}`);
check('and it is the corrected one, 4 of 5', unitScores(trig())[0].scored === 4,
  `${unitScores(trig())[0].scored}/${unitScores(trig())[0].total}`);
check('the subtopic is corrected too', unitScores(trig().subtopics[0])[0].scored === 4,
  `${unitScores(trig().subtopics[0])[0]?.scored}/${unitScores(trig().subtopics[0])[0]?.total}`);
check('a topic the correction did not touch is unchanged',
  unitScores(diff()).length === 1 && unitScores(diff())[0].percent === 100,
  `${unitScores(diff()).length} marks at ${unitScores(diff())[0]?.percent}%`);
check('the mistake list is rewritten', subjects[0].pastPapers[0].mistakes.length === 1,
  subjects[0].pastPapers[0].mistakes.map(m => `Q${m.question} −${m.marksLost}`).join(', '));
check('80% is not yet mastery, so the subtopic stays amber',
  trig().subtopics[0].status === 'in-progress', trig().subtopics[0].status);

// Correcting again must still leave one mark, not three.
subjects = mutate.revisePaperMarks(subjects, 'sub1', 'pp1', ['2', '3', '6']);
check('correcting twice still leaves one mark', unitScores(trig()).length === 1,
  `${unitScores(trig()).length}`);
check('full marks now, so the subtopic goes green',
  trig().subtopics[0].status === 'done' && averageScore(trig().subtopics[0]) === 100,
  `${trig().subtopics[0].status} at ${averageScore(trig().subtopics[0])}%`);

// A paper recorded before marks remembered their source is still correctable:
// the label is the fallback.
const legacy = [{
  id: 'sub1', name: 'Maths', category: 'study',
  topics: [{ id: 't1', name: 'Differentiation', paper: 'Paper 1', status: 'in-progress', subtopics: [],
    scores: [{ id: 'old', percent: 50, scored: 3, total: 6, label: 'Oct/Nov 2025' }] }],
  pastPapers: [{ id: 'pp9', paper: 'Paper 1', session: 'Oct/Nov', year: '2025', mistakes: [],
    questions: [{ question: '1', topic: 'Differentiation', marksScored: 3, marksAvailable: 6 }] }],
}];
const revived = mutate.revisePaperMarks(legacy, 'sub1', 'pp9', ['6']);
check('an older paper is corrected by its label, leaving one mark',
  unitScores(revived[0].topics[0]).length === 1,
  `${unitScores(revived[0].topics[0]).length} marks`);
check('and reads 6 of 6', unitScores(revived[0].topics[0])[0].scored === 6,
  `${unitScores(revived[0].topics[0])[0].scored}/${unitScores(revived[0].topics[0])[0].total}`);

// Filling in blanks must not have become a correction by accident.
const blank = mutate.addPastPaperRecord(base(), 'sub1', 'Paper 1',
  { ...record, id: 'pp2', needsMarks: true, questions: record.questions.map(q => ({ ...q, marksScored: null })) });
check('an unmarked paper leaves the topics alone', unitScores(blank[0].topics[0]).length === 0);
const filled = mutate.recordPaperMarks(blank, 'sub1', 'pp2', ['2', '3', '6']);
check('and filling it in marks them once', unitScores(filled[0].topics[0]).length === 1,
  `${unitScores(filled[0].topics[0]).length}`);
