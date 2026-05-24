import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const PRESETS = [
  { label: 'Crema', color: '#FFF8F0' },
  { label: 'Azul claro', color: '#EFF6FF' },
  { label: 'Verde claro', color: '#F0FDF4' },
  { label: 'Gris claro', color: '#F8F8F8' },
  { label: 'Amarillo', color: '#FEFCE8' },
];

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

export default function FondoColorPDFTool() {
  const [pdf, setPdf] = useState<{ file: File; name: string; size: number } | null>(null);
  const [color, setColor] = useState('#FFF8F0');
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setPdf(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!pdf) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    setResultUrl(null);
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const buf = await pdf.file.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      const [r, g, b] = hexToRgb(color);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(r, g, b),
          opacity: 1,
        });
        // Move the rectangle behind existing content by inserting at index 0
        // pdf-lib draws in order, so we save/restore to put rect behind
      }

      // Rebuild with background behind content: embed original pages as images
      const src2 = await PDFDocument.load(buf);
      const result = await PDFDocument.create();
      const srcPages = await result.copyPages(src2, src2.getPageIndices());

      for (let i = 0; i < srcPages.length; i++) {
        const newPage = result.addPage([srcPages[i].getWidth(), srcPages[i].getHeight()]);
        newPage.drawRectangle({
          x: 0,
          y: 0,
          width: srcPages[i].getWidth(),
          height: srcPages[i].getHeight(),
          color: rgb(r, g, b),
        });
        // Draw original page content on top via embedPage
        const embedded = await result.embedPage(srcPages[i]);
        newPage.drawPage(embedded, { x: 0, y: 0 });
      }

      const bytes = await result.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('[FondoColorPDF]', err);
      setError('Error al procesar el PDF. Asegúrate de que el archivo es un PDF válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = pdf?.name.replace(/\.pdf$/i, '_fondo.pdf') ?? 'resultado.pdf';
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={(f) => setPdf({ file: f, name: f.name, size: f.size })} onClear={handleClear} current={pdf} />

      {pdf && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Color de fondo</h2>

            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.color}
                  onClick={() => setColor(p.color)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    color === p.color
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span
                    style={{ backgroundColor: p.color, border: '1px solid #ccc' }}
                    className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle"
                  />
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-[var(--color-text)]">Color personalizado:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 cursor-pointer rounded border border-[var(--color-border)]"
              />
              <span className="text-sm text-[var(--color-text-secondary)] font-mono">{color.toUpperCase()}</span>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              El color de fondo se aplica debajo del contenido existente en cada página. Ideal para PDFs con texto negro sobre fondo transparente o blanco.
            </p>
          </div>

          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Aplicar fondo de color
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Aplicando fondo…</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            PDF con fondo: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar PDF con fondo
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
