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
import { matchQuestionToTopic } from './matchtopics';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// "(Total for Question 3 is 10 marks)" — Edexcel prints this under every
// question, and it is the most reliable thing on the page.
const TOTAL_LINE = /Total\s+for\s+Question\s+(\d+)\s+is\s+(\d+)\s+marks?/gi;

// A trailing "(4)" or "[4]" is how a part-question's marks are printed.
const PART_MARKS = /[[(](\d{1,2})[\])]\s*$/;

// A line that opens a question: "1.", "2 ", "13. (a)", or just "5." where a
// figure follows. Numbers are only accepted in sequence, which is what keeps a
// page number at the foot of the page from opening a question of its own.
const QUESTION_NUMBER = /^(\d{1,2})\s*[.)]?\s*(.*)$/;

function makeOpenerReader() {
  let expected = 1;
  return (text, insideQuestion) => {
    const match = text.match(QUESTION_NUMBER);
    if (!match) return null;
    if (Number(match[1]) !== expected) return null;
    // A bare number is only an opener between questions; mid-question it is a
    // page number or a stray figure label.
    if (!match[2].trim() && insideQuestion) return null;
    expected += 1;
    return String(match[1]);
  };
}

// "may" on its own is not a month: every Edexcel cover page says "there may be
// more space than you need", which read as the May/June sitting.
const SESSION_PATTERNS = [
  { re: /\bmay\s*\/\s*june\b|\bjune\b|\bsummer\b/i, session: 'May/June' },
  { re: /\boctober\b|\bnovember\b|\boct\s*\/\s*nov\b|\bautumn\b|\bwinter\b/i, session: 'Oct/Nov' },
  { re: /\bjanuary\b/i, session: 'January' },
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

// Everything printed between one question opening and the next, which is what
// a topic can be recognised from.
function collectWording(lines) {
  const wording = new Map();
  const readOpener = makeOpenerReader();
  let current = null;

  lines.forEach(({ text }) => {
    const opened = readOpener(text, current !== null);
    if (opened) current = opened;

    TOTAL_LINE.lastIndex = 0;
    if (TOTAL_LINE.test(text)) {
      // The total line closes a question and says nothing about its subject.
      current = null;
      return;
    }

    // Continuation headers and the answer lines beneath them say nothing about
    // what the question was on.
    if (/^Question\s+\d+\s+continued/i.test(text) || /^_+$/.test(text)) return;

    if (current) wording.set(current, `${wording.get(current) || ''} ${text}`.trim());
  });

  return wording;
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
  const readOpener = makeOpenerReader();
  let current = null;

  lines.forEach(({ text, page }) => {
    const opened = readOpener(text, current !== null);
    if (opened) {
      current = { question: opened, marksAvailable: 0, page };
      questions.push(current);
    }
    const part = text.match(PART_MARKS);
    if (part && current) current.marksAvailable += Number(part[1]);
  });

  return questions.filter(q => q.marksAvailable > 0);
}

// Split from the reading so the parsing can be tested against a real paper's
// text without needing the file itself.
export function scanLines(lines, topics = []) {
  if (!lines.length) {
    throw new Error('No text could be read from that PDF — it may be a scan of paper rather than a digital document.');
  }

  const byTotals = fromTotals(lines);
  const questions = byTotals.length ? byTotals : fromPartMarks(lines);

  if (!questions.length) {
    throw new Error('No questions could be identified. You can still add the paper by entering its questions yourself.');
  }

  const wording = collectWording(lines);

  return {
    ...detectSitting(lines),
    source: byTotals.length ? 'totals' : 'parts',
    questions: questions.map(q => {
      const text = wording.get(q.question) || '';
      const { target, score } = matchQuestionToTopic(text, topics);
      return { ...q, marksScored: null, target, matched: Boolean(target), matchScore: score };
    }),
  };
}

export async function scanPaper(file, topics = []) {
  return scanLines(await readLines(file), topics);
}
