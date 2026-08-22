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
// figure follows and there is nothing else on the line.
//
// The last of those has to be told apart from the page number, which is also a
// number alone on a line. Sequence is not enough to do it: an Edexcel paper
// prints its page numbers down the foot of every page, so they run 2, 3, 4 …
// 32 in perfect order and satisfy any check that only asks what comes next.
// The stop does tell them apart — a question is printed "4." and a page number
// "4" — and across the 2022 and 2025 papers every number carrying a stop is a
// question opener and no page number carries one.
const QUESTION_NUMBER = /^(\d{1,2})\s*([.)])?\s*(.*)$/;

function makeOpenerReader() {
  let expected = 1;
  return (text) => {
    const match = text.match(QUESTION_NUMBER);
    if (!match) return null;
    if (Number(match[1]) !== expected) return null;
    const [, number, stop, rest] = match;
    if (!rest.trim() && !stop) return null;
    expected += 1;
    return String(number);
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
// A page of an exam paper carries more furniture than words: a margin
// watermark set down the side of every page, the printer's code, "Turn over".
// The line grouping picks it up mid-sentence because it shares a row with the
// question, and none of it says anything about what is being asked. It is not
// harmless noise either — "DO NOT WRITE IN THIS AREA" was on its own enough to
// file a differentiation question under "Area under a curve".
const FURNITURE = [
  /DO\s*NOT\s*WRITE\s*IN\s*THIS\s*AREA/gi,
  /Leave\s+blank/gi,
  /\*?P\d{5}[0-9A-Z]*\*?/g,
  /\bTurn\s+over\b/gi,
  /\bBLANK\s+PAGE\b/gi,
];

const stripFurniture = (text) =>
  FURNITURE.reduce((out, re) => out.replace(re, ' '), text).replace(/\s+/g, ' ').trim();

function collectWording(lines) {
  const wording = new Map();
  const readOpener = makeOpenerReader();
  let current = null;

  lines.forEach(({ text }) => {
    const opened = readOpener(text);
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

    const words = stripFurniture(text);
    if (current && words) wording.set(current, `${wording.get(current) || ''} ${words}`.trim());
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
    const opened = readOpener(text);
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
// Some papers do not print their date at all — the 2022 and 2023 papers carry
// no "Tuesday 9 January" line where the 2024 one does — so there is nothing on
// the page to read and null is the truthful answer.
//
// The file it arrived in usually knows, though: "IAL_MATHS_2025_Oct_P1_QP",
// "wma11-01-que-20230110", "...-may-2022-pdf". A month there is unambiguous in
// a way it is not on the page, where "there may be more space than you need"
// is printed on every cover.
const NAME_MONTHS = [
  { re: /(^|[^a-z])(may|jun|june|summer)([^a-z]|$)/i, session: 'May/June' },
  { re: /(^|[^a-z])(oct|october|nov|november|autumn|winter)([^a-z]|$)/i, session: 'Oct/Nov' },
  { re: /(^|[^a-z])(jan|january)([^a-z]|$)/i, session: 'January' },
];

const SESSION_OF_MONTH = {
  1: 'January', 5: 'May/June', 6: 'May/June', 10: 'Oct/Nov', 11: 'Oct/Nov',
};

export function sittingFromName(fileName) {
  const name = String(fileName || '').replace(/\.[a-z0-9]+$/i, '');
  if (!name) return { session: null, year: null };

  // A printed date, as an exam board writes it in a file name: 20230110.
  const stamped = name.match(/(20\d{2})(0[1-9]|1[0-2])([0-2]\d|3[01])/);
  if (stamped) {
    return { session: SESSION_OF_MONTH[Number(stamped[2])] || null, year: stamped[1] };
  }

  const year = name.match(/(^|[^0-9])(20[0-2]\d)([^0-9]|$)/);
  const month = NAME_MONTHS.find(entry => entry.re.test(name));
  return { session: month ? month.session : null, year: year ? year[2] : null };
}

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

// One page of a paper, drawn as a picture.
//
// Rendered when it is asked for rather than at upload time: a paper has
// thirty-odd pages and almost none of them are ever looked at, so drawing them
// all would be a slow upload in exchange for pictures nobody opens.
export async function renderPdfPage(file, pageNumber, maxWidth = 1100) {
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const number = Math.min(Math.max(1, pageNumber), doc.numPages);
  const page = await doc.getPage(number);

  const unscaled = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: Math.min(2, maxWidth / unscaled.width) });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

  return { url: canvas.toDataURL('image/jpeg', 0.82), page: number, pages: doc.numPages };
}

export async function scanPaper(file, topics = []) {
  return scanLines(await readLines(file), topics);
}
