import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
const articlePath = path.join(out, 'conteudos', 'cuidar-de-si-tambem-e-uma-escolha.html');

if (!fs.existsSync(articlePath)) {
  throw new Error('Artigo de autocuidado não encontrado no build.');
}

let html = fs.readFileSync(articlePath, 'utf8');

const figure = `<figure class="article-image"><picture><source media="(max-width:700px)" srcset="../assets/foto-thales-hero-full-web.jpg" width="960" height="640"><img src="../assets/foto-thales-hero-full-web.jpg" width="960" height="640" loading="eager" fetchpriority="high" alt="Thales Rosa em um ambiente de alimentação e cuidado com a saúde"></picture></figure>`;

if (!html.includes('class="article-image"')) {
  const metaEnd = '<div class="meta">Por Thales Rosa · Nutricionista e profissional de Educação Física</div>';
  if (!html.includes(metaEnd)) throw new Error('Marcador da autoria do artigo não encontrado.');
  html = html.replace(metaEnd, `${metaEnd}\n${figure}`);
}

const schemaNeedle = '"dateModified":"2026-09-03"';
const schemaWithImage = '"dateModified":"2026-09-03","image":"https://www.nutrithales.com.br/assets/foto-thales-hero-full-web.jpg"';
if (!html.includes('"image":"https://www.nutrithales.com.br/assets/foto-thales-hero-full-web.jpg"') && html.includes(schemaNeedle)) {
  html = html.replace(schemaNeedle, schemaWithImage);
}

fs.writeFileSync(articlePath, html);
console.log('✅ Imagem padronizada aplicada ao artigo de autocuidado');
