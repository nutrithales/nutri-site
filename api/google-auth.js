import crypto from 'node:crypto';

const REDIRECT_URI = 'https://www.nutrithales.com.br/api/google-auth';
const SCOPE = 'https://www.googleapis.com/auth/calendar';

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function safeEqual(a, b) {
  const left = Buffer.from(a || '');
  const right = Buffer.from(b || '');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function page(title, message, token = '') {
  const safeToken = String(token).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f5f8f6;color:#151918;margin:0;padding:32px}.card{max-width:720px;margin:8vh auto;background:#fff;border:1px solid #dfe7e2;border-radius:20px;padding:28px;box-shadow:0 20px 55px #0b382016}h1{margin-top:0}code{display:block;overflow-wrap:anywhere;background:#eff8f3;padding:15px;border-radius:10px;margin:18px 0}button{border:0;border-radius:999px;background:#1adc7f;padding:12px 18px;font-weight:750;cursor:pointer}.warn{color:#8b251b}</style></head><body><main class="card"><h1>${title}</h1><p>${message}</p>${safeToken ? `<p>Copie o código abaixo e cadastre na Vercel como <b>GOOGLE_REFRESH_TOKEN</b>:</p><code id="token">${safeToken}</code><button onclick="navigator.clipboard.writeText(document.getElementById('token').textContent)">Copiar token</button><p class="warn">Não envie este código por mensagem e não publique capturas dele.</p>` : ''}</main></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const clientId = process.env.GOOGLE_CLIENT_ID?.replace(/\\s+/g, '');
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.replace(/\\s+/g, '');

  if (!clientId || !clientSecret) {
    return res.status(503).send(page('Configuração pendente', 'Cadastre GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nas variáveis de ambiente da Vercel e faça um novo deploy.'));
  }

  if (req.query.error) {
    return res.status(400).send(page('Autorização cancelada', 'O Google não concedeu acesso à agenda. Volte e tente novamente.'));
  }

  if (!req.query.code) {
    const timestamp = String(Date.now());
    const state = `${timestamp}.${sign(timestamp, clientSecret)}`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state
    });
    return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }

  const [timestamp, signature] = String(req.query.state || '').split('.');
  const validTime = Number.isFinite(Number(timestamp)) && Date.now() - Number(timestamp) < 10 * 60 * 1000;
  if (!validTime || !safeEqual(signature, sign(timestamp, clientSecret))) {
    return res.status(400).send(page('Solicitação inválida', 'A autorização expirou. Abra novamente /api/google-auth para recomeçar.'));
  }

  const body = new URLSearchParams({
    code: String(req.query.code),
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body
  });
  const data = await response.json();

  if (!response.ok) {
    return res.status(400).send(page('Erro ao gerar token', 'Confira o Client ID, a chave secreta e a URI autorizada no Google Cloud.'));
  }
  if (!data.refresh_token) {
    return res.status(400).send(page('Token não retornado', 'Remova o acesso anterior do aplicativo na sua Conta Google e abra novamente esta página para autorizar.'));
  }

  return res.status(200).send(page('Google Agenda autorizado', 'A conexão foi autorizada com sucesso.', data.refresh_token));
}
