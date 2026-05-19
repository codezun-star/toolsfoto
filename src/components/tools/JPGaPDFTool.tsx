import { useState, useCallback } from 'react';
import DownloadButton from '@/components/ui/DownloadButton';
import { formatBytes } from '@/lib/utils/format';
import { X, ChevronUp, ChevronDown, ImagePlus } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

type PageSize = 'a4' | 'letter' | 'auto';

interface ImgEntry { id: number; file: File; url: string }

let nextId = 0;

const PAGE_DIMS: Record<Exclude<PageSize, 'auto'>, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

export default function JPGaPDFTool() {
  const [images, setImages] = useState<ImgEntry[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((files: FileList) => {
    const entries: ImgEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) continue;
      entries.push({ id: ++nextId, file: f, url: URL.createObjectURL(f) });
    }
    setImages(prev => [...prev, ...entries]);
  }, []);

  function remove(id: number) {
    setImages(prev => { const e = prev.find(i => i.id === id); if (e) revokeURL(e.url); return prev.filter(i => i.id !== id); });
  }
  function moveUp(idx: number) { if (idx === 0) return; setImages(p => { const n = [...p]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; }); }
  function moveDown(idx: number) { setImages(p => { if (idx >= p.length - 1) return p; const n = [...p]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n; }); }

  async function handleCreate() {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();

      for (const entry of images) {
        const bytes = await entry.file.arrayBuffer();
        let img;
        if (entry.file.type === 'image/jpeg') {
          img = await pdf.embedJpg(bytes);
        } else {
          // For PNG/WebP, draw to canvas first to get PNG bytes
          const bitmap = await createImageBitmap(new Blob([bytes]));
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width; canvas.height = bitmap.height;
          canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
          const pngBytes = await new Promise<ArrayBuffer>((res, rej) => {
            canvas.toBlob(b => b ? b.arrayBuffer().then(res) : rej(), 'image/png');
          });
          img = await pdf.embedPng(pngBytes);
        }

        const [pw, ph] = pageSize === 'auto'
          ? [img.width, img.height]
          : PAGE_DIMS[pageSize];

        const scale = Math.min(pw / img.width, ph / img.height);
        const iw = img.width * scale;
        const ih = img.height * scale;
        const page = pdf.addPage([pw, ph]);
        page.drawImage(img, { x: (pw - iw) / 2, y: (ph - ih) / 2, width: iw, height: ih });
      }

      const out = await pdf.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = 'imagenes.pdf'; a.click();
      revokeURL(url);
    } catch {
      setError('Error al crear el PDF. Intenta con otro formato de imagen.');
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
          <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]"><ImagePlus size={24} /></div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text)]">Añadir imágenes</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">JPG, PNG, WebP · Múltiples archivos</p>
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
            onChange={(e) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ''; } }} />
        </label>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <div key={img.id} className="relative rounded-lg overflow-hidden bg-[var(--color-bg)] aspect-square border border-[var(--color-border)]">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 p-1 bg-black/40">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-0.5 text-white disabled:opacity-30"><ChevronUp size={12} /></button>
                  <button onClick={() => moveDown(idx)} disabled={idx === images.length - 1} className="p-0.5 text-white disabled:opacity-30"><ChevronDown size={12} /></button>
                </div>
                <button onClick={() => remove(img.id)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Tamaño de página</h2>
          <div className="grid grid-cols-3 gap-2">
            {(['a4', 'letter', 'auto'] as PageSize[]).map(s => (
              <button key={s} onClick={() => setPageSize(s)}
                className={['py-2.5 rounded-lg text-xs font-medium border transition-colors', pageSize === s ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}>
                {s === 'a4' ? 'A4' : s === 'letter' ? 'Carta' : 'Automático'}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {pageSize === 'auto' ? 'Cada página tendrá el tamaño de su imagen.' : `Todas las páginas serán tamaño ${pageSize.toUpperCase()}. La imagen se centra manteniendo la proporción.`}
          </p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton
          onClick={handleCreate}
          disabled={images.length === 0 || loading}
          loading={loading}
          label={`Crear PDF (${images.length} página${images.length !== 1 ? 's' : ''})`}
          className="w-full"
        />
      </div>
    </div>
  );
}
