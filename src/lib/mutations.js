import {
  averageScore,
  isMastered,
  findTextMatch,
  masteryFromScore,
  newUnit,
  parseMarkInput,
  normText,
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
    const unitId = resolve(q);
    if (!unitId) return;
    const entry = tally.get(unitId) || { scored: 0, available: 0 };
    entry.scored += Math.max(0, Math.min(available, Number(q.marksScored) || 0));
    entry.available += available;
    tally.set(unitId, entry);
  });
  return tally;
}

export function addPastPaperRecord(subjects, subjectId, paper, record) {
  return mapSubject(subjects, subjectId, s => {
    const label = record.session && record.year ? `${record.session} ${record.year}` : 'Past paper';
    const questions = questionsOf(record);

    const topics = s.topics.map(t => {
      if ((t.paper || 'Paper 1') !== paper) return t;
      const hasSubtopics = t.subtopics && t.subtopics.length > 0;

      // A question reaches a subtopic by its own subtopic label first, then by
      // its topic label, which is all the older records carry.
      const tally = tallyQuestions(questions, q => {
        if (hasSubtopics) {
          const match = (q.subtopic && findTextMatch(q.subtopic, t.subtopics))
            || (q.topic && findTextMatch(q.topic, t.subtopics));
          return match?.id || null;
        }
        const label_ = q.topic || q.subtopic;
        if (!label_) return null;
        const a = normText(label_);
        const b = normText(t.name);
        return (a === b || a.includes(b) || b.includes(a)) ? t.id : null;
      });
      if (!tally.size) return t;

      if (!hasSubtopics) {
        const { scored, available } = tally.get(t.id);
        return withPaperMarks(t, scored, available, label);
      }
      return {
        ...t,
        subtopics: t.subtopics.map(st => {
          const marks = tally.get(st.id);
          return marks ? withPaperMarks(st, marks.scored, marks.available, label) : st;
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
      const tally = tallyQuestions(
        questionsOf({ questions: record.details }),
        q => findTextMatch(q.subtopic, subtopics)?.id || null
      );
      return {
        ...t,
        subtopics: subtopics.map(st => {
          const marks = tally.get(st.id);
          return marks ? withPaperMarks(st, marks.scored, marks.available, 'Unit test') : st;
        }),
        unitTests: [...(t.unitTests || []), record],
      };
    }));
}

export function deleteSubject(subjects, subjectId) {
  return subjects.filter(s => s.id !== subjectId);
}
