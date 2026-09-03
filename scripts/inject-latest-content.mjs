import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(indexPath)) throw new Error('dist/index.html não encontrado para injeção de conteúdo');

let html = fs.readFileSync(indexPath, 'utf8');
const href = 'conteudos/cuidar-de-si-tambem-e-uma-escolha.html';

if (!html.includes(href)) {
  const marker = '<div class="grid3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">';
  if (!html.includes(marker)) throw new Error('grade de Conteúdos não encontrada; evitando alteração insegura');

  const card = `
      <a href="${href}" style="display:flex;flex-direction:column;background:#14181a;border:1px solid #14181a;border-radius:18px;padding:30px;min-height:290px;box-sizing:border-box;transition:transform .2s ease,box-shadow .2s ease;" style-hover="transform:translateY(-4px);box-shadow:0 18px 36px -20px rgba(20,24,26,.55);">
        <span style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#1adc7f;">Autocuidado e comportamento</span>
        <h2 style="font-size:1.45rem;line-height:1.2;margin:18px 0 12px;color:#fff;letter-spacing:-.03em;">Cuidar de si também é uma escolha</h2>
        <p style="color:rgba(255,255,255,.7);line-height:1.6;margin:0 0 24px;">Como autonomia, alimentação, movimento e saúde mental se conectam para construir um cuidado possível, acolhedor e baseado em ciência.</p>
        <span style="margin-top:auto;font-weight:700;color:#1adc7f;">Ler artigo →</span>
      </a>`;

  html = html.replace(marker, `${marker}${card}`);
  fs.writeFileSync(indexPath, html);
}
