import { unitStamp } from '../src/lib/helpers.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const sub = (percent, status = 'not-started') => ({
  status,
  scores: percent === null ? [] : [{ id: 'x', percent }],
});
const topic = (mastery, subtopics) => ({ mastery, subtopics });

// MASTERED=4 SOLID=3 LEARNING=2 SHAKY=1 UNRATED=0
const CASES = [
  ['a subtopic keeps its own mastery', unitStamp({ mastery: 4 }), 4],
  ['a topic with no subtopics keeps its own', unitStamp(topic(4, [])), 4],
  ['every subtopic mastered, so the topic may be',
    unitStamp(topic(4, [sub(95), sub(90)])), 4],
  ['two of five mastered caps it at solid — the screenshot that said MASTERED',
    unitStamp(topic(4, [sub(100), sub(95), sub(null), sub(null), sub(null)])), 3],
  ['nothing under it started, so it claims nothing — the one that said SOLID at 80%',
    unitStamp(topic(3, [sub(null), sub(null), sub(null), sub(null), sub(null)])), 0],
  ['covered but none mastered caps at learning',
    unitStamp(topic(4, [sub(60, 'in-progress'), sub(null)])), 2],
  ['a ticked-off subtopic counts as started',
    unitStamp(topic(4, [sub(null, 'done'), sub(null)])), 2],
  ['the cap never raises a weak topic',
    unitStamp(topic(1, [sub(95), sub(92)])), 1],
];

for (const [label, got, want] of CASES) check(label, got === want, `got ${got}, wanted ${want}`);
