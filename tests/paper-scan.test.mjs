// Reading a paper's own printed text: which question is which, and when it was
// sat. Both are things the app gets for nothing before anything is uploaded,
// and both used to be wrong on older papers.
import { sittingFromName } from '../src/lib/pdfscan.js';

const check = (label, ok, detail = '') =>
  console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);

// Real file names, as the exam board and the download sites write them.
const NAMES = [
  ['IAL_MATHS_2025_Oct_P1_QP.pdf', 'Oct/Nov', '2025'],
  ['wma11-01-que-20230110.pdf', 'January', '2023'],
  ['wma11-01-que-20240110.pdf', 'January', '2024'],
  ['2206-wma11-01-ial-pure-mathematics-p1-may-2022-pdf.pdf', 'May/June', '2022'],
  ['9618_s25_qp_23.pdf', null, null],
  ['scan.pdf', null, null],
  ['', null, null],
  // A month must be a whole word, not a fragment of one — "maybe" is not May,
  // and neither is "januarys" January.
  ['januarys-mock.pdf', null, null],
  ["january's-mock.pdf", 'January', null],
  ['maybe-this-one.pdf', null, null],
  ['summary-2024.pdf', null, '2024'],
  ['november_2021_paper.pdf', 'Oct/Nov', '2021'],
];

for (const [name, session, year] of NAMES) {
  const got = sittingFromName(name);
  check(`"${name || '(nothing)'}"`, got.session === session && got.year === year,
    `${got.session} ${got.year}`);
}

// The page number problem. An Edexcel paper prints its page numbers alone down
// the foot of every page, so they run 2, 3, 4 … 32 in perfect order and pass
// any check that only asks what number comes next. A question that opens with
// a figure is also a number alone on a line. The stop tells them apart.
import { scanLines } from '../src/lib/pdfscan.js';

const L = (page, text) => ({ page, text });
const pageFoot = (page) => [L(page, String(page)), L(page, `*P78848A0${page}32*`)];

// Q1 opens with text, Q2 with a figure, and the page numbers run right through
// both — reaching the same values as the questions do.
const lines = [
  L(1, 'Pearson Edexcel International Advanced Level'),
  L(1, 'Thursday 9 October 2025'),
  ...pageFoot(1),
  L(2, '1. The curve C has equation y = 6x2 + 3x'),
  L(2, '(a) Find the gradient of the tangent.'),
  L(2, '(4)'),
  ...pageFoot(2),
  L(3, '(Total for Question 1 is 4 marks)'),
  ...pageFoot(3),
  L(4, '2.'),
  L(4, 'Figure 1'),
  L(4, 'Find the area of the sector in radians.'),
  L(4, '(6)'),
  ...pageFoot(4),
  L(5, '(Total for Question 2 is 6 marks)'),
  ...pageFoot(5),
];

const withTotals = scanLines(lines, []);
check('a paper printing its question totals reads both questions',
  withTotals.questions.length === 2, `${withTotals.questions.length}`);
check('and their marks', withTotals.questions.map(q => q.marksAvailable).join(',') === '4,6',
  withTotals.questions.map(q => `Q${q.question}:${q.marksAvailable}`).join(' '));

// The same paper without the total lines — the older format, which has to fall
// back to adding up the part marks. This is where page numbers used to win.
const noTotals = scanLines(lines.filter(l => !/Total\s+for\s+Question/i.test(l.text)), []);
check('an older paper without them reads both questions too',
  noTotals.questions.length === 2, `${noTotals.questions.length}`);
check('and does not let a page number open a question',
  noTotals.questions.map(q => q.question).join(',') === '1,2',
  noTotals.questions.map(q => q.question).join(','));
check('so the marks are still right', noTotals.questions.map(q => q.marksAvailable).join(',') === '4,6',
  noTotals.questions.map(q => `Q${q.question}:${q.marksAvailable}`).join(' '));
check('the sitting is read from the page when the page says', withTotals.session === 'Oct/Nov',
  String(withTotals.session));
