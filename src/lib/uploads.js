import { callClaudeWithFile, inferMediaType, uid } from './helpers';

// Vercel caps a serverless request body at 4.5MB, and base64 inflates a file
// by about a third, so anything past roughly 3MB cannot be sent at all. Saying
// so here is clearer than letting the request fail on the way out.
const MAX_FILE_BYTES = 3 * 1024 * 1024;

async function fileToContentBlock(file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 3MB — `
      + 'split the PDF, or export it at a lower quality.'
    );
  }

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  return isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: inferMediaType(file), data: base64 } };
}

// Returns the extracted checklist as indented text, ready to drop into the
// import box so it can be reviewed before anything is added.
export async function extractChecklistDraft(file, isStudy) {
  const promptText = isStudy
    ? 'This file shows content from a syllabus or specification. Extract the main topics and, under each, its subtopics. Cover every page — do not stop partway through. Respond with ONLY a JSON array of objects, no other text, no markdown fences. Format: [{"topic": "Cell structure", "subtopics": ["Prokaryotic vs eukaryotic cells", "Organelles"]}]. If a main topic has no subtopics listed, use an empty array.'
    : 'This file shows a list of goals. Extract every individual item as a short line. Respond with ONLY a JSON array of strings, no other text, no markdown fences. Example: ["Do 10 pullups", "Run 5km"]';

  const parsed = await callClaudeWithFile(await fileToContentBlock(file), promptText, 8000);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('No topics were found in that file');
  }

  return isStudy
    ? parsed.map(g => {
        const subLines = (g.subtopics || []).map(st => `  - ${st}`).join('\n');
        return subLines ? `${g.topic}\n${subLines}` : g.topic;
      }).join('\n')
    : parsed.join('\n');
}

export async function extractPastPaper(file, paper, topicNames) {
  const promptText = `This file is a corrected/marked past exam paper. First, find the exam session and year printed on it (e.g. "May/June", "October/November", "January", plus a 4-digit year) — look at headers, footers, or the front cover. Then go through EVERY question on the paper, not only the ones with marks lost — a question answered perfectly matters just as much for working out how well the student knows a topic. For each question give: the question number, the topic it tests` +
    (topicNames.length ? ` (pick the closest match from this list where possible: ${topicNames.join(', ')}; otherwise give your own short topic label)` : '') +
    `, a more specific subtopic where you can identify one, the marks the student scored on it as an integer, and the marks available for it as an integer. Where marks were lost, also describe the mistake in one short sentence; where none were lost, leave the mistake out.

Then write feedback on THIS paper specifically. It must be grounded in the answers in front of you — never generic study advice, and never anything that would read the same on a different paper. For each topic where marks were actually lost, name the topic, describe the pattern behind the errors rather than restating one question, and give one concrete thing to do about it, naming the specific idea or technique. Add a one-sentence summary saying where the marks went and what cost the most. If no marks were lost anywhere, say so in the summary and give an empty list of areas.

Respond with ONLY a JSON object, no other text, no markdown fences. Format: {"session": "May/June", "year": "2023", "questions": [{"question": "3b", "topic": "Enzymes", "subtopic": "Inhibition", "marksScored": 3, "marksAvailable": 5, "mistake": "Confused competitive and non-competitive inhibition"}], "feedback": {"summary": "Nineteen of the 23 marks lost were on enzyme kinetics, mostly for describing graphs rather than explaining them.", "areas": [{"topic": "Inhibition", "problem": "Describes what the graph shows without saying why Vmax is unchanged", "action": "For each inhibitor type, write one sentence linking the shape of the curve to what the inhibitor does to the active site"}]}}. If the session or year can't be found, use null for that field.`;

  const parsed = await callClaudeWithFile(await fileToContentBlock(file), promptText, 8000);
  const questions = Array.isArray(parsed?.questions) ? parsed.questions : null;
  if (!questions) throw new Error('Unexpected response');

  return {
    id: uid(),
    paper,
    fileName: file.name,
    session: parsed.session || null,
    year: parsed.year || null,
    uploadedAt: new Date().toISOString(),
    questions,
    feedback: parsed.feedback && typeof parsed.feedback === 'object' ? parsed.feedback : null,
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

export async function extractUnitTest(file, topicName, subtopicNames) {
  const promptText = `This file is a corrected/marked unit test on the topic "${topicName || ''}". Go through EVERY question on it, not only the ones with marks lost — a question answered perfectly matters just as much for working out how well the student knows a subtopic. For each question give the subtopic it tests` +
    (subtopicNames.length ? ` (pick the closest match from this list where possible: ${subtopicNames.join(', ')}; otherwise give your own short subtopic label)` : '') +
    `, the marks the student scored on it as an integer, and the marks available for it as an integer. Where marks were lost, also describe the mistake in one short sentence. Then list which subtopics need the most focus, ranked by how many marks were lost on them.

Then write feedback on THIS test specifically, grounded in the answers in front of you — never generic study advice, and never anything that would read the same on a different test. For each subtopic where marks were lost, describe the pattern behind the errors rather than restating one question, and give one concrete thing to do about it. Add a one-sentence summary of where the marks went.

Respond with ONLY a JSON object, no other text, no markdown fences. Format: {"details": [{"subtopic": "Enzyme kinetics", "marksScored": 3, "marksAvailable": 5, "mistake": "Confused competitive and non-competitive inhibition"}], "focus": ["Enzyme kinetics"], "feedback": {"summary": "...", "areas": [{"topic": "Enzyme kinetics", "problem": "...", "action": "..."}]}}`;

  const parsed = await callClaudeWithFile(await fileToContentBlock(file), promptText, 6000);
  if (!parsed || !Array.isArray(parsed.details)) throw new Error('Unexpected response');

  return {
    id: uid(),
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    focus: Array.isArray(parsed.focus) ? parsed.focus : [],
    feedback: parsed.feedback && typeof parsed.feedback === 'object' ? parsed.feedback : null,
    details: parsed.details,
  };
}
