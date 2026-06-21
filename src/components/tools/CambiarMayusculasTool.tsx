import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type Mode = 'upper' | 'lower' | 'title' | 'sentence' | 'toggle' | 'alternate';

const MODES: { id: Mode; label: string }[] = [
  { id: 'upper', label: 'MAYÚSCULAS' },
  { id: 'lower', label: 'minúsculas' },
  { id: 'title', label: 'Cada Palabra' },
  { id: 'sentence', label: 'Tipo frase' },
  { id: 'toggle', label: 'iNVERTIR cASO' },
  { id: 'alternate', label: 'aLtErNaDo' },
];

function transform(text: string, mode: Mode): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.toLowerCase().replace(/(^|\s)([\p{L}])/gu, (_, sp, ch) => sp + ch.toUpperCase());
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*[\p{L}])|([.!?¿¡]\s*[\p{L}])/gu, (m) => m.toUpperCase());
    case 'toggle':
      return Array.from(text, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('');
    case 'alternate':
      return Array.from(text, (c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join('');
  }
}

export default function CambiarMayusculasTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('upper');
  const [copied, setCopied] = useState(false);

  const output = transform(input, mode);

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Texto de entrada</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe o pega tu texto aquí…"
          rows={5}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', mode === m.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[var(--color-text)]">Resultado</label>
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
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] focus:outline-none resize-y text-[var(--color-text)]"
        />
      </div>
    </div>
  );
}
