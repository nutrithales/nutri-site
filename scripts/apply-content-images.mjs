import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
const articlePath = path.join(out, 'conteudos', 'cuidar-de-si-tambem-e-uma-escolha.html');

if (!fs.existsSync(articlePath)) {
  throw new Error('Artigo de autocuidado não encontrado no build.');
}

let html = fs.readFileSync(articlePath, 'utf8');

const imageUrl = 'https://images.unsplash.com/photo-1784798455842-3a0be501172c?auto=format&fit=crop&fm=jpg&q=72&w=1600';
const figure = `<figure class="article-image"><picture><img src="${imageUrl}" width="960" height="540" loading="eager" fetchpriority="high" decoding="async" alt="Caderno, café e café da manhã em uma rotina tranquila de autocuidado"><figcaption>Foto: Mengkol Smile / Unsplash</figcaption></picture></figure>`;

const existingFigure = /<figure class="article-image">[\s\S]*?<\/figure>/;
if (existingFigure.test(html)) {
  html = html.replace(existingFigure, figure);
} else {
  const metaEnd = '<div class="meta">Por Thales Rosa · Nutricionista e profissional de Educação Física</div>';
  if (!html.includes(metaEnd)) throw new Error('Marcador da autoria do artigo não encontrado.');
  html = html.replace(metaEnd, `${metaEnd}\n${figure}`);
}

html = html.replace(/,"image":"[^"]+"/, '');
const schemaNeedle = '"dateModified":"2026-09-03"';
if (html.includes(schemaNeedle) && !html.includes(`"image":"${imageUrl}"`)) {
  html = html.replace(schemaNeedle, `${schemaNeedle},"image":"${imageUrl}"`);
}

fs.writeFileSync(articlePath, html);
console.log('✅ Imagem leve e acolhedora aplicada ao artigo');
