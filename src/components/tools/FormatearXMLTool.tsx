import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

function minifyXML(xml: string): string {
  return xml.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
}

function formatXML(xml: string): string {
  const PAD = '  ';
  const normalized = xml.replace(/\r\n?/g, '\n').replace(/>\s*</g, '>\n<').trim();
  let indent = 0;
  const out: string[] = [];
  for (const raw of normalized.split('\n')) {
    const node = raw.trim();
    if (!node) continue;
    const isClosing = /^<\//.test(node);
    const isOpening = /^<[^/!?][^>]*[^/]>$/.test(node);
    if (isClosing) indent = Math.max(indent - 1, 0);
    out.push(PAD.repeat(indent) + node);
    if (isOpening) indent++;
  }
  return out.join('\n');
}

export default function FormatearXMLTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function process() {
    setError(null);
    if (!input.trim()) return;
    try {
      const doc = new DOMParser().parseFromString(input, 'application/xml');
      if (doc.querySelector('parsererror')) {
        setError('El XML parece tener errores de sintaxis. Se ha procesado igualmente; revisa el resultado.');
      }
    } catch {
      /* validación opcional */
    }
    setOutput(mode === 'format' ? formatXML(input) : minifyXML(input));
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadXml() {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/xml' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = 'documento.xml';
    a.click();
    URL.revokeObjectURL(u);
  }

  const inputLines = input.trim() ? input.trim().split('\n').length : 0;
  const outputLines = output.trim() ? output.trim().split('\n').length : 0;
  const reduction = input.length > 0 ? Math.round((1 - output.length / input.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        {(['format', 'minify'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${mode === m ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'}`}>
            {m === 'format' ? 'Formatear XML' : 'Minificar XML'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text)]">XML de entrada</label>
            {inputLines > 0 && <span className="text-xs text-[var(--color-text-muted)]">{inputLines} líneas · {input.length} chars</span>}
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={'<catalogo><item id="1"><nombre>Ejemplo</nombre></item></catalogo>'}
            className="w-full h-64 px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-[var(--color-accent)]" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text)]">Resultado</label>
            {output && <span className="text-xs text-[var(--color-text-muted)]">{outputLines} líneas · {output.length} chars{mode === 'minify' && reduction > 0 ? ` · ${reduction}% menos` : ''}</span>}
          </div>
          <textarea readOnly value={output} placeholder="El XML formateado aparecerá aquí…"
            className="w-full h-64 px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm font-mono resize-none bg-[var(--color-bg)] focus:outline-none" />
        </div>
      </div>

      {error && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <button onClick={process} disabled={!input.trim()} className="flex-1 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {mode === 'format' ? 'Formatear' : 'Minificar'}
        </button>
        <button onClick={copy} disabled={!output} className="flex items-center gap-2 px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] disabled:opacity-40 transition-colors">
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button onClick={downloadXml} disabled={!output} className="flex items-center gap-2 px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] disabled:opacity-40 transition-colors">
          <Download size={16} /> .xml
        </button>
      </div>
    </div>
  );
}
