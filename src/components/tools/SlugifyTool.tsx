import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function slugify(text: string, sep: string, lower: boolean): string {
  let s = text
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // quitar acentos (marcas diacríticas)
    .replace(/[^a-zA-Z0-9\s-]/g, '') // solo alfanumérico, espacios y guiones
    .trim()
    .replace(/[\s_-]+/g, sep);
  s = s.replace(new RegExp(`^${sep}+|${sep}+$`, 'g'), '');
  return lower ? s.toLowerCase() : s;
}

export default function SlugifyTool() {
  const [input, setInput] = useState('');
  const [sep, setSep] = useState('-');
  const [lower, setLower] = useState(true);
  const [copied, setCopied] = useState(false);

  const output = slugify(input, sep, lower);

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Texto o título</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Cómo crear un Slug perfecto para SEO"
          rows={3}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Separador</label>
          <div className="grid grid-cols-2 gap-2">
            {(['-', '_'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSep(s)}
                className={['py-2 rounded-xl border text-sm font-semibold transition-colors', sep === s ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
              >
                {s === '-' ? 'Guion ( - )' : 'Bajo ( _ )'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Mayúsculas</label>
          <button
            onClick={() => setLower((v) => !v)}
            className={['w-full py-2 rounded-xl border text-sm font-semibold transition-colors', lower ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
          >
            {lower ? 'minúsculas' : 'Conservar caso'}
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[var(--color-text)]">Slug resultante</label>
          {output && (
            <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          )}
        </div>
        <input
          readOnly
          value={output}
          placeholder="el-slug-aparecera-aqui"
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] focus:outline-none font-mono text-[var(--color-text)]"
        />
      </div>
    </div>
  );
}
