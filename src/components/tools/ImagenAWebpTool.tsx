import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useState } from 'react';

export default function ImagenAWebpTool() {
  const upload = useImageUpload();
  const { download } = useDownload(upload.image?.file.name);
  const [quality, setQuality] = useState(85);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = getContext(canvas);
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, 'image/webp', quality / 100);
      download(blob, 'webp', 'webp');
    } catch {
      setError('Error al convertir la imagen. El formato WebP puede no estar soportado en este navegador.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ImageUploader
          image={upload.image}
          error={upload.error}
          isDragging={upload.isDragging}
          onDrop={upload.onDrop}
          onDragOver={upload.onDragOver}
          onDragLeave={upload.onDragLeave}
          onFileChange={upload.onFileChange}
          onClear={upload.clearImage}
        />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Calidad WebP</h2>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-[var(--color-text-secondary)]">Calidad</span>
            <span className="text-sm font-mono text-[var(--color-accent)]">{quality}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>Menor tamaño</span>
            <span>Mayor calidad</span>
          </div>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Archivo original</p>
            <p className="text-sm font-medium text-[var(--color-text)] truncate">{upload.image.file.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {formatBytes(upload.image.file.size)} · {upload.image.width} × {upload.image.height} px
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleConvert}
          disabled={!upload.image || loading}
          loading={loading}
          label="Convertir y descargar WebP"
          className="w-full"
        />
      </div>
    </div>
  );
}
