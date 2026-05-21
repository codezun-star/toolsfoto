import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

interface PdfEntry { file: File; name: string; size: number }

export default function EncabezadoPiePDFTool() {
  const [pdf, setPdf] = useState<PdfEntry | null>(null);
  const [header, setHeader] = useState('');
  const [footer, setFooter] = useState('Página {n} de {total}');
  const [fontSize, setFontSize] = useState(10);
  const [marginPt, setMarginPt] = useState(20);
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
    if (!pdf || (!header.trim() && !footer.trim())) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    setResultUrl(null);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const buf = await pdf.file.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const total = pages.length;

      for (let i = 0; i < total; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const size = fontSize;
        const color = rgb(0.2, 0.2, 0.2);

        if (header.trim()) {
          const text = header.replace('{n}', String(i + 1)).replace('{total}', String(total));
          const textW = font.widthOfTextAtSize(text, size);
          page.drawText(text, {
            x: (width - textW) / 2,
            y: height - marginPt,
            size,
            font,
            color,
          });
        }

        if (footer.trim()) {
          const text = footer.replace('{n}', String(i + 1)).replace('{total}', String(total));
          const textW = font.widthOfTextAtSize(text, size);
          page.drawText(text, {
            x: (width - textW) / 2,
            y: marginPt - size,
            size,
            font,
            color,
          });
        }
      }

      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('[EncabezadoPiePDF]', err);
      setError('Error al procesar el PDF. Asegúrate de que el archivo es un PDF válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !pdf) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = pdf.name.replace('.pdf', '_cabecera.pdf');
    a.click();
  }

  const canProcess = !!pdf && (header.trim().length > 0 || footer.trim().length > 0);

  return (
    <div className="space-y-6">
      <PdfUploader
        onFile={(f) => setPdf({ file: f, name: f.name, size: f.size })}
        onClear={handleClear}
        current={pdf}
      />

      {pdf && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Configuración</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">Encabezado</label>
              <input
                type="text"
                value={header}
                onChange={(e) => setHeader(e.target.value)}
                placeholder="Ej: Informe Anual 2024"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">Pie de página</label>
              <input
                type="text"
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                placeholder="Ej: Página {n} de {total}"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
              <p className="text-xs text-[var(--color-text-muted)]">Usa <code>{'{n}'}</code> para número de página y <code>{'{total}'}</code> para total de páginas.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text)]">Tamaño fuente</label>
                <input
                  type="number"
                  value={fontSize}
                  min={6}
                  max={24}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text)]">Margen (pt)</label>
                <input
                  type="number"
                  value={marginPt}
                  min={10}
                  max={60}
                  onChange={(e) => setMarginPt(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
          </div>
          <button
            onClick={process}
            disabled={!canProcess}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Añadir encabezado y pie
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Añadiendo texto…</p>
        </div>
      )}

      {resultUrl && pdf && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            PDF listo: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar PDF con encabezado
          </button>
          <button
            onClick={handleClear}
            className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            Procesar otro PDF
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
