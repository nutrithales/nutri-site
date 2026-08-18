const APPS = {
  'anna-diario': {
    origin: 'https://annaluiza-one.vercel.app',
    prefix: '/paciente/diario/anna',
  },
  'anna-hiit': {
    origin: 'https://hiitannaluiza.vercel.app',
    prefix: '/paciente/hiit/anna',
  },
  'anna-treino': {
    origin: 'https://treinoannaluiza.vercel.app',
    prefix: '/paciente/treinos/anna',
  },
  'isabel-maratona': {
    origin: 'https://isabel-ten-silk.vercel.app',
    prefix: '/paciente/treinos/isabel-maratona',
  },
  'vinicius-diario': {
    origin: 'https://vinisales.vercel.app',
    prefix: '/paciente/diario/vinicius',
  },
};

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePath(value) {
  const raw = first(value) || '';
  return raw.replace(/^\/+/, '');
}

function getBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  if (req.body == null) return undefined;
  if (Buffer.isBuffer(req.body) || typeof req.body === 'string') return req.body;
  return JSON.stringify(req.body);
}

function rewriteText(text, prefix, origin) {
  let result = text;

  // Relative navigation should remain inside the branded route.
  if (/<head[\s>]/i.test(result) && !/<base\s/i.test(result)) {
    result = result.replace(/<head([^>]*)>/i, `<head$1><base href="${prefix}/">`);
  }

  // Root-relative assets, links, forms and browser fetches must also pass
  // through the proxy; otherwise they would hit nutrithales.com.br root.
  const attrNames = ['href', 'src', 'action', 'poster'];
  for (const attr of attrNames) {
    const re = new RegExp(`(${attr}\\s*=\\s*["'])/(?!/)`, 'gi');
    result = result.replace(re, `$1${prefix}/`);
  }

  result = result
    .replace(/(fetch\(\s*["'])\/(?!\/)/g, `$1${prefix}/`)
    .replace(/(fetch\(\s*")\/(?!\/)/g, `$1${prefix}/`)
    .replace(/(new\s+URL\(\s*["'])\/(?!\/)/g, `$1${prefix}/`)
    .replace(/(url\(\s*["']?)\/(?!\/)/g, `$1${prefix}/`)
    .split(origin).join(prefix);

  return result;
}

function copyResponseHeaders(upstream, res) {
  const pass = [
    'content-type',
    'cache-control',
    'etag',
    'last-modified',
    'content-disposition',
  ];
  for (const name of pass) {
    const value = upstream.headers.get(name);
    if (value) res.setHeader(name, value);
  }
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export default async function handler(req, res) {
  const appKey = first(req.query.app);
  const app = APPS[appKey];
  if (!app) return res.status(404).json({ error: 'Página não encontrada.' });

  const path = normalizePath(req.query.path);
  const upstreamUrl = new URL(path ? `/${path}` : '/', app.origin);

  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'app' || key === 'path') continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) upstreamUrl.searchParams.append(key, item);
  }

  const headers = {};
  for (const name of ['accept', 'accept-language', 'content-type', 'authorization', 'cookie', 'user-agent']) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: getBody(req),
      redirect: 'manual',
    });

    const location = upstream.headers.get('location');
    if (location && upstream.status >= 300 && upstream.status < 400) {
      let rewrittenLocation = location;
      try {
        const target = new URL(location, app.origin);
        if (target.origin === new URL(app.origin).origin) {
          rewrittenLocation = `${app.prefix}${target.pathname === '/' ? '' : target.pathname}${target.search}${target.hash}`;
        }
      } catch {}
      res.setHeader('Location', rewrittenLocation);
      return res.status(upstream.status).end();
    }

    copyResponseHeaders(upstream, res);
    const contentType = upstream.headers.get('content-type') || '';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    if (/text\/html|text\/css|javascript|application\/json/.test(contentType)) {
      const text = rewriteText(buffer.toString('utf8'), app.prefix, app.origin);
      res.removeHeader('content-length');
      return res.status(upstream.status).send(text);
    }

    return res.status(upstream.status).send(buffer);
  } catch (error) {
    console.error('patient-page-proxy', appKey, error);
    return res.status(502).json({ error: 'Não foi possível carregar esta página agora.' });
  }
}
