import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import CopyDownload from '@/components/ui/CopyDownload';

const SAMPLE = `curl -X POST 'https://api.ejemplo.com/v1/pedidos?origen=web' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer TU_TOKEN' \\
  -d '{"producto": 42, "cantidad": 2}'`;

type Target = 'fetch' | 'axios' | 'python' | 'php' | 'node';

interface Request {
  method: string;
  url: string;
  headers: Array<[string, string]>;
  body: string | null;
  form: Array<[string, string]>;
  auth: string | null;
}

/** Divide una línea de comandos como lo haría bash: comillas simples, dobles y escapes. */
function tokenize(cmd: string): string[] {
  const s = cmd.replace(/\\\r?\n/g, ' ').replace(/\^\r?\n/g, ' ');
  const out: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  let has = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote === "'") {
      if (ch === "'") quote = null; else cur += ch;
    } else if (quote === '"') {
      if (ch === '"') quote = null;
      else if (ch === '\\' && i + 1 < s.length && '"\\$`'.includes(s[i + 1])) cur += s[++i];
      else cur += ch;
    } else if (ch === "'" || ch === '"') { quote = ch; has = true; }
    else if (ch === '\\' && i + 1 < s.length) { cur += s[++i]; has = true; }
    else if (/\s/.test(ch)) { if (cur || has) { out.push(cur); cur = ''; has = false; } }
    else { cur += ch; has = true; }
  }
  if (quote) throw new Error('Hay unas comillas sin cerrar.');
  if (cur || has) out.push(cur);
  return out;
}

function parseCurl(cmd: string): Request {
  const t = tokenize(cmd.trim());
  if (!t.length || !/^curl(\.exe)?$/i.test(t[0])) throw new Error('El comando debe empezar por «curl».');
  const req: Request = { method: '', url: '', headers: [], body: null, form: [], auth: null };
  const data: string[] = [];
  let get = false;
  for (let i = 1; i < t.length; i++) {
    const a = t[i];
    const next = () => { if (i + 1 >= t.length) throw new Error(`Falta el valor de ${a}.`); return t[++i]; };
    const eq = a.startsWith('--') && a.includes('=') ? a.indexOf('=') : -1;
    const flag = eq > 0 ? a.slice(0, eq) : a;
    const val = () => (eq > 0 ? a.slice(eq + 1) : next());
    switch (flag) {
      case '-X': case '--request': req.method = val().toUpperCase(); break;
      case '-H': case '--header': {
        const h = val(); const c = h.indexOf(':');
        if (c > 0) req.headers.push([h.slice(0, c).trim(), h.slice(c + 1).trim()]);
        break;
      }
      case '-d': case '--data': case '--data-raw': case '--data-binary': case '--data-ascii': data.push(val()); break;
      case '--data-urlencode': {
        // Como cURL: "nombre=valor" codifica solo el valor; sin "=", todo.
        const v = val(); const e = v.indexOf('=');
        data.push(e > 0 ? `${v.slice(0, e)}=${encodeURIComponent(v.slice(e + 1))}` : encodeURIComponent(v.replace(/^=/, '')));
        break;
      }
      case '--json': data.push(val()); req.headers.push(['Content-Type', 'application/json'], ['Accept', 'application/json']); break;
      case '-F': case '--form': { const f = val(); const e = f.indexOf('='); req.form.push([f.slice(0, e), f.slice(e + 1)]); break; }
      case '-u': case '--user': req.auth = val(); break;
      case '-A': case '--user-agent': req.headers.push(['User-Agent', val()]); break;
      case '-e': case '--referer': req.headers.push(['Referer', val()]); break;
      case '-b': case '--cookie': req.headers.push(['Cookie', val()]); break;
      case '--url': req.url = val(); break;
      case '-G': case '--get': get = true; break;
      case '-I': case '--head': req.method = 'HEAD'; break;
      // Opciones sin efecto en el código generado
      case '-L': case '--location': case '-k': case '--insecure': case '-s': case '--silent': case '-v': case '--verbose':
      case '--compressed': case '-i': case '--include': case '-S': case '--show-error': case '-f': case '--fail': break;
      case '-o': case '--output': case '-m': case '--max-time': case '--connect-timeout': case '-w': case '--write-out': val(); break;
      default:
        if (a.startsWith('-')) break; // opción desconocida: se ignora
        if (!req.url) req.url = a;
    }
  }
  if (!req.url) throw new Error('No se ha encontrado la URL en el comando.');
  if (!/^https?:\/\//i.test(req.url)) req.url = `https://${req.url}`;
  if (data.length) {
    if (get) {
      req.url += (req.url.includes('?') ? '&' : '?') + data.join('&');
    } else {
      req.body = data.join('&');
      if (!req.headers.some(([k]) => k.toLowerCase() === 'content-type')) req.headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
    }
  }
  req.method ||= req.body !== null || req.form.length ? 'POST' : 'GET';
  return req;
}

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const isJson = (r: Request) => r.headers.some(([k, v]) => k.toLowerCase() === 'content-type' && v.includes('json'));
function jsonBody(r: Request): unknown | undefined {
  if (!r.body || !isJson(r)) return undefined;
  try { return JSON.parse(r.body); } catch { return undefined; }
}
const indentLines = (s: string, n: number) => s.split('\n').map((l, i) => (i ? ' '.repeat(n) + l : l)).join('\n');

function toFetch(r: Request, node: boolean): string {
  // Cada cabecera con su valor ya como expresión de JavaScript.
  const headers: Array<[string, string]> = r.headers.map(([k, v]) => [k, q(v)]);
  if (r.auth) {
    headers.push(['Authorization', `'Basic ' + ${node ? `Buffer.from(${q(r.auth)}).toString('base64')` : `btoa(${q(r.auth)})`}`]);
  }
  const lines: string[] = [];
  if (r.form.length) {
    lines.push('const form = new FormData();');
    r.form.forEach(([k, v]) => lines.push(v.startsWith('@')
      ? `form.append(${q(k)}, archivo); // ${v.slice(1)}: un File o Blob`
      : `form.append(${q(k)}, ${q(v)});`));
    lines.push('');
  }
  const opts: string[] = [`  method: ${q(r.method)},`];
  if (headers.length) {
    opts.push('  headers: {');
    headers.forEach(([k, expr]) => opts.push(`    ${q(k)}: ${expr},`));
    opts.push('  },');
  }
  const jb = jsonBody(r);
  if (r.form.length) opts.push('  body: form,');
  else if (jb !== undefined) opts.push(`  body: JSON.stringify(${indentLines(JSON.stringify(jb, null, 2), 2)}),`);
  else if (r.body !== null) opts.push(`  body: ${q(r.body)},`);
  lines.push(`const response = await fetch(${q(r.url)}, {`, ...opts, '});', '', 'const data = await response.json();', 'console.log(data);');
  return lines.join('\n');
}

function toAxios(r: Request): string {
  const lines = ["import axios from 'axios';", ''];
  const cfg: string[] = [`  method: ${q(r.method.toLowerCase())},`, `  url: ${q(r.url)},`];
  if (r.headers.length) {
    cfg.push('  headers: {');
    r.headers.forEach(([k, v]) => cfg.push(`    ${q(k)}: ${q(v)},`));
    cfg.push('  },');
  }
  if (r.auth) {
    const [u, ...p] = r.auth.split(':');
    cfg.push(`  auth: { username: ${q(u)}, password: ${q(p.join(':'))} },`);
  }
  const jb = jsonBody(r);
  if (r.form.length) {
    lines.splice(1, 0, 'const form = new FormData();', ...r.form.map(([k, v]) => `form.append(${q(k)}, ${v.startsWith('@') ? 'archivo' : q(v)});`));
    cfg.push('  data: form,');
  } else if (jb !== undefined) cfg.push(`  data: ${indentLines(JSON.stringify(jb, null, 2), 2)},`);
  else if (r.body !== null) cfg.push(`  data: ${q(r.body)},`);
  lines.push('const { data } = await axios({', ...cfg, '});', '', 'console.log(data);');
  return lines.join('\n');
}

function pyStr(s: string) { return JSON.stringify(s); }
function pyValue(v: unknown, ind = 0): string {
  const pad = '    '.repeat(ind + 1);
  if (v === null) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'string') return pyStr(v);
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.length ? `[\n${v.map((x) => pad + pyValue(x, ind + 1)).join(',\n')},\n${'    '.repeat(ind)}]` : '[]';
  const entries = Object.entries(v as Record<string, unknown>);
  return entries.length ? `{\n${entries.map(([k, x]) => `${pad}${pyStr(k)}: ${pyValue(x, ind + 1)}`).join(',\n')},\n${'    '.repeat(ind)}}` : '{}';
}

function toPython(r: Request): string {
  const lines = ['import requests', ''];
  const args = [pyStr(r.url)];
  if (r.headers.length) {
    lines.push(`headers = ${pyValue(Object.fromEntries(r.headers))}`, '');
    args.push('headers=headers');
  }
  const jb = jsonBody(r);
  if (r.form.length) {
    const files = r.form.filter(([, v]) => v.startsWith('@'));
    const fields = r.form.filter(([, v]) => !v.startsWith('@'));
    if (fields.length) { lines.push(`data = ${pyValue(Object.fromEntries(fields))}`); args.push('data=data'); }
    if (files.length) { lines.push(`files = {${files.map(([k, v]) => `${pyStr(k)}: open(${pyStr(v.slice(1))}, "rb")`).join(', ')}}`); args.push('files=files'); }
    lines.push('');
  } else if (jb !== undefined) {
    lines.push(`payload = ${pyValue(jb)}`, '');
    args.push('json=payload');
  } else if (r.body !== null) {
    lines.push(`data = ${pyStr(r.body)}`, '');
    args.push('data=data');
  }
  if (r.auth) { const [u, ...p] = r.auth.split(':'); args.push(`auth=(${pyStr(u)}, ${pyStr(p.join(':'))})`); }
  const call = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(r.method)
    ? `requests.${r.method.toLowerCase()}(${args.join(', ')})`
    : `requests.request(${[pyStr(r.method), ...args].join(', ')})`;
  lines.push(`response = ${call}`, 'print(response.status_code)', 'print(response.json())');
  return lines.join('\n');
}

function toPhp(r: Request): string {
  const lines = ['<?php', '', `$ch = curl_init(${q(r.url)});`, 'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);'];
  if (r.method !== 'GET') lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ${q(r.method)});`);
  if (r.headers.length) {
    lines.push('curl_setopt($ch, CURLOPT_HTTPHEADER, [');
    r.headers.forEach(([k, v]) => lines.push(`    ${q(`${k}: ${v}`)},`));
    lines.push(']);');
  }
  if (r.auth) lines.push(`curl_setopt($ch, CURLOPT_USERPWD, ${q(r.auth)});`);
  if (r.form.length) {
    lines.push('curl_setopt($ch, CURLOPT_POSTFIELDS, [');
    r.form.forEach(([k, v]) => lines.push(`    ${q(k)} => ${v.startsWith('@') ? `new CURLFile(${q(v.slice(1))})` : q(v)},`));
    lines.push(']);');
  } else if (r.body !== null) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${q(r.body)});`);
  lines.push('', '$response = curl_exec($ch);', 'curl_close($ch);', '', 'echo $response;');
  return lines.join('\n');
}

const TARGETS: Array<[Target, string]> = [
  ['fetch', 'JavaScript (fetch)'], ['axios', 'JavaScript (axios)'], ['node', 'Node.js (fetch)'], ['python', 'Python (requests)'], ['php', 'PHP (cURL)'],
];

/**
 * Convierte un comando cURL en código para fetch, axios, Node.js, Python
 * (requests) o PHP. Analiza el comando como lo haría bash (comillas,
 * escapes, saltos de línea con \ o ^) y entiende las opciones habituales:
 * -X, -H, -d/--data*, --json, -F, -u, -A, -e, -b, -G, -I y --url.
 */
export default function CurlACodigoTool() {
  const [input, setInput] = useState(SAMPLE);
  const [target, setTarget] = useState<Target>('fetch');

  const { code, error } = useMemo(() => {
    if (!input.trim()) return { code: '', error: '' };
    try {
      const r = parseCurl(input);
      const gen = { fetch: () => toFetch(r, false), node: () => toFetch(r, true), axios: () => toAxios(r), python: () => toPython(r), php: () => toPhp(r) }[target];
      return { code: gen(), error: '' };
    } catch (e) {
      return { code: '', error: (e as Error).message };
    }
  }, [input, target]);

  const ext: Record<Target, string> = { fetch: 'js', node: 'mjs', axios: 'js', python: 'py', php: 'php' };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="curl-in" className="text-sm font-semibold text-[var(--color-text)]">Comando cURL</label>
        <textarea id="curl-in" value={input} onChange={(e) => setInput(e.target.value)} rows={7} spellCheck={false}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-sm bg-white resize-y focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="curl https://api.ejemplo.com/…" />
        {error && <p className="flex items-start gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {TARGETS.map(([id, label]) => (
            <button key={id} onClick={() => setTarget(id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${target === id ? 'bg-[var(--color-accent)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>{label}</button>
          ))}
        </div>
        <CopyDownload text={code} filename={`peticion.${ext[target]}`} />
      </div>
      <pre className="p-4 rounded-xl border border-[var(--color-border)] bg-[#111110] text-[#F5F3EF] text-sm overflow-x-auto min-h-[200px]"><code>{code}</code></pre>
    </div>
  );
}
