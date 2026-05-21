import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

interface PdfEntry { file: File; name: string; size: number }

function parsePages(input: string, total: number): number[] {
  const pages: number[] = [];
  const parts = input.split(',').map((s) => s.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      for (let i = a; i <= b; i++) {
        if (i >= 1 && i <= total) pages.push(i - 1);
      }
    } else {
      const n = Number(part);
      if (!isNaN(n) && n >= 1 && n <= total) pages.push(n - 1);
    }
  }
  return [...new Set(pages)].sort((a, b) => a - b);
}

export default function DuplicarPaginasPDFTool() {
  const [pdf, setPdf] = useState<PdfEntry | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pagesInput, setPagesInput] = useState('1');
  const [copies, setCopies] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(f: File) {
    const { PDFDocument } = await import('pdf-lib');
    const buf = await f.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    setPageCount(doc.getPageCount());
    setPdf({ file: f, name: f.name, size: f.size });
  }

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setPdf(null);
    setPageCount(0);
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
      const total = srcDoc.getPageCount();

      const pagesToDup = parsePages(pagesInput, total);
      const dupSet = new Set(pagesToDup);

      for (let i = 0; i < total; i++) {
        const [orig] = await newDoc.copyPages(srcDoc, [i]);
        newDoc.addPage(orig);
        if (dupSet.has(i)) {
          for (let c = 0; c < copies; c++) {
            const [dup] = await newDoc.copyPages(srcDoc, [i]);
            newDoc.addPage(dup);
          }
        }
      }

      const bytes = await newDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('[DuplicarPaginasPDF]', err);
      setError('Error al procesar el PDF. Asegúrate de que el archivo es un PDF válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !pdf) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = pdf.name.replace('.pdf', '_duplicado.pdf');
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader
        onFile={handleFile}
        onClear={handleClear}
        current={pdf}
      />

      {pdf && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Páginas a duplicar</h2>
            <p className="text-xs text-[var(--color-text-muted)]">El PDF tiene {pageCount} {pageCount === 1 ? 'página' : 'páginas'}.</p>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-text)]">Páginas (ej: 1, 3, 5-7)</label>
              <input
                type="text"
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-text)]">Copias adicionales</label>
              <input
                type="number"
                value={copies}
                min={1}
                max={10}
                onChange={(e) => setCopies(Math.max(1, Math.min(10, Number(e.target.value))))}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
              <p className="text-xs text-[var(--color-text-muted)]">Las copias se insertan justo después de la página original.</p>
            </div>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Duplicar páginas
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Duplicando páginas…</p>
        </div>
      )}

      {resultUrl && pdf && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            PDF resultante: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar PDF con páginas duplicadas
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
