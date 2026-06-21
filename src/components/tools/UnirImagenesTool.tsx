import { useState, useCallback } from 'react';
import DownloadButton from '@/components/ui/DownloadButton';
import { useDownload } from '@/hooks/useDownload';
import { canvasToBlob, createCanvas, getContext, loadImage } from '@/lib/utils/canvas';
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from '@/lib/constants/tools';
import { X, ImagePlus } from 'lucide-react';

interface Img { url: string; file: File }
type Dir = 'horizontal' | 'vertical';

export default function UnirImagenesTool() {
  const [images, setImages] = useState<Img[]>([]);
  const [dir, setDir] = useState<Dir>('horizontal');
  const [gap, setGap] = useState(0);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { download } = useDownload('imagen-unida');

  const addImages = useCallback((files: FileList) => {
    setUploadError(null);
    const valid: Img[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ACCEPTED_TYPES.includes(file.type)) { setUploadError('Algún archivo no es una imagen compatible.'); continue; }
      if (file.size > MAX_FILE_SIZE) continue;
      valid.push({ url: URL.createObjectURL(file), file });
    }
    setImages((prev) => [...prev, ...valid]);
  }, []);

  function removeImage(idx: number) {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].url);
      next.splice(idx, 1);
      return next;
    });
  }

  async function handleDownload() {
    if (images.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const imgs = await Promise.all(images.map((i) => loadImage(i.url)));
      let width: number, height: number;
      if (dir === 'horizontal') {
        height = Math.max(...imgs.map((i) => i.naturalHeight));
        width = imgs.reduce((s, i) => s + Math.round(i.naturalWidth * (height / i.naturalHeight)), 0) + gap * (imgs.length - 1);
      } else {
        width = Math.max(...imgs.map((i) => i.naturalWidth));
        height = imgs.reduce((s, i) => s + Math.round(i.naturalHeight * (width / i.naturalWidth)), 0) + gap * (imgs.length - 1);
      }
      const canvas = createCanvas(width, height);
      const ctx = getContext(canvas);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      let pos = 0;
      for (const img of imgs) {
        if (dir === 'horizontal') {
          const w = Math.round(img.naturalWidth * (height / img.naturalHeight));
          ctx.drawImage(img, pos, 0, w, height);
          pos += w + gap;
        } else {
          const h = Math.round(img.naturalHeight * (width / img.naturalWidth));
          ctx.drawImage(img, 0, pos, width, h);
          pos += h + gap;
        }
      }
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      download(blob, 'unida', 'jpg');
    } catch {
      setError('Error al unir las imágenes. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
        <h2 className="font-bold text-[var(--color-text)] mb-3">Imágenes ({images.length})</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((img, i) => (
            <div key={img.url} className="relative rounded-lg overflow-hidden bg-[var(--color-bg)] aspect-square">
              <img src={img.url} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
              <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"><X size={12} /></button>
            </div>
          ))}
          <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] cursor-pointer hover:border-[var(--color-accent)] transition-colors">
            <ImagePlus size={18} className="text-[var(--color-text-muted)]" />
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1">Añadir</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) { addImages(e.target.files); e.target.value = ''; } }} />
          </label>
        </div>
        {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
      </div>

      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['horizontal', 'vertical'] as const).map((d) => (
            <button key={d} onClick={() => setDir(d)} className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', dir === d ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>
              {d === 'horizontal' ? 'En fila (horizontal)' : 'En columna (vertical)'}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm"><label className="font-medium text-[var(--color-text)]">Separación</label><span className="text-[var(--color-text-secondary)]">{gap}px</span></div>
          <input type="range" min={0} max={60} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--color-text)]">Color de separación / fondo</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-14 rounded border border-[var(--color-border)] cursor-pointer" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

      <DownloadButton onClick={handleDownload} disabled={images.length < 2 || loading} loading={loading} label="Unir y descargar JPG" className="w-full" />
    </div>
  );
}
