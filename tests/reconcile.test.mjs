// The marker's own total is the one thing on a paper that can check the rest.
// These cover the arithmetic around it, which is what decides whether a second
// reading is asked for and whether it is trusted when it comes back.
import { readFileSync } from 'node:fs';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

const src = readFileSync(new URL('../src/lib/uploads.js', import.meta.url), 'utf8');

check('the reader is told a mark it could not read is not a zero',
  /Never 0 for a mark you could not read/.test(src));
check('an unreadable mark comes back null, not zero',
  /give null for that question/.test(src));
check('the printed allocations are handed over rather than re-read',
  /Use them for "marksAvailable" rather than reading them off the page again/.test(src));
check('the marker\'s total is asked for separately from any sum',
  /Do not put your own sum there/.test(src));
check('a mismatch triggers a second reading',
  /scoredTotal\(questions\) !== target/.test(src));
check('which thinks harder than the first',
  /readParts\(focused \? \[focused\] : parts, recheck, 8000, onProgress, 'high'\)/.test(src));
check('a revision is only taken if it reconciles',
  /scoredTotal\(reread\) === target/.test(src));
check('an unreconciled paper says so',
  /totalMismatch: \{ reported: target, read: scoredTotal\(questions\) \}/.test(src));
check('the parts are prepared once, not per pass',
  (src.match(/await prepareParts\(file\)/g) || []).length === 3,
  `${(src.match(/await prepareParts\(file\)/g) || []).length} calls`);

const api = readFileSync(new URL('../api/extract.js', import.meta.url), 'utf8');
check('the server honours a request to think harder',
  /thinkingLevel: body\?\.thinking === 'high' \? 'high' : 'low'/.test(api));

const page = readFileSync(new URL('../src/pages/PastPaperPage.jsx', import.meta.url), 'utf8');
check('a paper whose marks do not add up warns on its face',
  /These marks may not be right/.test(page));

// A question whose mark could not be read is chased, and never counted as a
// zero — not in the topics, and not in the feedback.
check('an unread question sends it back for a second look',
  /if \(unread\.length \|\| mismatched\(\)\)/.test(src));
check('the second look is told which questions to find',
  /no mark was read for \$\{unread\.length === 1 \? 'question' : 'questions'\}/.test(src));
check('a mark found where there was none is taken on its own merits',
  /if \(!wasUnread && !trustRevisions\) return q;/.test(src));
check('but changing a mark already read needs the total to agree',
  /const trustRevisions = reread\.length > 0 && target !== null && scoredTotal\(reread\) === target;/.test(src));
check('a blank is never overwritten with another blank',
  /if \(wasUnread && recordedScore\(better\) === null\) return q;/.test(src));
check('feedback written while questions were unread is thrown away',
  /const feedback = unread\.length\s*\?\s*null/.test(src));
check('and the unread questions are recorded on the paper',
  /unreadQuestions: unread/.test(src));
check('the reader is told a blank is not a lost mark',
  /Never describe a question you gave null for as having lost marks/.test(src));
check('and that null is a last resort, not an expression of doubt',
  /Only if there is genuinely no mark to be found/.test(src));
check('the paper names the questions it could not read',
  /No mark could be read for/.test(page));

// A mark that could not be found in a whole paper is looked for again on the
// two or three pages it must be on.
check('the pages a missing mark must be on are cut out',
  /const focused = unread\.length && !mismatched\(\) && wantedPages\.length/.test(src));
check('taken from the total line of each question, and its neighbours',
  /return page \? \[page - 1, page, page \+ 1\] : \[\];/.test(src));
check('but the whole paper is kept when a total must be settled',
  /unread\.length && !mismatched\(\)/.test(src));
check('the second look is told which marks are already settled',
  /These marks were read successfully and are not in question/.test(src));
check('and made to transcribe before it assigns',
  /list every handwritten number you can see anywhere on these pages/.test(src));

const prep = readFileSync(new URL('../src/lib/fileprep.js', import.meta.url), 'utf8');
check('cutting pages out refuses anything but a PDF',
  /if \(!isPdf\(file\) \|\| !pageNumbers\.length\) return null;/.test(prep));
check('and refuses a result too large to send',
  /if \(bytes\.length > MAX_PART_BYTES\) return null;/.test(prep));
check('page numbers out of range are dropped, not requested',
  /\.filter\(n => n >= 1 && n <= total\)/.test(prep));
