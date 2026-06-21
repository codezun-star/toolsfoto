import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfFile { file: File; name: string; size: number }

const SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
  Carta: [612, 792],
  Legal: [612, 1008],
};

export default function CambiarTamanoPdfTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [size, setSize] = useState('A4');
  const [landscape, setLandscape] = useState(false);
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

  async function handleResize() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await PDFDocument.load(await pdf.file.arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      let [tw, th] = SIZES[size];
      if (landscape) [tw, th] = [th, tw];
      const pages = src.getPages();
      const embedded = await out.embedPages(pages);
      embedded.forEach((emb) => {
        const page = out.addPage([tw, th]);
        const margin = 20;
        const scale = Math.min((tw - margin * 2) / emb.width, (th - margin * 2) / emb.height);
        const w = emb.width * scale;
        const h = emb.height * scale;
        page.drawPage(emb, { x: (tw - w) / 2, y: (th - h) / 2, width: w, height: h });
      });
      const outBytes = await out.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, `_${size}${landscape ? '_horizontal' : ''}.pdf`);
      a.click();
      revokeURL(url);
    } catch {
      setError('Error al cambiar el tamaño. Comprueba que el PDF no esté protegido.');
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
          <h2 className="font-bold text-[var(--color-text)]">Tamaño de página</h2>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(SIZES).map((s) => (
              <button key={s} onClick={() => setSize(s)} className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', size === s ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{s}</button>
            ))}
          </div>
          <button onClick={() => setLandscape((v) => !v)} className={['w-full py-2.5 rounded-xl border text-sm font-semibold transition-colors', landscape ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{landscape ? 'Horizontal (apaisado)' : 'Vertical'}</button>
          <p className="text-xs text-[var(--color-text-muted)]">El contenido de cada página se reescala manteniendo su proporción para ajustarse al nuevo tamaño.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={handleResize} disabled={!pdf || loading} loading={loading} label={`Convertir a ${size}`} className="w-full" />
      </div>
    </div>
  );
}
