import { callClaudeText, callClaudeWithFile, uid } from './helpers';
import { contentBlock, isPdf, prepareParts } from './fileprep';
import { scanPaper } from './pdfscan';

// A file too large to send in one request is split into parts that fit, each
// read on its own and the questions pooled. The student sees one paper; the
// only visible difference is that a long one takes a little longer.

const partLabel = (part, index, total) => {
  if (total === 1) return '';
  const where = part.pages ? `pages ${part.pages[0]}–${part.pages[1]}` : `part ${index + 1} of ${total}`;
  return ` This is ${where} of a longer paper, so number the questions as they are printed and do not be troubled that it starts or ends part way through.`;
};

// Free tiers rate limit by requests per minute, so the parts go together but
// not all at once.
const AT_ONCE = 3;

async function readParts(parts, buildPrompt, maxTokens, onProgress, thinking) {
  const results = new Array(parts.length);
  let done = 0;

  // Read together rather than in turn: three parts done one after another take
  // three times as long for no reason, since none of them needs the others.
  for (let from = 0; from < parts.length; from += AT_ONCE) {
    const batch = parts.slice(from, from + AT_ONCE);
    if (onProgress) onProgress(done, parts.length);

    await Promise.all(batch.map(async (part, offset) => {
      results[from + offset] = await callClaudeWithFile(
        contentBlock(part),
        buildPrompt(partLabel(part, from + offset, parts.length), parts.length === 1),
        maxTokens,
        thinking,
      );
      done += 1;
      if (onProgress) onProgress(done, parts.length);
    }));
  }

  return { results, partCount: parts.length };
}

// Returns the extracted checklist as indented text, ready to drop into the
// import box so it can be reviewed before anything is added.
export async function extractChecklistDraft(file, isStudy, onProgress) {
  const buildPrompt = (suffix) => (isStudy
    ? 'This file shows content from a syllabus or specification. Extract the main topics and, under each, its subtopics. Cover every page — do not stop partway through. Respond with ONLY a JSON array of objects, no other text, no markdown fences. Format: [{"topic": "Cell structure", "subtopics": ["Prokaryotic vs eukaryotic cells", "Organelles"]}]. If a main topic has no subtopics listed, use an empty array.'
    : 'This file shows a list of goals or tasks. Extract every individual item as a short line. Respond with ONLY a JSON array of strings, no other text, no markdown fences. Example: ["Do 10 pullups", "Run 5km"]') + suffix;

  const { results } = await readParts(await prepareParts(file), buildPrompt, 8000, onProgress);
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

// Google says "high demand" and Anthropic says "overloaded"; both mean the
// same thing, and neither means anything is wrong with the paper.
export const isBusy = (message) =>
  /high demand|overloaded|try again later|rate limit|quota|too many requests|temporarily/i.test(message || '');

// Reading a paper has two routes and takes them in order, without asking.
// The model route needs a key — held on the account, or on the server, so it is
// asked for once at most and often never. When there is none, or the model
// cannot make sense of the file, the PDF is read here in the browser instead:
// that gives the paper's sitting, its questions, their mark allocations and
// their topics, everything except what the student scored. Either way a paper
// gets added and the upload does not stop to ask anything.
export async function extractPastPaper(file, paper, topics, onProgress) {
  try {
    return await readPaperWithModel(file, paper, topics || [], onProgress);
  } catch (modelError) {
    // A photograph has no text layer to read, so there is nothing to fall back
    // to and the reader's own error is the useful thing to say.
    if (!isPdf(file)) throw modelError;
    // Neither is a reader that is merely busy: falling back would file a paper
    // with no marks on it, to be deleted and uploaded again, when waiting a
    // minute is the whole of the fix.
    if (isBusy(modelError.message)) {
      throw new Error(`The reader is busy: ${modelError.message} Nothing has been saved — upload it again in a minute.`);
    }
    try {
      // Why it came this way matters: no key and "the model could not read it"
      // need different things done about them, and without this the paper just
      // appears with empty boxes and no account of itself.
      return { ...(await paperFromScan(file, paper, topics || [])), fallbackReason: modelError.message };
    } catch (scanError) {
      // Both failed, and each knows something the other does not.
      throw new Error(`${modelError.message} Reading the PDF here instead did not work either: ${scanError.message}`);
    }
  }
}

async function paperFromScan(file, paper, topics) {
  return paperRecordFromScan(await scanPaper(file, topics), paper, file.name);
}

// Everything the PDF itself will admit to, which is everything but the marks.
export function paperRecordFromScan(scanned, paper, fileName) {
  const questions = scanned.questions.map(q => {
    const [topic, subtopic] = (q.target || '').split('|');
    return {
      question: q.question,
      topic: topic || null,
      subtopic: subtopic || null,
      marksScored: null,
      marksAvailable: Number(q.marksAvailable) || 0,
    };
  });

  return {
    id: uid(),
    paper,
    fileName,
    session: scanned.session || null,
    year: scanned.year || null,
    uploadedAt: new Date().toISOString(),
    questions,
    feedback: null,
    mistakes: [],
    readBy: 'scan',
    needsMarks: true,
  };
}

// The syllabus as the reader should see it: each topic and the subtopics under
// it, in the words the student's own checklist uses.
//
// Without this the reader was given topic names only and invented its own
// subtopic labels — "Polynomial differentiation" where the checklist says
// "Differentiating xⁿ", "Equation of tangent" where it says "Gradients,
// tangents, and normals". Nothing matched, so a paper marked the topic and
// left every subtopic under it looking untouched.
function syllabusOutline(topics) {
  return topics
    .map(topic => {
      const name = typeof topic === 'string' ? topic : topic.name;
      const parts = (typeof topic === 'string' ? [] : topic.subtopics || []).map(st => st.name);
      return parts.length ? `${name}: ${parts.join(' | ')}` : name;
    })
    .filter(Boolean)
    .join('\n');
}

// How marks are written on a marked script, and what to do when one cannot be
// read. The last sentence is the important one: a mark it cannot make out used
// to come back as 0, which is indistinguishable from a question the student
// actually scored nothing on, and quietly cost them marks they had earned.
const MARKING_BRIEF = `The marks are handwritten by whoever marked it. Look for a number in the margin beside each part, or beside the total line at the end of a question; ticks and crosses in the working are not the mark. Where a mark has been crossed out and rewritten, take the final one. If a mark is missing, illegible, or you are not certain of it, give null for that question — never 0 and never a guess. 0 means the marker wrote 0.`;

// What the paper says about itself, read in the browser before anything is
// sent. On a paper that prints "(Total for Question 3 is 5 marks)" this is
// exact and free, so the reader is told the allocations rather than left to
// read them off the page — halving what it can get wrong, since only the
// student's own marks are left to make out.
async function paperFacts(file, topics) {
  if (!isPdf(file)) return null;
  try {
    const scanned = await scanPaper(file, topics);
    const allocations = scanned.questions
      .filter(q => q.marksAvailable > 0)
      .map(q => `Q${q.question} is out of ${q.marksAvailable}`);
    if (!allocations.length) return null;
    return {
      session: scanned.session || null,
      year: scanned.year || null,
      allocations,
      total: scanned.questions.reduce((sum, q) => sum + q.marksAvailable, 0),
    };
  } catch (e) {
    // Not every paper prints its allocations, and a photograph prints nothing.
    return null;
  }
}

const questionsOfResults = (results) =>
  results.flatMap(r => (Array.isArray(r?.questions) ? r.questions : []));

const scoredTotal = (questions) =>
  questions.reduce((sum, q) => sum + (Number(q.marksScored) || 0), 0);

async function readPaperWithModel(file, paper, topics, onProgress) {
  const outline = syllabusOutline(topics);
  const facts = await paperFacts(file, topics);
  const parts = await prepareParts(file);

  // A paper split into parts has its feedback written once at the end, from all
  // of them together. Asking each part for feedback as well meant writing three
  // sets of it and throwing away three — most of the wait, for nothing.
  const buildPrompt = (suffix, single) =>
    `This file is a corrected/marked past exam paper.${suffix} Find the exam session and year printed on it (e.g. "May/June", "October/November", "January", plus a 4-digit year) — look at headers, footers, or the front cover. Then go through EVERY question, not only the ones with marks lost — a question answered perfectly matters just as much for working out how well the student knows a topic. For each question give: the question number, the topic it tests, the subtopic within that topic, the marks the student scored on it as an integer, and the marks available for it as an integer.`
    + (outline ? `\n\nThis is the student's syllabus. Each line is a topic, then the subtopics under it:\n\n${outline}\n\nUse these names EXACTLY as written above for both "topic" and "subtopic" — copy them character for character rather than describing the question in your own words, because they are matched by name against the student's checklist. Pick the single subtopic that fits best even when a question touches more than one. Only invent a label if a question genuinely fits nothing on the list, and say so by leaving "subtopic" null rather than writing something close.` : '')
    + (facts ? `\n\nThe paper itself states these mark allocations, read from its printed text. Use them for "marksAvailable" rather than reading them off the page again, and use the same question numbering:\n\n${facts.allocations.join('\n')}` : '')
    + `\n\n${MARKING_BRIEF}\n\nAlso report the total the marker wrote on the paper — the figure in the total box on the front cover, or the sum written at the end — as "reportedTotal". Give null if no such figure is written anywhere. Do not put your own sum there.`
    + ` Where marks were lost, also describe the mistake in one short sentence.${single ? `\n\n${FEEDBACK_BRIEF}` : ''}\n\nRespond with ONLY a JSON object, no other text, no markdown fences. Format: {"session": "May/June", "year": "2023", "reportedTotal": 62, "questions": [{"question": "3b", "topic": "Enzymes", "subtopic": "Inhibition", "marksScored": 3, "marksAvailable": 5, "mistake": "Confused competitive and non-competitive inhibition"}]${single ? `, "feedback": ${FEEDBACK_SHAPE}` : ''}}. If the session or year can't be found, use null for that field.`;

  let results = await readParts(parts, buildPrompt, 8000, onProgress).then(r => r.results);
  let questions = questionsOfResults(results);
  if (!questions.length) throw new Error('No questions could be read from that file');

  // The one check the paper can settle itself. If the marker's own total does
  // not match what was read off the page, something was misread — so it is
  // read again, slowly, and whichever pass agrees with the total is kept.
  const reported = results.map(r => r?.reportedTotal).find(t => Number.isFinite(Number(t)));
  const target = reported === undefined ? null : Number(reported);

  if (target !== null && scoredTotal(questions) !== target) {
    const recheck = (suffix) =>
      `This file is a corrected/marked past exam paper.${suffix} The marker wrote a total of ${target} on it, but a first reading of the individual marks came to ${scoredTotal(questions)}. Go through every question again and read each handwritten mark carefully, so that they add to ${target}. Give the question number, the topic, the subtopic, the marks scored and the marks available for each.`
      + (outline ? `\n\nUse these topic and subtopic names EXACTLY as written:\n\n${outline}` : '')
      + (facts ? `\n\nThe printed mark allocations are:\n\n${facts.allocations.join('\n')}` : '')
      + `\n\n${MARKING_BRIEF}\n\nRespond with ONLY a JSON object, no other text, no markdown fences. Format: {"questions": [{"question": "3b", "topic": "Enzymes", "subtopic": "Inhibition", "marksScored": 3, "marksAvailable": 5, "mistake": "..."}]}`;

    try {
      const second = await readParts(parts, recheck, 8000, onProgress, 'high').then(r => r.results);
      const reread = questionsOfResults(second);
      // Only taken if it actually reconciles; a second wrong answer is no
      // better than the first, and the first at least came with feedback.
      if (reread.length && scoredTotal(reread) === target) {
        const byNumber = new Map(reread.map(q => [String(q.question), q]));
        questions = questions.map(q => {
          const better = byNumber.get(String(q.question));
          return better ? { ...q, ...better, mistake: better.mistake || q.mistake } : q;
        });
      }
    } catch (e) {
      // The first reading stands, and the mismatch is recorded below.
    }
  }

  const identified = results.find(r => r?.session || r?.year) || {};
  const feedback = parts.length === 1
    ? (results[0]?.feedback || null)
    : await feedbackFromQuestions(questions);

  const settled = target === null || scoredTotal(questions) === target;

  return {
    id: uid(),
    paper,
    fileName: file.name,
    session: identified.session || facts?.session || null,
    year: identified.year || facts?.year || null,
    uploadedAt: new Date().toISOString(),
    questions,
    readBy: 'model',
    // Said plainly on the paper when the marks still do not add up, rather
    // than left to be noticed.
    ...(settled ? {} : { totalMismatch: { reported: target, read: scoredTotal(questions) } }),
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
  const buildPrompt = (suffix, single) =>
    `This file is a corrected/marked unit test on the topic "${topicName || ''}".${suffix} Go through EVERY question on it, not only the ones with marks lost. For each question give the subtopic it tests`
    + (subtopicNames.length ? ` — use one of these names EXACTLY as written, copied character for character rather than described in your own words, because they are matched by name against the student's checklist: ${subtopicNames.join(' | ')}. Only invent a label if a question fits none of them` : '')
    + `, the marks the student scored on it as an integer, the marks available for it as an integer, and where marks were lost a one-sentence description of the mistake. Then list which subtopics need the most focus, ranked by how many marks were lost on them.${single ? `\n\n${FEEDBACK_BRIEF}` : ''}\n\nRespond with ONLY a JSON object, no other text, no markdown fences. Format: {"details": [{"subtopic": "Enzyme kinetics", "marksScored": 3, "marksAvailable": 5, "mistake": "Confused competitive and non-competitive inhibition"}], "focus": ["Enzyme kinetics"]${single ? `, "feedback": ${FEEDBACK_SHAPE}` : ''}}`;

  const { results, partCount } = await readParts(await prepareParts(file), buildPrompt, 6000, onProgress);

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
