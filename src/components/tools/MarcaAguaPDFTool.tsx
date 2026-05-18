import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

export default function MarcaAguaPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('CONFIDENCIAL');
  const [opacity, setOpacity] = useState(25);
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState('#808080');
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

  function hexToRgb01(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }

  async function process() {
    if (!file || !text.trim()) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const [r, g, b] = hexToRgb01(color);

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: (height - fontSize) / 2,
          font,
          size: fontSize,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(45),
        });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al añadir la marca de agua. Comprueba que el PDF no está protegido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace('.pdf', '_watermark.pdf');
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={setFile} onClear={handleClear} current={file} />

      {file && !processing && !resultUrl && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Texto de la marca de agua</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="CONFIDENCIAL"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Tamaño (pt)</label>
              <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none">
                <option value={40}>40pt</option>
                <option value={60}>60pt</option>
                <option value={80}>80pt</option>
                <option value={100}>100pt</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Opacidad</label>
              <select value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none">
                <option value={10}>10%</option>
                <option value={20}>20%</option>
                <option value={25}>25%</option>
                <option value={40}>40%</option>
                <option value={60}>60%</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5" />
                {['#808080', '#FF0000', '#0000FF'].map((c) => (
                  <button key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={process} disabled={!text.trim()} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50">
            Añadir marca de agua
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
            Descargar PDF con marca de agua
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
