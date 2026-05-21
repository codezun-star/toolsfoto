import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

interface PdfEntry { file: File; name: string; size: number }

const PAGE_SIZES: Record<string, [number, number]> = {
  'A3': [841.89, 1190.55],
  'A4': [595.28, 841.89],
  'A5': [419.53, 595.28],
  'Carta': [612, 792],
  'Legal': [612, 1008],
};

type Orientation = 'portrait' | 'landscape';

export default function EscalarPDFTool() {
  const [pdf, setPdf] = useState<PdfEntry | null>(null);
  const [targetSize, setTargetSize] = useState('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
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
      const { PDFDocument } = await import('pdf-lib');
      const buf = await pdf.file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf);
      const newDoc = await PDFDocument.create();

      let [tw, th] = PAGE_SIZES[targetSize];
      if (orientation === 'landscape') [tw, th] = [th, tw];

      const pageCount = srcDoc.getPageCount();
      for (let i = 0; i < pageCount; i++) {
        const embeddedPage = await newDoc.embedPage(srcDoc.getPage(i));
        const { width: ow, height: oh } = embeddedPage;
        const scale = Math.min(tw / ow, th / oh);
        const drawW = ow * scale;
        const drawH = oh * scale;
        const x = (tw - drawW) / 2;
        const y = (th - drawH) / 2;
        const newPage = newDoc.addPage([tw, th]);
        newPage.drawPage(embeddedPage, { x, y, width: drawW, height: drawH });
      }

      const bytes = await newDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('[EscalarPDF]', err);
      setError('Error al escalar el PDF. Asegúrate de que el archivo es un PDF válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !pdf) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = pdf.name.replace('.pdf', `_${targetSize}.pdf`);
    a.click();
  }

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
            <h2 className="font-bold text-[var(--color-text)]">Tamaño de destino</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {Object.keys(PAGE_SIZES).map((size) => (
                <button
                  key={size}
                  onClick={() => setTargetSize(size)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                    targetSize === size
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              {(['portrait', 'landscape'] as Orientation[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setOrientation(o)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    orientation === o
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {o === 'portrait' ? 'Vertical' : 'Horizontal'}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Escalar PDF
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Escalando páginas…</p>
        </div>
      )}

      {resultUrl && pdf && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Original: <strong className="text-[var(--color-text)]">{formatBytes(pdf.size)}</strong> →
            Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar PDF escalado
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
