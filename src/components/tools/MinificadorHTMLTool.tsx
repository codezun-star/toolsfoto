import { useState } from 'react';
import { Copy, Download, CheckCircle2 } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

function minifyHTML(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')         // remove comments
    .replace(/\s+/g, ' ')                     // collapse whitespace
    .replace(/>\s+</g, '><')                  // remove spaces between tags
    .replace(/\s+>/g, '>')                    // remove spaces before >
    .replace(/<\s+/g, '<')                    // remove spaces after <
    .replace(/\s+\/>/g, '/>')                 // remove spaces before />
    .trim();
}

function formatHTML(html: string): string {
  let result = '';
  let indent = 0;
  const selfClosing = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];

  for (const token of tokens) {
    const text = token.trim();
    if (!text) continue;
    if (text.startsWith('</')) {
      indent = Math.max(0, indent - 1);
      result += '  '.repeat(indent) + text + '\n';
    } else if (text.startsWith('<')) {
      const tagName = text.match(/<([a-z][a-z0-9]*)/i)?.[1] ?? '';
      result += '  '.repeat(indent) + text + '\n';
      if (!selfClosing.test(tagName) && !text.endsWith('/>') && !text.startsWith('<!') && !text.startsWith('<?')) {
        indent++;
      }
    } else {
      const t = text.replace(/\s+/g, ' ').trim();
      if (t) result += '  '.repeat(indent) + t + '\n';
    }
  }
  return result.trimEnd();
}

export default function MinificadorHTMLTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'minify' | 'format' | null>(null);

  function handleMinify() {
    setOutput(minifyHTML(input));
    setMode('minify');
  }

  function handleFormat() {
    setOutput(formatHTML(input));
    setMode('format');
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'minify' ? 'index.min.html' : 'index.html';
    a.click();
    revokeURL(url);
  }

  const reduction = input && output && mode === 'minify'
    ? Math.round((1 - output.length / input.length) * 100)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">HTML de entrada</label>
        <textarea
          className="w-full h-56 font-mono text-sm p-4 rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-y"
          placeholder="<html>\n  <body>\n    <h1>  Hola mundo  </h1>\n  </body>\n</html>"
          value={input}
          onChange={e => { setInput(e.target.value); setOutput(''); setMode(null); }}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleMinify}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] transition-colors disabled:opacity-40"
        >
          Minificar
        </button>
        <button
          onClick={handleFormat}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium text-sm hover:border-[var(--color-accent)] transition-colors disabled:opacity-40"
        >
          Formatear
        </button>
      </div>

      {reduction !== null && (
        <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          Reducción: <strong>{reduction}%</strong> ({input.length} → {output.length} caracteres)
        </p>
      )}

      {output && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--color-text)]">Resultado</label>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
              >
                {copied ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={download}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
              >
                <Download size={13} />
                .html
              </button>
            </div>
          </div>
          <textarea
            readOnly
            className="w-full h-56 font-mono text-sm p-4 rounded-xl border border-[var(--color-tools-border)] bg-[var(--color-bg)] resize-y focus:outline-none"
            value={output}
          />
        </div>
      )}
    </div>
  );
}
