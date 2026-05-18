import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

type Shape = 'circle' | 'ellipse';

export default function CircularCropTool() {
  const upload = useImageUpload();
  const [shape, setShape] = useState<Shape>('circle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  async function handleApply() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const size = shape === 'circle' ? Math.min(w, h) : Math.max(w, h);
      const canvasW = shape === 'circle' ? size : w;
      const canvasH = shape === 'circle' ? size : h;
      const canvas = createCanvas(canvasW, canvasH);
      const ctx = getContext(canvas);
      const cx = canvasW / 2;
      const cy = canvasH / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, canvasW / 2, canvasH / 2, 0, 0, Math.PI * 2);
      ctx.clip();
      const offsetX = shape === 'circle' ? (size - w) / 2 : 0;
      const offsetY = shape === 'circle' ? (size - h) / 2 : 0;
      ctx.drawImage(img, offsetX, offsetY, w, h);
      const blob = await canvasToBlob(canvas, 'image/png');
      download(blob, shape === 'circle' ? 'circular' : 'elipse', 'png');
    } catch {
      setError('Error al procesar la imagen. Inténtalo de nuevo.');
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
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-4">Forma del recorte</h2>
          <div className="flex gap-3">
            {(['circle', 'ellipse'] as Shape[]).map((s) => (
              <button
                key={s}
                onClick={() => setShape(s)}
                className={[
                  'flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors',
                  shape === s
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]',
                ].join(' ')}
              >
                {s === 'circle' ? 'Círculo' : 'Elipse'}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            {shape === 'circle'
              ? 'El recorte usará el lado más corto de la imagen. Se exporta como PNG transparente.'
              : 'La elipse se ajusta a las proporciones originales de la imagen.'}
          </p>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Vista previa</p>
            <div
              className="flex items-center justify-center rounded-lg p-4"
              style={{ background: 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 16px 16px' }}
            >
              <img
                src={upload.image.url}
                alt="Preview"
                className="max-h-48 object-cover"
                style={{
                  borderRadius: '50%',
                  aspectRatio: shape === 'circle' ? '1/1' : undefined,
                  width: shape === 'circle' ? '12rem' : 'auto',
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleApply}
          disabled={!upload.image || loading}
          loading={loading}
          label="Descargar PNG"
          className="w-full"
        />
      </div>
    </div>
  );
}
