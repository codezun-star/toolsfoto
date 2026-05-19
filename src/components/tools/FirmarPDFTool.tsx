import { useState, useRef, useEffect } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

export default function FirmarPDFTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [xPct, setXPct] = useState(10);
  const [yPct, setYPct] = useState(10);
  const [sigWidth, setSigWidth] = useState(200);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!canvasRef.current) return;
    setDrawing(true);
    const ctx = canvasRef.current.getContext('2d')!;
    const { x, y } = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d')!;
    const { x, y } = getPos(e, canvasRef.current);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }

  function stopDraw() { setDrawing(false); }

  function clearCanvas() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  }

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setResultSize(0);
    setTotalPages(1);
    setPageNum(1);
    setError(null);
  }

  async function handleFile(f: File) {
    setFile(f);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      setTotalPages(doc.getPageCount());
    } catch {
      setTotalPages(1);
    }
  }

  async function process() {
    if (!file || !hasSignature || !canvasRef.current) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const pages = pdfDoc.getPages();
      const page = pages[pageNum - 1];
      const { width, height } = page.getSize();

      // Export signature as PNG
      const sigDataUrl = canvasRef.current.toDataURL('image/png');
      const sigRes = await fetch(sigDataUrl);
      const sigBuf = await sigRes.arrayBuffer();
      const pngImage = await pdfDoc.embedPng(sigBuf);
      const dims = pngImage.scaleToFit(sigWidth, 100);

      const x = (xPct / 100) * width;
      const y = height - (yPct / 100) * height - dims.height;

      page.drawImage(pngImage, { x, y, width: dims.width, height: dims.height });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al firmar el PDF. Comprueba que el archivo no está protegido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace('.pdf', '_firmado.pdf');
    a.click();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Paso 1 — Dibuja tu firma</p>
        <div className="relative bg-white rounded-xl border-2 border-[var(--color-border)] overflow-hidden" style={{ touchAction: 'none' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <button onClick={clearCanvas} className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-secondary)] hover:text-red-600 hover:border-red-300 transition-colors">
            <Trash2 size={12} />
            Borrar
          </button>
        </div>
        {!hasSignature && <p className="text-xs text-[var(--color-text-muted)] mt-1.5">Dibuja con el ratón o el dedo en el área blanca de arriba.</p>}
      </div>

      <div>
        <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Paso 2 — Sube el PDF</p>
        <PdfUploader onFile={handleFile} onClear={handleClear} current={file} />
      </div>

      {file && hasSignature && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Página ({totalPages} total)</label>
              <input type="number" min={1} max={totalPages} value={pageNum} onChange={(e) => setPageNum(Math.min(totalPages, Math.max(1, Number(e.target.value))))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Posición X (%)</label>
              <input type="number" min={0} max={90} value={xPct} onChange={(e) => setXPct(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Posición Y desde arriba (%)</label>
              <input type="number" min={0} max={90} value={yPct} onChange={(e) => setYPct(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Ancho firma (pt)</label>
              <input type="number" min={50} max={400} value={sigWidth} onChange={(e) => setSigWidth(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none" />
            </div>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Insertar firma en el PDF
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Insertando firma…</p>
        </div>
      )}

      {resultUrl && file && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(file.size)}</strong></span>
            <span>Firmado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar PDF firmado
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Firmar otro PDF
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
