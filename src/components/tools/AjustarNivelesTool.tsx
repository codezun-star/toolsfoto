import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

export default function AjustarNivelesTool() {
  const upload = useImageUpload();
  const [inBlack, setInBlack] = useState(0);
  const [inWhite, setInWhite] = useState(255);
  const [gamma, setGamma] = useState(100);
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
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const g = gamma / 100; // gamma < 100 → brighten midtones, > 100 → darken
      const range = Math.max(1, inWhite - inBlack);

      for (let i = 0; i < d.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          let v = (d[i + c] - inBlack) / range;
          v = Math.min(1, Math.max(0, v));
          v = Math.pow(v, g);
          d[i + c] = Math.round(v * 255);
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      download(blob, 'niveles', 'jpg');
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
          <h2 className="font-bold text-[var(--color-text)]">Niveles de entrada</h2>
          <Slider label="Punto negro (sombras)" value={inBlack} min={0} max={200} step={1} unit="" onChange={setInBlack} />
          <Slider label="Punto blanco (luces)" value={inWhite} min={50} max={255} step={1} unit="" onChange={setInWhite} />
          <Slider label="Gamma (medios tonos)" value={gamma} min={10} max={300} step={5} unit="%" onChange={setGamma} />
          <p className="text-xs text-[var(--color-text-muted)]">
            Gamma &lt; 100% aclara medios tonos · Gamma &gt; 100% los oscurece
          </p>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Vista previa (aproximada)</p>
            <div className="flex items-center justify-center bg-[var(--color-bg)] rounded-lg p-4">
              <img
                src={upload.image.url}
                alt="Preview"
                className="max-h-48 max-w-full object-contain"
                style={{
                  filter: `brightness(${gamma / 100}) contrast(${255 / Math.max(1, inWhite - inBlack)})`,
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
          className="w-full"
        />
      </div>
    </div>
  );
}
