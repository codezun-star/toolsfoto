import { useState, useEffect, useRef } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { canvasToBlob, loadImage, createCanvas, getContext } from '@/lib/utils/canvas';
import { RotateCcw } from 'lucide-react';

interface Adjustments {
  brightness: number; contrast: number; saturation: number;
  sharpness: number; temperature: number; shadows: number; highlights: number;
}

const DEFAULT: Adjustments = {
  brightness: 100, contrast: 100, saturation: 100,
  sharpness: 0, temperature: 0, shadows: 0, highlights: 0,
};

const PRESETS: { name: string; values: Adjustments }[] = [
  { name: 'Original', values: DEFAULT },
  { name: 'Vintage', values: { brightness: 95, contrast: 90, saturation: 75, sharpness: 0, temperature: 15, shadows: 10, highlights: -5 } },
  { name: 'B&N', values: { brightness: 100, contrast: 110, saturation: 0, sharpness: 5, temperature: 0, shadows: 0, highlights: 0 } },
  { name: 'Vivid', values: { brightness: 105, contrast: 115, saturation: 150, sharpness: 10, temperature: 0, shadows: -5, highlights: 5 } },
  { name: 'Fade', values: { brightness: 105, contrast: 80, saturation: 85, sharpness: 0, temperature: 5, shadows: 20, highlights: 10 } },
  { name: 'Cinematic', values: { brightness: 95, contrast: 120, saturation: 90, sharpness: 8, temperature: -10, shadows: -10, highlights: -5 } },
  { name: 'Cool', values: { brightness: 100, contrast: 100, saturation: 95, sharpness: 0, temperature: -20, shadows: 5, highlights: 0 } },
];

function buildFilter(a: Adjustments): string {
  const parts = [
    `brightness(${a.brightness}%)`,
    `contrast(${a.contrast}%)`,
    `saturate(${a.saturation}%)`,
  ];
  if (a.sharpness > 0) parts.push(`contrast(${1 + a.sharpness / 200})`);
  if (a.temperature > 0) parts.push(`sepia(${(a.temperature / 50) * 0.4})`);
  if (a.temperature < 0) parts.push(`hue-rotate(${a.temperature * 1.5}deg)`);
  return parts.join(' ');
}

export default function EditorTool() {
  const upload = useImageUpload();
  const [adj, setAdj] = useState<Adjustments>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { download } = useDownload(upload.image?.file.name);

  const filterStr = buildFilter(adj);

  function set(key: keyof Adjustments) {
    return (val: number) => setAdj(a => ({ ...a, [key]: val }));
  }

  async function handleApply() {
    if (!upload.image || !canvasRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = canvasRef.current;
      canvas.width = w;
      canvas.height = h;
      const ctx = getContext(canvas);

      ctx.filter = filterStr;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      if (adj.temperature !== 0) {
        const tempShift = (adj.temperature / 50) * 30;
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, Math.max(0, d[i] + tempShift));
          d[i + 2] = Math.min(255, Math.max(0, d[i + 2] - tempShift));
        }
        ctx.putImageData(imgData, 0, 0);
      }

      if (adj.shadows !== 0 || adj.highlights !== 0) {
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        const shadowAdj = (adj.shadows / 50) * 40;
        const highlightAdj = (adj.highlights / 50) * 40;
        for (let i = 0; i < d.length; i += 4) {
          const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          const shadowWeight = Math.max(0, 1 - lum * 3);
          const highlightWeight = Math.max(0, lum * 3 - 2);
          const shift = shadowAdj * shadowWeight + highlightAdj * highlightWeight;
          d[i] = Math.min(255, Math.max(0, d[i] + shift));
          d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + shift));
          d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + shift));
        }
        ctx.putImageData(imgData, 0, 0);
      }

      if (adj.sharpness > 0) {
        const blurCanvas = createCanvas(w, h);
        const blurCtx = getContext(blurCanvas);
        blurCtx.filter = `blur(${Math.max(1, Math.round(adj.sharpness / 5))}px)`;
        blurCtx.drawImage(canvas, 0, 0);
        const blurData = blurCtx.getImageData(0, 0, w, h);
        const sharpData = ctx.getImageData(0, 0, w, h);
        const factor = adj.sharpness / 100;
        for (let i = 0; i < sharpData.data.length; i += 4) {
          for (let c = 0; c < 3; c++) {
            sharpData.data[i + c] = Math.min(255, Math.max(0, sharpData.data[i + c] + factor * (sharpData.data[i + c] - blurData.data[i + c])));
          }
        }
        ctx.putImageData(sharpData, 0, 0);
      }

      const blob = await canvasToBlob(canvas, upload.image.file.type, 0.92);
      const ext = upload.image.file.name.split('.').pop() ?? 'jpg';
      download(blob, 'editada', ext);
    } catch {
      setError('Error al aplicar los ajustes.');
    } finally {
      setLoading(false);
    }
  }

  const controls: { key: keyof Adjustments; label: string; min: number; max: number; unit?: string }[] = [
    { key: 'brightness', label: 'Brillo', min: 0, max: 200, unit: '%' },
    { key: 'contrast', label: 'Contraste', min: 0, max: 200, unit: '%' },
    { key: 'saturation', label: 'Saturación', min: 0, max: 300, unit: '%' },
    { key: 'temperature', label: 'Temperatura', min: -50, max: 50 },
    { key: 'sharpness', label: 'Nitidez', min: 0, max: 20 },
    { key: 'shadows', label: 'Sombras', min: -50, max: 50 },
    { key: 'highlights', label: 'Luces altas', min: -50, max: 50 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {!upload.image ? (
          <ImageUploader
            image={upload.image} error={upload.error} isDragging={upload.isDragging}
            onDrop={upload.onDrop} onDragOver={upload.onDragOver} onDragLeave={upload.onDragLeave}
            onFileChange={upload.onFileChange} onClear={upload.clearImage}
          />
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="bg-[#F8F8F8] flex items-center justify-center min-h-48 p-4">
              <img
                src={upload.image.url}
                alt="Vista previa"
                className="max-w-full max-h-72 object-contain"
                style={{ filter: filterStr }}
              />
            </div>
            <div className="px-4 py-2 border-t border-[var(--color-border)] flex justify-end">
              <button onClick={upload.clearImage} className="text-xs text-[var(--color-accent)] hover:underline">Cambiar imagen</button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--color-text)]">Presets</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p.name} onClick={() => setAdj(p.values)}
                className={['px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  JSON.stringify(adj) === JSON.stringify(p.values)
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-text)]">Ajustes</h2>
            <button onClick={() => setAdj(DEFAULT)} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
              <RotateCcw size={12} />
              Resetear
            </button>
          </div>
          <div className="space-y-4">
            {controls.map(c => (
              <Slider key={c.key} label={c.label} value={adj[c.key]} min={c.min} max={c.max} unit={c.unit} onChange={set(c.key)} />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={handleApply} loading={loading} disabled={!upload.image} label="Aplicar y descargar" className="w-full" />
      </div>
    </div>
  );
}
