// The demo ledger is built by running the same mutations a real user would,
// so these checks are really asking whether that path still works end to end.
import { buildDemoLedger } from '../src/lib/demo.js';
import { computeProgress, unitScores, averageScore } from '../src/lib/helpers.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const subjects = buildDemoLedger();
const maths = subjects.find(s => s.name === 'Maths');
const physics = subjects.find(s => s.name === 'Physics');
const fitness = subjects.find(s => s.name === 'Fitness');

check('it has something to look at', subjects.length === 3, subjects.map(s => s.name).join(', '));
check('every subject has its own colour',
  new Set(subjects.map(s => s.accent)).size === subjects.length,
  subjects.map(s => s.accent).join(' '));

check('maths has its standard topics', (maths?.topics || []).length >= 15, `${maths?.topics.length}`);
check('and a paper on record', (maths?.pastPapers || []).length === 1);
check('the paper is dated, so the week can find it', Boolean(maths.pastPapers[0].uploadedAt));

const marked = maths.topics.filter(t => unitScores(t).length > 0);
check('the paper moved mastery on the topics it tested', marked.length >= 6,
  marked.map(t => `${t.name} ${averageScore(t)}%`).join(', '));

const quadratics = maths.topics.find(t => t.name === 'Quadratics');
const completing = (quadratics?.subtopics || []).find(st => /Completing/.test(st.name));
check('a subtopic answered perfectly is green', completing?.status === 'done',
  `${completing?.name}: ${completing?.status}`);

const trig = maths.topics.find(t => t.name === 'Trigonometric ratios');
const triangles = (trig?.subtopics || []).find(st => st.name === 'Solving triangle problems');
check('one answered badly is amber, not green', triangles?.status === 'in-progress',
  `${triangles?.name}: ${triangles?.status} at ${averageScore(triangles)}%`);

check('untested topics are untouched',
  maths.topics.some(t => unitScores(t).length === 0 && t.status === 'not-started'));

check('physics has topics ticked off by hand',
  (physics?.topics || []).some(t => (t.subtopics || []).some(st => st.status === 'in-progress')));

check('there are goals as well as subjects', (fitness?.topics || []).length === 2,
  (fitness?.topics || []).map(t => t.name).join(', '));
const pullups = fitness?.topics?.[0];
check('and one of them is part done', Number(pullups?.current) === 6, String(pullups?.current));
check('which reads as 6 of the 10 in its name',
  computeProgress([pullups]) === 60, `${computeProgress([pullups])}%`);

check('maths shows real progress, not none and not all',
  computeProgress(maths.topics) > 0 && computeProgress(maths.topics) < 100,
  `${computeProgress(maths.topics)}%`);

// Building it twice must not produce colliding ids, or React keys break.
const second = buildDemoLedger();
check('two builds do not share ids',
  subjects[0].id !== second[0].id && subjects[0].topics[0].id !== second[0].topics[0].id);
