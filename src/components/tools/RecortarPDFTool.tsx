import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const MM_TO_PT = 2.8346;

export default function RecortarPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [top, setTop] = useState(10);
  const [right, setRight] = useState(10);
  const [bottom, setBottom] = useState(10);
  const [left, setLeft] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!file) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const pages = pdfDoc.getPages();
      const topPt = top * MM_TO_PT;
      const rightPt = right * MM_TO_PT;
      const bottomPt = bottom * MM_TO_PT;
      const leftPt = left * MM_TO_PT;

      for (const page of pages) {
        const { width, height } = page.getSize();
        page.setCropBox(
          leftPt,
          bottomPt,
          width - leftPt - rightPt,
          height - bottomPt - topPt,
        );
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al recortar el PDF. Verifica que los márgenes no sean mayores que el tamaño de la página.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace('.pdf', '_recortado.pdf');
    a.click();
  }

  const MarginInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">{label} (mm)</label>
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)]"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PdfUploader onFile={setFile} onClear={handleClear} current={file} />

      {file && !processing && !resultUrl && (
        <div className="space-y-5">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Define cuántos milímetros recortar de cada lado. Se aplica a todas las páginas del PDF.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MarginInput label="Superior" value={top} onChange={setTop} />
            <MarginInput label="Derecho" value={right} onChange={setRight} />
            <MarginInput label="Inferior" value={bottom} onChange={setBottom} />
            <MarginInput label="Izquierdo" value={left} onChange={setLeft} />
          </div>
          <button
            onClick={() => { setTop(10); setRight(10); setBottom(10); setLeft(10); }}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Restablecer valores por defecto (10 mm)
          </button>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Recortar márgenes
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Recortando márgenes…</p>
        </div>
      )}

      {resultUrl && file && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(file.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar PDF recortado
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
