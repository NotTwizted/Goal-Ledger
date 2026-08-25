// Ticking off a whole paper at once. The interesting part is everything it
// must leave alone: a bulk tick that overwrote real progress would be worse
// than no button at all, and there is no undo for it.
import * as mutate from '../src/lib/mutations.js';
import { unitScores, averageScore, computeProgress } from '../src/lib/helpers.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const sub = (id, name, status = 'not-started', extra = {}) => ({ id, name, status, ...extra });

const ledger = () => [{
  id: 's1', name: 'Maths', category: 'study', pastPapers: [],
  topics: [
    { id: 't1', name: 'Quadratics', paper: 'Paper 1', status: 'not-started', subtopics: [
      sub('a', 'Completing the square'),
      sub('b', 'The discriminant', 'in-progress', { coveredAt: '2026-01-01T00:00:00Z' }),
      sub('c', 'The quadratic formula', 'done', { scores: [{ id: 'x', percent: 95 }] }),
      sub('d', 'Sketching quadratics', 'not-started', { scores: [{ id: 'y', percent: 60 }] }),
    ] },
    { id: 't2', name: 'Radians', paper: 'Paper 1', status: 'not-started', subtopics: [] },
    { id: 't3', name: 'Mechanics', paper: 'Paper 2', status: 'not-started', subtopics: [sub('e', 'Forces')] },
  ],
}];

const before = ledger();
check('it counts only what it would actually change',
  mutate.coverableCount(before[0].topics.filter(t => t.paper === 'Paper 1')) === 2,
  String(mutate.coverableCount(before[0].topics.filter(t => t.paper === 'Paper 1'))));

const after = mutate.coverAllTopics(before, 's1', 'Paper 1');
const [quad, radians, mech] = after[0].topics;
const [square, discriminant, formula, sketching] = quad.subtopics;

check('an untouched subtopic turns amber', square.status === 'in-progress', square.status);
check('and is stamped with when', Boolean(square.coveredAt));
check('one already covered keeps the date it was covered',
  discriminant.status === 'in-progress' && discriminant.coveredAt === '2026-01-01T00:00:00Z',
  discriminant.coveredAt);
check('a mastered one stays mastered', formula.status === 'done', formula.status);
check('one carrying marks is left to its marks',
  sketching.status === 'not-started' && averageScore(sketching) === 60,
  `${sketching.status} at ${averageScore(sketching)}%`);
check('a topic with no subtopics is covered itself',
  radians.status === 'in-progress', radians.status);
check('another paper is untouched',
  mech.subtopics[0].status === 'not-started', mech.subtopics[0].status);

check('completion moved', computeProgress(after[0].topics) > computeProgress(before[0].topics),
  `${computeProgress(before[0].topics)}% → ${computeProgress(after[0].topics)}%`);

// Pressing it again must be a no-op, or a second press would restamp every
// date and make the weekly report claim the work happened twice.
const twice = mutate.coverAllTopics(after, 's1', 'Paper 1');
check('nothing left to cover afterwards',
  mutate.coverableCount(twice[0].topics.filter(t => t.paper === 'Paper 1')) === 0);
check('and a second press changes nothing',
  twice[0].topics[0].subtopics[0].coveredAt === square.coveredAt);

// No paper given means the whole subject.
const all = mutate.coverAllTopics(ledger(), 's1', null);
check('with no paper named it covers every one',
  all[0].topics[2].subtopics[0].status === 'in-progress',
  all[0].topics[2].subtopics[0].status);

check('a subject that is not there is left alone',
  mutate.coverAllTopics(ledger(), 'nope', 'Paper 1')[0].topics[0].subtopics[0].status === 'not-started');
check('marks are never added by it', unitScores(square).length === 0);
