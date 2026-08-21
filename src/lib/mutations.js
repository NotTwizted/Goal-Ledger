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
//
// And a mark recorded against a unit means it has been sat, so the circle is
// at least amber. It used to stay white until somebody ticked it, which read
// as "never touched" on subtopics a paper had just tested.
const withMastery = (unit) => {
  if (isMastered(unit)) {
    return unit.status === 'done'
      ? unit
      : { ...unit, status: 'done', completedAt: new Date().toISOString() };
  }

  const marked = unitScores(unit).length > 0;

  // The marks that made this amber are gone and nothing was ticked by hand, so
  // it goes back to untouched. Without this, deleting a paper left every
  // subtopic it had marked looking as though the student had covered it.
  if (!marked && unit.coveredByMarks) {
    return { ...unit, status: 'not-started', coveredAt: null, completedAt: null, coveredByMarks: false };
  }

  if (unit.status === 'done') {
    return {
      ...unit,
      status: unit.coveredAt || marked ? 'in-progress' : 'not-started',
      coveredAt: unit.coveredAt || (marked ? new Date().toISOString() : null),
      coveredByMarks: unit.coveredAt ? unit.coveredByMarks : marked,
      completedAt: null,
    };
  }

  if (marked && unit.status === 'not-started') {
    return {
      ...unit,
      status: 'in-progress',
      coveredAt: unit.coveredAt || new Date().toISOString(),
      coveredByMarks: !unit.coveredAt,
    };
  }

  return unit;
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

const addScore = (unit, mark, label, sourceId) => {
  if (!mark) return unit;
  return withScores(unit, [...unitScores(unit), { id: uid(), ...mark, label, ...(sourceId ? { sourceId } : {}) }]);
};

// Folds marks from an uploaded paper into a unit's running totals and
// recalculates its score percentage from them.
// One upload contributes one mark per unit, however many questions on it
// touched that unit — so a paper counts once in the average, like a test does.
const withPaperMarks = (unit, scored, available, label, sourceId) => {
  if (!(available > 0)) return unit;
  const percent = Math.max(0, Math.min(100, Math.round((scored / available) * 100)));
  return addScore(unit, { percent, scored, total: available }, label, sourceId);
};

// Papers uploaded before a mark ticked the circle left their subtopics white,
// which read as never touched. Nothing about the ledger changes here — the
// marks were already recorded — the status is simply brought into line with
// them, once, so old uploads look like new ones.
export function syncStatusWithMarks(subjects) {
  // Nothing is rebuilt that did not change, so a ledger already in line comes
  // back as the same object and the backfill writes nothing.
  const mapChanged = (list, fn) => {
    let changed = false;
    const next = (list || []).map(item => {
      const fixed = fn(item);
      if (fixed !== item) changed = true;
      return fixed;
    });
    return changed ? next : list;
  };

  return mapChanged(subjects, subject => {
    const topics = mapChanged(subject.topics, topic => {
      const subtopics = mapChanged(topic.subtopics, withMastery);
      const base = subtopics === topic.subtopics ? topic : { ...topic, subtopics };
      return withMastery(base);
    });
    return topics === subject.topics ? subject : { ...subject, topics };
  });
}

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

// "Polynomial differentiation" and "Differentiating xⁿ" are the same thing said
// twice, and neither contains the other, so matching on names alone loses it.
// Comparing word stems does not: differentiation and differentiating both stem
// to differentiat, tangent and tangents to tangent.
// Strip the ending, then keep the first seven letters. Both halves are needed:
// differentiating loses its "ing" and differentiation keeps its "ion", so only
// the truncation brings them together as "differe" — while tangent and
// tangents need the ending gone before truncating, or they part at the eighth
// letter. Words under five letters carry too little to count.
const stem = (word) => word.replace(/(ing|ies|es|ed|s)$/, '').slice(0, 7);

const stemsOf = (name) => new Set(
  (name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .map(stem).filter(w => w.length >= 5));

// Half the shorter name's words in common is enough to be the same subtopic —
// "Equation of tangent" and "Gradients, tangents, and normals" share only
// "tangent", and that one word is the whole of what either is about.
const stemMatch = (label, subtopics) => {
  const wanted = stemsOf(label);
  if (!wanted.size) return null;

  let best = null;
  let bestScore = 0.5;
  subtopics.forEach(st => {
    const have = stemsOf(st.name);
    if (!have.size) return;
    const shared = [...wanted].filter(w => have.has(w)).length;
    const score = shared / Math.min(wanted.size, have.size);
    if (score >= bestScore && shared >= 1) {
      // A tie goes to the name that shares more, not merely a larger share.
      if (score > bestScore || !best || shared > [...wanted].filter(w => stemsOf(best.name).has(w)).length) {
        best = st;
        bestScore = score;
      }
    }
  });
  return best;
};

const subtopicOf = (q, topic) => {
  if (q.ownerTopicId && q.ownerTopicId !== topic.id) return null;
  const subtopics = topic.subtopics || [];
  return (q.subtopic && findTextMatch(q.subtopic, subtopics)?.id)
    || (q.topic && findTextMatch(q.topic, subtopics)?.id)
    || (q.subtopic && stemMatch(q.subtopic, subtopics)?.id)
    || null;
};

// A paper leaves two kinds of mark on a topic: one on each subtopic it tested,
// and one on the topic as a whole, taken over every question that belonged to
// it. The second is what makes a topic's mastery move with the paper — and it
// catches questions labelled only with the topic, which used to score nothing
// at all on a topic that had subtopics.
function applyPaperToTopic(topic, questions, label, sourceId) {
  const hasSubtopics = (topic.subtopics || []).length > 0;

  const topicMarks = tallyQuestions(questions, q => (questionHitsTopic(q, topic) ? topic.id : null)).get(topic.id);
  let next = topicMarks ? withPaperMarks(topic, topicMarks.scored, topicMarks.available, label, sourceId) : topic;

  if (!hasSubtopics) return next;

  const perSubtopic = tallyQuestions(questions, q => subtopicOf(q, topic));
  if (!perSubtopic.size) return next;

  return {
    ...next,
    subtopics: next.subtopics.map(st => {
      const marks = perSubtopic.get(st.id);
      return marks ? withPaperMarks(st, marks.scored, marks.available, label, sourceId) : st;
    }),
  };
}

const withoutMarksFrom = (unit, pastPaperId, label) => {
  const scores = unitScores(unit);
  const kept = scores.filter(score =>
    (score.sourceId ? score.sourceId !== pastPaperId : score.label !== label));
  return kept.length === scores.length ? unit : withScores(unit, kept);
};

const stripPaper = (topic, pastPaperId, label) => {
  const bare = withoutMarksFrom(topic, pastPaperId, label);
  const subtopics = (topic.subtopics || []).map(st => withoutMarksFrom(st, pastPaperId, label));
  const changed = subtopics.some((st, i) => st !== topic.subtopics[i]);
  return changed ? { ...bare, subtopics } : bare;
};

export function addPastPaperRecord(subjects, subjectId, paper, record) {
  return mapSubject(subjects, subjectId, s => {
    const label = record.session && record.year ? `${record.session} ${record.year}` : 'Past paper';
    const questions = withOwners(questionsOf(record), s.topics);
    const topics = s.topics.map(t =>
      ((t.paper || 'Paper 1') === paper ? applyPaperToTopic(t, questions, label, record.id) : t));
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
  return writePaperMarks(subjects, subjectId, pastPaperId, scores, false);
}

// Correcting a mark the reader got wrong. It reads handwriting, and a 2 with a
// line through it is a 0 as often as it is a 2, so a paper's marks have to be
// answerable to the person who sat it.
//
// What makes this different from filling in blanks is that the paper has
// already left its mark on every topic it touched. Applying the correction on
// top would count it twice, so the marks this paper put there are taken back
// out first — by the paper's own id, or by its label for papers recorded
// before marks remembered where they came from.
export function revisePaperMarks(subjects, subjectId, pastPaperId, scores) {
  return writePaperMarks(subjects, subjectId, pastPaperId, scores, true);
}

function writePaperMarks(subjects, subjectId, pastPaperId, scores, revising) {
  return mapSubject(subjects, subjectId, s => {
    const record = (s.pastPapers || []).find(pp => pp.id === pastPaperId);
    if (!record) return s;
    if (!revising && !record.needsMarks) return s;

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
      topics: s.topics.map(t => {
        if ((t.paper || 'Paper 1') !== record.paper) return t;
        const base = revising ? stripPaper(t, pastPaperId, label) : t;
        return applyPaperToTopic(base, owned, label, pastPaperId);
      }),
      pastPapers: (s.pastPapers || []).map(pp => (pp.id === pastPaperId ? filled : pp)),
    };
  });
}

// A paper's marks go with it. Leaving them behind meant a topic kept a score
// from a paper no longer on record, with nothing left to explain where it had
// come from and no way to be rid of it.
export function deletePastPaper(subjects, subjectId, pastPaperId) {
  return mapSubject(subjects, subjectId, s => {
    const record = (s.pastPapers || []).find(pp => pp.id === pastPaperId);
    const label = record && record.session && record.year
      ? `${record.session} ${record.year}`
      : 'Past paper';

    return {
      ...s,
      topics: record ? s.topics.map(t => stripPaper(t, pastPaperId, label)) : s.topics,
      pastPapers: (s.pastPapers || []).filter(pp => pp.id !== pastPaperId),
    };
  });
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
