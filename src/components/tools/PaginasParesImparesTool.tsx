import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfFile { file: File; name: string; size: number }
type Which = 'impares' | 'pares';

export default function PaginasParesImparesTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [which, setWhich] = useState<Which>('impares');
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

  const indices: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    const isOdd = i % 2 === 0; // página 1 (index 0) = impar
    if (which === 'impares' && isOdd) indices.push(i);
    if (which === 'pares' && !isOdd) indices.push(i);
  }

  async function handleExtract() {
    if (!pdf || indices.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await PDFDocument.load(await pdf.file.arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      const outBytes = await out.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, `_${which}.pdf`);
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
        {pageCount > 0 && <p className="text-sm text-[var(--color-text-muted)] px-1">PDF cargado: <strong className="text-[var(--color-text)]">{pageCount} páginas</strong></p>}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">¿Qué páginas conservar?</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['impares', 'pares'] as const).map((w) => (
              <button key={w} onClick={() => setWhich(w)} className={['py-2.5 rounded-xl border text-sm font-semibold capitalize transition-colors', which === w ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{w}</button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">Las páginas impares son la 1, 3, 5… y las pares la 2, 4, 6… Útil para imprimir a doble cara con impresoras de una sola cara.</p>
          {indices.length > 0 && <div className="p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]"><p className="text-xs text-[var(--color-text-secondary)]">Se generarán <strong>{indices.length} páginas</strong>.</p></div>}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={handleExtract} disabled={!pdf || indices.length === 0 || loading} loading={loading} label={`Extraer páginas ${which}`} className="w-full" />
      </div>
    </div>
  );
}
