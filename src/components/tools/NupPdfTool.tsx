import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfFile { file: File; name: string; size: number }

const A4: [number, number] = [595.28, 841.89];
const LAYOUTS: Record<number, { cols: number; rows: number; landscape: boolean }> = {
  2: { cols: 1, rows: 2, landscape: false },
  4: { cols: 2, rows: 2, landscape: false },
  6: { cols: 2, rows: 3, landscape: false },
};

export default function NupPdfTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [perSheet, setPerSheet] = useState(2);
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

  async function handleNup() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await PDFDocument.load(await pdf.file.arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const { cols, rows, landscape } = LAYOUTS[perSheet];
      let [sw, sh] = A4;
      if (landscape) [sw, sh] = [sh, sw];
      const pages = src.getPages();
      const embedded = await out.embedPages(pages);
      const margin = 14;
      const cellW = (sw - margin * (cols + 1)) / cols;
      const cellH = (sh - margin * (rows + 1)) / rows;
      for (let i = 0; i < embedded.length; i += perSheet) {
        const sheet = out.addPage([sw, sh]);
        for (let j = 0; j < perSheet; j++) {
          const emb = embedded[i + j];
          if (!emb) break;
          const col = j % cols;
          const row = Math.floor(j / cols);
          const scale = Math.min(cellW / emb.width, cellH / emb.height);
          const w = emb.width * scale;
          const h = emb.height * scale;
          const cellX = margin + col * (cellW + margin);
          // fila 0 arriba
          const cellY = sh - margin - (row + 1) * cellH - row * margin;
          sheet.drawPage(emb, { x: cellX + (cellW - w) / 2, y: cellY + (cellH - h) / 2, width: w, height: h });
        }
      }
      const outBytes = await out.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, `_${perSheet}porhoja.pdf`);
      a.click();
      revokeURL(url);
    } catch {
      setError('Error al combinar las páginas. Comprueba que el PDF no esté protegido.');
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
          <h2 className="font-bold text-[var(--color-text)]">Páginas por hoja</h2>
          <div className="grid grid-cols-3 gap-2">
            {[2, 4, 6].map((p) => (
              <button key={p} onClick={() => setPerSheet(p)} className={['py-2.5 rounded-xl border text-sm font-bold transition-colors', perSheet === p ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{p} en 1</button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">Combina varias páginas en una sola hoja A4 para ahorrar papel al imprimir. Ideal para apuntes, presentaciones y borradores.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={handleNup} disabled={!pdf || loading} loading={loading} label={`Combinar ${perSheet} por hoja`} className="w-full" />
      </div>
    </div>
  );
}
