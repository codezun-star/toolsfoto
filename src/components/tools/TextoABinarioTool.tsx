import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type Mode = 'encode' | 'decode';

function textToBinary(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (b) => b.toString(2).padStart(8, '0')).join(' ');
}

function binaryToText(bin: string): string {
  const clean = bin.replace(/[^01]/g, '');
  if (clean.length === 0 || clean.length % 8 !== 0) throw new Error('longitud inválida');
  const bytes = new Uint8Array(clean.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 8, i * 8 + 8), 2);
  }
  return new TextDecoder().decode(bytes);
}

function compute(text: string, m: Mode): { output: string; error: string | null } {
  if (!text.trim()) return { output: '', error: null };
  try {
    return { output: m === 'encode' ? textToBinary(text) : binaryToText(text), error: null };
  } catch {
    return { output: '', error: m === 'encode' ? 'Error al codificar.' : 'El binario debe tener grupos de 8 bits (0 y 1).' };
  }
}

export default function TextoABinarioTool() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const { output, error } = compute(input, mode);

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
            onClick={() => { setMode(m); setInput(''); }}
            className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', mode === m ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
          >
            {m === 'encode' ? 'Texto → Binario' : 'Binario → Texto'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">{mode === 'encode' ? 'Texto de entrada' : 'Binario de entrada'}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? 'Escribe el texto…' : 'Pega el binario (01001000 01101001…)'}
          rows={5}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono resize-y"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[var(--color-text)]">{mode === 'encode' ? 'Binario resultante' : 'Texto decodificado'}</label>
          {output && (
            <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          )}
        </div>
        <textarea readOnly value={output} rows={5} placeholder="El resultado aparecerá aquí…" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] focus:outline-none font-mono resize-y text-[var(--color-text)]" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
    </div>
  );
}
