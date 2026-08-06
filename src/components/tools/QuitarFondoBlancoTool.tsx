import { useState, useEffect, useRef, useCallback } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';

const PRESET_COLORS = ['#FFFFFF', '#F5F3EF', '#000000', '#00FF00', '#0000FF', '#FF00FF'];
const PREVIEW_MAX = 420;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * Vuelve transparentes los píxeles cercanos al color objetivo.
 * La distancia se mide por canal (máxima diferencia RGB) para que el umbral
 * sea predecible: 10 % de tolerancia = 25 niveles de diferencia por canal.
 */
function removeColor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  target: { r: number; g: number; b: number },
  tolerance: number,
  feather: number,
): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const tol = (tolerance / 100) * 255;
  const band = (feather / 100) * 255;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const dist = Math.max(
      Math.abs(data[i] - target.r),
      Math.abs(data[i + 1] - target.g),
      Math.abs(data[i + 2] - target.b),
    );
    if (dist <= tol) {
      data[i + 3] = 0;
    } else if (band > 0 && dist < tol + band) {
      data[i + 3] = Math.round(data[i + 3] * ((dist - tol) / band));
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

export default function QuitarFondoBlancoTool() {
  const upload = useImageUpload();
  const [color, setColor] = useState('#FFFFFF');
  const [tolerance, setTolerance] = useState(12);
  const [feather, setFeather] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const { download } = useDownload(upload.image?.file.name);

  const imageUrl = upload.image?.url ?? null;

  const renderPreview = useCallback(async () => {
    const canvas = previewRef.current;
    if (!canvas || !imageUrl) return;
    try {
      const img = await loadImage(imageUrl);
      const scale = Math.min(1, PREVIEW_MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.width = w;
      canvas.height = h;
      const ctx = getContext(canvas);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      removeColor(ctx, w, h, hexToRgb(color), tolerance, feather);
    } catch {
      setError('No se pudo generar la vista previa.');
    }
  }, [imageUrl, color, tolerance, feather]);

  useEffect(() => {
    if (!imageUrl) return;
    const id = window.setTimeout(renderPreview, 120);
    return () => window.clearTimeout(id);
  }, [imageUrl, renderPreview]);

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
      removeColor(ctx, w, h, hexToRgb(color), tolerance, feather);

      const blob = await canvasToBlob(canvas, 'image/png');
      download(blob, 'sin-fondo', 'png');
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

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">
              Resultado — las casillas grises son las zonas transparentes
            </p>
            <div
              className="flex items-center justify-center rounded-lg p-4"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #DDD 25%, transparent 25%), linear-gradient(-45deg, #DDD 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #DDD 75%), linear-gradient(-45deg, transparent 75%, #DDD 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            >
              <canvas ref={previewRef} className="max-h-72 max-w-full object-contain" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Color de fondo a eliminar</h2>
          <div className="flex gap-2 flex-wrap items-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                className={`w-7 h-7 rounded-full border-2 transition-colors ${
                  color.toUpperCase() === c ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label
              className="w-7 h-7 rounded-full border-2 border-dashed border-[var(--color-border)] cursor-pointer flex items-center justify-center overflow-hidden"
              title="Color personalizado"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                className="opacity-0 w-full h-full cursor-pointer"
              />
            </label>
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">{color}</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            El blanco puro (#FFFFFF) es lo habitual en fotos de producto y logos. Si tu fondo es un blanco roto o un croma verde, elige el color exacto.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Ajustes de recorte</h2>
          <Slider label="Tolerancia" value={tolerance} min={0} max={60} step={1} unit="%" onChange={setTolerance} />
          <Slider label="Suavizado de bordes" value={feather} min={0} max={40} step={1} unit="%" onChange={setFeather} />
          <p className="text-xs text-[var(--color-text-muted)]">
            Sube la tolerancia si quedan restos de fondo; bájala si desaparecen partes claras del sujeto. El suavizado difumina el borde para evitar el efecto recortado con tijeras.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton onClick={handleApply} disabled={!upload.image || loading} loading={loading} className="w-full" />
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          El archivo se descarga en PNG para conservar la transparencia.
        </p>
      </div>
    </div>
  );
}
