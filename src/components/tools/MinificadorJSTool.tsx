import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

type Mode = 'minify' | 'format';

function minifyJS(code: string): string {
  // Remove block comments (non-greedy)
  let result = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove single-line comments (but not URLs like https://)
  result = result.replace(/(?<![:\w])\/\/[^\n]*/g, '');
  // Collapse whitespace sequences (spaces, tabs, newlines) to a single space
  result = result.replace(/\s+/g, ' ');
  // Remove spaces around common operators and punctuation
  result = result.replace(/\s*([=+\-*/%&|^~!<>?:;,{}[\]()])\s*/g, '$1');
  return result.trim();
}

function formatJS(code: string): string {
  let result = '';
  let indent = 0;
  let inString = false;
  let stringChar = '';
  const tab = '  ';

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (inString) {
      result += ch;
      if (ch === stringChar && code[i - 1] !== '\\') inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      result += ch;
      continue;
    }
    if (ch === '{') {
      result += ch + '\n' + tab.repeat(++indent);
    } else if (ch === '}') {
      indent = Math.max(0, indent - 1);
      result = result.trimEnd() + '\n' + tab.repeat(indent) + ch;
      if (i + 1 < code.length && code[i + 1] !== ';' && code[i + 1] !== ',' && code[i + 1] !== ')') {
        result += '\n' + tab.repeat(indent);
      }
    } else if (ch === ';') {
      result += ch + '\n' + tab.repeat(indent);
    } else {
      result += ch;
    }
  }
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

export default function MinificadorJSTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('minify');
  const [copied, setCopied] = useState(false);

  const output = mode === 'minify' ? minifyJS(input) : formatJS(input);
  const origSize = new Blob([input]).size;
  const outSize = new Blob([output]).size;
  const reduction = origSize > 0 ? Math.round((1 - outSize / origSize) * 100) : 0;

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = mode === 'minify' ? 'script.min.js' : 'script.formatted.js';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2">
        {(['minify', 'format'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', mode === m ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-tools-border)]'].join(' ')}
          >
            {m === 'minify' ? 'Minificar' : 'Formatear'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">JavaScript original</label>
            {origSize > 0 && <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(origSize)}</span>}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={16}
            className="w-full px-3 py-3 rounded-xl border border-[var(--color-border)] text-sm font-mono resize-none focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="Pega tu código JavaScript aquí…"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              {mode === 'minify' ? 'JavaScript minificado' : 'JavaScript formateado'}
            </label>
            {outSize > 0 && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatBytes(outSize)}
                {mode === 'minify' && origSize > 0 && reduction > 0 && (
                  <span className="ml-1 text-green-600 font-semibold">-{reduction}%</span>
                )}
              </span>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            rows={16}
            className="w-full px-3 py-3 rounded-xl border border-[var(--color-tools-border)] bg-[var(--color-tools-bg)] text-sm font-mono resize-none focus:outline-none"
            placeholder="El resultado aparecerá aquí…"
          />
        </div>
      </div>

      {output && (
        <div className="flex gap-2">
          <button onClick={copy} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
            {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button onClick={download} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
            <Download size={15} />
            Descargar .js
          </button>
        </div>
      )}

      <p className="text-xs text-[var(--color-text-muted)]">El minificador básico elimina comentarios y colapsa espacios. Para proyectos en producción usa herramientas especializadas como Terser o esbuild.</p>
    </div>
  );
}
