import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

type Shape = 'rectangular' | 'elliptical';

export default function DesvanecerBordesTool() {
  const upload = useImageUpload();
  const [fadeSize, setFadeSize] = useState(15);
  const [shape, setShape] = useState<Shape>('elliptical');
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
      const fade = Math.round((Math.min(w, h) * fadeSize) / 100);

      const canvas = createCanvas(w, h);
      const ctx = getContext(canvas);
      ctx.drawImage(img, 0, 0);

      // Build alpha mask using a temporary canvas
      const maskCanvas = createCanvas(w, h);
      const mCtx = getContext(maskCanvas);

      if (shape === 'elliptical') {
        const rx = w / 2;
        const ry = h / 2;
        const innerRx = rx - fade;
        const innerRy = ry - fade;
        const grad = mCtx.createRadialGradient(rx, ry, Math.max(0, Math.min(innerRx, innerRy)), rx, ry, Math.min(rx, ry));
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        mCtx.fillStyle = grad;
        mCtx.fillRect(0, 0, w, h);
      } else {
        mCtx.fillStyle = 'black';
        mCtx.fillRect(0, 0, w, h);
        // Fade left edge
        const gL = mCtx.createLinearGradient(0, 0, fade, 0);
        gL.addColorStop(0, 'rgba(0,0,0,0)');
        gL.addColorStop(1, 'rgba(0,0,0,1)');
        mCtx.globalCompositeOperation = 'destination-in';
        mCtx.fillStyle = gL;
        mCtx.fillRect(0, 0, fade, h);
        // Fade right edge
        const gR = mCtx.createLinearGradient(w - fade, 0, w, 0);
        gR.addColorStop(0, 'rgba(0,0,0,1)');
        gR.addColorStop(1, 'rgba(0,0,0,0)');
        mCtx.fillStyle = gR;
        mCtx.fillRect(w - fade, 0, fade, h);
        // Fade top edge
        const gT = mCtx.createLinearGradient(0, 0, 0, fade);
        gT.addColorStop(0, 'rgba(0,0,0,0)');
        gT.addColorStop(1, 'rgba(0,0,0,1)');
        mCtx.fillStyle = gT;
        mCtx.fillRect(0, 0, w, fade);
        // Fade bottom edge
        const gB = mCtx.createLinearGradient(0, h - fade, 0, h);
        gB.addColorStop(0, 'rgba(0,0,0,1)');
        gB.addColorStop(1, 'rgba(0,0,0,0)');
        mCtx.fillStyle = gB;
        mCtx.fillRect(0, h - fade, w, fade);
      }

      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);

      const blob = await canvasToBlob(canvas, 'image/png');
      download(blob, 'desvanecer', 'png');
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
          <Slider label="Tamaño del fade" value={fadeSize} min={5} max={45} step={1} unit="%" onChange={setFadeSize} />
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Forma del desvanecimiento</p>
            <div className="flex gap-3">
              {(['elliptical', 'rectangular'] as Shape[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setShape(s)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    shape === s
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {s === 'elliptical' ? 'Elipse' : 'Rectangular'}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">El resultado se exporta como PNG con transparencia.</p>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Imagen original</p>
            <div className="flex items-center justify-center bg-[var(--color-bg)] rounded-lg p-4 bg-[repeating-conic-gradient(#ccc_0%_25%,#fff_0%_50%)] bg-[length:20px_20px]">
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
