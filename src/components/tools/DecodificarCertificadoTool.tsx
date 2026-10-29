import { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, Upload } from 'lucide-react';

/** Nodo ASN.1 DER: etiqueta, contenido y posición en el buffer. */
interface Node { tag: number; cls: number; constructed: boolean; start: number; header: number; len: number; bytes: Uint8Array; children: Node[] }

function parseDer(buf: Uint8Array, offset = 0, end = buf.length): Node[] {
  const nodes: Node[] = [];
  let p = offset;
  while (p < end) {
    const start = p;
    const id = buf[p++];
    let tag = id & 0x1f;
    if (tag === 0x1f) { tag = 0; while (buf[p] & 0x80) tag = (tag << 7) | (buf[p++] & 0x7f); tag = (tag << 7) | buf[p++]; }
    let len = buf[p++];
    if (len & 0x80) {
      const n = len & 0x7f;
      if (n === 0 || n > 4) throw new Error('Longitud ASN.1 no admitida');
      len = 0;
      for (let i = 0; i < n; i++) len = len * 256 + buf[p++];
    }
    if (p + len > end) throw new Error('Certificado truncado o dañado');
    const constructed = (id & 0x20) !== 0;
    const node: Node = { tag, cls: id >> 6, constructed, start, header: p - start, len, bytes: buf.subarray(p, p + len), children: [] };
    if (constructed) node.children = parseDer(buf, p, p + len);
    nodes.push(node);
    p += len;
  }
  return nodes;
}

function oid(b: Uint8Array): string {
  const parts = [Math.floor(b[0] / 40), b[0] % 40];
  let v = 0;
  for (let i = 1; i < b.length; i++) { v = v * 128 + (b[i] & 0x7f); if (!(b[i] & 0x80)) { parts.push(v); v = 0; } }
  return parts.join('.');
}

const OIDS: Record<string, string> = {
  '2.5.4.3': 'CN', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'ST', '2.5.4.10': 'O', '2.5.4.11': 'OU', '2.5.4.5': 'serialNumber',
  '2.5.4.42': 'GN', '2.5.4.4': 'SN', '1.2.840.113549.1.9.1': 'E', '2.5.4.97': 'organizationIdentifier',
  '1.2.840.113549.1.1.1': 'RSA', '1.2.840.10045.2.1': 'EC', '1.3.101.112': 'Ed25519',
  '1.2.840.113549.1.1.11': 'SHA-256 con RSA', '1.2.840.113549.1.1.12': 'SHA-384 con RSA', '1.2.840.113549.1.1.13': 'SHA-512 con RSA',
  '1.2.840.113549.1.1.5': 'SHA-1 con RSA', '1.2.840.10045.4.3.2': 'ECDSA con SHA-256', '1.2.840.10045.4.3.3': 'ECDSA con SHA-384',
  '1.2.840.113549.1.1.10': 'RSA-PSS',
  '1.2.840.10045.3.1.7': 'P-256', '1.3.132.0.34': 'P-384', '1.3.132.0.35': 'P-521',
  '2.5.29.17': 'subjectAltName', '2.5.29.19': 'basicConstraints', '2.5.29.15': 'keyUsage', '2.5.29.37': 'extKeyUsage',
  '1.3.6.1.5.5.7.3.1': 'Autenticación de servidor', '1.3.6.1.5.5.7.3.2': 'Autenticación de cliente', '1.3.6.1.5.5.7.3.3': 'Firma de código', '1.3.6.1.5.5.7.3.4': 'Correo seguro',
};

const text = (n: Node) => new TextDecoder(n.tag === 30 ? 'utf-16be' : 'utf-8').decode(n.bytes);
const hex = (b: Uint8Array, sep = ':') => Array.from(b, (x) => x.toString(16).padStart(2, '0').toUpperCase()).join(sep);

function name(n: Node): string {
  return n.children.flatMap((set) => set.children.map((atv) => `${OIDS[oid(atv.children[0].bytes)] ?? oid(atv.children[0].bytes)}=${text(atv.children[1])}`)).join(', ');
}

function time(n: Node): Date {
  const s = new TextDecoder().decode(n.bytes);
  const m = n.tag === 23
    ? /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/.exec(s)
    : /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/.exec(s);
  if (!m) return new Date(NaN);
  let y = Number(m[1]);
  if (n.tag === 23) y += y < 50 ? 2000 : 1900;
  return new Date(Date.UTC(y, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)));
}

interface Info {
  subject: string; issuer: string; serial: string; notBefore: Date; notAfter: Date;
  keyAlg: string; keyDetail: string; sigAlg: string; sans: string[]; ca: boolean | null; eku: string[];
  sha1: string; sha256: string; selfSigned: boolean;
}

async function decode(der: Uint8Array): Promise<Info> {
  const [cert] = parseDer(der);
  const tbs = cert?.children[0];
  if (!tbs || tbs.tag !== 16) throw new Error('No parece un certificado X.509');
  const f = tbs.children;
  let i = 0;
  if (f[0].cls === 2 && f[0].tag === 0) i++; // [0] version
  const serial = hex(f[i].bytes); i++;
  i++; // algoritmo de firma (repetido abajo)
  const issuer = name(f[i++]);
  const validity = f[i++];
  const subject = name(f[i++]);
  const spki = f[i++];
  const algOid = oid(spki.children[0].children[0].bytes);
  let keyDetail = '';
  if (OIDS[algOid] === 'RSA') {
    const key = parseDer(spki.children[1].bytes.subarray(1))[0];
    const mod = key.children[0].bytes;
    keyDetail = `${(mod[0] === 0 ? mod.length - 1 : mod.length) * 8} bits`;
  } else if (OIDS[algOid] === 'EC' && spki.children[0].children[1]) {
    keyDetail = OIDS[oid(spki.children[0].children[1].bytes)] ?? '';
  }
  const sans: string[] = [];
  const eku: string[] = [];
  let ca: boolean | null = null;
  const ext = f.find((n) => n.cls === 2 && n.tag === 3);
  for (const e of ext?.children[0]?.children ?? []) {
    const id = oid(e.children[0].bytes);
    const value = parseDer(e.children[e.children.length - 1].bytes)[0];
    if (OIDS[id] === 'subjectAltName') {
      for (const g of value.children) {
        if (g.tag === 2) sans.push(`DNS: ${new TextDecoder().decode(g.bytes)}`);
        else if (g.tag === 1) sans.push(`Email: ${new TextDecoder().decode(g.bytes)}`);
        else if (g.tag === 6) sans.push(`URI: ${new TextDecoder().decode(g.bytes)}`);
        else if (g.tag === 7) sans.push(`IP: ${g.bytes.length === 4 ? Array.from(g.bytes).join('.') : hex(g.bytes, ':')}`);
      }
    } else if (OIDS[id] === 'basicConstraints') {
      ca = value.children[0]?.tag === 1 ? value.children[0].bytes[0] !== 0 : false;
    } else if (OIDS[id] === 'extKeyUsage') {
      for (const k of value.children) eku.push(OIDS[oid(k.bytes)] ?? oid(k.bytes));
    }
  }
  const sigOid = oid(cert.children[1].children[0].bytes);
  const digest = async (alg: string) => hex(new Uint8Array(await crypto.subtle.digest(alg, der as Uint8Array<ArrayBuffer>)));
  return {
    subject, issuer, serial,
    notBefore: time(validity.children[0]), notAfter: time(validity.children[1]),
    keyAlg: OIDS[algOid] ?? algOid, keyDetail, sigAlg: OIDS[sigOid] ?? sigOid,
    sans, ca, eku, sha1: await digest('SHA-1'), sha256: await digest('SHA-256'), selfSigned: subject === issuer,
  };
}

/** PEM (uno o varios bloques) o DER binario → bytes DER de cada certificado. */
function toDers(input: string | Uint8Array): Uint8Array[] {
  if (input instanceof Uint8Array) {
    const asText = new TextDecoder().decode(input.subarray(0, 64));
    if (!asText.includes('-----BEGIN')) return [input];
    return toDers(new TextDecoder().decode(input));
  }
  const blocks = [...input.matchAll(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g)].map((m) => m[1]);
  const b64 = blocks.length ? blocks : [input];
  return b64.map((b) => {
    const clean = b.replace(/[^A-Za-z0-9+/=]/g, '');
    const bin = atob(clean);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  });
}

const fmtDate = (d: Date) => d.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';

/**
 * Decodifica certificados X.509 (PEM o DER) en el navegador con un lector
 * ASN.1 propio: sujeto, emisor, validez, dominios (SAN), clave pública,
 * algoritmo de firma, usos y huellas SHA-1/SHA-256 (Web Crypto). Admite una
 * cadena completa con varios certificados.
 */
export default function DecodificarCertificadoTool() {
  const [input, setInput] = useState('');
  const [infos, setInfos] = useState<Info[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function run(src: string | Uint8Array) {
    setError(null);
    try {
      const ders = toDers(src);
      setInfos(await Promise.all(ders.map(decode)));
    } catch (e) {
      setInfos([]);
      setError(`No se ha podido leer el certificado: ${(e as Error).message}. Pega el bloque completo, de «-----BEGIN CERTIFICATE-----» a «-----END CERTIFICATE-----».`);
    }
  }

  useEffect(() => {
    if (!input.trim()) { setInfos([]); setError(null); return; }
    void run(input);
  }, [input]);

  async function onFile(f: File) {
    setInput('');
    await run(new Uint8Array(await f.arrayBuffer()));
  }

  const now = Date.now();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <label htmlFor="pem-in" className="text-sm font-semibold text-[var(--color-text)]">Certificado (PEM)</label>
        <textarea id="pem-in" value={input} onChange={(e) => setInput(e.target.value)} rows={16} spellCheck={false}
          placeholder={'-----BEGIN CERTIFICATE-----\nMIIF…\n-----END CERTIFICATE-----'}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] font-mono text-xs bg-white resize-y focus:outline-none focus:border-[var(--color-accent)]" />
        <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[var(--color-border)] bg-white text-sm text-[var(--color-text-secondary)] cursor-pointer hover:border-[var(--color-accent)]">
          <Upload size={15} /> O sube un archivo .pem, .crt, .cer o .der
          <input type="file" accept=".pem,.crt,.cer,.der,.cert" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ''; }} />
        </label>
        {error && <p className="flex items-start gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}</p>}
      </div>
      <div className="space-y-4">
        {!infos.length && !error && (
          <p className="p-4 rounded-xl bg-[var(--color-tools-bg)] border border-[var(--color-tools-border)] text-sm text-[var(--color-text-secondary)]">
            Pega un certificado o una cadena completa: verás su titular, el emisor, las fechas de validez, los dominios que cubre y sus huellas.
          </p>
        )}
        {infos.map((c, n) => {
          const expired = c.notAfter.getTime() < now;
          const days = Math.round((c.notAfter.getTime() - now) / 86400000);
          return (
            <div key={n} className="p-4 rounded-xl bg-white border border-[var(--color-border)] space-y-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-[var(--color-text)] flex items-center gap-2"><ShieldCheck size={16} className="text-[var(--color-tools-icon)]" /> {infos.length > 1 ? `Certificado ${n + 1}` : 'Certificado'}{c.ca ? ' · CA' : ''}{c.selfSigned ? ' · autofirmado' : ''}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${expired ? 'bg-red-50 text-red-700' : days < 30 ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-700'}`}>
                  {expired ? `Caducado hace ${-days} días` : `Válido ${days} días más`}
                </span>
              </div>
              <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
                <dt className="text-[var(--color-text-muted)]">Titular</dt><dd className="break-all">{c.subject}</dd>
                <dt className="text-[var(--color-text-muted)]">Emisor</dt><dd className="break-all">{c.issuer}</dd>
                <dt className="text-[var(--color-text-muted)]">Válido desde</dt><dd>{fmtDate(c.notBefore)}</dd>
                <dt className="text-[var(--color-text-muted)]">Válido hasta</dt><dd>{fmtDate(c.notAfter)}</dd>
                <dt className="text-[var(--color-text-muted)]">Clave pública</dt><dd>{c.keyAlg}{c.keyDetail && ` · ${c.keyDetail}`}</dd>
                <dt className="text-[var(--color-text-muted)]">Firma</dt><dd>{c.sigAlg}</dd>
                {c.eku.length > 0 && <><dt className="text-[var(--color-text-muted)]">Usos</dt><dd>{c.eku.join(', ')}</dd></>}
                <dt className="text-[var(--color-text-muted)]">N.º de serie</dt><dd className="font-mono text-xs break-all">{c.serial}</dd>
                <dt className="text-[var(--color-text-muted)]">SHA-256</dt><dd className="font-mono text-xs break-all">{c.sha256}</dd>
                <dt className="text-[var(--color-text-muted)]">SHA-1</dt><dd className="font-mono text-xs break-all">{c.sha1}</dd>
              </dl>
              {c.sans.length > 0 && (
                <div>
                  <p className="text-[var(--color-text-muted)] mb-1">Nombres alternativos ({c.sans.length})</p>
                  <div className="flex flex-wrap gap-1.5">{c.sans.map((s) => <code key={s} className="px-2 py-0.5 rounded bg-[var(--color-bg)] text-xs">{s}</code>)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
