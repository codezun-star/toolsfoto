import { useState, useRef } from 'react';
import { Copy, Check, Download, Upload, RefreshCw } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

function minifySVG(input: string): string {
  let out = input;
  // Remove XML comments
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  // Remove metadata, title, desc, defs if empty
  out = out.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  out = out.replace(/<title[\s\S]*?<\/title>/gi, '');
  out = out.replace(/<desc[\s\S]*?<\/desc>/gi, '');
  // Remove Inkscape / Sodipodi / RDF / DC / CC namespaced attributes
  out = out.replace(/\s(?:inkscape|sodipodi|dc|cc|rdf):[a-zA-Z-]+="[^"]*"/g, '');
  // Remove namespace declarations for those prefixes
  out = out.replace(/\s+xmlns:(?:inkscape|sodipodi|dc|cc|rdf)="[^"]*"/g, '');
  // Remove empty defs
  out = out.replace(/<defs\s*\/>/g, '');
  out = out.replace(/<defs>\s*<\/defs>/g, '');
  // Remove XML declaration
  out = out.replace(/<\?xml[^?]*\?>/g, '');
  // Remove DOCTYPE
  out = out.replace(/<!DOCTYPE[^>]*>/gi, '');
  // Collapse multiple whitespace inside tags (but not in content)
  out = out.replace(/\s{2,}/g, ' ');
  // Remove whitespace between tags
  out = out.replace(/>\s+</g, '><');
  // Remove trailing whitespace on attribute values
  out = out.replace(/"\s+"/g, '" "');
  // Remove unnecessary spaces before />
  out = out.replace(/\s+\/>/g, '/>');
  // Remove spaces around = in attributes
  out = out.replace(/\s*=\s*/g, '=');
  // Trim
  out = out.trim();
  return out;
}

export default function MinificadorSVGTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function process() {
    if (!input.trim()) return;
    setError(null);
    try {
      if (!input.trim().includes('<svg') && !input.trim().includes('<SVG')) {
        throw new Error('El contenido no parece un archivo SVG válido.');
      }
      setOutput(minifySVG(input));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al minificar el SVG.');
      setOutput('');
    }
  }

  function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith('.svg') && f.type !== 'image/svg+xml') {
      setError('Solo se aceptan archivos .svg');
      return;
    }
    f.text().then((text) => { setInput(text); setOutput(''); setError(null); });
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!output) return;
    const blob = new Blob([output], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minificado.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  const originalBytes = new TextEncoder().encode(input).length;
  const minifiedBytes = new TextEncoder().encode(output).length;
  const reduction = originalBytes > 0 && minifiedBytes > 0 ? Math.round((1 - minifiedBytes / originalBytes) * 100) : 0;

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white cursor-pointer hover:border-[var(--color-accent)] transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      >
        <Upload size={18} className="text-[var(--color-text-muted)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">Arrastra un archivo .svg o haz clic para subir</span>
        <input ref={inputRef} type="file" accept=".svg,image/svg+xml" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">SVG original</label>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setOutput(''); }}
          placeholder={`<svg xmlns="http://www.w3.org/2000/svg" ...>...</svg>`}
          rows={8}
          className="w-full px-4 py-3 text-xs font-mono rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] resize-y"
        />
        {input && <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatBytes(originalBytes)}</p>}
      </div>

      <button onClick={process} disabled={!input.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50">
        <RefreshCw size={16} /> Minificar SVG
      </button>

      {output && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">SVG minificado</label>
            {reduction > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full">-{reduction}% ({formatBytes(minifiedBytes)})</span>
            )}
          </div>
          <textarea
            value={output}
            readOnly
            rows={6}
            className="w-full px-4 py-3 text-xs font-mono rounded-xl border border-[var(--color-tools-border)] bg-[var(--color-tools-bg)] resize-y focus:outline-none"
          />
          <div className="flex gap-3">
            <button onClick={copy} className="flex items-center gap-1.5 px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-xl font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
              {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button onClick={download} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm">
              <Download size={15} /> Descargar .svg
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
