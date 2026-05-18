import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

const SHADOW_COLORS = ['#000000', '#333333', '#666666', '#0F172A', '#1E3A5F', '#7C3AED'];

export default function ShadowTool() {
  const upload = useImageUpload();
  const [blur, setBlur] = useState(15);
  const [offsetX, setOffsetX] = useState(8);
  const [offsetY, setOffsetY] = useState(8);
  const [color, setColor] = useState('#000000');
  const [opacity, setOpacity] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  function shadowColor(): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity / 100})`;
  }

  async function handleApply() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const pad = blur * 3 + Math.max(Math.abs(offsetX), Math.abs(offsetY));
      const canvas = createCanvas(w + pad * 2, h + pad * 2);
      const ctx = getContext(canvas);
      ctx.shadowColor = shadowColor();
      ctx.shadowBlur = blur;
      ctx.shadowOffsetX = offsetX;
      ctx.shadowOffsetY = offsetY;
      ctx.drawImage(img, pad, pad, w, h);
      const blob = await canvasToBlob(canvas, 'image/png');
      download(blob, 'sombra', 'png');
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
        <p className="text-xs text-[var(--color-text-muted)] px-1">
          Para mejores resultados usa imágenes PNG con fondo transparente. La sombra se exporta como PNG.
        </p>
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Configuración de sombra</h2>
          <Slider label="Desenfoque" value={blur} min={0} max={50} step={1} unit="px" onChange={setBlur} />
          <Slider label="Desplazamiento horizontal" value={offsetX} min={-40} max={40} step={1} unit="px" onChange={setOffsetX} />
          <Slider label="Desplazamiento vertical" value={offsetY} min={-40} max={40} step={1} unit="px" onChange={setOffsetY} />
          <Slider label="Opacidad" value={opacity} min={10} max={100} step={5} unit="%" onChange={setOpacity} />
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Color de sombra</p>
            <div className="flex flex-wrap gap-2">
              {SHADOW_COLORS.map((c) => (
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
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
              </label>
            </div>
          </div>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Vista previa</p>
            <div
              className="flex items-center justify-center rounded-lg p-8"
              style={{ background: 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 16px 16px' }}
            >
              <img
                src={upload.image.url}
                alt="Preview"
                className="max-h-36 max-w-full object-contain"
                style={{
                  filter: `drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${shadowColor()})`,
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
          label="Descargar PNG"
          className="w-full"
        />
      </div>
    </div>
  );
}
