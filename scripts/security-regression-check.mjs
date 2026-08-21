import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failed = false;
const fail = (message) => { failed = true; console.error(`❌ ${message}`); };
const ok = (message) => console.log(`✅ ${message}`);
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

console.log('🔐 Validando contratos de segurança e rotas críticas...');

const vercel = JSON.parse(read('vercel.json'));
const headers = Array.isArray(vercel.headers) ? vercel.headers : [];
const globalHeaders = headers.find((entry) => entry?.source === '/(.*)')?.headers || [];
const headerMap = new Map(globalHeaders.map((entry) => [String(entry.key).toLowerCase(), entry.value]));

if (headerMap.get('x-content-type-options') !== 'nosniff') fail('X-Content-Type-Options deve permanecer como nosniff.');
else ok('X-Content-Type-Options preservado');

if (headerMap.get('referrer-policy') !== 'strict-origin-when-cross-origin') fail('Referrer-Policy defensiva ausente ou alterada.');
else ok('Referrer-Policy preservada');

if (!headerMap.has('content-security-policy-report-only')) fail('CSP Report-Only ausente.');
else ok('CSP permanece em modo Report-Only (não bloqueante)');

if (headerMap.has('content-security-policy')) fail('CSP bloqueante não pode ser ativada sem validação específica de compatibilidade.');
else ok('Nenhuma CSP bloqueante foi ativada');

const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];
const expectedRewrites = new Map([
  ['/paciente/diario/anna', '/api/patient-page-proxy?app=anna-diario'],
  ['/paciente/diario/anna/:path*', '/api/patient-page-proxy?app=anna-diario&path=:path*'],
  ['/paciente/hiit/anna', '/api/patient-page-proxy?app=anna-hiit'],
  ['/paciente/hiit/anna/:path*', '/api/patient-page-proxy?app=anna-hiit&path=:path*'],
  ['/paciente/treinos/anna', '/api/patient-page-proxy?app=anna-treino'],
  ['/paciente/treinos/anna/:path*', '/api/patient-page-proxy?app=anna-treino&path=:path*'],
  ['/paciente/treinos/isabel-maratona', '/api/patient-page-proxy?app=isabel-maratona'],
  ['/paciente/treinos/isabel-maratona/:path*', '/api/patient-page-proxy?app=isabel-maratona&path=:path*'],
  ['/paciente/diario/vinicius', '/api/patient-page-proxy?app=vinicius-diario'],
  ['/paciente/diario/vinicius/:path*', '/api/patient-page-proxy?app=vinicius-diario&path=:path*'],
  ['/paciente', 'https://admin.nutrithales.com.br/paciente'],
  ['/paciente/:path*', 'https://admin.nutrithales.com.br/paciente/:path*'],
  ['/_next/:path*', 'https://admin.nutrithales.com.br/_next/:path*'],
]);

for (const [source, destination] of expectedRewrites) {
  const route = rewrites.find((entry) => entry?.source === source);
  if (!route) fail(`Rota crítica removida: ${source}`);
  else if (route.destination !== destination) fail(`Destino da rota crítica mudou sem revisão: ${source}`);
  else ok(`Rota preservada: ${source}`);
}

const requiredBuildFiles = [
  ['dist/index.html', 'Nutricionista em Curitiba'],
  ['dist/politica-de-privacidade/index.html', 'Política de Privacidade'],
  ['dist/conteudos/avaliacao-fisica-com-bodymetrix.html', 'BodyMetrix'],
];
for (const [file, marker] of requiredBuildFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    fail(`Página crítica ausente do build: ${file}`);
    continue;
  }
  const body = read(file);
  if (!body.includes(marker)) fail(`Página crítica perdeu conteúdo esperado: ${file}`);
  else ok(`Página crítica íntegra: ${file}`);
}

if (fs.existsSync(path.join(root, 'dist/index.html'))) {
  const home = read('dist/index.html');
  if (!home.includes('href="/politica-de-privacidade/"')) fail('Link funcional da Política de Privacidade desapareceu do rodapé.');
  else ok('Link da Política de Privacidade preservado');
}

const proxy = read('api/patient-page-proxy.js');
for (const app of ['anna-diario', 'anna-hiit', 'anna-treino', 'isabel-maratona', 'vinicius-diario']) {
  if (!proxy.includes(`'${app}'`) && !proxy.includes(`\"${app}\"`)) fail(`Proxy autorizado desapareceu: ${app}`);
}
ok('Allowlist dos proxies críticos verificada');

if (failed) {
  console.error('\n🚫 REGRESSÃO DE SEGURANÇA/ROTA DETECTADA.');
  process.exit(1);
}
console.log('\n✅ Contratos de segurança e rotas críticas preservados.');
