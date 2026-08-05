// Analyze 新版HSK考试大纲词汇.pdf vs current app HSK data
// Usage: node scripts/analyze-pdf.mjs "path/to/pdf"
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── 1. Count current app data (main entries only, not examples) ──
for (const lvl of [1, 2, 3, 4, 5, 6]) {
  const src = readFileSync(resolve('src/data/hsk3', `hsk${lvl}-words.js`), 'utf-8');
  // Count only object entries whose id is hskN-xxx (i.e., main word rows, not example objects)
  const ids = [...src.matchAll(new RegExp(`"id":"hsk${lvl}-(\\d+)"`, 'g'))];
  console.log(`APP  HSK ${lvl}: ${ids.length} entries`);
}

// ── 2. Extract PDF text ──────────────────────────────────────────
const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error('Usage: node scripts/analyze-pdf.mjs "<pdf path>"');
  process.exit(1);
}
const { PDFParse } = await import('pdf-parse');
const dataBuffer = readFileSync(pdfPath);
const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
const result = await parser.getText();
const text = result.text ?? '';
console.log(`PDF pages: ${result.pages?.length ?? 'n/a'}, text chars: ${text.length}`);

// Save raw text for inspection
writeFileSync(resolve('scripts/data/pdf-extracted.txt'), text, 'utf-8');
console.log('Saved raw text to scripts/data/pdf-extracted.txt');
console.log('\n── First 2000 chars ──');
console.log(text.slice(0, 2000));
