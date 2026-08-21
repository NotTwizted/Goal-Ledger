import * as mutate from '../src/lib/mutations.js';
import { unitScores } from '../src/lib/helpers.js';
import { paperScore, paperFeedback } from '../src/lib/feedback.js';

// A subject shaped the way the app stores one.
const subjects = [{
  id: 'sub1', name: 'Maths', category: 'study',
  topics: [
    { id: 't1', name: 'Differentiation', paper: 'Paper 1', status: 'not-started', subtopics: [
      { id: 's1', name: 'Tangents and normals', status: 'not-started' },
    ] },
    { id: 't2', name: 'Integration', paper: 'Paper 1', status: 'not-started', subtopics: [] },
  ],
  pastPapers: [],
}];

// What extractPastPaper's scan route produces: questions and allocations, no marks.
const scanned = {
  id: 'pp1', paper: 'Paper 1', fileName: 'WMA11.pdf',
  session: 'Oct/Nov', year: '2025', uploadedAt: new Date().toISOString(),
  questions: [
    { question: '1', topic: 'Differentiation', subtopic: 'Tangents and normals', marksScored: null, marksAvailable: 6 },
    { question: '2', topic: 'Integration', subtopic: null, marksScored: null, marksAvailable: 5 },
  ],
  feedback: null, mistakes: [], readBy: 'scan', needsMarks: true,
};

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

// 1. Adding it must not touch mastery: an unread mark is not a nought.
let next = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', scanned);
const t1 = next[0].topics[0];
check('adding an unmarked paper leaves the topic alone',
  unitScores(t1).length === 0 && unitScores(t1.subtopics[0]).length === 0,
  `topic scores ${unitScores(t1).length}, subtopic ${unitScores(t1.subtopics[0]).length}`);
check('the paper is stored', next[0].pastPapers.length === 1);
check('no score is claimed for it', paperScore(scanned) === null, JSON.stringify(paperScore(scanned)));

// 2. Filling the marks in applies them, once.
next = mutate.recordPaperMarks(next, 'sub1', 'pp1', ['3', '5']);
const filled = next[0].pastPapers[0];
const topic = next[0].topics[0];
const sub = topic.subtopics[0];
check('the flag clears', filled.needsMarks === false);
check('marks are written into the record',
  filled.questions[0].marksScored === 3 && filled.questions[1].marksScored === 5);
check('the topic gets one mark', unitScores(topic).length === 1,
  JSON.stringify(unitScores(topic).map(s => `${s.scored}/${s.total}`)));
check('at 3/6 = 50%', unitScores(topic)[0]?.percent === 50);
check('the subtopic gets its own', unitScores(sub)[0]?.percent === 50);
check('the other topic is marked from its own question',
  unitScores(next[0].topics[1])[0]?.percent === 100);
check('the mistake is recorded', filled.mistakes.length === 1 && filled.mistakes[0].marksLost === 3);
check('the paper now scores 8/11', paperScore(filled)?.scored === 8 && paperScore(filled)?.available === 11);

// 3. Saving again must not double count.
const again = mutate.recordPaperMarks(next, 'sub1', 'pp1', ['4', '5']);
check('a second save changes nothing', unitScores(again[0].topics[0]).length === 1);

// 4. A partly filled paper counts only what was entered.
let partial = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', { ...scanned, id: 'pp2' });
partial = mutate.recordPaperMarks(partial, 'sub1', 'pp2', ['3', '']);
check('an unentered question is left out of the total',
  paperScore(partial[0].pastPapers[0])?.available === 6,
  JSON.stringify(paperScore(partial[0].pastPapers[0])));
check('and out of the untouched topic',
  unitScores(partial[0].topics[1]).length === 0);

// 5. Feedback on an unmarked paper says nothing false.
const fb = paperFeedback(scanned);
check('no marks means no invented feedback areas', fb.areas.length === 0, fb.summary);
