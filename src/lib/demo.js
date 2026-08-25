// A ledger to look around in without signing up for anything.
//
// Built by running the same mutations a real user would — load the standard
// topics, tick some off, apply a marked paper — rather than by writing out a
// finished state by hand. That way the demo cannot drift from how the app
// actually behaves: if applying a paper stops moving mastery, the demo stops
// showing mastery too, and the fault is visible rather than papered over.
//
// It is held in memory for as long as the tab is open and written down
// nowhere — not to an account, not to this browser. A refresh ends it and
// takes everything done in it. That is what makes it safe to hand to anybody:
// there is nothing to clean up afterwards and nothing of theirs left behind.
//
// It is also why a shared demo login would have been the wrong answer. An
// account persists by definition, so everyone looking around would have been
// editing the same row as everyone else, and whatever the last person did
// would be what the next one found.

import { getSeedData } from './syllabus';
import * as mutate from './mutations';
import { uid } from './helpers';
import { nextSubjectAccent } from './palette';

const subject = (subjects, fields) => ({
  id: uid(),
  accent: nextSubjectAccent(subjects),
  spec: [fields.level, fields.board, (fields.components || []).join(', ')].filter(Boolean).join(' · '),
  level: '',
  board: '',
  components: [],
  target: '',
  deadline: '',
  topics: [],
  pastPapers: [],
  ...fields,
});

// The October 2025 Pure paper, as reading it actually leaves it: a mark on
// every question, two of them dropped.
const PAPER = {
  id: 'demo-paper',
  paper: 'Paper 1',
  fileName: 'IAL_MATHS_2025_Oct_P1.pdf',
  session: 'Oct/Nov',
  year: '2025',
  readBy: 'model',
  feedback: {
    summary: '66 out of 75. The marks went on trigonometry and on reading what the question asked for, rather than on the algebra itself.',
    areas: [
      {
        topic: 'Trigonometric ratios',
        problem: 'Treated the ratio of the sides as the ratio of the angles, so the largest angle was wrong and part (b) inherited it.',
        action: 'Three sides means the cosine rule. Write it out before substituting, and check the angle you get is the one opposite the longest side.',
      },
      {
        topic: 'Graphs and transformations',
        problem: 'The y-intercept of the reciprocal sketch came out as (0, −1/2) instead of (0, −2).',
        action: 'Substitute x = 0 into the equation and solve it on the page rather than reading the intercept off the shape.',
      },
    ],
  },
  questions: [
    { question: '1a', topic: 'Differentiation', subtopic: 'Differentiating xⁿ', marksScored: 3, marksAvailable: 3, page: 3 },
    { question: '1b', topic: 'Differentiation', subtopic: 'Gradients, tangents, and normals', marksScored: 3, marksAvailable: 3, page: 3 },
    { question: '2', topic: 'Integration', subtopic: 'Finding the indefinite integral', marksScored: 4, marksAvailable: 5, page: 5, mistake: 'Simplified 12/2 to 4 instead of 6 in the integrated term.' },
    { question: '3a', topic: 'Trigonometric ratios', subtopic: 'Solving triangle problems', marksScored: 0, marksAvailable: 2, page: 7, mistake: 'Assumed the side ratios divided 180° rather than using the cosine rule.' },
    { question: '3b', topic: 'Trigonometric ratios', subtopic: 'Solving triangle problems', marksScored: 2, marksAvailable: 3, page: 7, mistake: 'Carried the wrong angle through from part (a).' },
    { question: '4', topic: 'Algebraic expressions', subtopic: 'Laws of indices', marksScored: 7, marksAvailable: 7, page: 11 },
    { question: '5', topic: 'Quadratics', subtopic: 'Completing the square', marksScored: 10, marksAvailable: 10, page: 15 },
    { question: '6', topic: 'Graphs and transformations', subtopic: 'Reciprocal graphs', marksScored: 8, marksAvailable: 9, page: 19, mistake: 'Read the y-intercept as (0, −1/2) instead of (0, −2).' },
    { question: '7', topic: 'Radians', subtopic: 'Areas of sectors and segments', marksScored: 9, marksAvailable: 9, page: 23 },
    { question: '8', topic: 'Differentiation', subtopic: 'Gradients, tangents, and normals', marksScored: 8, marksAvailable: 8, page: 27 },
    { question: '9', topic: 'Trigonometric ratios', subtopic: 'Transforming trigonometric graphs', marksScored: 4, marksAvailable: 6, page: 29, mistake: 'Identified a sine curve through the origin as a cosine curve.' },
    { question: '10', topic: 'Differentiation', subtopic: 'Gradients, tangents, and normals', marksScored: 8, marksAvailable: 10, page: 32, mistake: 'Gave a full coordinate pair where only the x coordinate was asked for.' },
  ],
  mistakes: [],
};

// A few days apart, so the weekly report has something in it and the dates do
// not all read as the same instant.
const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString();

export function buildDemoLedger() {
  let subjects = [];

  const maths = subject(subjects, {
    name: 'Maths', category: 'study', level: 'AS',
    board: 'Edexcel International', components: ['Pure'],
  });
  subjects = [...subjects, maths];
  subjects = mutate.applySeedChecklist(subjects, maths.id, getSeedData(maths));

  const physics = subject(subjects, {
    name: 'Physics', category: 'study', level: 'AS', board: 'Edexcel International',
  });
  subjects = [...subjects, physics];
  const physicsSeed = getSeedData(physics);
  if (physicsSeed) subjects = mutate.applySeedChecklist(subjects, physics.id, physicsSeed);

  const fitness = subject(subjects, { name: 'Fitness', category: 'general' });
  subjects = [...subjects, fitness];
  subjects = mutate.appendImportedMilestones(subjects, fitness.id, ['Do 10 pullups', 'Run 5km without stopping']);

  // The paper is what makes the rest of it mean anything: it is what puts
  // marks on the topics and turns the circles amber and green.
  subjects = mutate.addPastPaperRecord(subjects, maths.id, 'Paper 1',
    { ...PAPER, uploadedAt: daysAgo(2) });

  // A couple of things worked through by hand, so the week shows both kinds of
  // progress — ticked off, and proven by marks.
  const physicsTopics = subjects.find(s => s.id === physics.id)?.topics || [];
  physicsTopics.slice(0, 2).forEach(topic => {
    (topic.subtopics || []).slice(0, 2).forEach(st => {
      subjects = mutate.cycleSubtopicStatus(subjects, physics.id, topic.id, st.id);
    });
  });

  const pullups = subjects.find(s => s.id === fitness.id)?.topics?.[0];
  if (pullups) subjects = mutate.setGoalProgress(subjects, fitness.id, pullups.id, null, 'current', '6');

  return subjects;
}

// Earlier versions kept the demo in this browser. Anyone who tried it then
// still has that lying about, so it is cleared on the way in.
export function clearStoredDemo() {
  try {
    localStorage.removeItem('study-tracker:demo');
  } catch (e) {
    // No storage to clear.
  }
}
