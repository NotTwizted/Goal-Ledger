import {
  STATUS_ORDER,
  averageScore,
  isMastered,
  findTextMatch,
  masteryFromScore,
  newUnit,
  parseMarkInput,
  normText,
  recordedScore,
  syncTopicsWithSeed,
  uid,
  unitScores,
} from './helpers';
import { effectiveTarget } from './goals';

// Every function here takes the current subject list and returns the next one,
// so pages never have to hand-roll a nested spread.

// Deleting a topic or subtopic sets it aside instead of destroying it, so
// reloading the standard checklist can bring it back with its recorded
// progress. The cap stops a long-lived ledger growing without bound.
const ARCHIVE_LIMIT = 100;

const archive = (list, item) => (item ? [...(list || []), item].slice(-ARCHIVE_LIMIT) : (list || []));

const mapSubject = (subjects, subjectId, fn) =>
  subjects.map(s => (s.id === subjectId ? fn(s) : s));

const mapTopic = (subject, topicId, fn) => ({
  ...subject,
  topics: subject.topics.map(t => (t.id === topicId ? fn(t) : t)),
});

// Ticking says "I have covered this" and turns the circle amber. It cannot
// reach green — that belongs to the marks, and is applied by withMastery below.
const toggleCovered = (unit) => {
  if (isMastered(unit)) return unit;
  const covered = unit.status !== 'not-started';
  return covered
    ? { ...unit, status: 'not-started', coveredAt: null }
    : { ...unit, status: 'in-progress', coveredAt: new Date().toISOString() };
};

// Green follows the average, both ways: crossing the threshold marks a unit
// mastered and stamps when; falling back below returns it to however far the
// student had got by hand.
const withMastery = (unit) => {
  if (isMastered(unit)) {
    return unit.status === 'done'
      ? unit
      : { ...unit, status: 'done', completedAt: new Date().toISOString() };
  }
  if (unit.status !== 'done') return unit;
  return { ...unit, status: unit.coveredAt ? 'in-progress' : 'not-started', completedAt: null };
};

// scorePercent stays written as the average so progress, sorting and the
// mastery stamp keep reading one number.
const withScores = (unit, scores) => {
  const next = { ...unit, scores };
  const average = averageScore(next);
  return withMastery({
    ...next,
    scorePercent: average,
    mastery: average === null ? 0 : masteryFromScore(average),
  });
};

const addScore = (unit, mark, label) => {
  if (!mark) return unit;
  return withScores(unit, [...unitScores(unit), { id: uid(), ...mark, label }]);
};

// Folds marks from an uploaded paper into a unit's running totals and
// recalculates its score percentage from them.
// One upload contributes one mark per unit, however many questions on it
// touched that unit — so a paper counts once in the average, like a test does.
const withPaperMarks = (unit, scored, available, label) => {
  if (!(available > 0)) return unit;
  const percent = Math.max(0, Math.min(100, Math.round((scored / available) * 100)));
  return addScore(unit, { percent, scored, total: available }, label);
};

export function addTopic(subjects, subjectId, name, paper) {
  return mapSubject(subjects, subjectId, s => ({
    ...s,
    topics: [...s.topics, { ...newUnit(name), ...(paper ? { paper } : {}), subtopics: [] }],
  }));
}

export function deleteTopic(subjects, subjectId, topicId) {
  return mapSubject(subjects, subjectId, s => ({
    ...s,
    topics: s.topics.filter(t => t.id !== topicId),
    archivedTopics: archive(s.archivedTopics, s.topics.find(t => t.id === topicId)),
  }));
}

export function cycleTopicStatus(subjects, subjectId, topicId) {
  return mapSubject(subjects, subjectId, s => mapTopic(s, topicId, toggleCovered));
}

const mapUnit = (subject, topicId, subtopicId, fn) =>
  mapTopic(subject, topicId, t => (subtopicId
    ? { ...t, subtopics: (t.subtopics || []).map(st => (st.id === subtopicId ? fn(st) : st)) }
    : fn(t)));

// Takes "45/60" or "75" — whichever the student has in front of them.
export function addUnitScore(subjects, subjectId, topicId, subtopicId, input, label) {
  const mark = parseMarkInput(input);
  if (!mark) return subjects;
  return mapSubject(subjects, subjectId, s =>
    mapUnit(s, topicId, subtopicId, u => addScore(u, mark, label)));
}

export function removeUnitScore(subjects, subjectId, topicId, subtopicId, scoreId) {
  return mapSubject(subjects, subjectId, s =>
    mapUnit(s, topicId, subtopicId, u => withScores(u, unitScores(u).filter(x => x.id !== scoreId))));
}

// A general goal is measured against a target rather than marked out of a
// paper: how many you can do now against how many you are aiming for. The
// target usually comes from the goal's own name. Status follows from the two,
// so reaching the target is what completes it.
const applyGoalProgress = (unit, field, number) => {
  const next = { ...unit, [field]: number };
  const target = Number(effectiveTarget(next)) || 0;
  const current = Number(next.current) || 0;

  if (target <= 0) return { ...next, scorePercent: null };

  const percent = Math.min(100, Math.round((current / target) * 100));
  const status = current >= target ? 'done' : current > 0 ? 'in-progress' : 'not-started';
  return {
    ...next,
    scorePercent: percent,
    mastery: masteryFromScore(percent),
    status,
    completedAt: status === 'done' ? (unit.completedAt || new Date().toISOString()) : null,
    coveredAt: status === 'in-progress' ? (unit.coveredAt || new Date().toISOString()) : unit.coveredAt,
  };
};

export function setGoalProgress(subjects, subjectId, topicId, subtopicId, field, value) {
  const number = value === '' ? null : Math.max(0, Number(value));
  if (number !== null && Number.isNaN(number)) return subjects;
  return mapSubject(subjects, subjectId, s =>
    mapUnit(s, topicId, subtopicId, u => applyGoalProgress(u, field, number)));
}

// A goal with no number in it — "book a venue" — is a plain thing to be done,
// so its circle cycles the whole way round by hand.
export function cycleGoalStatus(subjects, subjectId, topicId, subtopicId) {
  return mapSubject(subjects, subjectId, s =>
    mapUnit(s, topicId, subtopicId, u => {
      const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(u.status) + 1) % STATUS_ORDER.length];
      return {
        ...u,
        status: nextStatus,
        completedAt: nextStatus === 'done' ? new Date().toISOString() : null,
        coveredAt: nextStatus === 'in-progress' ? new Date().toISOString() : u.coveredAt,
      };
    }));
}

export function setTopicMastery(subjects, subjectId, topicId, value) {
  return mapSubject(subjects, subjectId, s =>
    mapTopic(s, topicId, t => ({ ...t, mastery: t.mastery === value ? 0 : value })));
}

export function addSubtopic(subjects, subjectId, topicId, name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return subjects;
  return mapSubject(subjects, subjectId, s =>
    mapTopic(s, topicId, t => ({ ...t, subtopics: [...(t.subtopics || []), newUnit(trimmed)] })));
}

export function deleteSubtopic(subjects, subjectId, topicId, subtopicId) {
  return mapSubject(subjects, subjectId, s =>
    mapTopic(s, topicId, t => ({
      ...t,
      subtopics: (t.subtopics || []).filter(st => st.id !== subtopicId),
      archivedSubtopics: archive(t.archivedSubtopics, (t.subtopics || []).find(st => st.id === subtopicId)),
    })));
}

export function cycleSubtopicStatus(subjects, subjectId, topicId, subtopicId) {
  return mapSubject(subjects, subjectId, s =>
    mapTopic(s, topicId, t => ({
      ...t,
      subtopics: (t.subtopics || []).map(st => (st.id === subtopicId ? toggleCovered(st) : st)),
    })));
}

export function appendImportedTopics(subjects, subjectId, groups, paper) {
  return mapSubject(subjects, subjectId, s => {
    const existing = new Set(s.topics.map(t => normText(t.name)));
    const additions = groups
      .filter(g => !existing.has(normText(g.name)))
      .map(g => ({
        ...newUnit(g.name),
        paper: paper || 'Paper 1',
        subtopics: g.subtopics.map(newUnit),
      }));
    return { ...s, topics: [...s.topics, ...additions] };
  });
}

export function appendImportedMilestones(subjects, subjectId, names) {
  return mapSubject(subjects, subjectId, s => {
    const existing = new Set(s.topics.map(t => normText(t.name)));
    const additions = names
      .filter(n => !existing.has(normText(n)))
      .map(n => ({ ...newUnit(n), subtopics: [] }));
    return { ...s, topics: [...s.topics, ...additions] };
  });
}

// Restores the standard checklist: every syllabus topic and subtopic comes
// back in its canonical position, keeping the progress already recorded.
export function applySeedChecklist(subjects, subjectId, seed) {
  return mapSubject(subjects, subjectId, s => {
    const { topics, archivedTopics } = syncTopicsWithSeed(s.topics, seed, s.archivedTopics || []);
    return { ...s, topics, archivedTopics };
  });
}

// Every question on the paper counts, not only the ones that went wrong:
// a percentage built from mistakes alone would score a near-perfect paper as
// though the student had only attempted the questions they fumbled.
// Older records stored just the mistakes, so those are converted back into
// per-question marks and read the same way.
function questionsOf(record) {
  if (Array.isArray(record.questions) && record.questions.length) return record.questions;
  return (record.mistakes || []).map(m => ({
    topic: m.topic,
    subtopic: m.topic,
    marksScored: Math.max(0, (Number(m.marksAvailable) || 0) - (Number(m.marksLost) || 0)),
    marksAvailable: Number(m.marksAvailable) || 0,
  }));
}

// Sums the marks each unit earned across the whole paper, so one upload
// leaves one mark per unit.
function tallyQuestions(questions, resolve) {
  const tally = new Map();
  questions.forEach(q => {
    const available = Number(q.marksAvailable) || 0;
    if (available <= 0) return;
    // A question read off the PDF but never marked says nothing about how well
    // the topic is known, so it is left out rather than counted as a nought.
    const scored = recordedScore(q);
    if (scored === null) return;
    const unitId = resolve(q);
    if (!unitId) return;
    const entry = tally.get(unitId) || { scored: 0, available: 0 };
    entry.scored += Math.max(0, Math.min(available, scored));
    entry.available += available;
    tally.set(unitId, entry);
  });
  return tally;
}

// A question that names a topic belongs to that topic and to no other.
//
// Without this, a question labelled "Quadratics" also credited Differentiation,
// which has a subtopic called "Differentiating quadratics". The loose name
// matching that lets "Inhibition" find "Enzyme inhibition" cannot tell those
// two cases apart, so the question's own label settles it.
const withOwners = (questions, topics) => questions.map(q => {
  const named = q.topic && findTextMatch(q.topic, topics);
  return named ? { ...q, ownerTopicId: named.id } : q;
});

// Whether a question belongs to this topic at all: by naming one of its
// subtopics, or by naming the topic itself.
const questionHitsTopic = (q, topic) => {
  if (q.ownerTopicId) return q.ownerTopicId === topic.id;
  const labels = [q.subtopic, q.topic].filter(Boolean);
  if (!labels.length) return false;
  if ((topic.subtopics || []).length && labels.some(l => findTextMatch(l, topic.subtopics))) return true;
  const name = normText(topic.name);
  return labels.some(l => {
    const label = normText(l);
    return label === name || label.includes(name) || name.includes(label);
  });
};

const subtopicOf = (q, topic) => {
  if (q.ownerTopicId && q.ownerTopicId !== topic.id) return null;
  return (q.subtopic && findTextMatch(q.subtopic, topic.subtopics)?.id)
    || (q.topic && findTextMatch(q.topic, topic.subtopics)?.id)
    || null;
};

// A paper leaves two kinds of mark on a topic: one on each subtopic it tested,
// and one on the topic as a whole, taken over every question that belonged to
// it. The second is what makes a topic's mastery move with the paper — and it
// catches questions labelled only with the topic, which used to score nothing
// at all on a topic that had subtopics.
function applyPaperToTopic(topic, questions, label) {
  const hasSubtopics = (topic.subtopics || []).length > 0;

  const topicMarks = tallyQuestions(questions, q => (questionHitsTopic(q, topic) ? topic.id : null)).get(topic.id);
  let next = topicMarks ? withPaperMarks(topic, topicMarks.scored, topicMarks.available, label) : topic;

  if (!hasSubtopics) return next;

  const perSubtopic = tallyQuestions(questions, q => subtopicOf(q, topic));
  if (!perSubtopic.size) return next;

  return {
    ...next,
    subtopics: next.subtopics.map(st => {
      const marks = perSubtopic.get(st.id);
      return marks ? withPaperMarks(st, marks.scored, marks.available, label) : st;
    }),
  };
}

export function addPastPaperRecord(subjects, subjectId, paper, record) {
  return mapSubject(subjects, subjectId, s => {
    const label = record.session && record.year ? `${record.session} ${record.year}` : 'Past paper';
    const questions = withOwners(questionsOf(record), s.topics);
    const topics = s.topics.map(t =>
      ((t.paper || 'Paper 1') === paper ? applyPaperToTopic(t, questions, label) : t));
    return { ...s, topics, pastPapers: [...(s.pastPapers || []), record] };
  });
}

const mistakesFrom = (questions) => questions
  .filter(q => recordedScore(q) !== null && (Number(q.marksAvailable) || 0) > recordedScore(q))
  .map(q => ({
    question: q.question,
    topic: q.subtopic || q.topic,
    mistake: q.mistake || null,
    marksLost: (Number(q.marksAvailable) || 0) - recordedScore(q),
    marksAvailable: Number(q.marksAvailable) || 0,
  }));

// A paper read straight out of the PDF has its questions and their mark
// allocations but not what the student scored, so nothing reached the topics
// when it was added. Filling the marks in is the moment it does — and the flag
// it clears is what stops the same paper counting twice.
export function recordPaperMarks(subjects, subjectId, pastPaperId, scores) {
  return mapSubject(subjects, subjectId, s => {
    const record = (s.pastPapers || []).find(pp => pp.id === pastPaperId);
    if (!record || !record.needsMarks) return s;

    const questions = (record.questions || []).map((q, i) => {
      const entered = scores[i];
      const value = entered === '' || entered === null || entered === undefined ? null : Number(entered);
      return { ...q, marksScored: Number.isFinite(value) ? value : null };
    });
    if (!questions.some(q => recordedScore(q) !== null)) return s;

    const filled = { ...record, questions, needsMarks: false, mistakes: mistakesFrom(questions) };
    const label = record.session && record.year ? `${record.session} ${record.year}` : 'Past paper';

    const owned = withOwners(questions, s.topics);

    return {
      ...s,
      topics: s.topics.map(t =>
        ((t.paper || 'Paper 1') === record.paper ? applyPaperToTopic(t, owned, label) : t)),
      pastPapers: (s.pastPapers || []).map(pp => (pp.id === pastPaperId ? filled : pp)),
    };
  });
}

export function deletePastPaper(subjects, subjectId, pastPaperId) {
  return mapSubject(subjects, subjectId, s => ({
    ...s,
    pastPapers: (s.pastPapers || []).filter(pp => pp.id !== pastPaperId),
  }));
}

export function addUnitTestRecord(subjects, subjectId, topicId, record) {
  return mapSubject(subjects, subjectId, s =>
    mapTopic(s, topicId, t => ({
      ...applyPaperToTopic(t, questionsOf({ questions: record.details }), 'Unit test'),
      unitTests: [...(t.unitTests || []), record],
    })));
}

export function deleteSubject(subjects, subjectId) {
  return subjects.filter(s => s.id !== subjectId);
}
