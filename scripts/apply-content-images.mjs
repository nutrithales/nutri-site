import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
const articlePath = path.join(out, 'conteudos', 'cuidar-de-si-tambem-e-uma-escolha.html');
const sourceImagePath = path.join(root, 'assets', 'autocuidado-site.svg');

if (!fs.existsSync(articlePath)) {
  throw new Error('Artigo de autocuidado não encontrado no build.');
}

if (!fs.existsSync(sourceImagePath)) {
  throw new Error('Imagem de autocuidado não encontrada no repositório.');
}

let html = fs.readFileSync(articlePath, 'utf8');
const svgSource = fs.readFileSync(sourceImagePath, 'utf8');
const prefix = 'data:image/jpeg;base64,';
const dataStart = svgSource.indexOf(prefix);
const dataEnd = dataStart >= 0 ? svgSource.indexOf('"', dataStart) : -1;
const embeddedJpeg = dataStart >= 0 && dataEnd > dataStart ? svgSource.slice(dataStart, dataEnd) : null;

if (!embeddedJpeg) {
  throw new Error('JPEG embutido na imagem de autocuidado não encontrado.');
}

const figure = `<figure class="article-image"><picture><img src="${embeddedJpeg}" width="960" height="540" loading="eager" fetchpriority="high" decoding="async" alt="Rotina de autocuidado com alimentação, hidratação, movimento e atenção à saúde mental"></picture></figure>`;

const existingFigure = /<figure class="article-image">[\s\S]*?<\/figure>/;
if (existingFigure.test(html)) {
  html = html.replace(existingFigure, figure);
} else {
  const metaEnd = '<div class="meta">Por Thales Rosa · Nutricionista e profissional de Educação Física</div>';
  if (!html.includes(metaEnd)) throw new Error('Marcador da autoria do artigo não encontrado.');
  html = html.replace(metaEnd, `${metaEnd}\n${figure}`);
}

html = html.replace(/,"image":"[^"]+"/, '');

fs.writeFileSync(articlePath, html);
console.log('✅ Imagem de autocuidado incorporada como JPEG direto no HTML');
