import { useState, useCallback } from 'react';
import DownloadButton from '@/components/ui/DownloadButton';
import { formatBytes } from '@/lib/utils/format';
import { X, ChevronUp, ChevronDown, Upload, Files } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

interface PdfEntry { id: number; file: File }

let nextId = 0;

export default function UnirPDFsTool() {
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((files: FileList) => {
    const entries: PdfEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].type === 'application/pdf') entries.push({ id: ++nextId, file: files[i] });
    }
    setPdfs(prev => [...prev, ...entries]);
    setError(null);
  }, []);

  function remove(id: number) { setPdfs(prev => prev.filter(p => p.id !== id)); }
  function moveUp(idx: number) {
    if (idx === 0) return;
    setPdfs(prev => { const n = [...prev]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; });
  }
  function moveDown(idx: number) {
    setPdfs(prev => { if (idx >= prev.length - 1) return prev; const n = [...prev]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n; });
  }

  async function handleMerge() {
    if (pdfs.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const entry of pdfs) {
        const bytes = await entry.file.arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const out = await merged.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = 'union.pdf'; a.click();
      revokeURL(url);
    } catch {
      setError('Error al unir los PDFs. Comprueba que no estén protegidos con contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <label
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)] cursor-pointer transition-colors"
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]"><Upload size={24} /></div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text)]">Añadir PDFs</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Arrastra o haz clic · Múltiples archivos</p>
          </div>
          <input type="file" accept="application/pdf" multiple className="hidden"
            onChange={(e) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ''; } }} />
        </label>

        {pdfs.length > 0 && (
          <div className="space-y-2">
            {pdfs.map((entry, idx) => (
              <div key={entry.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[var(--color-border)]">
                <Files size={16} className="text-[var(--color-tools-icon)] shrink-0" />
                <span className="flex-1 text-sm text-[var(--color-text)] truncate">{entry.file.name}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(entry.file.size)}</span>
                <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"><ChevronUp size={14} /></button>
                <button onClick={() => moveDown(idx)} disabled={idx === pdfs.length - 1} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"><ChevronDown size={14} /></button>
                <button onClick={() => remove(entry.id)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-2">Resumen</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {pdfs.length === 0 ? 'Añade al menos 2 PDFs para unirlos.' : `${pdfs.length} archivo${pdfs.length !== 1 ? 's' : ''} listos para unir.`}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Usa las flechas para reordenar. El primer archivo de la lista será la primera página del resultado.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleMerge}
          disabled={pdfs.length < 2 || loading}
          loading={loading}
          label="Unir y descargar PDF"
          className="w-full"
        />
      </div>
    </div>
  );
}
