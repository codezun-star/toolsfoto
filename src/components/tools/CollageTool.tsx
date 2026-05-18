import { useState, useCallback, useEffect, useRef } from 'react';
import DownloadButton from '@/components/ui/DownloadButton';
import Slider from '@/components/ui/Slider';
import { useDownload } from '@/hooks/useDownload';
import { canvasToBlob, createCanvas, getContext, loadImage } from '@/lib/utils/canvas';
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from '@/lib/constants/tools';
import { X, ImagePlus, LayoutGrid } from 'lucide-react';

type Layout = '1x2' | '1x3' | '2x2' | '1+2' | '2+1';

interface CollageImage {
  url: string;
  file: File;
}

const LAYOUTS: { id: Layout; label: string }[] = [
  { id: '1x2', label: '1×2' },
  { id: '1x3', label: '1×3' },
  { id: '2x2', label: '2×2' },
  { id: '1+2', label: '1+2' },
  { id: '2+1', label: '2+1' },
];

const BG_COLORS = ['#FFFFFF', '#000000', '#F5F3EF', '#111110', '#E84827', '#3B82F6'];

function maxImagesForLayout(layout: Layout): number {
  if (layout === '1x2') return 2;
  if (layout === '1x3') return 3;
  if (layout === '2x2') return 4;
  return 3; // 1+2, 2+1
}

async function buildCollageCanvas(
  images: CollageImage[],
  layout: Layout,
  gap: number,
  bgColor: string,
  size: number,
): Promise<HTMLCanvasElement> {
  const half = Math.floor((size - gap * 3) / 2);

  function drawCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number, y: number, w: number, h: number,
  ) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const offsetX = (sw - w) / 2;
    const offsetY = (sh - h) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, x - offsetX, y - offsetY, sw, sh);
    ctx.restore();
  }

  const imgs = await Promise.all(images.map((i) => loadImage(i.url)));
  const canvas = createCanvas(size, size);
  const ctx = getContext(canvas);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  if (layout === '1x2') {
    const w = Math.floor((size - gap * 3) / 2);
    drawCover(ctx, imgs[0], gap, gap, w, size - gap * 2);
    if (imgs[1]) drawCover(ctx, imgs[1], gap * 2 + w, gap, w, size - gap * 2);
  } else if (layout === '1x3') {
    const w = Math.floor((size - gap * 4) / 3);
    imgs.slice(0, 3).forEach((img, i) => {
      drawCover(ctx, img, gap + i * (w + gap), gap, w, size - gap * 2);
    });
  } else if (layout === '2x2') {
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const idx = r * 2 + c;
        if (imgs[idx]) drawCover(ctx, imgs[idx], gap + c * (half + gap), gap + r * (half + gap), half, half);
      }
    }
  } else if (layout === '1+2') {
    const bigH = Math.floor((size - gap * 3) * 2 / 3);
    if (imgs[0]) drawCover(ctx, imgs[0], gap, gap, size - gap * 2, bigH);
    const smallH = size - gap * 3 - bigH;
    const w2 = Math.floor((size - gap * 3) / 2);
    if (imgs[1]) drawCover(ctx, imgs[1], gap, gap * 2 + bigH, w2, smallH);
    if (imgs[2]) drawCover(ctx, imgs[2], gap * 2 + w2, gap * 2 + bigH, w2, smallH);
  } else if (layout === '2+1') {
    const smallH = Math.floor((size - gap * 3) * 2 / 3);
    const w2 = Math.floor((size - gap * 3) / 2);
    if (imgs[0]) drawCover(ctx, imgs[0], gap, gap, w2, smallH);
    if (imgs[1]) drawCover(ctx, imgs[1], gap * 2 + w2, gap, w2, smallH);
    const bigH = size - gap * 3 - smallH;
    if (imgs[2]) drawCover(ctx, imgs[2], gap, gap * 2 + smallH, size - gap * 2, bigH);
  }

  return canvas;
}

export default function CollageTool() {
  const [images, setImages] = useState<CollageImage[]>([]);
  const [layout, setLayout] = useState<Layout>('2x2');
  const [gap, setGap] = useState(8);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const { download } = useDownload('collage');

  // Live preview: regenera cada vez que cambian imágenes, layout, gap o color
  useEffect(() => {
    if (images.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setPreviewing(true);
      buildCollageCanvas(images, layout, gap, bgColor, 400)
        .then((canvas) => {
          if (cancelled || !previewRef.current) return;
          previewRef.current.width = 400;
          previewRef.current.height = 400;
          const ctx = previewRef.current.getContext('2d');
          ctx?.drawImage(canvas, 0, 0);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setPreviewing(false); });
    }, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [images, layout, gap, bgColor]);

  const addImages = useCallback((files: FileList) => {
    setUploadError(null);
    const max = maxImagesForLayout(layout);
    const remaining = max - images.length;
    if (remaining <= 0) {
      setUploadError(`El diseño ${layout} admite máximo ${max} imágenes.`);
      return;
    }
    const valid: CollageImage[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      valid.push({ url: URL.createObjectURL(file), file });
    }
    setImages((prev) => [...prev, ...valid]);
  }, [images, layout]);

  function removeImage(idx: number) {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].url);
      next.splice(idx, 1);
      return next;
    });
  }

  async function handleDownload() {
    if (images.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const canvas = await buildCollageCanvas(images, layout, gap, bgColor, 800);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      download(blob, 'collage', 'jpg');
    } catch {
      setError('Error al crear el collage. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const maxCount = maxImagesForLayout(layout);
  const hasPreview = images.length >= 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Columna izquierda: gestión de imágenes + controles */}
      <div className="space-y-4">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--color-text)]">Imágenes ({images.length}/{maxCount})</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div key={img.url} className="relative rounded-lg overflow-hidden bg-[var(--color-bg)] aspect-square">
                <img src={img.url} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {images.length < maxCount && (
              <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] cursor-pointer hover:border-[var(--color-accent)] transition-colors">
                <ImagePlus size={20} className="text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-muted)] mt-1">Añadir</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) { addImages(e.target.files); e.target.value = ''; } }}
                />
              </label>
            )}
          </div>
          {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
        </div>

        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Diseño</h2>
          <div className="grid grid-cols-5 gap-2">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                className={[
                  'py-2 rounded-lg text-xs font-medium border transition-colors',
                  layout === l.id
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]',
                ].join(' ')}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Slider label="Espaciado" value={gap} min={0} max={30} step={2} unit="px" onChange={setGap} />
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Color de fondo</p>
            <div className="flex gap-2">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: bgColor === c ? 'var(--color-accent)' : 'var(--color-border)' }}
                  aria-label={c}
                />
              ))}
              <label className="w-7 h-7 rounded-full border-2 border-[var(--color-border)] overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha: preview en tiempo real */}
      <div className="space-y-4">
        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--color-text)]">Vista previa</h2>
            {previewing && <span className="text-xs text-[var(--color-text-muted)]">Generando…</span>}
          </div>
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[var(--color-bg)]">
            {hasPreview ? (
              <>
                <canvas
                  ref={previewRef}
                  className="w-full h-full object-contain"
                />
                {previewing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
                <LayoutGrid size={36} className="opacity-30" />
                <p className="text-sm">Añade al menos 2 imágenes</p>
              </div>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            La previsualización se actualiza automáticamente. El archivo final se exporta a 800×800 px.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <DownloadButton
          onClick={handleDownload}
          disabled={images.length < 2 || loading}
          loading={loading}
          label="Descargar collage JPG"
          className="w-full"
        />
      </div>
    </div>
  );
}
