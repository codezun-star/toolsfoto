import { useState, useRef, useCallback, useEffect } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDownload } from '@/hooks/useDownload';
import { loadImage, createCanvas, canvasToBlob } from '@/lib/utils/canvas';

interface Region { x: number; y: number; w: number; h: number }

// Pixela una región rectangular del canvas usando un único getImageData
function pixelateRegion(
  ctx: CanvasRenderingContext2D,
  rx: number, ry: number, rw: number, rh: number,
  block: number,
) {
  if (rw < 1 || rh < 1) return;
  const data = ctx.getImageData(rx, ry, rw, rh);
  const d = data.data;
  for (let by = 0; by < rh; by += block) {
    for (let bx = 0; bx < rw; bx += block) {
      const cx = Math.min(bx + Math.floor(block / 2), rw - 1);
      const cy = Math.min(by + Math.floor(block / 2), rh - 1);
      const src = (cy * rw + cx) * 4;
      const r = d[src], g = d[src + 1], b = d[src + 2];
      for (let py = by; py < Math.min(by + block, rh); py++) {
        for (let px = bx; px < Math.min(bx + block, rw); px++) {
          const dst = (py * rw + px) * 4;
          d[dst] = r; d[dst + 1] = g; d[dst + 2] = b;
        }
      }
    }
  }
  ctx.putImageData(data, rx, ry);
}

function renderPreview(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  regions: Region[],
  intensity: number,
) {
  const maxSize = 640;
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const pw = Math.round(img.naturalWidth * scale);
  const ph = Math.round(img.naturalHeight * scale);
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, pw, ph);
  for (const r of regions) {
    const rx = Math.round(r.x * pw);
    const ry = Math.round(r.y * ph);
    const rw = Math.round(r.w * pw);
    const rh = Math.round(r.h * ph);
    pixelateRegion(ctx, rx, ry, rw, rh, Math.max(1, Math.round(intensity * scale)));
  }
}

export default function PixelateTool() {
  const upload = useImageUpload();
  const [intensity, setIntensity] = useState(15);
  const [regions, setRegions] = useState<Region[]>([]);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [current, setCurrent] = useState<Region | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const { download } = useDownload(upload.image?.file.name);

  // Carga la imagen y renderiza el preview inicial
  useEffect(() => {
    if (!upload.image) { loadedImgRef.current = null; return; }
    loadImage(upload.image.url).then((img) => {
      loadedImgRef.current = img;
      if (previewRef.current) renderPreview(previewRef.current, img, [], intensity);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upload.image?.url]);

  // Actualiza el preview cuando cambian zonas o intensidad
  useEffect(() => {
    const img = loadedImgRef.current;
    if (!img || !previewRef.current) return;
    const timer = setTimeout(() => {
      if (previewRef.current) renderPreview(previewRef.current, img, regions, intensity);
    }, 80);
    return () => clearTimeout(timer);
  }, [regions, intensity]);

  function getRelPos(e: React.MouseEvent): { x: number; y: number } {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }

  function handleMouseDown(e: React.MouseEvent) {
    const pos = getRelPos(e);
    setStart(pos);
    setDragging(true);
    setCurrent({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const pos = getRelPos(e);
    setCurrent({ x: start.x, y: start.y, w: pos.x - start.x, h: pos.y - start.y });
  }, [dragging, start]);

  function handleMouseUp() {
    if (current && Math.abs(current.w) > 0.01 && Math.abs(current.h) > 0.01) {
      const norm: Region = {
        x: Math.min(current.x, current.x + current.w),
        y: Math.min(current.y, current.y + current.h),
        w: Math.abs(current.w),
        h: Math.abs(current.h),
      };
      setRegions((r) => [...r, norm]);
    }
    setDragging(false);
    setCurrent(null);
  }

  function clearRegions() { setRegions([]); }

  async function handleApply() {
    if (!upload.image || regions.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const img = await loadImage(upload.image.url);
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Error de canvas');
      ctx.drawImage(img, 0, 0);
      for (const r of regions) {
        const rx = Math.round(r.x * img.naturalWidth);
        const ry = Math.round(r.y * img.naturalHeight);
        const rw = Math.round(r.w * img.naturalWidth);
        const rh = Math.round(r.h * img.naturalHeight);
        pixelateRegion(ctx, rx, ry, rw, rh, intensity);
      }
      const blob = await canvasToBlob(canvas, upload.image.file.type, 0.92);
      const ext = upload.image.file.name.split('.').pop() ?? 'jpg';
      download(blob, 'pixelada', ext);
    } catch {
      setError('Error al pixelar la imagen.');
    } finally {
      setLoading(false);
    }
  }

  const currentStyle = current ? {
    left: `${Math.min(current.x, current.x + current.w) * 100}%`,
    top: `${Math.min(current.y, current.y + current.h) * 100}%`,
    width: `${Math.abs(current.w) * 100}%`,
    height: `${Math.abs(current.h) * 100}%`,
  } : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Columna izquierda: selección interactiva */}
      <div className="space-y-4">
        {!upload.image ? (
          <ImageUploader
            image={upload.image} error={upload.error} isDragging={upload.isDragging}
            onDrop={upload.onDrop} onDragOver={upload.onDragOver} onDragLeave={upload.onDragLeave}
            onFileChange={upload.onFileChange} onClear={upload.clearImage}
          />
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-white">
            <div className="px-4 pt-3 pb-2">
              <p className="text-sm font-bold text-[var(--color-text)]">Seleccionar zonas</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Arrastra para marcar las áreas a pixelar</p>
            </div>
            <div
              className="relative cursor-crosshair select-none bg-[#F8F8F8]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imgRef}
                src={upload.image.url}
                alt="Para pixelar"
                className="w-full max-h-72 object-contain pointer-events-none"
                draggable={false}
              />
              {regions.map((r, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/20 pointer-events-none"
                  style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
                />
              ))}
              {currentStyle && (
                <div className="absolute border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent)]/10 pointer-events-none" style={currentStyle} />
              )}
            </div>
            <div className="px-4 py-2 border-t border-[var(--color-border)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>{regions.length} zona{regions.length !== 1 ? 's' : ''}</span>
              <div className="flex gap-3">
                {regions.length > 0 && (
                  <button onClick={clearRegions} className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                    Limpiar zonas
                  </button>
                )}
                <button onClick={() => { upload.clearImage(); setRegions([]); }} className="text-[var(--color-accent)] hover:underline">
                  Cambiar imagen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Columna derecha: preview en tiempo real + controles */}
      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Configuración</h2>
          <Slider label="Intensidad del pixelado" value={intensity} min={4} max={40} onChange={setIntensity} />
          <p className="text-xs text-[var(--color-text-muted)]">
            Valores bajos (4–8) dan un pixelado sutil. Valores altos (30–40) censuran la zona completamente.
          </p>
        </div>

        {upload.image && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-sm font-bold text-[var(--color-text)] mb-3">Vista previa del resultado</p>
            <canvas
              ref={previewRef}
              className="w-full rounded-lg bg-[var(--color-bg)]"
            />
            {regions.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">
                Dibuja una zona en la imagen de la izquierda para ver el efecto.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleApply}
          loading={loading}
          disabled={!upload.image || regions.length === 0}
          label="Pixelar y descargar"
          className="w-full"
        />
      </div>
    </div>
  );
}
