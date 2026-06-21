import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfFile { file: File; name: string; size: number }

export default function InvertirOrdenPdfTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPdf({ file, name: file.name, size: file.size });
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch { setPageCount(0); }
  }

  function handleClear() { setPdf(null); setPageCount(0); setError(null); }

  async function handleReverse() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await PDFDocument.load(await pdf.file.arrayBuffer(), { ignoreEncryption: true });
      const total = src.getPageCount();
      const order = Array.from({ length: total }, (_, i) => total - 1 - i);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, order);
      copied.forEach((p) => out.addPage(p));
      const outBytes = await out.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, '_invertido.pdf');
      a.click();
      revokeURL(url);
    } catch {
      setError('Error al invertir el orden. Comprueba que el PDF no esté protegido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label="Sube tu PDF" onFile={handleFile} onClear={handleClear} current={pdf} />
        {pageCount > 0 && <p className="text-sm text-[var(--color-text-muted)] px-1">PDF cargado: <strong className="text-[var(--color-text)]">{pageCount} páginas</strong></p>}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-2">Invertir el orden de las páginas</h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">La última página pasará a ser la primera y viceversa. Ideal para documentos escaneados al revés o para corregir el orden de un PDF generado de atrás hacia adelante.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={handleReverse} disabled={!pdf || loading} loading={loading} label="Invertir y descargar PDF" className="w-full" />
      </div>
    </div>
  );
}
