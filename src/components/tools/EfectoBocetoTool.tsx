import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

export default function EfectoBocetoTool() {
  const upload = useImageUpload();
  const [intensity, setIntensity] = useState(6);
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

      // Canvas gris original
      const grayCanvas = createCanvas(w, h);
      const grayCtx = getContext(grayCanvas);
      grayCtx.filter = 'grayscale(1)';
      grayCtx.drawImage(img, 0, 0);

      // Canvas invertido + desenfocado (el "papel")
      const blurCanvas = createCanvas(w, h);
      const blurCtx = getContext(blurCanvas);
      blurCtx.filter = `grayscale(1) invert(1) blur(${intensity}px)`;
      blurCtx.drawImage(img, 0, 0);

      // Color dodge blend manual
      const grayData = grayCtx.getImageData(0, 0, w, h);
      const blurData = blurCtx.getImageData(0, 0, w, h);
      const resultCanvas = createCanvas(w, h);
      const resultCtx = getContext(resultCanvas);
      const resultData = resultCtx.createImageData(w, h);

      for (let i = 0; i < grayData.data.length; i += 4) {
        const g = grayData.data[i];
        const b = blurData.data[i];
        const dodge = b >= 255 ? 255 : Math.min(255, Math.floor((g * 255) / (255 - b)));
        resultData.data[i] = dodge;
        resultData.data[i + 1] = dodge;
        resultData.data[i + 2] = dodge;
        resultData.data[i + 3] = 255;
      }

      resultCtx.putImageData(resultData, 0, 0);
      const blob = await canvasToBlob(resultCanvas, 'image/jpeg', 0.92);
      download(blob, 'boceto', 'jpg');
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
          <h2 className="font-bold text-[var(--color-text)]">Ajustes</h2>
          <Slider
            label="Suavidad del trazo"
            value={intensity}
            min={1}
            max={20}
            step={1}
            onChange={setIntensity}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Valores bajos generan trazos más definidos. Valores altos producen un boceto más suave.
          </p>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Imagen original</p>
            <div className="flex items-center justify-center bg-[var(--color-bg)] rounded-lg p-4">
              <img
                src={upload.image.url}
                alt="Original"
                className="max-h-48 max-w-full object-contain"
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
