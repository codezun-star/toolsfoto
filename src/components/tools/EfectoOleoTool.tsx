import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

function applyOilPainting(src: ImageData, radius: number, levels: number): ImageData {
  const w = src.width;
  const h = src.height;
  const out = new ImageData(w, h);
  const sd = src.data;
  const od = out.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const bucketR = new Float32Array(levels);
      const bucketG = new Float32Array(levels);
      const bucketB = new Float32Array(levels);
      const count = new Int32Array(levels);

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const idx = (ny * w + nx) * 4;
          const r = sd[idx];
          const g = sd[idx + 1];
          const b = sd[idx + 2];
          const intensity = Math.floor(((r + g + b) / 3 / 255) * (levels - 1));
          count[intensity]++;
          bucketR[intensity] += r;
          bucketG[intensity] += g;
          bucketB[intensity] += b;
        }
      }

      let maxCount = 0;
      let maxIdx = 0;
      for (let i = 0; i < levels; i++) {
        if (count[i] > maxCount) {
          maxCount = count[i];
          maxIdx = i;
        }
      }

      const oi = (y * w + x) * 4;
      od[oi] = bucketR[maxIdx] / maxCount;
      od[oi + 1] = bucketG[maxIdx] / maxCount;
      od[oi + 2] = bucketB[maxIdx] / maxCount;
      od[oi + 3] = sd[oi + 3];
    }
  }
  return out;
}

export default function EfectoOleoTool() {
  const upload = useImageUpload();
  const [radius, setRadius] = useState(3);
  const [levels, setLevels] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  async function handleApply() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      // Limit size to keep processing fast
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = createCanvas(w, h);
      const ctx = getContext(canvas);
      ctx.drawImage(img, 0, 0, w, h);
      const srcData = ctx.getImageData(0, 0, w, h);
      const outData = applyOilPainting(srcData, radius, levels);
      ctx.putImageData(outData, 0, 0);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      download(blob, 'oleo', 'jpg');
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
          <h2 className="font-bold text-[var(--color-text)]">Ajustes del efecto</h2>
          <Slider label="Radio del pincel" value={radius} min={1} max={6} step={1} unit="px" onChange={setRadius} />
          <Slider label="Niveles de intensidad" value={levels} min={4} max={16} step={1} unit="" onChange={setLevels} />
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Imágenes grandes se escalan a 1200px para agilizar el procesamiento. El tiempo puede ser de varios segundos.
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
