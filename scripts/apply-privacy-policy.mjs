import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const homepagePath = path.join(dist, 'index.html');
const policyPath = path.join(dist, 'politica-de-privacidade', 'index.html');

if (!fs.existsSync(homepagePath)) {
  throw new Error('Homepage compilada não encontrada em dist/index.html');
}

if (!fs.existsSync(policyPath)) {
  throw new Error('Política de Privacidade não foi incluída no build');
}

let homepage = fs.readFileSync(homepagePath, 'utf8');

const privacyLinkPattern = /<a href="#"([^>]*)>Política de Privacidade<\/a>/;
if (!privacyLinkPattern.test(homepage)) {
  if (!homepage.includes('href="/politica-de-privacidade/"') || !homepage.includes('Política de Privacidade')) {
    throw new Error('Link de Política de Privacidade não encontrado no rodapé da homepage');
  }
} else {
  homepage = homepage.replace(
    privacyLinkPattern,
    '<a href="/politica-de-privacidade/"$1>Política de Privacidade</a>'
  );
  fs.writeFileSync(homepagePath, homepage);
}

const policy = fs.readFileSync(policyPath, 'utf8');
const requiredMarkers = [
  '<title>Política de Privacidade',
  'Lei Geral de Proteção de Dados',
  'Dados de saúde',
  'Direitos do titular',
  'nutri.thalesrosa@gmail.com'
];

for (const marker of requiredMarkers) {
  if (!policy.includes(marker)) {
    throw new Error(`Política de Privacidade incompleta: marcador ausente (${marker})`);
  }
}

console.log('✅ Política de Privacidade presente e linkada no rodapé');
