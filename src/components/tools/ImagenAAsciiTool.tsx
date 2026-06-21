import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';
import { loadImage, createCanvas, getContext } from '@/lib/utils/canvas';
import { Copy, Check, Download } from 'lucide-react';

const RAMPS: Record<string, string> = {
  detallado: '@%#*+=-:. ',
  bloques: '█▓▒░ ',
  simple: '#=. ',
};

export default function ImagenAAsciiTool() {
  const upload = useImageUpload();
  const [width, setWidth] = useState(100);
  const [ramp, setRamp] = useState<keyof typeof RAMPS>('detallado');
  const [invert, setInvert] = useState(false);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const w = width;
      const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w * 0.5));
      const canvas = createCanvas(w, h);
      const ctx = getContext(canvas);
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let chars = RAMPS[ramp];
      if (invert) chars = chars.split('').reverse().join('');
      const lines: string[] = [];
      for (let y = 0; y < h; y++) {
        let line = '';
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          const idx = Math.min(chars.length - 1, Math.floor(lum * (chars.length - 1)));
          line += chars[idx];
        }
        lines.push(line);
      }
      setOutput(lines.join('\n'));
    } catch {
      setError('Error al generar el ASCII. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadTxt() {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <ImageUploader
        image={upload.image}
        error={upload.error}
        isDragging={upload.isDragging}
        onDrop={upload.onDrop}
        onDragOver={upload.onDragOver}
        onDragLeave={upload.onDragLeave}
        onFileChange={upload.onFileChange}
        onClear={() => { upload.clearImage(); setOutput(''); }}
      />

      {upload.image && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><label className="font-medium text-[var(--color-text)]">Ancho (caracteres)</label><span className="text-[var(--color-text-secondary)]">{width}</span></div>
            <input type="range" min={40} max={200} step={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(RAMPS) as (keyof typeof RAMPS)[]).map((r) => (
              <button key={r} onClick={() => setRamp(r)} className={['py-2 rounded-xl border text-sm font-semibold capitalize transition-colors', ramp === r ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{r}</button>
            ))}
          </div>
          <button onClick={() => setInvert((v) => !v)} className={['px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors', invert ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>Invertir (para fondo oscuro)</button>
          <button onClick={generate} disabled={loading} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] disabled:opacity-40 transition-colors">
            {loading ? 'Generando…' : 'Generar ASCII art'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

      {output && (
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-3">
            <button onClick={copy} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copiado' : 'Copiar'}</button>
            <button onClick={downloadTxt} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"><Download size={13} /> .txt</button>
          </div>
          <pre className="px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[#0d0d0d] text-[#d8d8d8] overflow-x-auto leading-[1] font-mono" style={{ fontSize: '5px' }}>{output}</pre>
        </div>
      )}
    </div>
  );
}
