import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfFile { file: File; name: string; size: number }
type Dir = 'vertical' | 'horizontal';

export default function DividirPdfMitadTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [dir, setDir] = useState<Dir>('vertical');
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

  async function handleSplit() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await PDFDocument.load(await pdf.file.arrayBuffer(), { ignoreEncryption: true });
      const total = src.getPageCount();
      const out = await PDFDocument.create();
      // dos copias por página: para la primera y la segunda mitad
      const order: number[] = [];
      for (let i = 0; i < total; i++) { order.push(i, i); }
      const copied = await out.copyPages(src, order);
      copied.forEach((page, idx) => {
        const { width, height } = page.getSize();
        const isFirstHalf = idx % 2 === 0;
        if (dir === 'vertical') {
          // izquierda / derecha
          if (isFirstHalf) page.setMediaBox(0, 0, width / 2, height);
          else page.setMediaBox(width / 2, 0, width / 2, height);
        } else {
          // arriba / abajo
          if (isFirstHalf) page.setMediaBox(0, height / 2, width, height / 2);
          else page.setMediaBox(0, 0, width, height / 2);
        }
        out.addPage(page);
      });
      const outBytes = await out.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, '_dividido.pdf');
      a.click();
      revokeURL(url);
    } catch {
      setError('Error al dividir las páginas. Comprueba que el PDF no esté protegido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label="Sube tu PDF" onFile={handleFile} onClear={handleClear} current={pdf} />
        {pageCount > 0 && <p className="text-sm text-[var(--color-text-muted)] px-1">PDF cargado: <strong className="text-[var(--color-text)]">{pageCount} páginas</strong> → {pageCount * 2} resultantes</p>}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Dirección del corte</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setDir('vertical')} className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', dir === 'vertical' ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>Vertical (izq/der)</button>
            <button onClick={() => setDir('horizontal')} className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', dir === 'horizontal' ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>Horizontal (arr/abj)</button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">Cada página se divide en dos. Ideal para separar libros escaneados con dos páginas por hoja o documentos a doble columna.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={handleSplit} disabled={!pdf || loading} loading={loading} label="Dividir páginas a la mitad" className="w-full" />
      </div>
    </div>
  );
}
