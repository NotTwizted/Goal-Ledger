// Pulls the lines out of a real PDF exactly as the app's readLines does, so a
// fixture is the paper's own text rather than someone's memory of it.
// Usage: npm run fixture -- <paper.pdf>  (writes tests/fixtures.mjs)
import { readFileSync, writeFileSync } from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const [, , input, output = new URL('./fixtures.mjs', import.meta.url).pathname.slice(1)] = process.argv;
const data = new Uint8Array(readFileSync(input));
const doc = await pdfjs.getDocument({ data, useSystemFonts: false }).promise;

const lines = [];
for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();

  const rows = new Map();
  content.items.forEach(item => {
    if (!item.str || !item.str.trim()) return;
    const y = Math.round(item.transform[5]);
    const row = rows.get(y) || [];
    row.push({ x: item.transform[4], text: item.str });
    rows.set(y, row);
  });

  [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .forEach(([, row]) => {
      const text = row.sort((a, b) => a.x - b.x).map(p => p.text).join(' ').replace(/\s+/g, ' ').trim();
      if (text) lines.push({ page: pageNumber, text });
    });
}

if (output) {
  const body = lines.map(l => `  { page: ${l.page}, text: ${JSON.stringify(l.text)} },`).join('\n');
  writeFileSync(output, `// Lines as ${input.split(/[\\/]/).pop()} actually extracts.\nexport const LINES = [\n${body}\n];\n`);
  console.log(`${lines.length} lines written to ${output}`);
} else {
  lines.forEach(l => console.log(`p${l.page}\t${l.text}`));
}
