import { PDFDocument } from 'pdf-lib';

// A serverless request body is capped at 4.5MB, and base64 inflates a file by
// about a third, so roughly 3MB is all that can be sent in one go. Rather than
// refuse anything larger, oversized files are made to fit here in the browser:
// photos are scaled down, and a long PDF is split into runs of pages that are
// each small enough to send. The paper is still read in full — just in more
// than one request.

const MAX_PART_BYTES = 3 * 1024 * 1024;

// Beyond this the splitting itself becomes the slow part, and a scan this
// large is usually a phone photo of every page at full resolution.
export const MAX_TOTAL_BYTES = 40 * 1024 * 1024;

export const isPdf = (file) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

function bytesToBase64(bytes) {
  // Chunked, because spreading a few million bytes into one call overflows
  // the argument limit.
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

// Every photograph is scaled down, not only the ones too large to send. A
// twelve megapixel picture of an A4 page is thousands of image tokens for the
// model to look at and tells it nothing a 1600px one does not — it was the
// difference between a page taking a minute and taking seconds.
async function shrinkImage(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (e) {
    // A format the browser will not decode (HEIC, most often). Send it as it
    // is and let the model decide, so long as it fits.
    if (file.size <= MAX_PART_BYTES) {
      const buffer = await readAsArrayBuffer(file);
      return [{ mediaType: file.type || 'image/jpeg', data: bytesToBase64(new Uint8Array(buffer)) }];
    }
    throw new Error(`${file.name} is not an image this browser can open, and is too large to send as it is.`);
  }

  for (const [maxEdge, quality] of [[1600, 0.82], [1300, 0.75], [1000, 0.65]]) {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_PART_BYTES) {
      const buffer = await blob.arrayBuffer();
      return [{ mediaType: 'image/jpeg', data: bytesToBase64(new Uint8Array(buffer)) }];
    }
  }
  throw new Error(`${file.name} could not be reduced enough to send. Try photographing fewer pages at once.`);
}

async function pagesToBytes(source, start, end) {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(source, Array.from({ length: end - start }, (_, i) => start + i));
  pages.forEach(page => out.addPage(page));
  return out.save();
}

// Splits into the longest runs of pages that still fit, halving a run whenever
// it comes out too large.
async function splitPdf(file) {
  const buffer = await readAsArrayBuffer(file);
  const source = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = source.getPageCount();

  const parts = [];
  let start = 0;
  let run = Math.max(1, Math.ceil(total / Math.ceil(buffer.byteLength / MAX_PART_BYTES)));

  while (start < total) {
    let end = Math.min(total, start + run);
    let bytes = await pagesToBytes(source, start, end);

    while (bytes.length > MAX_PART_BYTES && end - start > 1) {
      end = start + Math.max(1, Math.floor((end - start) / 2));
      bytes = await pagesToBytes(source, start, end);
    }

    if (bytes.length > MAX_PART_BYTES) {
      throw new Error(`A single page of ${file.name} is too large to send. Try exporting the PDF at a lower quality.`);
    }

    parts.push({ mediaType: 'application/pdf', data: bytesToBase64(bytes), pages: [start + 1, end] });
    run = Math.max(1, end - start);
    start = end;
  }

  return parts;
}

// One file becomes one or more parts, each small enough to send.
export async function prepareParts(file) {
  if (file.size > MAX_TOTAL_BYTES) {
    throw new Error(`${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB, over the ${MAX_TOTAL_BYTES / 1024 / 1024}MB limit.`);
  }

  if (isPdf(file)) {
    if (file.size <= MAX_PART_BYTES) {
      const buffer = await readAsArrayBuffer(file);
      return [{ mediaType: 'application/pdf', data: bytesToBase64(new Uint8Array(buffer)) }];
    }
    return splitPdf(file);
  }

  return shrinkImage(file);
}

// Just the pages asked for, as one small PDF.
//
// A mark that could not be found in a whole paper is worth looking for again
// on the two or three pages it must be on. The question's own total line says
// which page that is, so the second attempt is a short document with the
// answer somewhere in it rather than thirty-two pages to search.
export async function pagesOf(file, pageNumbers) {
  if (!isPdf(file) || !pageNumbers.length) return null;

  try {
    const source = await PDFDocument.load(await readAsArrayBuffer(file), { ignoreEncryption: true });
    const total = source.getPageCount();
    const wanted = [...new Set(pageNumbers)]
      .filter(n => n >= 1 && n <= total)
      .sort((a, b) => a - b);
    if (!wanted.length) return null;

    const out = await PDFDocument.create();
    const pages = await out.copyPages(source, wanted.map(n => n - 1));
    pages.forEach(page => out.addPage(page));
    const bytes = await out.save();
    if (bytes.length > MAX_PART_BYTES) return null;

    return {
      mediaType: 'application/pdf',
      data: bytesToBase64(bytes),
      pages: [wanted[0], wanted[wanted.length - 1]],
      only: wanted,
    };
  } catch (e) {
    return null;
  }
}

export function contentBlock(part) {
  return part.mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: part.data } }
    : { type: 'image', source: { type: 'base64', media_type: part.mediaType, data: part.data } };
}
