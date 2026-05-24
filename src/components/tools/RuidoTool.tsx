import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

export default function RuidoTool() {
  const upload = useImageUpload();
  const [amount, setAmount] = useState(30);
  const [monochrome, setMonochrome] = useState(true);
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
      const intensity = amount * 2.55;

      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity;
        if (monochrome) {
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        } else {
          data[i] = Math.min(255, Math.max(0, data[i] + (Math.random() - 0.5) * intensity));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (Math.random() - 0.5) * intensity));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (Math.random() - 0.5) * intensity));
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      download(blob, 'ruido', 'jpg');
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
          <h2 className="font-bold text-[var(--color-text)]">Ajustes de ruido</h2>
          <Slider label="Intensidad" value={amount} min={0} max={100} step={5} unit="%" onChange={setAmount} />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="mono"
              checked={monochrome}
              onChange={(e) => setMonochrome(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            <label htmlFor="mono" className="text-sm font-medium text-[var(--color-text)]">
              Ruido monocromático (grano cinematográfico)
            </label>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            El ruido monocromático aplica el mismo valor a los 3 canales. El ruido de color aplica valores independientes.
          </p>
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
