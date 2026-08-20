import { callClaudeText, callClaudeWithFile, uid } from './helpers';
import { contentBlock, prepareParts } from './fileprep';

// A file too large to send in one request is split into parts that fit, each
// read on its own and the questions pooled. The student sees one paper; the
// only visible difference is that a long one takes a little longer.

const partLabel = (part, index, total) => {
  if (total === 1) return '';
  const where = part.pages ? `pages ${part.pages[0]}–${part.pages[1]}` : `part ${index + 1} of ${total}`;
  return ` This is ${where} of a longer paper, so number the questions as they are printed and do not be troubled that it starts or ends part way through.`;
};

async function readParts(file, buildPrompt, maxTokens, onProgress) {
  const parts = await prepareParts(file);
  const results = [];

  for (let i = 0; i < parts.length; i++) {
    if (onProgress) onProgress(i, parts.length);
    results.push(await callClaudeWithFile(
      contentBlock(parts[i]),
      buildPrompt(partLabel(parts[i], i, parts.length)),
      maxTokens,
    ));
  }

  return { results, partCount: parts.length };
}

// Returns the extracted checklist as indented text, ready to drop into the
// import box so it can be reviewed before anything is added.
export async function extractChecklistDraft(file, isStudy, onProgress) {
  const buildPrompt = (suffix) => (isStudy
    ? 'This file shows content from a syllabus or specification. Extract the main topics and, under each, its subtopics. Cover every page — do not stop partway through. Respond with ONLY a JSON array of objects, no other text, no markdown fences. Format: [{"topic": "Cell structure", "subtopics": ["Prokaryotic vs eukaryotic cells", "Organelles"]}]. If a main topic has no subtopics listed, use an empty array.'
    : 'This file shows a list of goals or tasks. Extract every individual item as a short line. Respond with ONLY a JSON array of strings, no other text, no markdown fences. Example: ["Do 10 pullups", "Run 5km"]') + suffix;

  const { results } = await readParts(file, buildPrompt, 8000, onProgress);
  const merged = results.flatMap(r => (Array.isArray(r) ? r : []));
  if (!merged.length) throw new Error('No topics were found in that file');

  return isStudy
    ? merged.map(g => {
        const subLines = (g.subtopics || []).map(st => `  - ${st}`).join('\n');
        return subLines ? `${g.topic}\n${subLines}` : g.topic;
      }).join('\n')
    : merged.join('\n');
}

const FEEDBACK_SHAPE = '{"summary": "...", "areas": [{"topic": "...", "problem": "...", "action": "..."}]}';

const FEEDBACK_BRIEF = 'Then write feedback on THIS paper specifically. It must be grounded in the answers in front of you — never generic study advice, and never anything that would read the same on a different paper. For each topic where marks were actually lost, name the topic, describe the pattern behind the errors rather than restating one question, and give one concrete thing to do about it, naming the specific idea or technique. Add a one-sentence summary saying where the marks went and what cost the most. If no marks were lost anywhere, say so in the summary and give an empty list of areas.';

// When a paper arrives in parts, no single request has seen all of it, so the
// feedback is written once at the end from the pooled questions.
async function feedbackFromQuestions(questions) {
  const lines = questions
    .filter(q => (Number(q.marksAvailable) || 0) > (Number(q.marksScored) || 0))
    .map(q => `Q${q.question || '?'} — ${q.subtopic || q.topic || 'unlabelled'}: scored ${q.marksScored} of ${q.marksAvailable}${q.mistake ? `. ${q.mistake}` : ''}`);

  if (!lines.length) return { summary: 'No marks were dropped on this paper.', areas: [] };

  const prompt = `These are the questions a student lost marks on across one exam paper, with what went wrong on each:\n\n${lines.join('\n')}\n\n${FEEDBACK_BRIEF} Respond with ONLY a JSON object, no other text, no markdown fences. Format: ${FEEDBACK_SHAPE}`;
  try {
    return await callClaudeText(prompt, 2000);
  } catch (e) {
    return null; // The page falls back to feedback derived from the marks.
  }
}

export async function extractPastPaper(file, paper, topicNames, onProgress) {
  const buildPrompt = (suffix) =>
    `This file is a corrected/marked past exam paper.${suffix} Find the exam session and year printed on it (e.g. "May/June", "October/November", "January", plus a 4-digit year) — look at headers, footers, or the front cover. Then go through EVERY question, not only the ones with marks lost — a question answered perfectly matters just as much for working out how well the student knows a topic. For each question give: the question number, the topic it tests`
    + (topicNames.length ? ` (pick the closest match from this list where possible: ${topicNames.join(', ')}; otherwise give your own short topic label)` : '')
    + `, a more specific subtopic where you can identify one, the marks the student scored on it as an integer, and the marks available for it as an integer. Where marks were lost, also describe the mistake in one short sentence.\n\n${FEEDBACK_BRIEF}\n\nRespond with ONLY a JSON object, no other text, no markdown fences. Format: {"session": "May/June", "year": "2023", "questions": [{"question": "3b", "topic": "Enzymes", "subtopic": "Inhibition", "marksScored": 3, "marksAvailable": 5, "mistake": "Confused competitive and non-competitive inhibition"}], "feedback": ${FEEDBACK_SHAPE}}. If the session or year can't be found, use null for that field.`;

  const { results, partCount } = await readParts(file, buildPrompt, 8000, onProgress);

  const questions = results.flatMap(r => (Array.isArray(r?.questions) ? r.questions : []));
  if (!questions.length) throw new Error('No questions could be read from that file');

  const identified = results.find(r => r?.session || r?.year) || {};
  const feedback = partCount === 1
    ? (results[0]?.feedback || null)
    : await feedbackFromQuestions(questions);

  return {
    id: uid(),
    paper,
    fileName: file.name,
    session: identified.session || null,
    year: identified.year || null,
    uploadedAt: new Date().toISOString(),
    questions,
    feedback: feedback && typeof feedback === 'object' ? feedback : null,
    // Kept for the mistakes view, which lists only what went wrong.
    mistakes: questions
      .filter(q => (Number(q.marksAvailable) || 0) > (Number(q.marksScored) || 0))
      .map(q => ({
        question: q.question,
        topic: q.subtopic || q.topic,
        mistake: q.mistake,
        marksLost: (Number(q.marksAvailable) || 0) - (Number(q.marksScored) || 0),
        marksAvailable: Number(q.marksAvailable) || 0,
      })),
  };
}

export async function extractUnitTest(file, topicName, subtopicNames, onProgress) {
  const buildPrompt = (suffix) =>
    `This file is a corrected/marked unit test on the topic "${topicName || ''}".${suffix} Go through EVERY question on it, not only the ones with marks lost. For each question give the subtopic it tests`
    + (subtopicNames.length ? ` (pick the closest match from this list where possible: ${subtopicNames.join(', ')}; otherwise give your own short subtopic label)` : '')
    + `, the marks the student scored on it as an integer, the marks available for it as an integer, and where marks were lost a one-sentence description of the mistake. Then list which subtopics need the most focus, ranked by how many marks were lost on them.\n\n${FEEDBACK_BRIEF}\n\nRespond with ONLY a JSON object, no other text, no markdown fences. Format: {"details": [{"subtopic": "Enzyme kinetics", "marksScored": 3, "marksAvailable": 5, "mistake": "Confused competitive and non-competitive inhibition"}], "focus": ["Enzyme kinetics"], "feedback": ${FEEDBACK_SHAPE}}`;

  const { results, partCount } = await readParts(file, buildPrompt, 6000, onProgress);

  const details = results.flatMap(r => (Array.isArray(r?.details) ? r.details : []));
  if (!details.length) throw new Error('No questions could be read from that file');

  const feedback = partCount === 1
    ? (results[0]?.feedback || null)
    : await feedbackFromQuestions(details.map(d => ({ ...d, topic: d.subtopic })));

  return {
    id: uid(),
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    focus: [...new Set(results.flatMap(r => (Array.isArray(r?.focus) ? r.focus : [])))],
    feedback: feedback && typeof feedback === 'object' ? feedback : null,
    details,
  };
}
