import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

interface PdfFile { file: File; name: string; size: number }
interface Part { url: string; size: number; from: number; to: number; index: number }

export default function DividirCadaNPaginasTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [n, setN] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Part[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPdf({ file, name: file.name, size: file.size });
    setError(null);
    setResults([]);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch { setPageCount(0); }
  }

  function handleClear() { results.forEach((r) => revokeURL(r.url)); setPdf(null); setPageCount(0); setResults([]); setError(null); }

  async function handleSplit() {
    if (!pdf) return;
    results.forEach((r) => revokeURL(r.url));
    setResults([]);
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await PDFDocument.load(await pdf.file.arrayBuffer(), { ignoreEncryption: true });
      const total = src.getPageCount();
      const out: Part[] = [];
      let part = 0;
      for (let start = 0; start < total; start += n) {
        const end = Math.min(start + n, total);
        const doc = await PDFDocument.create();
        const idxs = Array.from({ length: end - start }, (_, i) => start + i);
        const copied = await doc.copyPages(src, idxs);
        copied.forEach((p) => doc.addPage(p));
        const bytes = await doc.save({ useObjectStreams: true });
        out.push({ url: URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), size: bytes.length, from: start + 1, to: end, index: part });
        part++;
      }
      setResults(out);
    } catch {
      setError('Error al dividir el PDF. Comprueba que no esté protegido.');
    } finally {
      setLoading(false);
    }
  }

  function downloadPart(p: Part) {
    if (!pdf) return;
    const a = document.createElement('a');
    a.href = p.url;
    a.download = pdf.name.replace(/\.pdf$/i, `_parte${p.index + 1}.pdf`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader label="Sube tu PDF" onFile={handleFile} onClear={handleClear} current={pdf} />
      {pageCount > 0 && results.length === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">PDF cargado: <strong className="text-[var(--color-text)]">{pageCount} páginas</strong></p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><label className="font-medium text-[var(--color-text)]">Páginas por archivo</label><span className="text-[var(--color-accent)] font-bold">{n}</span></div>
            <input type="range" min={1} max={Math.max(1, pageCount - 1)} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <button onClick={handleSplit} disabled={loading} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] disabled:opacity-40 transition-colors">{loading ? 'Dividiendo…' : `Dividir cada ${n} página${n !== 1 ? 's' : ''}`}</button>
        </div>
      )}

      {loading && results.length === 0 && (
        <div className="p-6 text-center"><Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" /><p className="text-sm mt-3">Dividiendo PDF…</p></div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">{results.length} archivos generados</p>
          <div className="space-y-2">
            {results.map((p) => (
              <div key={p.index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[var(--color-border)]">
                <span className="text-sm text-[var(--color-text)]">Parte {p.index + 1} · págs. {p.from}-{p.to} <span className="text-[var(--color-text-muted)]">({formatBytes(p.size)})</span></span>
                <button onClick={() => downloadPart(p)} className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold rounded-lg hover:bg-[#C93D1E] transition-colors"><Download size={12} /> PDF</button>
              </div>
            ))}
          </div>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Dividir otro PDF</button>
        </div>
      )}
    </div>
  );
}
