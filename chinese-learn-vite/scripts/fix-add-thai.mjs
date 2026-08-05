import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(__dirname, 'add-thai-v2.mjs');
const patchPath = resolve(__dirname, 'build-thai-patch.mjs');

// 1. Read the current add-thai-v2.mjs
let content = readFileSync(scriptPath, 'utf-8');

// 2. Remove the broken add() section at the end
const marker = '// ── Final batch patch';
const idx = content.indexOf(marker);
if (idx > 0) {
  content = content.slice(0, idx).trimEnd() + '\n';
  console.log('Removed broken add() blocks at end of file');
}

// 3. Find the insertion point (before translateWord function)
const insertBefore = 'function translateWord(word)';
const insertIdx = content.indexOf(insertBefore);
if (insertIdx < 0) {
  console.error('ERROR: cannot find translateWord function');
  process.exit(1);
}

// 4. Read the patch script and extract the M dictionary entries
const patchRaw = readFileSync(patchPath, 'utf-8');
const startMarker = 'const M = {';
const endMarker = '};';
const patchStart = patchRaw.indexOf(startMarker);
const patchEnd = patchRaw.indexOf(endMarker, patchStart) + endMarker.length;
const dictBlock = patchRaw.slice(patchStart + startMarker.length, patchEnd - endMarker.length);

// 5. Parse key-value pairs and generate w() calls
const wCalls = [];
const keyValueRegex = /^\s*"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/;
for (const line of dictBlock.split('\n')) {
  const m = line.match(keyValueRegex);
  if (m) {
    // m[1] and m[2] are the raw key/value from JSON-like format
    // They may contain escape sequences like \" \\ etc
    const key = m[1];
    const val = m[2];
    // Escape for JS string: backslashes and double quotes
    const escapedKey = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const escapedVal = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    wCalls.push(`w("${escapedKey}","${escapedVal}");`);
  }
}

console.log(`Generated ${wCalls.length} w() calls`);

// 6. Insert before translateWord
const insertion = `\n// ── Batch patch: ${wCalls.length} entries ──\n` + wCalls.join('\n') + '\n\n';
content = content.slice(0, insertIdx) + insertion + content.slice(insertIdx);

// 7. Write back
writeFileSync(scriptPath, content, 'utf-8');
console.log('Successfully patched add-thai-v2.mjs');
