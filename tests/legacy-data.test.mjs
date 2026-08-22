// Ledgers written by older versions of the app, and half-formed ones.
//
// The stored ledger has been through several shapes and is edited from more
// than one device, so a subject can arrive without its topics and a topic
// without its subtopics. None of this may throw: rendering nothing for one odd
// subject is a small wrong answer, where throwing takes the whole page with it
// — and the weekly report, which is the home page, walks every subject there
// is.
import * as h from '../src/lib/helpers.js';
import * as mutate from '../src/lib/mutations.js';
import * as feedback from '../src/lib/feedback.js';
import * as palette from '../src/lib/palette.js';
import * as goals from '../src/lib/goals.js';
import { buildWeeklyReport } from '../src/lib/report.js';
import { getSeedData, getPaperCode, getSpecUrl } from '../src/lib/syllabus.js';
import { parseLedger } from '../src/lib/ledgerdata.js';

// Each of these renders something on a page, so throwing takes that page down.
// The value returned matters much less than the fact there is one.
const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const tryIt = (label, fn) => {
  try {
    const value = fn();
    check(label, true, JSON.stringify(value)?.slice(0, 48) ?? 'undefined');
  } catch (e) {
    check(label, false, `threw: ${e.message}`);
  }
};

console.log('\n== a subject missing the fields the app expects ==');
const bare = { id: 's1', name: 'Maths', category: 'study' };
tryIt('computeProgress(subject.topics) when there are none', () => h.computeProgress(bare.topics));
tryIt('computeProgress(undefined)', () => h.computeProgress(undefined));
tryIt('computeProgress(null)', () => h.computeProgress(null));
tryIt('a topic with no subtopics key', () => h.computeProgress([{ id: 't', name: 'X', status: 'done' }]));
tryIt('unitStamp on a topic with no subtopics key', () => h.unitStamp({ id: 't', mastery: 2 }));
tryIt('assignMissingAccents on a subject with no id', () => palette.assignMissingAccents([{ name: 'X' }]).length);
tryIt('assignMissingAccents(undefined)', () => palette.assignMissingAccents(undefined));
tryIt('subjectAccent(undefined)', () => palette.subjectAccent(undefined));
tryIt('accentOrder on a retired hue', () => palette.accentOrder({ accent: '#123456' }));

console.log('\n== old score shapes ==');
tryIt('a unit storing one number as scorePercent', () => h.unitScores({ scorePercent: 80 }).length);
tryIt('averageScore of that unit', () => h.averageScore({ scorePercent: 80 }));
tryIt('a unit with scores: null', () => h.unitScores({ scores: null }).length);
tryIt('a unit with scores: "80"', () => h.unitScores({ scores: '80' }).length);
tryIt('isMastered(undefined)', () => h.isMastered(undefined));
tryIt('averageScore(undefined)', () => h.averageScore(undefined));

console.log('\n== papers with pieces missing ==');
tryIt('paperFeedback on an empty record', () => feedback.paperFeedback({}).summary);
tryIt('paperFeedback with questions: null', () => feedback.paperFeedback({ questions: null }).summary);
tryIt('paperScore on an empty record', () => feedback.paperScore({}));
tryIt('pastPaperLabel with nothing', () => h.pastPaperLabel({}));
tryIt('a paper with no questions applied to a topic', () => mutate.addPastPaperRecord(
  [{ id: 's1', topics: [{ id: 't1', name: 'A', paper: 'Paper 1', subtopics: [] }], pastPapers: [] }],
  's1', 'Paper 1', { id: 'p', paper: 'Paper 1' })[0].pastPapers.length);
tryIt('deleting a paper that is not there', () => mutate.deletePastPaper(
  [{ id: 's1', topics: [], pastPapers: [] }], 's1', 'nope')[0].pastPapers.length);
tryIt('revising a paper that is not there', () => mutate.revisePaperMarks(
  [{ id: 's1', topics: [], pastPapers: [] }], 's1', 'nope', ['1']).length);
tryIt('a subject with no pastPapers key', () => mutate.deletePastPaper(
  [{ id: 's1', topics: [] }], 's1', 'x')[0].pastPapers);

console.log('\n== the weekly report on odd data ==');
tryIt('report of no subjects', () => buildWeeklyReport([], 0).completedCount);
tryIt('report of a subject with no topics', () => buildWeeklyReport([{ id: 's', name: 'M' }], 0).completedCount);
tryIt('a topic done with no completedAt', () => buildWeeklyReport(
  [{ id: 's', name: 'M', topics: [{ id: 't', name: 'X', status: 'done', subtopics: [] }] }], 0).completedCount);
tryIt('a paper with a nonsense uploadedAt', () => buildWeeklyReport(
  [{ id: 's', name: 'M', topics: [], pastPapers: [{ id: 'p', uploadedAt: 'not a date' }] }], 0).paperCount);

console.log('\n== the syllabus ==');
tryIt('a subject nobody has a seed for', () => getSeedData({ name: 'Underwater Basketry', level: 'AS', board: 'Edexcel' }));
tryIt('getSeedData(undefined)', () => getSeedData(undefined));
tryIt('getPaperCode for an unknown subject', () => getPaperCode('AS', 'Nonsense', 'Edexcel'));
tryIt('getSpecUrl for an unknown subject', () => getSpecUrl('AS', 'Nonsense', 'Edexcel'));
tryIt('syncTopicsWithSeed with no topics', () => h.syncTopicsWithSeed([], { 'Paper 1': [{ name: 'A', subtopics: [] }] }).topics.length);
tryIt('syncTopicsWithSeed with an empty seed', () => h.syncTopicsWithSeed([{ id: 't', name: 'Mine' }], {}).topics.length);

console.log('\n== goals with pieces missing ==');
tryIt('effectiveTarget(undefined)', () => goals.effectiveTarget(undefined));
tryIt('goalUnit(undefined)', () => goals.goalUnit(undefined));
tryIt('goalPlaceholder(undefined)', () => goals.goalPlaceholder(undefined));
tryIt('unitCompletion of an empty goal', () => h.unitCompletion({}));
tryIt('setGoalProgress on a goal that is not there', () => mutate.setGoalProgress(
  [{ id: 's', topics: [] }], 's', 'nope', null, 'current', '4').length);

console.log('\n== what comes back from the account ==');
tryIt('parseLedger of a string', () => parseLedger('nonsense'));
tryIt('parseLedger of a number', () => parseLedger(42));
tryIt('parseLedger of items: null', () => parseLedger({ items: null }));

// The one that is a wrong answer rather than a crash: a unit stored with no
// status at all used to count as half covered, so a legacy ledger read as
// further along than it was.
check('a unit with no status is not half covered', h.unitCompletion({}) === 0,
  String(h.unitCompletion({})));
check('a unit that is covered still is', h.unitCompletion({ status: 'in-progress' }) === 0.5);
check('and one that is done still is', h.unitCompletion({ status: 'done' }) === 1);
