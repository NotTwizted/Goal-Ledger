// Several papers on one subtopic, and what happens when one of them is
// deleted. Both are about the same thing: a subtopic's percentage should be
// the papers currently on record, and nothing else.
import * as mutate from '../src/lib/mutations.js';
import { unitScores, averageScore } from '../src/lib/helpers.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const base = () => [{
  id: 'sub1', name: 'Maths', category: 'study',
  topics: [
    { id: 't1', name: 'Differentiation', paper: 'Paper 1', status: 'not-started',
      subtopics: [
        { id: 's1', name: 'Gradients, tangents, and normals', status: 'not-started' },
        { id: 's2', name: 'Second order derivatives', status: 'not-started' },
      ] },
    { id: 't2', name: 'Integration', paper: 'Paper 1', status: 'not-started', subtopics: [] },
  ],
  pastPapers: [],
}];

const paperOn = (id, session, scored, available) => ({
  id, paper: 'Paper 1', session, year: '2025', uploadedAt: new Date().toISOString(), mistakes: [],
  questions: [
    { question: '1', topic: 'Differentiation', subtopic: 'Gradients, tangents, and normals', marksScored: scored, marksAvailable: available },
    { question: '2', topic: 'Integration', subtopic: null, marksScored: 4, marksAvailable: 4 },
  ],
});

// Three papers on the same subtopic: 50%, 100%, 60%.
let subjects = base();
subjects = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', paperOn('pp1', 'Jan', 3, 6));
subjects = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', paperOn('pp2', 'May/June', 6, 6));
subjects = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', paperOn('pp3', 'Oct/Nov', 3, 5));

const tangents = () => subjects[0].topics[0].subtopics[0];
const derivatives = () => subjects[0].topics[0].subtopics[1];
const integration = () => subjects[0].topics[1];

check('each paper leaves its own mark on the subtopic', unitScores(tangents()).length === 3,
  unitScores(tangents()).map(s => `${s.scored}/${s.total}`).join(', '));
check('and the subtopic shows their average', averageScore(tangents()) === 70,
  `${averageScore(tangents())}% from 50, 100, 60`);
check('each mark is labelled with its sitting',
  unitScores(tangents()).map(s => s.label).join(', ') === 'Jan 2025, May/June 2025, Oct/Nov 2025',
  unitScores(tangents()).map(s => s.label).join(', '));
check('a subtopic no paper tested has none', unitScores(derivatives()).length === 0);
check('the average is below mastery, so it is amber', tangents().status === 'in-progress',
  tangents().status);

// Deleting the middle paper.
subjects = mutate.deletePastPaper(subjects, 'sub1', 'pp2');

check('the paper is gone from the list', subjects[0].pastPapers.map(pp => pp.id).join(',') === 'pp1,pp3',
  subjects[0].pastPapers.map(pp => pp.id).join(','));
check('its mark is gone from the subtopic too', unitScores(tangents()).length === 2,
  unitScores(tangents()).map(s => `${s.label} ${s.percent}%`).join(', '));
check('the average is the two that remain', averageScore(tangents()) === 55,
  `${averageScore(tangents())}% from 50, 60`);
check('the other papers are untouched',
  unitScores(tangents()).map(s => s.label).join(', ') === 'Jan 2025, Oct/Nov 2025',
  unitScores(tangents()).map(s => s.label).join(', '));
check('the topic above it loses that paper as well', unitScores(subjects[0].topics[0]).length === 2,
  `${unitScores(subjects[0].topics[0]).length} marks`);
check('and so does a topic with no subtopics', unitScores(integration()).length === 2,
  `${unitScores(integration()).length} marks`);

// Deleting the rest puts the subtopic back to untouched.
subjects = mutate.deletePastPaper(subjects, 'sub1', 'pp1');
subjects = mutate.deletePastPaper(subjects, 'sub1', 'pp3');
check('with every paper gone the subtopic has no marks', unitScores(tangents()).length === 0);
check('and its circle goes back to white', tangents().status === 'not-started', tangents().status);
check('no papers are left', subjects[0].pastPapers.length === 0);

// A subtopic ticked by hand keeps its tick when a paper is deleted — the tick
// was never the paper's to take away.
let ticked = mutate.addPastPaperRecord(base(), 'sub1', 'Paper 1', paperOn('pp4', 'Jan', 3, 6));
ticked = mutate.cycleSubtopicStatus(ticked, 'sub1', 't1', 's2');
check('a hand-ticked subtopic is amber', ticked[0].topics[0].subtopics[1].status === 'in-progress');
ticked = mutate.deletePastPaper(ticked, 'sub1', 'pp4');
check('and stays amber after the paper goes',
  ticked[0].topics[0].subtopics[1].status === 'in-progress',
  ticked[0].topics[0].subtopics[1].status);
check('while the one only the paper had marked goes white',
  ticked[0].topics[0].subtopics[0].status === 'not-started',
  ticked[0].topics[0].subtopics[0].status);

// Full marks twice is mastery; deleting one of them can undo it.
let mastered = base();
mastered = mutate.addPastPaperRecord(mastered, 'sub1', 'Paper 1', paperOn('pp5', 'Jan', 6, 6));
mastered = mutate.addPastPaperRecord(mastered, 'sub1', 'Paper 1', paperOn('pp6', 'May/June', 3, 6));
check('50% and 100% average to 75, which is not mastery',
  mastered[0].topics[0].subtopics[0].status === 'in-progress',
  `${averageScore(mastered[0].topics[0].subtopics[0])}%`);
mastered = mutate.deletePastPaper(mastered, 'sub1', 'pp6');
check('deleting the weaker paper leaves 100% and turns it green',
  mastered[0].topics[0].subtopics[0].status === 'done',
  `${averageScore(mastered[0].topics[0].subtopics[0])}% and ${mastered[0].topics[0].subtopics[0].status}`);
