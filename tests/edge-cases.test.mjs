// Awkward input, and the three things it turned up.
import * as h from '../src/lib/helpers.js';
import * as mutate from '../src/lib/mutations.js';
import { paperScore } from '../src/lib/feedback.js';
import { buildWeeklyReport } from '../src/lib/report.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

// ── A paper marks the topics on its own paper, and no others ──────────────
//
// Computer Science has Data representation on Paper 1 and again on Paper 3.
// A question was assigned to whichever came first in the list and then
// rejected by every topic on the paper being marked for belonging elsewhere,
// so the whole upload scored nothing and said nothing about it.
const twoPapers = () => [{
  id: 's1', name: 'Computer Science', category: 'study', pastPapers: [],
  topics: [
    { id: 'p1', name: 'Data representation', paper: 'Paper 1', status: 'not-started',
      subtopics: [{ id: 'p1a', name: 'Binary', status: 'not-started' }] },
    { id: 'p3', name: 'Data representation', paper: 'Paper 3', status: 'not-started',
      subtopics: [{ id: 'p3a', name: 'Binary', status: 'not-started' }] },
  ],
}];

const onPaper3 = mutate.addPastPaperRecord(twoPapers(), 's1', 'Paper 3', {
  id: 'pp1', paper: 'Paper 3', session: 'Oct/Nov', year: '2025', mistakes: [],
  questions: [{ question: '1', topic: 'Data representation', subtopic: 'Binary', marksScored: 4, marksAvailable: 5 }],
});
check('a Paper 3 paper marks the Paper 3 topic', h.unitScores(onPaper3[0].topics[1]).length === 1,
  h.unitScores(onPaper3[0].topics[1]).map(s => `${s.scored}/${s.total}`).join('') || 'nothing');
check('and its subtopic', h.unitScores(onPaper3[0].topics[1].subtopics[0]).length === 1);
check('leaving the Paper 1 topic of the same name alone',
  h.unitScores(onPaper3[0].topics[0]).length === 0);

const onPaper1 = mutate.addPastPaperRecord(twoPapers(), 's1', 'Paper 1', {
  id: 'pp2', paper: 'Paper 1', session: 'Jan', year: '2025', mistakes: [],
  questions: [{ question: '1', topic: 'Data representation', marksScored: 2, marksAvailable: 5 }],
});
check('and the same holds the other way round',
  h.unitScores(onPaper1[0].topics[0]).length === 1 && h.unitScores(onPaper1[0].topics[1]).length === 0,
  `Paper 1 ${h.unitScores(onPaper1[0].topics[0]).length}, Paper 3 ${h.unitScores(onPaper1[0].topics[1]).length}`);

// ── A mark is never worth more than the question ──────────────────────────
const outOfRange = { question: '1', topic: 'Algebra', marksScored: 9, marksAvailable: 5 };
check('9 out of 5 reads as 5', h.recordedScore(outOfRange) === 5, String(h.recordedScore(outOfRange)));
check('and a negative mark as none',
  h.recordedScore({ marksScored: -4, marksAvailable: 5 }) === 0,
  String(h.recordedScore({ marksScored: -4, marksAvailable: 5 })));
check('a question with no allocation still clamps at none',
  h.recordedScore({ marksScored: -1, marksAvailable: 0 }) === 0);
check('and an unknown mark is still unknown', h.recordedScore({ marksAvailable: 5 }) === null);
check('a paper cannot score more than it is out of',
  paperScore({ questions: [outOfRange, { marksScored: 5, marksAvailable: 5 }] }).percent === 100,
  JSON.stringify(paperScore({ questions: [outOfRange, { marksScored: 5, marksAvailable: 5 }] })));

let typed = mutate.addPastPaperRecord([{ id: 's1', name: 'M', category: 'study', pastPapers: [],
  topics: [{ id: 't1', name: 'Algebra', paper: 'Paper 1', status: 'not-started', subtopics: [] }] }],
  's1', 'Paper 1', { id: 'pp', paper: 'Paper 1', session: 'Jan', year: '2025', mistakes: [],
    questions: [{ question: '1', topic: 'Algebra', marksScored: 2, marksAvailable: 5 }] });
typed = mutate.revisePaperMarks(typed, 's1', 'pp', ['99']);
check('a mark typed over the maximum is stored clamped',
  typed[0].pastPapers[0].questions[0].marksScored === 5,
  String(typed[0].pastPapers[0].questions[0].marksScored));
check('so the paper and the topic agree',
  paperScore(typed[0].pastPapers[0]).percent === 100 && h.unitScores(typed[0].topics[0])[0].percent === 100);

// ── A circle set by marks is not cleared by clicking it ───────────────────
let ticked = [{ id: 's1', name: 'M', category: 'study', pastPapers: [], topics: [
  { id: 't1', name: 'Algebra', paper: 'Paper 1', status: 'not-started',
    subtopics: [{ id: 'a', name: 'Indices', status: 'not-started' }] }] }];
ticked = mutate.addUnitScore(ticked, 's1', 't1', 'a', '50%', 'test');
check('a mark turns the circle amber', ticked[0].topics[0].subtopics[0].status === 'in-progress');
ticked = mutate.cycleSubtopicStatus(ticked, 's1', 't1', 'a');
check('and clicking it cannot turn it white again',
  ticked[0].topics[0].subtopics[0].status === 'in-progress',
  ticked[0].topics[0].subtopics[0].status);
const scoreId = h.unitScores(ticked[0].topics[0].subtopics[0])[0].id;
ticked = mutate.removeUnitScore(ticked, 's1', 't1', 'a', scoreId);
check('removing the mark is what undoes it',
  ticked[0].topics[0].subtopics[0].status === 'not-started',
  ticked[0].topics[0].subtopics[0].status);

let unmarked = mutate.cycleSubtopicStatus(ticked, 's1', 't1', 'a');
check('a subtopic with no marks still ticks by hand',
  unmarked[0].topics[0].subtopics[0].status === 'in-progress');
unmarked = mutate.cycleSubtopicStatus(unmarked, 's1', 't1', 'a');
check('and unticks', unmarked[0].topics[0].subtopics[0].status === 'not-started');

// ── Things that were already right, and should stay so ────────────────────
check('"45/60" is 75%', h.parseMarkInput('45/60').percent === 75);
check('"5/0" is not a mark', h.parseMarkInput('5/0') === null);
check('"120%" is held at 100', h.parseMarkInput('120%').percent === 100);
check('"-3" is not a mark', h.parseMarkInput('-3') === null);
check('an empty box is not a mark', h.parseMarkInput('') === null);

const { start, end } = h.getWeekRange(0);
check('a week starts on a Friday', start.getDay() === 5, String(start.getDay()));
check('and is exactly seven days', Math.round((end - start) / 86400000) === 7);
check('last week is the seven days before it',
  Math.round((start - h.getWeekRange(-1).start) / 86400000) === 7);

const at = (d) => new Date(d).toISOString();
const week = buildWeeklyReport([{ id: 's1', name: 'M', category: 'study', pastPapers: [], topics: [
  { id: 'a', name: 'The first moment', status: 'done', completedAt: at(start), subtopics: [] },
  { id: 'b', name: 'A second before the end', status: 'done', completedAt: at(end.getTime() - 1000), subtopics: [] },
  { id: 'c', name: 'Exactly the end', status: 'done', completedAt: at(end), subtopics: [] },
  { id: 'd', name: 'A second before the start', status: 'done', completedAt: at(start.getTime() - 1000), subtopics: [] },
] }], 0);
check('the week takes its first moment but not its last', week.completedCount === 2,
  `${week.completedCount} of 4`);

check('a goal reads its target from its own name',
  h.unitCompletion({ status: 'not-started', current: 4, name: 'Do 10 pullups' }) === 0.4);
check('and cannot go past finished',
  h.unitCompletion({ status: 'not-started', current: 60, name: 'Do 10 pullups' }) === 1);
check('a subject deleted is gone and the rest are not',
  mutate.deleteSubject([{ id: 'a' }, { id: 'b' }], 'a').map(s => s.id).join('') === 'b');
check('deleting one that is not there changes nothing',
  mutate.deleteSubject([{ id: 'a' }, { id: 'b' }], 'zz').length === 2);
