import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

const PRESETS = [
  { label: 'Azul/Naranja', shadow: '#1a3a5c', highlight: '#f5a623' },
  { label: 'Púrpura/Amarillo', shadow: '#3d0066', highlight: '#ffdd00' },
  { label: 'Verde/Rosa', shadow: '#004d3d', highlight: '#ff6b9d' },
  { label: 'Rojo/Cian', shadow: '#7a0000', highlight: '#00e5ff' },
  { label: 'Marrón/Crema', shadow: '#2d1a0a', highlight: '#f5e6c8' },
];

export default function EfectoDuotonoTool() {
  const upload = useImageUpload();
  const [shadowColor, setShadowColor] = useState('#1a3a5c');
  const [highlightColor, setHighlightColor] = useState('#f5a623');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  function applyPreset(preset: { shadow: string; highlight: string }) {
    setShadowColor(preset.shadow);
    setHighlightColor(preset.highlight);
  }

  async function handleApply() {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const srcCanvas = createCanvas(w, h);
      const srcCtx = getContext(srcCanvas);
      srcCtx.drawImage(img, 0, 0);
      const imageData = srcCtx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const shadow = hexToRgb(shadowColor);
      const highlight = hexToRgb(highlightColor);

      for (let i = 0; i < data.length; i += 4) {
        const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        data[i] = Math.round(shadow.r + (highlight.r - shadow.r) * lum);
        data[i + 1] = Math.round(shadow.g + (highlight.g - shadow.g) * lum);
        data[i + 2] = Math.round(shadow.b + (highlight.b - shadow.b) * lum);
      }

      const resultCanvas = createCanvas(w, h);
      const resultCtx = getContext(resultCanvas);
      resultCtx.putImageData(imageData, 0, 0);
      const blob = await canvasToBlob(resultCanvas, 'image/jpeg', 0.92);
      download(blob, 'duotono', 'jpg');
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
          <h2 className="font-bold text-[var(--color-text)]">Colores del duotono</h2>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:border-[var(--color-accent)] transition-colors"
              >
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.shadow }} />
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.highlight }} />
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-2">Sombras</label>
              <div className="flex items-center gap-2">
                <label className="relative w-10 h-10 rounded-lg border-2 border-[var(--color-border)] cursor-pointer overflow-hidden">
                  <input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                  <div className="w-full h-full" style={{ backgroundColor: shadowColor }} />
                </label>
                <span className="font-mono text-sm text-[var(--color-text-secondary)]">{shadowColor.toUpperCase()}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-2">Luces</label>
              <div className="flex items-center gap-2">
                <label className="relative w-10 h-10 rounded-lg border-2 border-[var(--color-border)] cursor-pointer overflow-hidden">
                  <input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                  <div className="w-full h-full" style={{ backgroundColor: highlightColor }} />
                </label>
                <span className="font-mono text-sm text-[var(--color-text-secondary)]">{highlightColor.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div
            className="h-10 rounded-lg"
            style={{ background: `linear-gradient(to right, ${shadowColor}, ${highlightColor})` }}
          />
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Imagen original</p>
            <div className="flex items-center justify-center bg-[var(--color-bg)] rounded-lg p-4">
              <img src={upload.image.url} alt="Original" className="max-h-40 max-w-full object-contain" />
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
