import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

export default function BlurTool() {
  const upload = useImageUpload();
  const [intensity, setIntensity] = useState(5);
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
      // expand canvas to avoid edge darkening from blur
      const pad = intensity * 3;
      const canvas = createCanvas(w + pad * 2, h + pad * 2);
      const ctx = getContext(canvas);
      ctx.filter = `blur(${intensity}px)`;
      ctx.drawImage(img, pad, pad, w, h);
      // crop back to original size
      const final = createCanvas(w, h);
      const fctx = getContext(final);
      fctx.drawImage(canvas, pad, pad, w, h, 0, 0, w, h);
      const blob = await canvasToBlob(final, 'image/jpeg', 0.92);
      download(blob, 'desenfocada', 'jpg');
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
          <h2 className="font-bold text-[var(--color-text)] mb-4">Configuración</h2>
          <Slider
            label="Intensidad del desenfoque"
            value={intensity}
            min={1}
            max={40}
            step={1}
            unit="px"
            onChange={setIntensity}
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Valores altos (20–40px) generan un desenfoque fuerte tipo fondo de foto.
          </p>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Vista previa</p>
            <div className="flex items-center justify-center bg-[var(--color-bg)] rounded-lg p-4 overflow-hidden">
              <img
                src={upload.image.url}
                alt="Preview"
                className="max-h-48 max-w-full object-contain"
                style={{ filter: `blur(${intensity * 0.3}px)` }}
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
          className="w-full"
        />
      </div>
    </div>
  );
}
