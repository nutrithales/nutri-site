import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const fail = (msg) => { console.error(`\n❌ ${msg}`); process.exitCode = 1; };
const ok = (msg) => console.log(`✅ ${msg}`);

function read(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    fail(`Arquivo obrigatório ausente: ${rel}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

function checkInlineScripts(html, label) {
  const regex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let checked = 0;
  while ((match = regex.exec(html))) {
    const attrs = match[1] || '';
    const code = (match[2] || '').trim();
    if (!code || /\bsrc\s*=/.test(attrs) || /application\/ld\+json|application\/json/.test(attrs)) continue;
    try {
      new Function(code);
      checked++;
    } catch (error) {
      fail(`${label}: JavaScript inline inválido (${error.message})`);
    }
  }
  ok(`${label}: ${checked} bloco(s) JavaScript com sintaxe válida`);
}

console.log('🔒 Executando preflight de segurança do site público...');
const build = spawnSync(process.execPath, ['build-runner.mjs'], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) {
  fail('O build-runner falhou. Produção não deve ser publicada.');
  process.exit(process.exitCode || 1);
}
ok('Build local concluído');

const rootHtml = read('dist/index.html');
const patientHtml = read('dist/paciente/index.html');
const trainingHtml = read('dist/paciente/treinos/index.html');

if (!rootHtml.includes('Nutricionista em Curitiba')) fail('Homepage perdeu o título/estrutura principal esperada.'); else ok('Homepage principal preservada');
if (!patientHtml.includes('Área do Paciente')) fail('Área do Paciente não foi encontrada no build.'); else ok('Área do Paciente presente');
if (!trainingHtml.includes('Dashboard de Treinos')) fail('Dashboard de Treinos não foi encontrado no build.'); else ok('Dashboard de Treinos presente');

for (const [name, html] of [['Área do Paciente', patientHtml], ['Dashboard de Treinos', trainingHtml]]) {
  if (/admin\.nutrithales\.com\.br/i.test(html)) fail(`${name} referencia o domínio administrativo.`);
  else ok(`${name} isolado de admin.nutrithales.com.br`);
}

checkInlineScripts(rootHtml, 'Homepage');
checkInlineScripts(patientHtml, 'Área do Paciente');
checkInlineScripts(trainingHtml, 'Dashboard de Treinos');

if (process.exitCode) {
  console.error('\n🚫 PRE-FLIGHT REPROVADO. Não publicar em produção.');
  process.exit(process.exitCode);
}
console.log('\n✅ PRE-FLIGHT APROVADO. Estrutura pública íntegra.');
