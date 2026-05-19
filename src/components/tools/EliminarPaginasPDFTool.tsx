import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfFile { file: File; name: string; size: number }

function parseRange(input: string, total: number): number[] {
  const pages: number[] = [];
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) continue;
    const from = parseInt(match[1], 10);
    const to = match[2] ? parseInt(match[2], 10) : from;
    for (let i = Math.max(1, from); i <= Math.min(to, total); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
  }
  return pages.sort((a, b) => a - b);
}

export default function EliminarPaginasPDFTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPdf({ file, name: file.name, size: file.size });
    setError(null);
    setRange('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch { setPageCount(0); }
  }

  function handleClear() { setPdf(null); setPageCount(0); setRange(''); setError(null); }

  const pagesToDelete = pdf && range.trim() ? parseRange(range, pageCount) : [];
  const pagesToKeep = pageCount > 0
    ? Array.from({ length: pageCount }, (_, i) => i + 1).filter(p => !pagesToDelete.includes(p))
    : [];

  async function handleProcess() {
    if (!pdf || pagesToKeep.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await pdf.file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, pagesToKeep.map(p => p - 1));
      copied.forEach(p => out.addPage(p));
      const outBytes = await out.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, '_eliminadas.pdf');
      a.click();
      revokeURL(url);
    } catch {
      setError('Error al procesar el PDF. Comprueba que no esté protegido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label="Sube tu PDF" onFile={handleFile} onClear={handleClear} current={pdf} />
        {pageCount > 0 && (
          <p className="text-sm text-[var(--color-text-muted)] px-1">
            PDF cargado: <strong className="text-[var(--color-text)]">{pageCount} páginas</strong>
          </p>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Páginas a eliminar</h2>
          <input
            type="text"
            value={range}
            onChange={e => setRange(e.target.value)}
            placeholder={`Ej: 1, 3, 5-7 (de 1 a ${pageCount || 'N'})`}
            disabled={!pdf}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)] disabled:bg-[var(--color-bg)] disabled:text-[var(--color-text-muted)]"
          />
          <p className="text-xs text-[var(--color-text-muted)]">Separa páginas con comas. Usa guión para rangos continuos.</p>

          {pagesToDelete.length > 0 && (
            <div className="space-y-2">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-700">
                  Se eliminarán <strong>{pagesToDelete.length}</strong> páginas: {pagesToDelete.join(', ')}
                </p>
              </div>
              {pagesToKeep.length > 0 && (
                <div className="p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    El PDF resultante tendrá <strong>{pagesToKeep.length}</strong> páginas
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton
          onClick={handleProcess}
          disabled={!pdf || pagesToDelete.length === 0 || pagesToKeep.length === 0 || loading}
          loading={loading}
          label={pagesToDelete.length > 0 ? `Eliminar ${pagesToDelete.length} página${pagesToDelete.length !== 1 ? 's' : ''}` : 'Eliminar páginas'}
          className="w-full"
        />
      </div>
    </div>
  );
}
