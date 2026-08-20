// Reads an exam paper in the browser and works out its question structure —
// which questions there are and what each is worth — without sending anything
// anywhere. The printed text is all this needs, so it costs nothing and works
// offline.
//
// What it cannot do is read the marker's handwriting. The marks a student
// actually scored are theirs to enter; this only saves them typing out the
// question list and hunting for each total.

import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// "(Total for Question 3 is 10 marks)" — Edexcel prints this under every
// question, and it is the most reliable thing on the page.
const TOTAL_LINE = /Total\s+for\s+Question\s+(\d+)\s+is\s+(\d+)\s+marks?/gi;

// A trailing "(4)" or "[4]" is how a part-question's marks are printed.
const PART_MARKS = /[[(](\d{1,2})[\])]\s*$/;

// A line that opens a question: "1.", "2 ", "13. (a)"
const QUESTION_START = /^(\d{1,2})[.)]?\s/;

const SESSION_PATTERNS = [
  { re: /\b(?:may|june|may\s*\/\s*june|summer)\b/i, session: 'May/June' },
  { re: /\b(?:october|november|oct\s*\/\s*nov|autumn|winter)\b/i, session: 'Oct/Nov' },
  { re: /\b(?:january|jan)\b/i, session: 'January' },
];

async function readLines(file) {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const lines = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    // Group text fragments into lines by their vertical position, since a PDF
    // stores words as scattered pieces rather than as lines.
    const rows = new Map();
    content.items.forEach(item => {
      if (!item.str || !item.str.trim()) return;
      const y = Math.round(item.transform[5]);
      const row = rows.get(y) || [];
      row.push({ x: item.transform[4], text: item.str });
      rows.set(y, row);
    });

    [...rows.entries()]
      .sort((a, b) => b[0] - a[0]) // top of the page downwards
      .forEach(([, row]) => {
        const text = row.sort((a, b) => a.x - b.x).map(p => p.text).join(' ').replace(/\s+/g, ' ').trim();
        if (text) lines.push({ page: pageNumber, text });
      });
  }

  return lines;
}

function detectSitting(lines) {
  const head = lines.slice(0, 60).map(l => l.text).join(' ');
  const year = (head.match(/\b(20\d{2})\b/) || [])[1] || null;
  const session = (SESSION_PATTERNS.find(p => p.re.test(head)) || {}).session || null;
  return { session, year };
}

// Preferred: the paper tells us each question's total outright.
function fromTotals(lines) {
  const found = new Map();
  lines.forEach(({ text, page }) => {
    TOTAL_LINE.lastIndex = 0;
    let match;
    while ((match = TOTAL_LINE.exec(text)) !== null) {
      found.set(match[1], { question: match[1], marksAvailable: Number(match[2]), page });
    }
  });
  return [...found.values()].sort((a, b) => Number(a.question) - Number(b.question));
}

// Otherwise: add up the part marks printed against each question.
function fromPartMarks(lines) {
  const questions = [];
  let current = null;

  lines.forEach(({ text, page }) => {
    const opener = text.match(QUESTION_START);
    if (opener) {
      const number = opener[1];
      if (!current || current.question !== number) {
        current = { question: number, marksAvailable: 0, page };
        questions.push(current);
      }
    }
    const part = text.match(PART_MARKS);
    if (part && current) current.marksAvailable += Number(part[1]);
  });

  return questions.filter(q => q.marksAvailable > 0);
}

export async function scanPaper(file) {
  const lines = await readLines(file);
  if (!lines.length) {
    throw new Error('No text could be read from that PDF — it may be a scan of paper rather than a digital document.');
  }

  const byTotals = fromTotals(lines);
  const questions = byTotals.length ? byTotals : fromPartMarks(lines);

  if (!questions.length) {
    throw new Error('No questions could be identified. You can still add the paper by entering its questions yourself.');
  }

  return {
    ...detectSitting(lines),
    source: byTotals.length ? 'totals' : 'parts',
    questions: questions.map(q => ({ ...q, marksScored: null, topic: '' })),
  };
}
