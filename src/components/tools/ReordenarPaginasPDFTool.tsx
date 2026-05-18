import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PageThumb { index: number; url: string }

export default function ReordenarPaginasPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<PageThumb[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    thumbs.forEach((t) => URL.revokeObjectURL(t.url));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setThumbs([]);
    setOrder([]);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function loadThumbs(f: File) {
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN;
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      const pages: PageThumb[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.7));
        pages.push({ index: i - 1, url: URL.createObjectURL(blob) });
      }
      setThumbs(pages);
      setOrder(pages.map((_, i) => i));
    } catch {
      setError('Error al cargar el PDF.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  }

  function move(pos: number, dir: -1 | 1) {
    setOrder((prev) => {
      const arr = [...prev];
      const j = pos + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[pos], arr[j]] = [arr[j], arr[pos]];
      return arr;
    });
  }

  async function process() {
    if (!file) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf);
      const dst = await PDFDocument.create();
      const copied = await dst.copyPages(src, order);
      copied.forEach((p) => dst.addPage(p));
      const bytes = await dst.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al reordenar el PDF.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace('.pdf', '_reordenado.pdf');
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={loadThumbs} onClear={handleClear} current={file} />

      {loading && (
        <div className="p-6 text-center">
          <Loader2 size={24} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-2">Cargando páginas…</p>
        </div>
      )}

      {thumbs.length > 0 && !processing && !resultUrl && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">{thumbs.length} páginas — usa las flechas para reordenar</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {order.map((origIdx, pos) => {
              const thumb = thumbs[origIdx];
              return (
                <div key={`${origIdx}-${pos}`} className="relative bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <img src={thumb.url} alt={`Página ${origIdx + 1}`} className="w-full" />
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 rounded font-bold">{pos + 1}</div>
                  <div className="absolute top-1 right-1 flex flex-col gap-0.5">
                    <button onClick={() => move(pos, -1)} disabled={pos === 0} className="bg-black/60 hover:bg-black/80 text-white rounded p-0.5 disabled:opacity-30 transition-colors">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => move(pos, 1)} disabled={pos === order.length - 1} className="bg-black/60 hover:bg-black/80 text-white rounded p-0.5 disabled:opacity-30 transition-colors">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Guardar PDF reordenado
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Reordenando páginas…</p>
        </div>
      )}

      {resultUrl && file && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(file.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar PDF reordenado
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Reordenar otro PDF
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
