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
  const questions = questionsOf(record);
  const available = questions.reduce((sum, q) => sum + (Number(q.marksAvailable) || 0), 0);
  if (available <= 0) return null;
  const scored = questions.reduce((sum, q) => sum + (Number(q.marksScored) || 0), 0);
  return { scored, available, percent: Math.round((scored / available) * 100) };
}

// Marks lost per topic, worst first — the shape of where a paper went wrong.
export function lostByTopic(record) {
  const byTopic = new Map();
  questionsOf(record).forEach(q => {
    const lost = (Number(q.marksAvailable) || 0) - (Number(q.marksScored) || 0);
    if (lost <= 0) return;
    const name = q.subtopic || q.topic || 'Unlabelled';
    const entry = byTopic.get(name) || { topic: name, lost: 0, questions: 0, mistakes: [] };
    entry.lost += lost;
    entry.questions += 1;
    if (q.mistake) entry.mistakes.push(q.mistake);
    byTopic.set(name, entry);
  });
  return [...byTopic.values()].sort((a, b) => b.lost - a.lost);
}

export function paperFeedback(record) {
  const stored = record.feedback;
  const areas = lostByTopic(record);
  const score = paperScore(record);

  if (stored && (stored.summary || (stored.areas || []).length)) {
    return { source: 'read', summary: stored.summary || '', areas: stored.areas || [], lost: areas, score };
  }

  if (!areas.length) {
    return {
      source: 'derived',
      summary: score && score.scored === score.available
        ? 'Full marks — nothing was dropped on this paper.'
        : 'No mistakes were recorded against this paper.',
      areas: [],
      lost: areas,
      score,
    };
  }

  const total = areas.reduce((sum, a) => sum + a.lost, 0);
  const worst = areas[0];
  const share = Math.round((worst.lost / total) * 100);

  return {
    source: 'derived',
    summary: areas.length === 1
      ? `All ${total} marks lost on this paper went on ${worst.topic}.`
      : `${total} marks lost across ${areas.length} topics, ${share}% of them on ${worst.topic}.`,
    // Without the model's reading of the script, the mistakes it recorded per
    // question are the most specific thing available.
    areas: areas.slice(0, 4).map(a => ({
      topic: a.topic,
      problem: a.mistakes.length
        ? a.mistakes.slice(0, 3).join('; ')
        : `${a.lost} marks lost across ${a.questions} question${a.questions !== 1 ? 's' : ''}`,
      action: null,
    })),
    lost: areas,
    score,
  };
}
