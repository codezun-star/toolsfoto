import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';
import { revokeURL, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function PdfAImagenLargaTool() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/jpeg');
  const [gap, setGap] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClear() { if (result) revokeURL(result.url); setFile(null); setResult(null); setError(null); }

  async function process() {
    if (!file) return;
    if (result) revokeURL(result.url);
    setProcessing(true);
    setResult(null);
    setError(null);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      const scale = 1.5;
      const canvases: HTMLCanvasElement[] = [];
      let maxW = 0;
      let totalH = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale });
        const c = createCanvas(vp.width, vp.height);
        const ctx = getContext(c);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        canvases.push(c);
        maxW = Math.max(maxW, c.width);
        totalH += c.height;
      }
      totalH += gap * (canvases.length - 1);
      const out = createCanvas(maxW, totalH);
      const octx = getContext(out);
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, maxW, totalH);
      let y = 0;
      for (const c of canvases) {
        octx.drawImage(c, (maxW - c.width) / 2, y);
        y += c.height + gap;
      }
      const blob = await canvasToBlob(out, format, 0.9);
      setResult({ url: URL.createObjectURL(blob), size: blob.size });
    } catch {
      setError('Error al convertir el PDF. Comprueba que no esté protegido o que no tenga demasiadas páginas.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${file.name.replace('.pdf', '')}-completo.${format === 'image/png' ? 'png' : 'jpg'}`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={setFile} onClear={handleClear} current={file} />

      {file && !processing && !result && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Formato de salida</p>
            <div className="grid grid-cols-2 gap-2">
              {([['image/jpeg', 'JPG (más ligero)'], ['image/png', 'PNG (sin pérdida)']] as const).map(([f, label]) => (
                <button key={f} onClick={() => setFormat(f)} className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', format === f ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><label className="font-medium text-[var(--color-text)]">Separación entre páginas</label><span className="text-[var(--color-text-secondary)]">{gap}px</span></div>
            <input type="range" min={0} max={40} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">Unir páginas en una imagen</button>
        </div>
      )}

      {processing && (<div className="p-6 text-center"><Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" /><p className="text-sm mt-3">Renderizando páginas…</p></div>)}

      {result && (
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
            <img src={result.url} alt="PDF como imagen larga" className="w-full" />
          </div>
          <p className="text-sm text-center text-[var(--color-text-secondary)]">Imagen generada: <strong className="text-[var(--color-accent)]">{formatBytes(result.size)}</strong></p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"><Download size={18} /> Descargar imagen</button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Convertir otro PDF</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
