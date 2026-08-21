import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', '.next', '.vercel', 'dist', 'coverage']);
const ignoredExtensions = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.mov'
]);
const allowedSecretPlaceholders = new Set(['.env.example', '.env.template']);

const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ['OpenAI API key', /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ['Stripe live secret', /\bsk_live_[A-Za-z0-9]{20,}\b/g],
  [
    'hard-coded sensitive value',
    /\b(?:GOOGLE_CLIENT_SECRET|GOOGLE_REFRESH_TOKEN|SUPABASE_SERVICE_ROLE(?:_KEY)?|ADMIN_PASSWORD|DATABASE_URL|JWT_SECRET|API_SECRET|PRIVATE_KEY)\b\s*[:=]\s*["'](?!process\.env|\$\{|REPLACE_|CHANGE_|YOUR_|EXAMPLE_)([^"'\n]{8,})["']/gi
  ]
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

const findings = [];

for (const file of walk(root)) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const base = path.basename(file);
  const ext = path.extname(file).toLowerCase();

  if (ignoredExtensions.has(ext)) continue;

  if ((base === '.env' || base.startsWith('.env.')) && !allowedSecretPlaceholders.has(base)) {
    findings.push(`${relative}: environment file must not be committed`);
    continue;
  }

  if (['.pem', '.key', '.p12', '.pfx'].includes(ext)) {
    findings.push(`${relative}: private key/certificate file must not be committed`);
    continue;
  }

  const stat = fs.statSync(file);
  if (stat.size > 2_000_000) continue;

  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const [label, regex] of patterns) {
    regex.lastIndex = 0;
    for (const match of content.matchAll(regex)) {
      const line = content.slice(0, match.index).split('\n').length;
      findings.push(`${relative}:${line}: possible ${label}`);
    }
  }
}

if (findings.length) {
  console.error('Potential secrets detected:\n');
  for (const finding of findings) console.error(`- ${finding}`);
  console.error('\nMove secrets to environment variables and rotate any exposed credential before merging.');
  process.exit(1);
}

console.log('Secret scan passed: no obvious committed secrets detected.');
