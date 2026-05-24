import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

export default function InsertarPaginaPDFTool() {
  const [pdf, setPdf] = useState<{ file: File; name: string; size: number } | null>(null);
  const [position, setPosition] = useState(1);
  const [count, setCount] = useState(1);
  const [mode, setMode] = useState<'before' | 'after'>('after');
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleLoad(f: File) {
    const { PDFDocument } = await import('pdf-lib');
    const buf = await f.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    setPageCount(doc.getPageCount());
    setPdf({ file: f, name: f.name, size: f.size });
    setPosition(1);
  }

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setPdf(null);
    setResultUrl(null);
    setResultSize(0);
    setPageCount(0);
    setError(null);
  }

  async function process() {
    if (!pdf) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    setResultUrl(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await pdf.file.arrayBuffer();
      const src = await PDFDocument.load(buf);
      const result = await PDFDocument.create();

      const pages = await result.copyPages(src, src.getPageIndices());
      const refPage = pages[0];
      const pageWidth = refPage.getWidth();
      const pageHeight = refPage.getHeight();

      const insertAt = mode === 'after' ? position : position - 1;

      for (let i = 0; i < pages.length; i++) {
        result.addPage(pages[i]);
        if (i === insertAt - 1) {
          for (let j = 0; j < count; j++) {
            const blank = result.addPage([pageWidth, pageHeight]);
            // Move the newly added blank page to the correct index
            // pdf-lib addPage always adds at end, so we need to restructure
            void blank;
          }
        }
      }

      // Rebuild with correct order
      const result2 = await PDFDocument.create();
      const srcPages = await result2.copyPages(src, src.getPageIndices());
      const insertIndex = mode === 'after' ? position : position - 1;

      for (let i = 0; i < srcPages.length; i++) {
        if (i === insertIndex) {
          for (let j = 0; j < count; j++) {
            result2.addPage([pageWidth, pageHeight]);
          }
        }
        result2.addPage(srcPages[i]);
      }
      if (insertIndex >= srcPages.length) {
        for (let j = 0; j < count; j++) {
          result2.addPage([pageWidth, pageHeight]);
        }
      }

      const bytes = await result2.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('[InsertarPagina]', err);
      setError('Error al procesar el PDF. Asegúrate de que el archivo es un PDF válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = pdf?.name.replace(/\.pdf$/i, '_con_paginas.pdf') ?? 'resultado.pdf';
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={handleLoad} onClear={handleClear} current={pdf} />

      {pdf && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Configurar inserción</h2>
            <p className="text-xs text-[var(--color-text-muted)]">Este PDF tiene {pageCount} {pageCount === 1 ? 'página' : 'páginas'}.</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-[var(--color-text)] block mb-1">Insertar</label>
                <div className="flex gap-2">
                  {(['before', 'after'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        mode === m
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {m === 'before' ? 'Antes de' : 'Después de'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text)] block mb-1">Página nº</label>
                <input
                  type="number"
                  value={position}
                  min={1}
                  max={pageCount}
                  onChange={(e) => setPosition(Math.min(pageCount, Math.max(1, Number(e.target.value))))}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--color-text)] block mb-1">Número de páginas en blanco</label>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      count === n
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Insertar {count} página{count !== 1 ? 's' : ''} en blanco
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Insertando páginas…</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            PDF resultante: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar PDF
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otro PDF
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
