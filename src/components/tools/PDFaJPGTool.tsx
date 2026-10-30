import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { revokeURL } from '@/lib/utils/canvas';
import { loadPdfjs } from '@/lib/utils/pdfjs';
import { useT, withLang } from '@/i18n/react';

interface PdfFile { file: File; name: string; size: number }
interface PagePreview { num: number; url: string }


function PDFaJPGTool() {
  const t = useT();
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(2);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleClear() { pages.forEach(p => revokeURL(p.url)); setPdf(null); setPages([]); setError(null); setProgress(''); }

  async function handleConvert() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    setProgress(t('Cargando PDF…'));
    pages.forEach(p => revokeURL(p.url));
    setPages([]);
    try {
      const pdfjsLib = await loadPdfjs();
      const bytes = await pdf.file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
      const newPages: PagePreview[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        setProgress(t('Renderizando página {i} de {n}…', { i, n: doc.numPages }));
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        const url = await new Promise<string>((res, rej) => {
          canvas.toBlob(b => { if (b) res(URL.createObjectURL(b)); else rej(); }, 'image/jpeg', quality / 100);
        });
        newPages.push({ num: i, url });
      }
      setPages(newPages);
      setProgress('');
    } catch {
      setError(t('Error al convertir el PDF. Comprueba que no esté protegido.'));
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
      a.download = `${baseName}_${t('pagina')}${pages[i].num}.jpg`;
      a.click();
      await new Promise(r => setTimeout(r, 150));
    }
  }

  function downloadOne(page: PagePreview) {
    if (!pdf) return;
    const baseName = pdf.name.replace(/\.pdf$/i, '');
    const a = document.createElement('a');
    a.href = page.url;
    a.download = `${baseName}_${t('pagina')}${page.num}.jpg`;
    a.click();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label={t('Sube tu PDF')} onFile={(f) => { setPdf({ file: f, name: f.name, size: f.size }); setPages([]); setError(null); }} onClear={handleClear} current={pdf} />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">{t('Configuración')}</h2>
          <Slider label={t('Calidad JPG')} value={quality} min={60} max={100} step={5} unit="%" onChange={setQuality} />
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">{t('Resolución')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(s => (
                <button key={s} onClick={() => setScale(s)}
                  className={['py-2 rounded-lg text-xs font-medium border transition-colors', scale === s ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}>
                  {s === 1 ? t('Normal') : s === 2 ? t('Alta (×2)') : t('Muy alta (×3)')}
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
            {loading ? t('Convirtiendo…') : t('Convertir a {f}', { f: 'JPG' })}
          </button>
          <DownloadButton onClick={downloadAll} disabled={pages.length === 0} loading={loading} label={pages.length > 1 ? t('Descargar {n} JPG', { n: pages.length }) : t('Descargar {f}', { f: 'JPG' })} className="flex-1" />
        </div>
      </div>

      {pages.length > 0 && (
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-4">{t('Páginas convertidas ({n})', { n: pages.length })}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pages.map(p => (
              <div key={p.num} className="space-y-1.5">
                <img src={p.url} alt={t('Página {n}', { n: p.num })} className="w-full rounded-lg border border-[var(--color-border)] object-contain bg-[var(--color-bg)]" />
                <button onClick={() => downloadOne(p)} className="w-full text-xs text-[var(--color-accent)] hover:underline">
                  {t('Descargar página {n}', { n: p.num })}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default withLang(PDFaJPGTool);
