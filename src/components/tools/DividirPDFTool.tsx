import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { formatBytes } from '@/lib/utils/format';

interface PdfFile { file: File; name: string; size: number }

type Mode = 'all' | 'range';

function parseRange(input: string, total: number): number[] {
  const pages: number[] = [];
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) continue;
    const from = parseInt(match[1], 10);
    const to = match[2] ? parseInt(match[2], 10) : from;
    for (let i = from; i <= to; i++) {
      if (i >= 1 && i <= total && !pages.includes(i)) pages.push(i);
    }
  }
  return pages.sort((a, b) => a - b);
}

export default function DividirPDFTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<Mode>('all');
  const [range, setRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPdf({ file, name: file.name, size: file.size });
    setError(null);
    setRange('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(0);
    }
  }

  function handleClear() { setPdf(null); setPageCount(0); setRange(''); setError(null); setProgress(''); }

  async function handleSplit() {
    if (!pdf || pageCount === 0) return;
    setLoading(true);
    setError(null);
    setProgress('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await pdf.file.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const baseName = pdf.name.replace(/\.pdf$/i, '');

      const pagesToExtract = mode === 'all'
        ? Array.from({ length: pageCount }, (_, i) => i + 1)
        : parseRange(range, pageCount);

      if (pagesToExtract.length === 0) { setError('No hay páginas válidas en el rango indicado.'); setLoading(false); return; }

      for (let i = 0; i < pagesToExtract.length; i++) {
        const pageNum = pagesToExtract[i];
        setProgress(`Generando página ${pageNum}…`);
        const newDoc = await PDFDocument.create();
        const [copied] = await newDoc.copyPages(srcDoc, [pageNum - 1]);
        newDoc.addPage(copied);
        const out = await newDoc.save({ useObjectStreams: true });
        const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = mode === 'all' ? `${baseName}_pagina${pageNum}.pdf` : `${baseName}_paginas_${pagesToExtract[0]}-${pagesToExtract[pagesToExtract.length - 1]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        if (mode === 'range') break; // range mode → single output
        await new Promise(r => setTimeout(r, 150));
      }
      setProgress('');
    } catch {
      setError('Error al dividir el PDF.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PdfUploader label="Sube tu PDF" onFile={handleFile} onClear={handleClear} current={pdf} />
        {pageCount > 0 && (
          <p className="text-sm text-[var(--color-text-muted)] px-1">
            PDF cargado: <strong className="text-[var(--color-text)]">{pageCount} páginas</strong>
          </p>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Modo de división</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['all', 'range'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={['py-2.5 rounded-lg text-sm font-medium border transition-colors', mode === m ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}>
                {m === 'all' ? 'Página por página' : 'Extraer rango'}
              </button>
            ))}
          </div>
          {mode === 'range' && (
            <div>
              <label className="text-sm font-medium text-[var(--color-text)]">Páginas a extraer</label>
              <input
                type="text"
                value={range}
                onChange={e => setRange(e.target.value)}
                placeholder={`Ej: 1-3, 5, 8-10 (máx. ${pageCount || 'N'})`}
                className="mt-1.5 w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Separa páginas con comas. Usa guión para rangos.</p>
            </div>
          )}
          {mode === 'all' && pageCount > 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Se descargarán {pageCount} archivos PDF, uno por página.
            </p>
          )}
        </div>

        {progress && <p className="text-sm text-[var(--color-text-muted)] text-center">{progress}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton
          onClick={handleSplit}
          disabled={!pdf || pageCount === 0 || loading || (mode === 'range' && !range.trim())}
          loading={loading}
          label={mode === 'all' ? 'Dividir y descargar' : 'Extraer páginas'}
          className="w-full"
        />
      </div>
    </div>
  );
}
