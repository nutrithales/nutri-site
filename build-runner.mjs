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

const indexPath = path.join(out, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const mobileCta = `<div class="mcta" style="position:fixed;left:0;right:0;bottom:0;z-index:998;background:#14181a;padding:12px 16px;">
  <a href="{{ waLink }}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 16px;border-radius:999px;font-weight:600;font-size:.85rem;letter-spacing:-0.01em;background:#1adc7f;color:#04140c;width:100%;box-sizing:border-box;">Quero agendar minha pré-avaliação gratuita</a>
</div>
<div style="height:76px;" class="mcta"></div>`;
if (html.includes(mobileCta)) {
  html = html.replace(mobileCta, `<sc-if value="{{ !isAreaPaciente }}" hint-placeholder-val="{{ true }}">\n${mobileCta}\n</sc-if>`);
}
fs.writeFileSync(indexPath, html);

const patientIndexPath = path.join(out, 'paciente', 'index.html');
if (fs.existsSync(patientIndexPath)) {
  let patientHtml = fs.readFileSync(patientIndexPath, 'utf8');
  const trainingScriptV3 = '<script src="/paciente/patient-training-link.js?v=3"></script>';
  patientHtml = patientHtml
    .replace('<script src="/paciente/patient-training-link.js"></script>', trainingScriptV3)
    .replace('<script src="/paciente/patient-training-link.js?v=2"></script>', trainingScriptV3);
  if (!patientHtml.includes(trainingScriptV3)) {
    if (!patientHtml.includes('</body>')) throw new Error('patient page body marker not found');
    patientHtml = patientHtml.replace('</body>', `${trainingScriptV3}\n</body>`);
  }
  fs.writeFileSync(patientIndexPath, patientHtml);
}
