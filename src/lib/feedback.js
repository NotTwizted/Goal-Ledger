import { pitfallFor } from './pitfalls';
import { recordedScore } from './helpers';

// What a marked paper says about the person who sat it.
//
// The extraction writes feedback grounded in the actual answers, and that is
// what gets shown. Papers uploaded before it did so still have their
// per-question marks, so the same shape is reconstructed from those: which
// topics the marks went on, and what was written about each mistake. It is
// thinner than the model's own reading of the script, but it is still this
// paper's mistakes rather than advice that would fit any paper.

function questionsOf(record) {
  if (Array.isArray(record.questions) && record.questions.length) return record.questions;
  return (record.mistakes || []).map(m => ({
    topic: m.topic,
    subtopic: m.topic,
    marksScored: Math.max(0, (Number(m.marksAvailable) || 0) - (Number(m.marksLost) || 0)),
    marksAvailable: Number(m.marksAvailable) || 0,
    mistake: m.mistake,
    question: m.question,
  }));
}

// Total marks on the paper, where the extraction recorded them.
export function paperScore(record) {
  const marked = questionsOf(record).filter(q => recordedScore(q) !== null);
  const available = marked.reduce((sum, q) => sum + (Number(q.marksAvailable) || 0), 0);
  if (available <= 0) return null;
  const scored = marked.reduce((sum, q) => sum + recordedScore(q), 0);
  return { scored, available, percent: Math.round((scored / available) * 100) };
}

// Marks lost per topic, worst first — the shape of where a paper went wrong.
export function lostByTopic(record) {
  const byTopic = new Map();
  questionsOf(record).forEach(q => {
    const scored = recordedScore(q);
    if (scored === null) return;
    const available = Number(q.marksAvailable) || 0;
    const name = q.subtopic || q.topic || 'Unlabelled';
    const entry = byTopic.get(name)
      || { topic: name, lost: 0, available: 0, questions: [], mistakes: [] };
    entry.available += available;
    if (available > scored) {
      entry.lost += available - scored;
      if (q.question) entry.questions.push(q.question);
      if (q.mistake) entry.mistakes.push(q.mistake);
    }
    byTopic.set(name, entry);
  });
  return [...byTopic.values()].filter(a => a.lost > 0).sort((a, b) => b.lost - a.lost);
}

const marks = (n) => `${n} mark${n === 1 ? '' : 's'}`;

const listQuestions = (numbers) => {
  if (!numbers.length) return '';
  if (numbers.length === 1) return `Q${numbers[0]}`;
  return `Q${numbers.slice(0, -1).join(', Q')} and Q${numbers[numbers.length - 1]}`;
};

// Without a model reading the script there is no telling what went wrong, but
// how much went and where is enough to say what to do next. The advice changes
// with how much of the topic was lost, because dropping half a topic and
// dropping one mark call for entirely different things.
function actionFor(area) {
  const kept = area.available > 0 ? Math.round(((area.available - area.lost) / area.available) * 100) : 0;
  const where = listQuestions(area.questions);

  if (kept < 50) {
    return `More than half the marks on this went. Work back through it before sitting another paper, then redo ${where}.`;
  }
  if (kept < 75) {
    return `Mark ${where} against the mark scheme, then do two more questions on this to see whether it holds.`;
  }
  if (kept < 90) {
    return `Close. Compare your working on ${where} line by line with the mark scheme to find the step that cost it.`;
  }
  return `Only ${marks(area.lost)}. Check ${where} for a slip rather than a gap — accuracy, not understanding.`;
}

export function paperFeedback(record) {
  const stored = record.feedback;
  const areas = lostByTopic(record);
  const score = paperScore(record);

  // The pitfalls belong to the topic, not to this paper, so they are useful
  // whether or not a model read the script.
  const withPitfall = (area) => ({ ...area, pitfall: pitfallFor(area.topic) });

  if (stored && (stored.summary || (stored.areas || []).length)) {
    return {
      source: 'read',
      summary: stored.summary || '',
      areas: (stored.areas || []).map(withPitfall),
      lost: areas,
      score,
    };
  }

  const opening = score ? `${score.scored}/${score.available} — ${score.percent}%. ` : '';

  if (!areas.length) {
    return {
      source: 'derived',
      // No marks lost and no marks recorded look the same from here, and only
      // one of them is good news.
      summary: score
        ? `${opening}Nothing was dropped on this paper.`
        : 'No marks have been recorded for this paper yet.',
      areas: [],
      lost: areas,
      score,
    };
  }

  const total = areas.reduce((sum, a) => sum + a.lost, 0);
  const worst = areas[0];

  return {
    source: 'derived',
    summary: areas.length === 1
      ? `${opening}All ${marks(total)} lost went on ${worst.topic}.`
      : `${opening}${marks(total)} lost across ${areas.length} topics, most of it — ${marks(worst.lost)} — on ${worst.topic}.`,
    areas: areas.slice(0, 5).map(area => withPitfall({
      topic: area.topic,
      problem: area.mistakes.length
        ? area.mistakes.slice(0, 3).join('; ')
        : `Lost ${marks(area.lost)} of ${area.available} on ${listQuestions(area.questions)}.`,
      action: actionFor(area),
    })),
    lost: areas,
    score,
  };
}
