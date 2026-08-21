import { getWeekRange, pastPaperLabel } from './helpers';
import { getPaperCode } from './syllabus';

// A week's work comes in two kinds: a unit the student ticked as covered, and
// a unit whose marks crossed into mastery. Both are worth reporting, and the
// difference is the point — "I have been through it" is not "I can do it".
function unitEvent(unit, inWeek) {
  if (unit.status === 'done' && unit.completedAt && inWeek(unit.completedAt)) {
    return { kind: 'mastered', at: new Date(unit.completedAt).getTime() };
  }
  if (unit.status === 'in-progress' && unit.coveredAt && inWeek(unit.coveredAt)) {
    return { kind: 'covered', at: new Date(unit.coveredAt).getTime() };
  }
  return null;
}

function groupsForSubject(subject, inWeek) {
  const groups = [];

  subject.topics.forEach(t => {
    const hasSubtopics = t.subtopics && t.subtopics.length > 0;

    if (!hasSubtopics) {
      const event = unitEvent(t, inWeek);
      if (event) {
        groups.push({
          key: t.id,
          topicName: t.name,
          subtopicName: null,
          wholeTopic: true,
          hadSubtopics: false,
          kind: event.kind,
          latest: event.at,
        });
      }
      return;
    }

    const events = t.subtopics.map(st => ({ st, event: unitEvent(st, inWeek) })).filter(x => x.event);
    if (!events.length) return;

    // A topic finished outright this week reads as one line rather than five.
    const allMastered = t.subtopics.every(st => st.status === 'done');
    const allCovered = t.subtopics.every(st => st.status !== 'not-started');
    if (allMastered || allCovered) {
      groups.push({
        key: t.id,
        topicName: t.name,
        subtopicName: null,
        wholeTopic: true,
        hadSubtopics: true,
        kind: allMastered ? 'mastered' : 'covered',
        latest: Math.max(...events.map(x => x.event.at)),
      });
      return;
    }

    events.forEach(({ st, event }) => {
      groups.push({
        key: st.id,
        topicName: t.name,
        subtopicName: st.name,
        wholeTopic: false,
        hadSubtopics: true,
        kind: event.kind,
        latest: event.at,
      });
    });
  });

  return groups.sort((a, b) => b.latest - a.latest);
}

export function buildSummary(groups, papers = []) {
  const listJoin = (arr) =>
    arr.length <= 2 ? arr.join(' and ') : `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
  const nameOf = (g) => (g.wholeTopic ? g.topicName : g.subtopicName);

  const mastered = groups.filter(g => g.kind === 'mastered').map(nameOf);
  const covered = groups.filter(g => g.kind === 'covered').map(nameOf);

  const parts = [];
  if (mastered.length) parts.push(`mastered ${listJoin(mastered)}`);
  if (covered.length) parts.push(`covered ${listJoin(covered)}`);
  if (papers.length) {
    parts.push(`sat ${papers.length === 1 ? papers[0].label : `${papers.length} papers`}`);
  }
  if (!parts.length) return 'Nothing completed here yet this week.';
  return `You ${parts.join(', and ')}.`;
}

// Papers sat during the week are work too, and the report was silent about
// them. Each carries the session and year it was sat and the specification
// code, so a row identifies the paper without opening the subject.
function papersForSubject(subject, inWeek) {
  return (subject.pastPapers || [])
    .filter(pp => pp.uploadedAt && inWeek(pp.uploadedAt))
    .map(pp => ({
      id: pp.id,
      label: pastPaperLabel(pp),
      paper: pp.paper,
      code: subject.category === 'study' ? getPaperCode(subject.level, subject.name, subject.board) : null,
      mistakes: (pp.mistakes || []).length,
      needsMarks: Boolean(pp.needsMarks),
      at: new Date(pp.uploadedAt).getTime(),
    }))
    .sort((a, b) => b.at - a.at);
}

export function buildWeeklyReport(subjects, weekOffset) {
  const { start: weekStart, end: weekEnd } = getWeekRange(weekOffset);
  const inWeek = (iso) => {
    const d = new Date(iso);
    return d >= weekStart && d < weekEnd;
  };

  const latestOf = (r) => Math.max(r.groups[0]?.latest || 0, r.papers[0]?.at || 0);

  const reports = subjects
    .map(s => ({ subject: s, groups: groupsForSubject(s, inWeek), papers: papersForSubject(s, inWeek) }))
    .filter(r => r.groups.length > 0 || r.papers.length > 0)
    .sort((a, b) => latestOf(b) - latestOf(a));

  return {
    weekStart,
    weekEnd,
    reports,
    completedCount: reports.reduce((sum, r) => sum + r.groups.length, 0),
    masteredCount: reports.reduce((sum, r) => sum + r.groups.filter(g => g.kind === 'mastered').length, 0),
    paperCount: reports.reduce((sum, r) => sum + r.papers.length, 0),
  };
}
