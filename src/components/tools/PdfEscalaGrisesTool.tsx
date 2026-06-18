import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function PdfEscalaGrisesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function clearResult() { if (resultUrl) revokeURL(resultUrl); setResultUrl(null); setResultSize(0); }
  function handleClear() { clearResult(); setFile(null); setError(null); setProgress(''); }

  async function process() {
    if (!file) return;
    clearResult();
    setError(null);
    setProcessing(true);
    setProgress('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN;
      const { PDFDocument } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      const out = await PDFDocument.create();
      for (let i = 1; i <= doc.numPages; i++) {
        setProgress(`Página ${i} de ${doc.numPages}`);
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let p = 0; p < d.length; p += 4) {
          const g = Math.round(0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]);
          d[p] = d[p + 1] = d[p + 2] = g;
        }
        ctx.putImageData(imgData, 0, 0);
        const jpgBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.85));
        const jpgBytes = new Uint8Array(await jpgBlob.arrayBuffer());
        const embedded = await out.embedJpg(jpgBytes);
        const newPage = out.addPage([canvas.width, canvas.height]);
        newPage.drawImage(embedded, { x: 0, y: 0, width: canvas.width, height: canvas.height });
      }
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al procesar el PDF. Comprueba que no está protegido con contraseña.');
    } finally {
      setProcessing(false);
      setProgress('');
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace(/\.pdf$/i, '') + '-grises.pdf';
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={(f) => { setFile(f); clearResult(); setError(null); }} onClear={handleClear} current={file} />

      {file && !processing && !resultUrl && (
        <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
          Convertir a escala de grises
        </button>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress || 'Procesando…'}</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-center text-[var(--color-text-muted)]">PDF en escala de grises · {formatBytes(resultSize)}</p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} /> Descargar PDF
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otro PDF</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}

      <p className="text-xs text-[var(--color-text-muted)]">Cada página se rasteriza en escala de grises y se reensambla en un nuevo PDF (el texto deja de ser seleccionable). Todo se procesa en tu navegador, sin subir el archivo.</p>
    </div>
  );
}
