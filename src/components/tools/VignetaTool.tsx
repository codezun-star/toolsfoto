import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

const COLORS = ['#000000', '#1a0a0a', '#0a0a1a', '#1a1008', '#ffffff'];

export default function VignetaTool() {
  const upload = useImageUpload();
  const [intensity, setIntensity] = useState(60);
  const [softness, setSoftness] = useState(50);
  const [color, setColor] = useState('#000000');
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

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.sqrt(cx * cx + cy * cy) * (1 - softness / 200);
      const outerRadius = Math.sqrt(cx * cx + cy * cy) * 1.5;

      const gradient = ctx.createRadialGradient(cx, cy, radius, cx, cy, outerRadius);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      const alpha = intensity / 100;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      gradient.addColorStop(1, `rgba(${r},${g},${b},${alpha})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.93);
      download(blob, 'vigneta', 'jpg');
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
          <h2 className="font-bold text-[var(--color-text)]">Ajustes de viñeta</h2>
          <Slider label="Intensidad" value={intensity} min={10} max={100} step={5} unit="%" onChange={setIntensity} />
          <Slider label="Suavidad" value={softness} min={10} max={90} step={5} unit="%" onChange={setSoftness} />

          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Color de viñeta</p>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c ? 'border-[var(--color-accent)] scale-110' : 'border-gray-300'
                  }`}
                />
              ))}
              <label className="cursor-pointer">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="sr-only" />
                <div
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                    !COLORS.includes(color) ? 'border-[var(--color-accent)]' : 'border-gray-300'
                  }`}
                >
                  +
                </div>
              </label>
            </div>
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
