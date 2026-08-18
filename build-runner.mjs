import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const excluded = new Set(['.git', '.github', '.vercel', 'dist', 'node_modules', 'build-patient-site.mjs', 'build-runner.mjs', 'vercel.json']);
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  fs.cpSync(path.join(root, entry.name), path.join(out, entry.name), { recursive: true });
}

const source = fs.readFileSync(path.join(root, 'build-patient-site.mjs'), 'utf8');
const marker = "const indexPath = path.join(out, 'index.html');";
const pos = source.indexOf(marker);
if (pos < 0) throw new Error('overlay marker not found');

const runtime = `import fs from 'node:fs';\nimport path from 'node:path';\nconst root = ${JSON.stringify(root)};\nconst out = ${JSON.stringify(out)};\n` + source.slice(pos);
const tmp = path.join(os.tmpdir(), `patient-overlay-${Date.now()}.mjs`);
fs.writeFileSync(tmp, runtime);
await import(pathToFileURL(tmp).href);
fs.rmSync(tmp, { force: true });
