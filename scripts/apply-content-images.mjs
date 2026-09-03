import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
const articlePath = path.join(out, 'conteudos', 'cuidar-de-si-tambem-e-uma-escolha.html');

if (!fs.existsSync(articlePath)) {
  throw new Error('Artigo de autocuidado não encontrado no build.');
}

let html = fs.readFileSync(articlePath, 'utf8');

const imagePath = '../assets/autocuidado-site.svg';
const imageUrl = 'https://www.nutrithales.com.br/assets/autocuidado-site.svg';
const figure = `<figure class="article-image"><picture><source media="(max-width:700px)" srcset="${imagePath}" width="960" height="540"><img src="${imagePath}" width="960" height="540" loading="eager" fetchpriority="high" alt="Rotina de autocuidado com alimentação, hidratação, movimento e atenção à saúde mental"></picture></figure>`;

const existingFigure = /<figure class="article-image">[\s\S]*?<\/figure>/;
if (existingFigure.test(html)) {
  html = html.replace(existingFigure, figure);
} else {
  const metaEnd = '<div class="meta">Por Thales Rosa · Nutricionista e profissional de Educação Física</div>';
  if (!html.includes(metaEnd)) throw new Error('Marcador da autoria do artigo não encontrado.');
  html = html.replace(metaEnd, `${metaEnd}\n${figure}`);
}

html = html.replace(/"image":"[^"]+"/, `"image":"${imageUrl}"`);
if (!html.includes(`"image":"${imageUrl}"`)) {
  const schemaNeedle = '"dateModified":"2026-09-03"';
  if (html.includes(schemaNeedle)) {
    html = html.replace(schemaNeedle, `${schemaNeedle},"image":"${imageUrl}"`);
  }
}

fs.writeFileSync(articlePath, html);
console.log('✅ Imagem temática de autocuidado aplicada ao artigo');
