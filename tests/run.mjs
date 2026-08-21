// Runs every *.test.mjs beside this file and fails the process if any check
// printed FAIL. The checks print their own lines, so a run reads as a list of
// what does and does not hold rather than a count.
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter(f => f.endsWith('.test.mjs')).sort();

let failed = 0;
const write = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, ...rest) => {
  if (String(chunk).includes('FAIL')) failed += 1;
  return write(chunk, ...rest);
};

for (const file of files) {
  write(`\n── ${file.replace('.test.mjs', '')}\n`);
  await import(pathToFileURL(join(here, file)).href);
}

write(failed ? `\n${failed} check${failed === 1 ? '' : 's'} failed\n` : '\nall checks passed\n');
process.exit(failed ? 1 : 0);
