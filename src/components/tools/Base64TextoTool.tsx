import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type Mode = 'encode' | 'decode';

function encodeBase64(text: string): string {
  return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
}

function decodeBase64(b64: string): string {
  return decodeURIComponent(Array.from(atob(b64), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
}

export default function Base64TextoTool() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getOutput(): string {
    if (!input.trim()) return '';
    try {
      setError(null);
      return mode === 'encode' ? encodeBase64(input) : decodeBase64(input);
    } catch {
      setError(mode === 'encode' ? 'Error al codificar.' : 'El texto no es Base64 válido.');
      return '';
    }
  }

  const output = getOutput();

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {(['encode', 'decode'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setInput(''); setError(null); }}
            className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', mode === m ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
          >
            {m === 'encode' ? 'Texto → Base64' : 'Base64 → Texto'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
          {mode === 'encode' ? 'Texto de entrada' : 'Base64 de entrada'}
        </label>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          placeholder={mode === 'encode' ? 'Escribe el texto a codificar…' : 'Pega el Base64 a decodificar…'}
          rows={5}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono resize-y"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[var(--color-text)]">
            {mode === 'encode' ? 'Base64 resultante' : 'Texto decodificado'}
          </label>
          {output && (
            <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          )}
        </div>
        <textarea
          readOnly
          value={output}
          rows={5}
          placeholder="El resultado aparecerá aquí…"
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] focus:outline-none font-mono resize-y text-[var(--color-text)]"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
    </div>
  );
}
