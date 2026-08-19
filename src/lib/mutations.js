import {
  STATUS_ORDER,
  clampPercent,
  findTextMatch,
  masteryFromScore,
  newUnit,
  normText,
  scoreFromMarks,
  syncTopicsWithSeed,
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

const withScore = (unit, value) => {
  const scorePercent = clampPercent(value);
  return {
    ...unit,
    scorePercent: scorePercent === '' ? null : scorePercent,
    mastery: masteryFromScore(scorePercent),
  };
};

// Folds marks from an uploaded paper into a unit's running totals and
// recalculates its score percentage from them.
const withMarks = (unit, marksLost, marksAvailable) => {
  // Ledgers written before scores were percentages stored a bare "marks lost"
  // with no total to measure it against, so that figure is dropped rather than
  // folded into the first percentage.
  const priorTotal = Number(unit.marksTotal) || 0;
  const priorLost = priorTotal > 0 ? (Number(unit.marksLost) || 0) : 0;
  const lost = priorLost + marksLost;
  const total = priorTotal + (Number(marksAvailable) || 0);
  const scorePercent = scoreFromMarks(lost, total);
  if (scorePercent === null) return { ...unit, marksLost: lost, marksTotal: total };
  return { ...unit, marksLost: lost, marksTotal: total, scorePercent, mastery: masteryFromScore(scorePercent) };
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

export function setTopicScore(subjects, subjectId, topicId, value) {
  return mapSubject(subjects, subjectId, s => mapTopic(s, topicId, t => withScore(t, value)));
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

export function setSubtopicScore(subjects, subjectId, topicId, subtopicId, value) {
  return mapSubject(subjects, subjectId, s =>
    mapTopic(s, topicId, t => ({
      ...t,
      subtopics: (t.subtopics || []).map(st => (st.id === subtopicId ? withScore(st, value) : st)),
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

export function addPastPaperRecord(subjects, subjectId, paper, record) {
  return mapSubject(subjects, subjectId, s => {
    const topics = s.topics.map(t => {
      if ((t.paper || 'Paper 1') !== paper) return t;
      let topic = { ...t };
      const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

      record.mistakes.forEach(m => {
        if (typeof m.marksLost !== 'number' || !m.topic) return;
        if (hasSubtopics) {
          const match = findTextMatch(m.topic, topic.subtopics);
          if (!match) return;
          topic = {
            ...topic,
            subtopics: topic.subtopics.map(st =>
              st.id === match.id ? withMarks(st, m.marksLost, m.marksAvailable) : st),
          };
          return;
        }
        const a = normText(m.topic);
        const b = normText(topic.name);
        if (a === b || a.includes(b) || b.includes(a)) {
          topic = withMarks(topic, m.marksLost, m.marksAvailable);
        }
      });

      return topic;
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
      let subtopics = t.subtopics || [];
      record.details.forEach(d => {
        if (typeof d.marksLost !== 'number' || !d.subtopic) return;
        const match = findTextMatch(d.subtopic, subtopics);
        if (!match) return;
        subtopics = subtopics.map(st =>
          st.id === match.id ? withMarks(st, d.marksLost, d.marksAvailable) : st);
      });
      return { ...t, subtopics, unitTests: [...(t.unitTests || []), record] };
    }));
}

export function deleteSubject(subjects, subjectId) {
  return subjects.filter(s => s.id !== subjectId);
}
