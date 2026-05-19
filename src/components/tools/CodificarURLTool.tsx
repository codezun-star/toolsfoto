import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

type Mode = 'encodeComponent' | 'decodeComponent' | 'encodeURI' | 'decodeURI';

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: 'encodeComponent', label: 'Codificar componente', desc: 'encodeURIComponent — codifica todo excepto letras, dígitos y - _ . ! ~ * \' ( )' },
  { id: 'decodeComponent', label: 'Decodificar componente', desc: 'decodeURIComponent — decodifica los % de un componente' },
  { id: 'encodeURI', label: 'Codificar URL completa', desc: 'encodeURI — conserva ://?, &=# etc.' },
  { id: 'decodeURI', label: 'Decodificar URL completa', desc: 'decodeURI — decodifica una URL completa' },
];

function compute(text: string, m: Mode): { output: string; error: string | null } {
  if (!text) return { output: '', error: null };
  try {
    switch (m) {
      case 'encodeComponent': return { output: encodeURIComponent(text), error: null };
      case 'decodeComponent': return { output: decodeURIComponent(text), error: null };
      case 'encodeURI': return { output: encodeURI(text), error: null };
      case 'decodeURI': return { output: decodeURI(text), error: null };
    }
  } catch {
    return { output: '', error: 'Error al procesar. Verifica que el texto sea válido para la operación seleccionada.' };
  }
}

export default function CodificarURLTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encodeComponent');
  const [copied, setCopied] = useState(false);

  const { output, error } = compute(input, mode);

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={[
              'px-4 py-3 rounded-xl border text-sm text-left transition-colors',
              mode === m.id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] font-semibold'
                : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)] text-[var(--color-text-secondary)]',
            ].join(' ')}
          >
            <span className="block font-semibold text-[13px]">{m.label}</span>
            <span className="block text-xs mt-0.5 opacity-75">{m.desc}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Entrada</label>
          <textarea
            className="w-full h-44 font-mono text-sm p-4 rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-none"
            placeholder="Escribe o pega tu URL o texto aquí…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-[var(--color-text)]">Resultado</label>
            {output && (
              <button
                onClick={copy}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
              >
                {copied ? <CheckCircle2 size={12} className="text-green-600" /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            )}
          </div>
          <textarea
            readOnly
            className="w-full h-44 font-mono text-sm p-4 rounded-xl border border-[var(--color-tools-border)] bg-[var(--color-bg)] resize-none focus:outline-none"
            value={output}
            placeholder="El resultado aparecerá aquí…"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}
    </div>
  );
}
