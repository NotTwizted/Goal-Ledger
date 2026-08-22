// Which question tested a given topic, and where to find it printed.
//
// The report lists what was mastered or covered this week, by name. Getting
// from that name back to a picture of the question means finding, among every
// paper on record, the questions that were filed under it — most recent first,
// because the latest attempt is the one worth looking at.

import { normText, pastPaperLabel } from './helpers';

const sameName = (a, b) => {
  const x = normText(a);
  const y = normText(b);
  return Boolean(x) && Boolean(y) && x === y;
};

// A question belongs to this row if it names the subtopic; or, for a row that
// is a whole topic, if it names the topic and nothing narrower was asked for.
const matches = (question, topicName, subtopicName) => (subtopicName
  ? sameName(question.subtopic, subtopicName)
  : sameName(question.subtopic, topicName) || sameName(question.topic, topicName));

export function questionsFor(subject, topicName, subtopicName) {
  const found = [];

  [...(subject?.pastPapers || [])]
    .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))
    .forEach(paper => {
      (paper.questions || []).forEach(question => {
        if (!question.page || !matches(question, topicName, subtopicName)) return;
        found.push({
          paperId: paper.id,
          paperLabel: pastPaperLabel(paper),
          paper: paper.paper,
          question: question.question,
          page: question.page,
          marksScored: question.marksScored,
          marksAvailable: question.marksAvailable,
          mistake: question.mistake || null,
        });
      });
    });

  return found;
}
