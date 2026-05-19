import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PageResult { url: string; size: number; page: number }

export default function PDFaPNGTool() {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(2);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<PageResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    results.forEach((r) => revokeURL(r.url));
    setFile(null);
    setResults([]);
    setError(null);
  }

  async function process() {
    if (!file) return;
    results.forEach((r) => revokeURL(r.url));
    setProcessing(true);
    setResults([]);
    setError(null);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      const pageResults: PageResult[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
        pageResults.push({ url: URL.createObjectURL(blob), size: blob.size, page: i });
      }
      setResults(pageResults);
    } catch {
      setError('Error al convertir el PDF. Comprueba que no está protegido con contraseña.');
    } finally {
      setProcessing(false);
    }
  }

  function downloadAll() {
    results.forEach(({ url, page }) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file!.name.replace('.pdf', '')}_pagina_${page}.png`;
      a.click();
    });
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={setFile} onClear={handleClear} current={file} />

      {file && !processing && results.length === 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Calidad de renderizado</p>
            <div className="flex gap-2">
              {([1, 1.5, 2, 3] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={['flex-1 py-2.5 text-sm rounded-xl border font-medium transition-colors', scale === s ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
                >
                  {s === 1 ? '72 dpi' : s === 1.5 ? '108 dpi' : s === 2 ? '144 dpi' : '216 dpi'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Convertir a PNG
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Convirtiendo páginas a PNG…</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-text)]">{results.length} página{results.length !== 1 ? 's' : ''} convertida{results.length !== 1 ? 's' : ''}</p>
            {results.length > 1 && (
              <button onClick={downloadAll} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
                <Download size={15} />
                Descargar todas
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map(({ url, size, page }) => (
              <div key={page} className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-white">
                <img src={url} alt={`Página ${page}`} className="w-full" />
                <div className="p-3 flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-muted)]">Página {page} · {formatBytes(size)}</span>
                  <a
                    href={url}
                    download={`${file!.name.replace('.pdf', '')}_pagina_${page}.png`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold rounded-lg hover:bg-[#C93D1E] transition-colors"
                  >
                    <Download size={12} />
                    PNG
                  </a>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Convertir otro PDF
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
