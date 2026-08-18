import { getWeekRange } from './helpers';

// Collapses a subject's completed work for one week into report rows: a topic
// whose subtopics are all done reads as one "full topic" line, anything else
// is listed subtopic by subtopic.
function groupsForSubject(subject, inWeek) {
  const groups = [];

  subject.topics.forEach(t => {
    const hasSubtopics = t.subtopics && t.subtopics.length > 0;

    if (hasSubtopics) {
      const doneThisWeek = t.subtopics.filter(st => st.completedAt && inWeek(st.completedAt));
      if (!doneThisWeek.length) return;

      if (t.subtopics.every(st => st.status === 'done')) {
        groups.push({
          key: t.id,
          topicName: t.name,
          subtopicName: null,
          wholeTopic: true,
          hadSubtopics: true,
          latest: Math.max(...doneThisWeek.map(st => new Date(st.completedAt).getTime())),
        });
      } else {
        doneThisWeek.forEach(st => {
          groups.push({
            key: st.id,
            topicName: t.name,
            subtopicName: st.name,
            wholeTopic: false,
            hadSubtopics: true,
            latest: new Date(st.completedAt).getTime(),
          });
        });
      }
    } else if (t.completedAt && inWeek(t.completedAt)) {
      groups.push({
        key: t.id,
        topicName: t.name,
        subtopicName: null,
        wholeTopic: true,
        hadSubtopics: false,
        latest: new Date(t.completedAt).getTime(),
      });
    }
  });

  return groups.sort((a, b) => b.latest - a.latest);
}

export function buildSummary(groups) {
  const fullTopics = groups.filter(g => g.wholeTopic).map(g => g.topicName);
  const partials = groups.filter(g => !g.wholeTopic);
  const partialTopicNames = [...new Set(partials.map(g => g.topicName))];

  const listJoin = (arr) =>
    arr.length <= 2 ? arr.join(' and ') : `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;

  const parts = [];
  if (fullTopics.length) {
    parts.push(`finished ${fullTopics.length === 1 ? 'the topic' : 'the topics'} ${listJoin(fullTopics)}`);
  }
  if (partialTopicNames.length) {
    parts.push(`completed ${partials.length} subtopic${partials.length !== 1 ? 's' : ''} across ${listJoin(partialTopicNames)}`);
  }
  if (!parts.length) return 'Nothing completed here yet this week.';
  return `You ${parts.join(', and ')}.`;
}

export function buildWeeklyReport(subjects, weekOffset) {
  const { start: weekStart, end: weekEnd } = getWeekRange(weekOffset);
  const inWeek = (iso) => {
    const d = new Date(iso);
    return d >= weekStart && d < weekEnd;
  };

  const reports = subjects
    .map(s => ({ subject: s, groups: groupsForSubject(s, inWeek) }))
    .filter(r => r.groups.length > 0)
    .sort((a, b) => b.groups[0].latest - a.groups[0].latest);

  return {
    weekStart,
    weekEnd,
    reports,
    completedCount: reports.reduce((sum, r) => sum + r.groups.length, 0),
  };
}
