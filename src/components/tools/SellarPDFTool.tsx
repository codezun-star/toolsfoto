import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

const STAMP_PRESETS = ['BORRADOR', 'CONFIDENCIAL', 'APROBADO', 'RECHAZADO', 'COPIA', 'URGENTE'];
const COLORS = ['#CC0000', '#808080', '#0066CC', '#009900', '#FF6600'];

export default function SellarPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('CONFIDENCIAL');
  const [opacity, setOpacity] = useState(20);
  const [fontSize, setFontSize] = useState(80);
  const [color, setColor] = useState('#CC0000');
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  function hexToRgb01(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
    ];
  }

  async function process() {
    if (!file || !text.trim()) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const [r, g, b] = hexToRgb01(color);
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        const stampText = text.toUpperCase();
        const textWidth = font.widthOfTextAtSize(stampText, fontSize);
        // Draw sello once centered diagonal
        page.drawText(stampText, {
          x: (width - textWidth) / 2,
          y: (height - fontSize) / 2,
          font,
          size: fontSize,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(35),
        });
      }
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al sellar el PDF. Comprueba que el archivo no está protegido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace('.pdf', '_sellado.pdf');
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={setFile} onClear={handleClear} current={file} />

      {file && !processing && !resultUrl && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Sellos predefinidos</label>
            <div className="flex flex-wrap gap-2">
              {STAMP_PRESETS.map((s) => (
                <button
                  key={s}
                  onClick={() => setText(s)}
                  className={['px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors', text === s ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">Texto personalizado</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              placeholder="CONFIDENCIAL"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] uppercase"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Tamaño</label>
              <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none">
                {[40, 60, 80, 100, 120].map((v) => <option key={v} value={v}>{v}pt</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Opacidad</label>
              <select value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none">
                {[10, 15, 20, 30, 40, 50].map((v) => <option key={v} value={v}>{v}%</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Color</label>
              <div className="flex items-center gap-1.5">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-8 rounded border border-[var(--color-border)] cursor-pointer p-0.5" />
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`} />
                ))}
              </div>
            </div>
          </div>

          <button onClick={process} disabled={!text.trim()} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50">
            Sellar PDF
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Añadiendo sello…</p>
        </div>
      )}

      {resultUrl && file && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(file.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} /> Descargar PDF sellado
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Sellar otro PDF</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
