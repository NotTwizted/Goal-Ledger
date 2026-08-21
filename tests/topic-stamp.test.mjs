import { unitStamp, masteredFraction } from '../src/lib/helpers.js';
import * as mutate from '../src/lib/mutations.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const sub = (percent, status = 'not-started') => ({
  id: `s${percent}${status}`,
  status,
  scores: percent === null ? [] : [{ id: 'x', percent }],
});
const topic = (mastery, subtopics) => ({ mastery, subtopics });

// A topic is as mastered as its parts, not as its own paper marks.
// MASTERED=4 SOLID=3 LEARNING=2 SHAKY=1 UNRATED=0
const CASES = [
  ['two of five mastered is 40%', masteredFraction(topic(4, [sub(100), sub(95), sub(null), sub(null), sub(null)])), 40],
  ['and reads as learning', unitStamp(topic(4, [sub(100), sub(95), sub(null), sub(null), sub(null)])), 2],
  ['none mastered is 0%', masteredFraction(topic(3, [sub(null), sub(null), sub(null)])), 0],
  ['and claims nothing', unitStamp(topic(3, [sub(null), sub(null), sub(null)])), 0],
  ['all five mastered is 100%', masteredFraction(topic(0, [sub(95), sub(92), sub(90), sub(99), sub(91)])), 100],
  ['and only then is the topic mastered', unitStamp(topic(0, [sub(95), sub(92), sub(90), sub(99), sub(91)])), 4],
  ['four of five is solid', unitStamp(topic(0, [sub(95), sub(92), sub(90), sub(99), sub(null)])), 3],
  ['one of five is shaky', unitStamp(topic(4, [sub(95), sub(null), sub(null), sub(null), sub(null)])), 1],
  ['a subtopic has no parts, so keeps its own marks', masteredFraction({ mastery: 4 }), null],
  ['a subtopic keeps its own stamp', unitStamp({ mastery: 4 }), 4],
];

for (const [label, got, want] of CASES) check(label, got === want, `got ${got}, wanted ${want}`);

// A mark recorded against a subtopic means it has been sat: amber below the
// threshold, green at or above it. It used to stay white until hand-ticked.
const subjects = [{
  id: 'sub1', name: 'Maths', category: 'study',
  topics: [{
    id: 't1', name: 'Graphs and transformations', paper: 'Paper 1', status: 'not-started',
    subtopics: [
      { id: 'a', name: 'Reciprocal graphs', status: 'not-started' },
      { id: 'b', name: 'Translating graphs', status: 'not-started' },
      { id: 'c', name: 'Stretching graphs', status: 'not-started' },
    ],
  }],
  pastPapers: [],
}];

const paper = {
  id: 'pp1', paper: 'Paper 1', session: 'Oct/Nov', year: '2025',
  uploadedAt: new Date().toISOString(),
  questions: [
    { question: '6a', topic: 'Graphs and transformations', subtopic: 'Reciprocal graphs', marksScored: 3, marksAvailable: 4 },
    { question: '9b', topic: 'Graphs and transformations', subtopic: 'Translating graphs', marksScored: 2, marksAvailable: 2 },
  ],
  mistakes: [],
};

const after = mutate.addPastPaperRecord(subjects, 'sub1', 'Paper 1', paper);
const [reciprocal, translating, stretching] = after[0].topics[0].subtopics;

check('a 75% mark turns the circle amber, not white', reciprocal.status === 'in-progress', reciprocal.status);
check('and stamps when it was covered', Boolean(reciprocal.coveredAt));
check('full marks turn it green', translating.status === 'done', translating.status);
check('an untested subtopic is still untouched', stretching.status === 'not-started', stretching.status);
check('so the topic is one of three mastered', masteredFraction(after[0].topics[0]) === 33,
  String(masteredFraction(after[0].topics[0])));

// The same for a ledger written before a mark ticked the circle: the marks
// were recorded, only the status was left behind.
const stale = [{
  id: 'sub1', name: 'Maths', category: 'study',
  topics: [{
    id: 't1', name: 'Quadratics', status: 'not-started',
    subtopics: [
      { id: 'a', name: 'Completing the square', status: 'not-started', scores: [{ id: '1', percent: 100 }] },
      { id: 'b', name: 'The discriminant', status: 'not-started', scores: [{ id: '2', percent: 60 }] },
      { id: 'c', name: 'The quadratic formula', status: 'not-started' },
    ],
  }],
}];

const fixed = mutate.syncStatusWithMarks(stale);
const [square, discriminant, formula] = fixed[0].topics[0].subtopics;
check('a 100% mark left white turns green', square.status === 'done', square.status);
check('a 60% mark left white turns amber', discriminant.status === 'in-progress', discriminant.status);
check('one with no marks is untouched still', formula.status === 'not-started', formula.status);
check('a ledger with nothing to fix is returned as it was',
  mutate.syncStatusWithMarks(fixed) === fixed);
