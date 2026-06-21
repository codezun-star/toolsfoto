import { useState, useCallback } from 'react';
import DownloadButton from '@/components/ui/DownloadButton';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { X, FilePlus2, FileText, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';

interface Item { file: File; id: string }

export default function UnirPdfImagenesTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((files: FileList) => {
    const valid: Item[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type === 'application/pdf' || f.type === 'image/png' || f.type === 'image/jpeg') {
        valid.push({ file: f, id: `${f.name}-${Date.now()}-${i}` });
      }
    }
    setItems((prev) => [...prev, ...valid]);
  }, []);

  function remove(id: string) { setItems((prev) => prev.filter((it) => it.id !== id)); }
  function move(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[idx], next[t]] = [next[t], next[idx]];
      return next;
    });
  }

  async function merge() {
    if (items.length < 1) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const out = await PDFDocument.create();
      for (const it of items) {
        const bytes = await it.file.arrayBuffer();
        if (it.file.type === 'application/pdf') {
          const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const copied = await out.copyPages(src, src.getPageIndices());
          copied.forEach((p) => out.addPage(p));
        } else {
          const img = it.file.type === 'image/png' ? await out.embedPng(bytes) : await out.embedJpg(bytes);
          const page = out.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
      }
      const outBytes = await out.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([outBytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documento-unido.pdf';
      a.click();
      revokeURL(url);
    } catch {
      setError('Error al unir los archivos. Comprueba que los PDFs no estén protegidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <label className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white cursor-pointer hover:border-[var(--color-accent)] transition-colors">
        <FilePlus2 size={28} className="text-[var(--color-text-muted)]" />
        <span className="text-sm font-medium text-[var(--color-text)] mt-2">Añadir PDFs e imágenes</span>
        <span className="text-xs text-[var(--color-text-muted)] mt-0.5">PDF, JPG o PNG · se combinan en el orden de la lista</span>
        <input type="file" accept="application/pdf,image/png,image/jpeg" multiple className="hidden" onChange={(e) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ''; } }} />
      </label>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={it.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--color-border)]">
              {it.file.type === 'application/pdf' ? <FileText size={18} className="text-[var(--color-tools-icon)] shrink-0" /> : <ImageIcon size={18} className="text-[var(--color-tools-icon)] shrink-0" />}
              <span className="flex-1 text-sm text-[var(--color-text)] truncate">{it.file.name}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(it.file.size)}</span>
              <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] disabled:opacity-30"><ArrowUp size={15} /></button>
              <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] disabled:opacity-30"><ArrowDown size={15} /></button>
              <button onClick={() => remove(it.id)} className="text-[var(--color-text-muted)] hover:text-red-600"><X size={15} /></button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}

      <DownloadButton onClick={merge} disabled={items.length < 1 || loading} loading={loading} label="Unir todo en un PDF" className="w-full" />
    </div>
  );
}
