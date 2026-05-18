import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

type Position = 'bottom-center' | 'bottom-right' | 'top-right';
type Format = 'number' | 'page-n' | 'n-of-total';

const POSITIONS: { id: Position; label: string }[] = [
  { id: 'bottom-center', label: 'Inferior centro' },
  { id: 'bottom-right', label: 'Inferior derecho' },
  { id: 'top-right', label: 'Superior derecho' },
];

export default function NumerarPaginasPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [format, setFormat] = useState<Format>('number');
  const [startNum, setStartNum] = useState(1);
  const [fontSize, setFontSize] = useState(12);
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
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const total = pages.length;
      const margin = 30;

      pages.forEach((page, i) => {
        const num = startNum + i;
        let label = '';
        if (format === 'number') label = String(num);
        else if (format === 'page-n') label = `Página ${num}`;
        else label = `${num} / ${total + startNum - 1}`;

        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(label, fontSize);
        let x = 0, y = 0;
        if (position === 'bottom-center') { x = (width - textWidth) / 2; y = margin; }
        else if (position === 'bottom-right') { x = width - textWidth - margin; y = margin; }
        else { x = width - textWidth - margin; y = height - margin - fontSize; }

        page.drawText(label, { x, y, font, size: fontSize, color: rgb(0.3, 0.3, 0.3) });
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al numerar el PDF. Comprueba que el archivo no está protegido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace('.pdf', '_numerado.pdf');
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={setFile} onClear={handleClear} current={file} />

      {file && !processing && !resultUrl && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Posición</p>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map((p) => (
                <button key={p.id} onClick={() => setPosition(p.id)} className={['px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors', position === p.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Formato</p>
            <div className="grid grid-cols-3 gap-2">
              {([['number', '1, 2, 3…'], ['page-n', 'Página 1, 2…'], ['n-of-total', '1/N, 2/N…']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setFormat(id)} className={['px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors', format === id ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Número inicial</label>
              <input type="number" min={1} value={startNum} onChange={(e) => setStartNum(Math.max(1, Number(e.target.value)))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Tamaño de fuente</label>
              <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none">
                <option value={10}>10pt</option>
                <option value={12}>12pt</option>
                <option value={14}>14pt</option>
                <option value={16}>16pt</option>
              </select>
            </div>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Numerar páginas
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Procesando…</p>
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
            Descargar PDF numerado
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
