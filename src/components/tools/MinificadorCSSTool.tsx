import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';
import { revokeURL } from '@/lib/utils/canvas';

type Mode = 'minify' | 'beautify';

function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/;\}/g, '}')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

function beautifyCSS(css: string): string {
  let depth = 0;
  const indent = '  ';
  return css
    .replace(/\s*\{\s*/g, ' {\n')
    .replace(/;\s*/g, ';\n')
    .replace(/\s*\}\s*/g, '\n}\n')
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.endsWith('}')) depth = Math.max(0, depth - 1);
      const result = indent.repeat(depth) + trimmed;
      if (trimmed.endsWith('{')) depth++;
      return result;
    })
    .filter(Boolean)
    .join('\n');
}

export default function MinificadorCSSTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('minify');
  const [copied, setCopied] = useState(false);

  const output = input.trim()
    ? mode === 'minify' ? minifyCSS(input) : beautifyCSS(input)
    : '';

  const reduction = input.length > 0 && output.length > 0
    ? Math.round((1 - output.length / input.length) * 100)
    : 0;

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'minify' ? 'styles.min.css' : 'styles.css';
    a.click();
    setTimeout(() => revokeURL(url), 100);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {(['minify', 'beautify'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', mode === m ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
          >
            {m === 'minify' ? 'Minificar' : 'Formatear'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">CSS de entrada</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pega tu CSS aquí…"
          rows={8}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono resize-y"
        />
        {input.length > 0 && <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatBytes(input.length)} · {input.length} caracteres</p>}
      </div>

      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-[var(--color-text)]">Resultado</label>
              {mode === 'minify' && reduction > 0 && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  -{reduction}%
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button onClick={download} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                <Download size={13} />
                .css
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            rows={8}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-tools-bg)] focus:outline-none font-mono resize-y text-[var(--color-text)]"
          />
          <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(output.length)} · {output.length} caracteres</p>
        </div>
      )}
    </div>
  );
}
