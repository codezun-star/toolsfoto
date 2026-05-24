import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

export default function SolarizarTool() {
  const upload = useImageUpload();
  const [threshold, setThreshold] = useState(128);
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

      const canvas = createCanvas(w, h);
      const ctx = getContext(canvas);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Solarize: invert pixels above threshold (Sabattier effect)
        if (data[i] > threshold) data[i] = 255 - data[i];
        if (data[i + 1] > threshold) data[i + 1] = 255 - data[i + 1];
        if (data[i + 2] > threshold) data[i + 2] = 255 - data[i + 2];
      }
      ctx.putImageData(imageData, 0, 0);

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      download(blob, 'solarizado', 'jpg');
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
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Ajuste de solarización</h2>
          <Slider label="Umbral de inversión" value={threshold} min={0} max={255} step={5} unit="" onChange={setThreshold} />
          <p className="text-xs text-[var(--color-text-muted)]">
            Los píxeles con valor superior al umbral se invierten (técnica Sabattier). Con umbral 128 obtienes el efecto clásico.
            Valores bajos afectan a casi toda la imagen; valores altos solo a las luces.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[64, 128, 192].map((t) => (
              <button
                key={t}
                onClick={() => setThreshold(t)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  threshold === t
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                }`}
              >
                {t === 64 ? 'Intenso' : t === 128 ? 'Clásico' : 'Suave'}
              </button>
            ))}
          </div>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Imagen original</p>
            <div className="flex items-center justify-center bg-[var(--color-bg)] rounded-lg p-4">
              <img src={upload.image.url} alt="Preview" className="max-h-48 max-w-full object-contain" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton onClick={handleApply} disabled={!upload.image || loading} loading={loading} className="w-full" />
      </div>
    </div>
  );
}
