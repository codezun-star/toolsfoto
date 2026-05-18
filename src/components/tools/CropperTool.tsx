import { useState, useRef, useCallback } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, getContext, canvasToBlob } from '@/lib/utils/canvas';

type Preset = { label: string; ratio: number | null };

const PRESETS: Preset[] = [
  { label: 'Libre', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '3:2', ratio: 3 / 2 },
];

interface CropArea { x: number; y: number; w: number; h: number }

export default function CropperTool() {
  const upload = useImageUpload();
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [crop, setCrop] = useState<CropArea | null>(null);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { download } = useDownload(upload.image?.file.name);

  function getRelativePos(e: React.MouseEvent): { x: number; y: number } {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }

  function handleMouseDown(e: React.MouseEvent) {
    const pos = getRelativePos(e);
    setStartPos(pos);
    setDragging(true);
    setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const pos = getRelativePos(e);
    let w = pos.x - startPos.x;
    let h = pos.y - startPos.y;
    if (preset.ratio !== null) {
      const imgEl = imgRef.current;
      if (imgEl) {
        const imgRatio = imgEl.naturalWidth / imgEl.naturalHeight;
        const displayRatio = imgEl.clientWidth / imgEl.clientHeight;
        h = (w / preset.ratio) * (imgRatio / displayRatio);
      }
    }
    setCrop({ x: startPos.x, y: startPos.y, w, h });
  }, [dragging, startPos, preset]);

  function handleMouseUp() {
    setDragging(false);
  }

  async function handleCrop() {
    if (!upload.image || !crop || !imgRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      const x = Math.min(crop.x, crop.x + crop.w);
      const y = Math.min(crop.y, crop.y + crop.h);
      const w = Math.abs(crop.w);
      const h = Math.abs(crop.h);

      if (w < 0.005 || h < 0.005) throw new Error('Selecciona un área más grande.');

      const sx = x * iw;
      const sy = y * ih;
      const sw = w * iw;
      const sh = h * ih;

      const canvas = createCanvas(Math.round(sw), Math.round(sh));
      const ctx = getContext(canvas);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, Math.round(sw), Math.round(sh));

      const blob = await canvasToBlob(canvas, upload.image.file.type);
      const ext = upload.image.file.name.split('.').pop() ?? 'png';
      download(blob, 'recortada', ext);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al recortar la imagen.');
    } finally {
      setLoading(false);
    }
  }

  const cropStyle = crop ? {
    left: `${Math.min(crop.x, crop.x + crop.w) * 100}%`,
    top: `${Math.min(crop.y, crop.y + crop.h) * 100}%`,
    width: `${Math.abs(crop.w) * 100}%`,
    height: `${Math.abs(crop.h) * 100}%`,
  } : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {!upload.image ? (
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
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[#F8F8F8]">
            <div
              ref={containerRef}
              className="relative cursor-crosshair select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imgRef}
                src={upload.image.url}
                alt="Para recortar"
                className="w-full max-h-80 object-contain pointer-events-none"
                draggable={false}
              />
              {cropStyle && (
                <div
                  className="absolute border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/10 pointer-events-none"
                  style={cropStyle}
                />
              )}
            </div>
            <div className="px-4 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] flex justify-between">
              <span>Arrastra para seleccionar el área a recortar</span>
              <button onClick={() => { upload.clearImage(); setCrop(null); }} className="text-[var(--color-accent)] hover:underline">Cambiar imagen</button>
            </div>
          </div>
        )}
        {upload.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{upload.error}</p>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-3">Proporción</h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { setPreset(p); setCrop(null); }}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  preset.label === p.label
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            {crop && Math.abs(crop.w) > 0.01
              ? `Área seleccionada: ${Math.round(Math.abs(crop.w) * 100)}% × ${Math.round(Math.abs(crop.h) * 100)}%`
              : 'Dibuja el área de recorte en la imagen.'}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleCrop}
          loading={loading}
          disabled={!upload.image || !crop || Math.abs(crop.w) < 0.01}
          label="Recortar y descargar"
          className="w-full"
        />
      </div>
    </div>
  );
}
