import { useState, useCallback } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';
import { Copy, Check } from 'lucide-react';

function hexFromRgb(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function extractPalette(img: HTMLImageElement, count: number): string[] {
  const size = 100;
  const canvas = createCanvas(size, size);
  const ctx = getContext(canvas);
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    // quantize to reduce similar colors
    pixels.push([data[i] >> 4, data[i + 1] >> 4, data[i + 2] >> 4]);
  }
  const freq: Record<string, { r: number; g: number; b: number; n: number }> = {};
  for (const [r, g, b] of pixels) {
    const key = `${r},${g},${b}`;
    if (!freq[key]) freq[key] = { r: r << 4, g: g << 4, b: b << 4, n: 0 };
    freq[key].n++;
  }
  return Object.values(freq)
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map(({ r, g, b }) => hexFromRgb(r, g, b));
}

export default function PaletteTool() {
  const upload = useImageUpload();
  const [count, setCount] = useState(6);
  const [palette, setPalette] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  const handleExtract = useCallback(async () => {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      setPalette(extractPalette(img, count));
    } catch {
      setError('Error al analizar la imagen. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [upload.image, count]);

  async function handleDownload() {
    if (!palette.length) return;
    const swatchW = 120;
    const swatchH = 100;
    const labelH = 24;
    const pad = 8;
    const canvas = createCanvas(palette.length * (swatchW + pad) + pad, swatchH + labelH + pad * 2);
    const ctx = getContext(canvas);
    ctx.fillStyle = '#F5F3EF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    palette.forEach((hex, i) => {
      const x = pad + i * (swatchW + pad);
      ctx.fillStyle = hex;
      ctx.beginPath();
      ctx.roundRect(x, pad, swatchW, swatchH, 6);
      ctx.fill();
      ctx.fillStyle = '#111110';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hex, x + swatchW / 2, pad + swatchH + labelH - 4);
    });
    const blob = await canvasToBlob(canvas, 'image/png');
    download(blob, 'paleta', 'png');
  }

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex);
      setTimeout(() => setCopied(null), 1500);
    });
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
          onClear={() => { upload.clearImage(); setPalette([]); }}
        />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-4">Configuración</h2>
          <Slider label="Número de colores" value={count} min={3} max={12} step={1} onChange={setCount} />
        </div>

        {palette.length > 0 && (
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
            <h2 className="font-bold text-[var(--color-text)] mb-3">Paleta extraída</h2>
            <div className="grid grid-cols-3 gap-2">
              {palette.map((hex) => (
                <button
                  key={hex}
                  onClick={() => copyHex(hex)}
                  className="group relative rounded-lg overflow-hidden border border-[var(--color-border)] hover:scale-105 transition-transform"
                >
                  <div className="h-14" style={{ background: hex }} />
                  <div className="py-1.5 bg-white flex items-center justify-center gap-1">
                    <span className="text-xs font-mono text-[var(--color-text-secondary)]">{hex}</span>
                    {copied === hex ? (
                      <Check size={12} className="text-green-500 shrink-0" />
                    ) : (
                      <Copy size={12} className="text-[var(--color-text-muted)] shrink-0 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">Haz clic en un color para copiar el HEX.</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleExtract}
            disabled={!upload.image || loading}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Extraer paleta
          </button>
          <DownloadButton
            onClick={handleDownload}
            disabled={!palette.length}
            loading={loading}
            label="Descargar PNG"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
