import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

export default function NitidezTool() {
  const upload = useImageUpload();
  const [amount, setAmount] = useState(50);
  const [radius, setRadius] = useState(1);
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

      // Draw original
      const origCanvas = createCanvas(w, h);
      const origCtx = getContext(origCanvas);
      origCtx.drawImage(img, 0, 0);
      const origData = origCtx.getImageData(0, 0, w, h);

      // Draw blurred version with padding to avoid edge darkening
      const pad = radius * 3;
      const blurCanvas = createCanvas(w + 2 * pad, h + 2 * pad);
      const blurCtx = getContext(blurCanvas);
      blurCtx.filter = `blur(${radius}px)`;
      blurCtx.drawImage(img, pad, pad);
      const blurData = blurCtx.getImageData(pad, pad, w, h);

      // Unsharp mask: out = orig + amount * (orig - blurred)
      const factor = amount / 100;
      const out = origCtx.createImageData(w, h);
      const o = origData.data;
      const b = blurData.data;
      const d = out.data;
      for (let i = 0; i < o.length; i += 4) {
        d[i] = Math.min(255, Math.max(0, o[i] + factor * (o[i] - b[i])));
        d[i + 1] = Math.min(255, Math.max(0, o[i + 1] + factor * (o[i + 1] - b[i + 1])));
        d[i + 2] = Math.min(255, Math.max(0, o[i + 2] + factor * (o[i + 2] - b[i + 2])));
        d[i + 3] = o[i + 3];
      }
      origCtx.putImageData(out, 0, 0);

      const blob = await canvasToBlob(origCanvas, 'image/jpeg', 0.92);
      download(blob, 'nitida', 'jpg');
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
          <h2 className="font-bold text-[var(--color-text)]">Ajustes de nitidez</h2>
          <Slider label="Intensidad" value={amount} min={0} max={200} step={5} unit="%" onChange={setAmount} />
          <Slider label="Radio del desenfoque base" value={radius} min={1} max={5} step={1} unit="px" onChange={setRadius} />
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Vista previa (aproximada)</p>
            <div className="flex items-center justify-center bg-[var(--color-bg)] rounded-lg p-4">
              <img
                src={upload.image.url}
                alt="Preview"
                className="max-h-48 max-w-full object-contain"
                style={{ filter: `contrast(${1 + amount / 200})` }}
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
