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

const privacyScript = path.join(root, 'scripts', 'apply-privacy-policy.mjs');
if (fs.existsSync(privacyScript)) {
  const privacy = spawnSync(process.execPath, ['scripts/apply-privacy-policy.mjs'], { cwd: root, stdio: 'inherit' });
  if (privacy.status !== 0) {
    fail('A validação da Política de Privacidade falhou.');
    process.exit(process.exitCode || 1);
  }
}

const rootHtml = read('dist/index.html');
if (!rootHtml.includes('Nutricionista em Curitiba')) fail('Homepage perdeu o título/estrutura principal esperada.'); else ok('Homepage principal preservada');
checkInlineScripts(rootHtml, 'Homepage');

const policyPath = path.join(root, 'dist', 'politica-de-privacidade', 'index.html');
if (fs.existsSync(policyPath)) {
  const policyHtml = fs.readFileSync(policyPath, 'utf8');
  if (!policyHtml.includes('Política de Privacidade') || !policyHtml.includes('LGPD')) {
    fail('Política de Privacidade está incompleta no build.');
  } else {
    ok('Política de Privacidade presente no build');
  }
}

const patientPath = path.join(root, 'dist', 'paciente', 'index.html');
const trainingPath = path.join(root, 'dist', 'paciente', 'treinos', 'index.html');

if (fs.existsSync(patientPath) && fs.existsSync(trainingPath)) {
  const patientHtml = fs.readFileSync(patientPath, 'utf8');
  const trainingHtml = fs.readFileSync(trainingPath, 'utf8');
  if (!patientHtml.includes('Área do Paciente')) fail('Área do Paciente não foi encontrada no build local.'); else ok('Área do Paciente local presente');
  if (!trainingHtml.includes('Dashboard de Treinos')) fail('Dashboard de Treinos não foi encontrado no build local.'); else ok('Dashboard de Treinos local presente');
  checkInlineScripts(patientHtml, 'Área do Paciente');
  checkInlineScripts(trainingHtml, 'Dashboard de Treinos');
} else {
  const vercel = JSON.parse(read('vercel.json') || '{}');
  const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];
  const patientRewrite = rewrites.find((r) => r?.source === '/paciente');
  const patientCatchAll = rewrites.find((r) => r?.source === '/paciente/:path*');
  const expectedBase = 'https://admin.nutrithales.com.br/paciente';

  if (patientRewrite?.destination !== expectedBase) {
    fail('Rewrite /paciente não aponta para o destino esperado.');
  } else {
    ok('Rewrite /paciente validado');
  }

  if (patientCatchAll?.destination !== `${expectedBase}/:path*`) {
    fail('Rewrite /paciente/:path* não aponta para o destino esperado.');
  } else {
    ok('Rewrite /paciente/:path* validado');
  }
}

if (process.exitCode) {
  console.error('\n🚫 PRE-FLIGHT REPROVADO. Não publicar em produção.');
  process.exit(process.exitCode);
}
console.log('\n✅ PRE-FLIGHT APROVADO. Estrutura pública íntegra.');
