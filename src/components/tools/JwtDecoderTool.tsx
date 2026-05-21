import { useState } from 'react';
import { Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

interface JwtPart {
  raw: string;
  decoded: unknown;
}

function base64urlDecode(str: string): string {
  // Pad to multiple of 4
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4;
  const base64 = pad ? padded + '='.repeat(4 - pad) : padded;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function parseJwt(token: string): { header: JwtPart; payload: JwtPart; signature: string } | null {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    return {
      header: { raw: parts[0], decoded: JSON.parse(base64urlDecode(parts[0])) },
      payload: { raw: parts[1], decoded: JSON.parse(base64urlDecode(parts[1])) },
      signature: parts[2],
    };
  } catch {
    return null;
  }
}

function isExpired(payload: unknown): boolean | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (typeof p['exp'] !== 'number') return null;
  return Date.now() / 1000 > p['exp'];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function doCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={doCopy} className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function Section({ title, part, extra }: { title: string; part: JwtPart; extra?: React.ReactNode }) {
  const json = JSON.stringify(part.decoded, null, 2);
  return (
    <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-text)]">{title}</p>
        <CopyButton text={json} />
      </div>
      {extra}
      <pre className="text-xs font-mono bg-[var(--color-bg)] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
        {json}
      </pre>
    </div>
  );
}

export default function JwtDecoderTool() {
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  const parsed = token.trim() ? parseJwt(token.trim()) : null;
  const expired = parsed ? isExpired(parsed.payload.decoded) : null;

  async function copyToken() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text)]">Token JWT</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Pega tu token JWT aquí: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          className="w-full h-28 px-3 py-2 border border-[var(--color-border)] rounded-xl text-xs font-mono resize-none focus:outline-none focus:border-[var(--color-accent)]"
        />
        {token.trim() && !parsed && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertTriangle size={13} />
            Token inválido. Asegúrate de que tiene el formato correcto (header.payload.signature).
          </p>
        )}
      </div>

      {parsed && (
        <div className="space-y-4">
          {expired !== null && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${
              expired
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              {expired ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
              {expired ? 'Token expirado' : 'Token vigente'}
            </div>
          )}

          <Section title="Header" part={parsed.header} />
          <Section
            title="Payload"
            part={parsed.payload}
            extra={
              typeof (parsed.payload.decoded as Record<string, unknown>)['exp'] === 'number' && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  exp: {new Date(((parsed.payload.decoded as Record<string, unknown>)['exp'] as number) * 1000).toLocaleString()}
                </p>
              )
            }
          />

          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--color-text)]">Signature</p>
              <CopyButton text={parsed.signature} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] break-all font-mono bg-[var(--color-bg)] rounded-lg p-3">
              {parsed.signature}
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              La firma no se puede verificar sin la clave secreta. Este decodificador solo lee el contenido del token.
            </p>
          </div>

          <button
            onClick={copyToken}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] transition-colors"
          >
            {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
            {copied ? 'Token copiado' : 'Copiar token completo'}
          </button>
        </div>
      )}
    </div>
  );
}
