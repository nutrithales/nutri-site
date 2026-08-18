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

const workoutIndexPath = path.join(out, 'paciente', 'treinos', 'index.html');
if (fs.existsSync(workoutIndexPath)) {
  let workoutHtml = fs.readFileSync(workoutIndexPath, 'utf8');
  const backBase = '.back{font-size:13px;color:var(--muted);font-weight:700}';
  const backButton = '.back{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:9px 13px;border:1px solid var(--border);border-radius:999px;background:var(--surface);color:var(--text);font-size:12px;font-weight:800;white-space:nowrap;box-shadow:var(--shadow)}';
  const hiddenMobileBack = '.header-left .back{display:none}';
  const logoText = '<div class="logo">NUTRI THALES</div>';
  const logoImages = '<div class="brand-logo" aria-label="Nutri Thales"><img class="brand-logo-light" src="/assets/logo-thales.png" alt="Nutri Thales"><img class="brand-logo-dark" src="/assets/logo-thales-white.png" alt="Nutri Thales"></div>';
  const logoStyles = '.brand-logo{display:flex;align-items:center;height:44px}.brand-logo img{display:block;width:auto;max-width:150px;max-height:42px;object-fit:contain}.brand-logo-dark{display:none!important}body.dark .brand-logo-light{display:none!important}body.dark .brand-logo-dark{display:block!important}';
  const navItemsToRemove = [
    '<button class="nav-btn locked">Alimentação <span class="lock">em breve</span></button>',
    '<button class="nav-btn locked">Check-in <span class="lock">em breve</span></button>',
    '<button class="nav-btn locked">Agenda <span class="lock">em breve</span></button>'
  ];

  if (!workoutHtml.includes('← Área do paciente')) throw new Error('workout dashboard return link marker not found');
  if (!workoutHtml.includes(backBase) && !workoutHtml.includes(backButton)) throw new Error('workout dashboard return button style marker not found');
  if (!workoutHtml.includes(logoText) && !workoutHtml.includes('class="brand-logo"')) throw new Error('workout dashboard brand marker not found');

  workoutHtml = workoutHtml.replace(backBase, backButton).replace(hiddenMobileBack, '.header-left .back{display:inline-flex}');
  if (workoutHtml.includes(logoText)) workoutHtml = workoutHtml.replace(logoText, logoImages);
  if (!workoutHtml.includes(logoStyles)) workoutHtml = workoutHtml.replace('</style>', `${logoStyles}\n</style>`);
  for (const navItem of navItemsToRemove) workoutHtml = workoutHtml.replace(navItem, '');

  const oldRestTick = "clearInterval(state.restTick);state.restTick=setInterval(()=>{const s=session(),r=s.rest;if(!r||r.paused)return;r.remaining=Math.max(0,(r.remaining||0)-1);if(r.remaining<=0){s.rest=null;scheduleSave();toast('Descanso concluído');renderRest()}else renderRest(false)},1000)";
  const newRestTick = "clearInterval(state.restTick);state.restTick=setInterval(()=>syncRestClock(true),500)";
  const oldStartRest = "function startRest(ex){const sec=Number(ex.descanso_seg||0);if(!sec)return;const s=session();s.rest={exerciseId:ex.id,label:ex.nome,total:sec,remaining:sec,paused:false};scheduleSave();renderRest();}";
  const newStartRest = "function startRest(ex){const sec=Number(ex.descanso_seg||0);if(!sec)return;const s=session();s.rest={exerciseId:ex.id,label:ex.nome,total:sec,remaining:sec,paused:false,endAt:Date.now()+sec*1000};scheduleSave();renderRest();}";
  const oldPause = "$('#restPause').onclick=()=>{r.paused=!r.paused;scheduleSave();renderRest()}";
  const newPause = "$('#restPause').onclick=()=>{if(r.paused){r.paused=false;r.endAt=Date.now()+Math.max(0,Number(r.remaining)||0)*1000}else{if(r.endAt)r.remaining=Math.max(0,Math.ceil((r.endAt-Date.now())/1000));r.paused=true;r.endAt=null}scheduleSave();renderRest()}";
  const oldRestart = "$('#restRestart').onclick=()=>{r.remaining=r.total;r.paused=false;scheduleSave();renderRest()}";
  const newRestart = "$('#restRestart').onclick=()=>{r.remaining=r.total;r.paused=false;r.endAt=Date.now()+Math.max(0,Number(r.total)||0)*1000;scheduleSave();renderRest()}";
  const oldAdd = "$('#restAdd').onclick=()=>{r.total+=30;r.remaining+=30;scheduleSave();renderRest()}";
  const newAdd = "$('#restAdd').onclick=()=>{r.total+=30;r.remaining+=30;if(!r.paused)r.endAt=Date.now()+Math.max(0,Number(r.remaining)||0)*1000;scheduleSave();renderRest()}";
  const syncRestCode = "function syncRestClock(showToast=false){const s=session(),r=s.rest;if(!r||r.paused)return;if(!r.endAt)r.endAt=Date.now()+Math.max(0,Number(r.remaining)||0)*1000;r.remaining=Math.max(0,Math.ceil((r.endAt-Date.now())/1000));if(r.remaining<=0){s.rest=null;scheduleSave();if(showToast)toast('Descanso concluído');renderRest();return}renderRest(false)}\ndocument.addEventListener('visibilitychange',()=>{if(!document.hidden)syncRestClock(true)});window.addEventListener('pageshow',()=>syncRestClock(true));\n";

  if (!workoutHtml.includes(oldRestTick)) throw new Error('workout rest interval marker not found');
  if (!workoutHtml.includes(oldStartRest)) throw new Error('workout rest start marker not found');
  if (!workoutHtml.includes(oldPause) || !workoutHtml.includes(oldRestart) || !workoutHtml.includes(oldAdd)) throw new Error('workout rest controls marker not found');
  workoutHtml = workoutHtml
    .replace(oldRestTick, newRestTick)
    .replace(oldStartRest, newStartRest)
    .replace(oldPause, newPause)
    .replace(oldRestart, newRestart)
    .replace(oldAdd, newAdd);
  if (!workoutHtml.includes('function syncRestClock(')) workoutHtml = workoutHtml.replace('boot();', `${syncRestCode}boot();`);

  fs.writeFileSync(workoutIndexPath, workoutHtml);
}
