import { useState, useEffect, useRef } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { canvasToBlob } from '@/lib/utils/canvas';
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
  return [
    `brightness(${a.brightness}%)`,
    `contrast(${a.contrast}%)`,
    `saturate(${a.saturation}%)`,
  ].join(' ');
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
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('No se pudo cargar la imagen'));
        img.src = upload.image!.url;
      });

      const canvas = canvasRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Error de canvas');

      ctx.filter = filterStr;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

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
