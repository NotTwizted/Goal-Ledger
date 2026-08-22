import { callClaudeText, callClaudeWithFile, recordedScore, uid } from './helpers';
import { contentBlock, isPdf, pagesOf, prepareParts } from './fileprep';
import { scanPaper, sittingFromName } from './pdfscan';

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
  const named = sittingFromName(fileName);
  const questions = scanned.questions.map(q => {
    const [topic, subtopic] = (q.target || '').split('|');
    return {
      question: q.question,
      topic: topic || null,
      subtopic: subtopic || null,
      marksScored: null,
      marksAvailable: Number(q.marksAvailable) || 0,
      ...(q.page ? { page: q.page } : {}),
    };
  });

  return {
    id: uid(),
    paper,
    fileName,
    session: scanned.session || named.session,
    year: scanned.year || named.year,
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
const MARKING_BRIEF = `The marks are handwritten by whoever marked it. Look for a number in the margin beside each part, or beside the total line at the end of a question; ticks and crosses in the working are not the mark. Where a mark has been crossed out and rewritten, take the final one.

Read a mark for every question — that is the point of the exercise, and every question on a marked script has one somewhere. Look at the whole page: the margin, the foot of the page, beside the question's total line. Only if there is genuinely no mark to be found — the page is missing, or the writing is obscured — give null for that question. Never 0 for a mark you could not read: 0 means the marker wrote 0, and a question you could not read is not a question the student got wrong. Never describe a question you gave null for as having lost marks.`;

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
      // Where each question's total line is printed, which is where its mark
      // is written.
      pages: Object.fromEntries(scanned.questions.filter(q => q.page).map(q => [String(q.question), q.page])),
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

  // Two things send it back for a second look, and both mean the same thing:
  // the first reading is not to be trusted as it stands.
  //
  // A question with no mark read is the worse of the two. A blank where a mark
  // should be tells the student nothing and counts for nothing, and it is
  // exactly the question they most want an answer about.
  const reported = results.map(r => r?.reportedTotal).find(t => Number.isFinite(Number(t)));
  const target = reported === undefined ? null : Number(reported);

  const unreadOf = (list) => list.filter(q => recordedScore(q) === null).map(q => String(q.question));
  let unread = unreadOf(questions);
  const mismatched = () => target !== null && scoredTotal(questions) !== target;

  if (unread.length || mismatched()) {
    const why = [
      unread.length ? `no mark was read for ${unread.length === 1 ? 'question' : 'questions'} ${unread.join(', ')} — find ${unread.length === 1 ? 'it' : 'them'}` : '',
      mismatched() ? `the marker wrote a total of ${target} but the marks read came to ${scoredTotal(questions)}, so at least one is wrong` : '',
    ].filter(Boolean).join(', and ');

    // The pages the missing marks must be on — the question's total line and
    // its neighbours — cut out into one short document. Searching three pages
    // beats searching thirty-two. Only when the marks are the whole problem:
    // a total that will not add up needs the whole paper to settle.
    const wantedPages = unread.flatMap(number => {
      const page = facts?.pages?.[number];
      return page ? [page - 1, page, page + 1] : [];
    }).filter(page => page >= 1);

    const focused = unread.length && !mismatched() && wantedPages.length
      ? await pagesOf(file, wantedPages)
      : null;

    const known = questions
      .filter(q => recordedScore(q) !== null)
      .map(q => `Q${q.question}: ${recordedScore(q)} of ${q.marksAvailable}`);

    const recheck = (suffix) =>
      `This is ${focused ? 'part of' : ''} a corrected/marked past exam paper.${focused ? '' : suffix} It has been read once already and needs looking at again: ${why}.`
      + (known.length ? `\n\nThese marks were read successfully and are not in question:\n\n${known.join('\n')}` : '')
      + `\n\nWork in two steps. First, list every handwritten number you can see anywhere on these pages, with where each one is — "12 in the right margin", "6 beside the total line for question 5". Include every one, even those you think are part of the student's working. Then decide which of them is the marker's mark for each question you were asked about, and report that.`
      + (outline ? `\n\nUse these topic and subtopic names EXACTLY as written:\n\n${outline}` : '')
      + (facts ? `\n\nThe printed mark allocations are:\n\n${facts.allocations.join('\n')}` : '')
      + (target !== null && !focused ? `\n\nThe marks you report must add to ${target}, which is what the marker wrote.` : '')
      + `\n\n${MARKING_BRIEF}\n\nRespond with ONLY a JSON object, no other text, no markdown fences. Format: {"seen": ["12 in the right margin of the page for question 5"], "questions": [{"question": "3b", "topic": "Enzymes", "subtopic": "Inhibition", "marksScored": 3, "marksAvailable": 5, "mistake": "..."}]}`;

    try {
      const second = await readParts(focused ? [focused] : parts, recheck, 8000, onProgress, 'high')
        .then(r => r.results);
      const reread = questionsOfResults(second);
      const byNumber = new Map(reread.map(q => [String(q.question), q]));

      // A mark found where there was none is taken on its own merits: it can
      // only be an improvement on a blank. Changing a mark that was already
      // read is a bigger claim, so it is taken only when the second reading
      // reconciles with the marker's total — a second wrong answer is no
      // better than the first.
      const trustRevisions = reread.length > 0 && target !== null && scoredTotal(reread) === target;

      questions = questions.map(q => {
        const better = byNumber.get(String(q.question));
        if (!better) return q;
        const wasUnread = recordedScore(q) === null;
        if (!wasUnread && !trustRevisions) return q;
        if (wasUnread && recordedScore(better) === null) return q;
        return { ...q, ...better, mistake: better.mistake || q.mistake };
      });
      unread = unreadOf(questions);
    } catch (e) {
      // The first reading stands, and whatever is still wrong is said below.
    }
  }

  const identified = results.find(r => r?.session || r?.year) || {};
  const named = sittingFromName(file.name);

  // Which page each question is printed on, so it can be looked at again. The
  // reader is not asked — the paper's own total lines already say, exactly.
  if (facts?.pages) {
    questions = questions.map(q => {
      const number = String(q.question || '').match(/\d+/);
      const page = number ? facts.pages[number[0]] : null;
      return page ? { ...q, page } : q;
    });
  }

  // Feedback written alongside the first reading counted every unread question
  // as a zero — "the student lost 42 marks" on a paper where 28 of them were
  // simply not read. It is worth nothing once that is known, so the page works
  // out its own from the marks that were.
  const feedback = unread.length
    ? null
    : (parts.length === 1 ? (results[0]?.feedback || null) : await feedbackFromQuestions(questions));

  const settled = target === null || scoredTotal(questions) === target;

  return {
    id: uid(),
    paper,
    fileName: file.name,
    session: identified.session || facts?.session || named.session,
    year: identified.year || facts?.year || named.year,
    uploadedAt: new Date().toISOString(),
    questions,
    readBy: 'model',
    // Said plainly on the paper when the marks still do not add up, rather
    // than left to be noticed.
    ...(settled ? {} : { totalMismatch: { reported: target, read: scoredTotal(questions) } }),
    ...(unread.length ? { unreadQuestions: unread } : {}),
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
