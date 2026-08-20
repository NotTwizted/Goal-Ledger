import {
  STATUS_ORDER,
  averageScore,
  clampPercent,
  findTextMatch,
  masteryFromScore,
  newUnit,
  normText,
  scoreFromMarks,
  syncTopicsWithSeed,
  uid,
  unitScores,
} from './helpers';

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

const advanceStatus = (unit) => {
  const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(unit.status) + 1) % STATUS_ORDER.length];
  return {
    ...unit,
    status: nextStatus,
    completedAt: nextStatus === 'done' ? new Date().toISOString() : null,
  };
};

// scorePercent stays written as the average so progress, sorting and the
// mastery stamp keep reading one number.
const withScores = (unit, scores) => {
  const next = { ...unit, scores };
  const average = averageScore(next);
  return { ...next, scorePercent: average, mastery: average === null ? 0 : masteryFromScore(average) };
};

const addScore = (unit, percent, label) => {
  const value = clampPercent(percent);
  if (value === '') return unit;
  return withScores(unit, [...unitScores(unit), { id: uid(), percent: value, label }]);
};

// Folds marks from an uploaded paper into a unit's running totals and
// recalculates its score percentage from them.
// One upload contributes one mark per unit, however many questions on it
// touched that unit — so a paper counts once in the average, like a test does.
const withPaperMarks = (unit, lost, available, label) => {
  const percent = scoreFromMarks(lost, available);
  return percent === null ? unit : addScore(unit, percent, label);
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
  return mapSubject(subjects, subjectId, s => mapTopic(s, topicId, advanceStatus));
}

const mapUnit = (subject, topicId, subtopicId, fn) =>
  mapTopic(subject, topicId, t => (subtopicId
    ? { ...t, subtopics: (t.subtopics || []).map(st => (st.id === subtopicId ? fn(st) : st)) }
    : fn(t)));

export function addUnitScore(subjects, subjectId, topicId, subtopicId, value, label) {
  return mapSubject(subjects, subjectId, s =>
    mapUnit(s, topicId, subtopicId, u => addScore(u, value, label)));
}

export function removeUnitScore(subjects, subjectId, topicId, subtopicId, scoreId) {
  return mapSubject(subjects, subjectId, s =>
    mapUnit(s, topicId, subtopicId, u => withScores(u, unitScores(u).filter(x => x.id !== scoreId))));
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
      subtopics: (t.subtopics || []).map(st => (st.id === subtopicId ? advanceStatus(st) : st)),
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

// Groups a paper's mistakes onto the units they belong to, then records one
// mark per unit — a paper is a single sitting, so it counts once.
function tallyMarks(mistakes, resolve) {
  const tally = new Map();
  mistakes.forEach(m => {
    if (typeof m.marksLost !== 'number') return;
    const unitId = resolve(m);
    if (!unitId) return;
    const entry = tally.get(unitId) || { lost: 0, available: 0 };
    entry.lost += m.marksLost;
    entry.available += Number(m.marksAvailable) || 0;
    tally.set(unitId, entry);
  });
  return tally;
}

export function addPastPaperRecord(subjects, subjectId, paper, record) {
  return mapSubject(subjects, subjectId, s => {
    const label = record.session && record.year ? `${record.session} ${record.year}` : 'Past paper';

    const topics = s.topics.map(t => {
      if ((t.paper || 'Paper 1') !== paper) return t;
      const hasSubtopics = t.subtopics && t.subtopics.length > 0;

      const tally = tallyMarks(record.mistakes, m => {
        if (!m.topic) return null;
        if (hasSubtopics) return findTextMatch(m.topic, t.subtopics)?.id || null;
        const a = normText(m.topic);
        const b = normText(t.name);
        return (a === b || a.includes(b) || b.includes(a)) ? t.id : null;
      });
      if (!tally.size) return t;

      if (!hasSubtopics) {
        const { lost, available } = tally.get(t.id);
        return withPaperMarks(t, lost, available, label);
      }
      return {
        ...t,
        subtopics: t.subtopics.map(st => {
          const marks = tally.get(st.id);
          return marks ? withPaperMarks(st, marks.lost, marks.available, label) : st;
        }),
      };
    });

    return { ...s, topics, pastPapers: [...(s.pastPapers || []), record] };
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
    mapTopic(s, topicId, t => {
      const subtopics = t.subtopics || [];
      const tally = tallyMarks(
        record.details.map(d => ({ ...d, topic: d.subtopic })),
        d => findTextMatch(d.subtopic, subtopics)?.id || null
      );
      return {
        ...t,
        subtopics: subtopics.map(st => {
          const marks = tally.get(st.id);
          return marks ? withPaperMarks(st, marks.lost, marks.available, 'Unit test') : st;
        }),
        unitTests: [...(t.unitTests || []), record],
      };
    }));
}

export function deleteSubject(subjects, subjectId) {
  return subjects.filter(s => s.id !== subjectId);
}
