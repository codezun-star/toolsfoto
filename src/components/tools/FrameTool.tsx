import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

const PRESET_COLORS = ['#FFFFFF', '#000000', '#E84827', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function FrameTool() {
  const upload = useImageUpload();
  const [size, setSize] = useState(20);
  const [color, setColor] = useState('#FFFFFF');
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
      const canvas = createCanvas(w + size * 2, h + size * 2);
      const ctx = getContext(canvas);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, size, size, w, h);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      download(blob, 'con-marco', 'jpg');
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
          <h2 className="font-bold text-[var(--color-text)]">Configuración del marco</h2>
          <Slider
            label="Grosor"
            value={size}
            min={2}
            max={150}
            step={2}
            unit="px"
            onChange={setSize}
          />
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Color del marco</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c,
                    borderColor: color === c ? 'var(--color-accent)' : 'var(--color-border)',
                  }}
                  aria-label={c}
                />
              ))}
              <label className="w-7 h-7 rounded-full border-2 border-[var(--color-border)] overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="opacity-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Vista previa</p>
            <div className="flex items-center justify-center bg-[var(--color-bg)] rounded-lg p-4">
              <img
                src={upload.image.url}
                alt="Preview"
                className="max-h-40 max-w-full object-contain"
                style={{ outline: `${Math.min(size, 40)}px solid ${color}` }}
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
