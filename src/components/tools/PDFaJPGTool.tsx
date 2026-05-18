import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';

interface PdfFile { file: File; name: string; size: number }
interface PagePreview { num: number; url: string }

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function PDFaJPGTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(2);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleClear() { pages.forEach(p => URL.revokeObjectURL(p.url)); setPdf(null); setPages([]); setError(null); setProgress(''); }

  async function handleConvert() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    setProgress('Cargando PDF…');
    pages.forEach(p => URL.revokeObjectURL(p.url));
    setPages([]);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN;
      const bytes = await pdf.file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
      const newPages: PagePreview[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        setProgress(`Renderizando página ${i} de ${doc.numPages}…`);
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const url = await new Promise<string>((res, rej) => {
          canvas.toBlob(b => { if (b) res(URL.createObjectURL(b)); else rej(); }, 'image/jpeg', quality / 100);
        });
        newPages.push({ num: i, url });
      }
      setPages(newPages);
      setProgress('');
    } catch {
      setError('Error al convertir el PDF. Comprueba que no esté protegido.');
    } finally {
      setLoading(false);
    }
  }

  async function downloadAll() {
    if (!pdf) return;
    const baseName = pdf.name.replace(/\.pdf$/i, '');
    for (let i = 0; i < pages.length; i++) {
      const a = document.createElement('a');
      a.href = pages[i].url;
      a.download = `${baseName}_pagina${pages[i].num}.jpg`;
      a.click();
      await new Promise(r => setTimeout(r, 150));
    }
  }

  function downloadOne(page: PagePreview) {
    if (!pdf) return;
    const baseName = pdf.name.replace(/\.pdf$/i, '');
    const a = document.createElement('a');
    a.href = page.url;
    a.download = `${baseName}_pagina${page.num}.jpg`;
    a.click();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label="Sube tu PDF" onFile={(f) => { setPdf({ file: f, name: f.name, size: f.size }); setPages([]); setError(null); }} onClear={handleClear} current={pdf} />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Configuración</h2>
          <Slider label="Calidad JPG" value={quality} min={60} max={100} step={5} unit="%" onChange={setQuality} />
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Resolución</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(s => (
                <button key={s} onClick={() => setScale(s)}
                  className={['py-2 rounded-lg text-xs font-medium border transition-colors', scale === s ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}>
                  {s === 1 ? 'Normal' : s === 2 ? 'Alta (×2)' : 'Muy alta (×3)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {progress && <p className="text-sm text-[var(--color-text-muted)] text-center">{progress}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={handleConvert} disabled={!pdf || loading}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Convirtiendo…' : 'Convertir a JPG'}
          </button>
          <DownloadButton onClick={downloadAll} disabled={pages.length === 0} loading={loading} label={pages.length > 1 ? `Descargar ${pages.length} JPG` : 'Descargar JPG'} className="flex-1" />
        </div>
      </div>

      {pages.length > 0 && (
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-4">Páginas convertidas ({pages.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pages.map(p => (
              <div key={p.num} className="space-y-1.5">
                <img src={p.url} alt={`Página ${p.num}`} className="w-full rounded-lg border border-[var(--color-border)] object-contain bg-[var(--color-bg)]" />
                <button onClick={() => downloadOne(p)} className="w-full text-xs text-[var(--color-accent)] hover:underline">
                  Descargar página {p.num}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
