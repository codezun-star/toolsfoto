import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, Plus, Trash2 } from 'lucide-react';

interface TextEntry {
  id: number;
  text: string;
  page: number;
  xPct: number;
  yPct: number;
  fontSize: number;
  color: string;
}

let _nextId = 0;

function newEntry(totalPages: number): TextEntry {
  return { id: _nextId++, text: '', page: 1, xPct: 10, yPct: 10, fontSize: 12, color: '#111111' };
}

export default function AnadirTextoPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [entries, setEntries] = useState<TextEntry[]>([{ id: _nextId++, text: '', page: 1, xPct: 10, yPct: 10, fontSize: 12, color: '#111111' }]);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setResultSize(0);
    setTotalPages(1);
    setError(null);
    setEntries([newEntry(1)]);
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

  function updateEntry(id: number, patch: Partial<TextEntry>) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } : e));
  }

  function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }

  async function process() {
    if (!file || entries.every((e) => !e.text.trim())) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setError(null);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      for (const entry of entries) {
        if (!entry.text.trim()) continue;
        const pageIndex = Math.min(Math.max(entry.page - 1, 0), pages.length - 1);
        const page = pages[pageIndex];
        const { width, height } = page.getSize();
        const x = (entry.xPct / 100) * width;
        const y = height - (entry.yPct / 100) * height - entry.fontSize;
        const [r, g, b] = hexToRgb(entry.color);
        page.drawText(entry.text, { x, y, font, size: entry.fontSize, color: rgb(r, g, b) });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al añadir texto al PDF. Comprueba que el archivo no está protegido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace('.pdf', '_con_texto.pdf');
    a.click();
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={handleFile} onClear={handleClear} current={file} />

      {file && !processing && !resultUrl && (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div key={entry.id} className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Texto {i + 1}</span>
                {entries.length > 1 && (
                  <button onClick={() => setEntries((prev) => prev.filter((e) => e.id !== entry.id))} className="text-[var(--color-text-muted)] hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={entry.text}
                onChange={(e) => updateEntry(entry.id, { text: e.target.value })}
                placeholder="Texto a insertar…"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Página</label>
                  <input type="number" min={1} max={totalPages} value={entry.page} onChange={(e) => updateEntry(entry.id, { page: Math.min(totalPages, Math.max(1, Number(e.target.value))) })} className="w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Pos. X (%)</label>
                  <input type="number" min={0} max={95} value={entry.xPct} onChange={(e) => updateEntry(entry.id, { xPct: Number(e.target.value) })} className="w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Pos. Y (%)</label>
                  <input type="number" min={0} max={95} value={entry.yPct} onChange={(e) => updateEntry(entry.id, { yPct: Number(e.target.value) })} className="w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Fuente (pt)</label>
                  <select value={entry.fontSize} onChange={(e) => updateEntry(entry.id, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-white focus:outline-none">
                    {[8, 10, 12, 14, 16, 18, 24, 32].map((s) => <option key={s} value={s}>{s}pt</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-[var(--color-text)]">Color</label>
                <div className="flex gap-2">
                  {['#111111', '#E84827', '#0066CC', '#009900', '#888888'].map((c) => (
                    <button key={c} onClick={() => updateEntry(entry.id, { color: c })} className={['w-6 h-6 rounded-full border-2 transition-all', entry.color === c ? 'border-[var(--color-accent)] scale-110' : 'border-transparent'].join(' ')} style={{ backgroundColor: c }} />
                  ))}
                  <label className="relative w-6 h-6 rounded-full border-2 border-[var(--color-border)] overflow-hidden cursor-pointer">
                    <span className="absolute inset-0" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
                    <input type="color" value={entry.color} onChange={(e) => updateEntry(entry.id, { color: e.target.value })} className="absolute opacity-0 w-full h-full cursor-pointer" />
                  </label>
                </div>
              </div>
            </div>
          ))}

          {entries.length < 5 && (
            <button onClick={() => setEntries((prev) => [...prev, newEntry(totalPages)])} className="w-full py-2.5 border border-dashed border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors flex items-center justify-center gap-2">
              <Plus size={16} />
              Añadir otro texto
            </button>
          )}

          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Insertar texto en el PDF
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">Insertando texto…</p>
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
            Descargar PDF con texto
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Editar otro PDF
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
