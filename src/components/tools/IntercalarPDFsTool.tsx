import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

interface PdfEntry { file: File; name: string; size: number }

export default function IntercalarPDFsTool() {
  const [pdfA, setPdfA] = useState<PdfEntry | null>(null);
  const [pdfB, setPdfB] = useState<PdfEntry | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setPdfA(null);
    setPdfB(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!pdfA || !pdfB) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    setResultUrl(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bufA = await pdfA.file.arrayBuffer();
      const bufB = await pdfB.file.arrayBuffer();
      const docA = await PDFDocument.load(bufA);
      const docB = await PDFDocument.load(bufB);
      const result = await PDFDocument.create();

      const pagesA = docA.getPageCount();
      const pagesB = docB.getPageCount();
      const total = Math.max(pagesA, pagesB);

      for (let i = 0; i < total; i++) {
        if (i < pagesA) {
          const [page] = await result.copyPages(docA, [i]);
          result.addPage(page);
        }
        if (i < pagesB) {
          const [page] = await result.copyPages(docB, [i]);
          result.addPage(page);
        }
      }

      const bytes = await result.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('[IntercalarPDFs]', err);
      setError('Error al intercalar los PDFs. Asegúrate de que ambos archivos son PDFs válidos.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'intercalado.pdf';
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--color-text)]">Primer PDF (páginas impares)</p>
          <PdfUploader
            onFile={(f) => setPdfA({ file: f, name: f.name, size: f.size })}
            onClear={() => setPdfA(null)}
            current={pdfA}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--color-text)]">Segundo PDF (páginas pares)</p>
          <PdfUploader
            onFile={(f) => setPdfB({ file: f, name: f.name, size: f.size })}
            onClear={() => setPdfB(null)}
            current={pdfB}
          />
        </div>
      </div>

      {pdfA && pdfB && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-tools-bg)] rounded-xl border border-[var(--color-tools-border)] text-sm text-[var(--color-text)]">
            <p>El PDF resultante alternará: A1, B1, A2, B2, A3, B3…</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Si un PDF tiene más páginas, las páginas extra se añaden al final.</p>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Intercalar PDFs
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Intercalando páginas…</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            PDF intercalado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar PDF intercalado
          </button>
          <button
            onClick={handleClear}
            className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            Procesar otros PDFs
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
