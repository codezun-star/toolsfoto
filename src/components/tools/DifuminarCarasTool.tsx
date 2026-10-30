import { useCallback, useEffect, useRef, useState } from 'react';
import { ScanFace, Download, Plus } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import ImageUploader from '@/components/ui/ImageUploader';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';
import { triggerDownload, getOutputFilename } from '@/lib/utils/download';
import { useT, withLang } from '@/i18n/react';

/** BlazeFace (rango corto) de MediaPipe, alojado en el propio sitio (230 KB). */
const MODEL_URL = '/models/blaze-face-short-range-v1.tflite';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm';

type Effect = 'pixelate' | 'blur' | 'solid';
type Shape = 'ellipse' | 'rect';
interface Box { x: number; y: number; w: number; h: number; on: boolean; manual?: boolean; score?: number }

function iou(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const min = Math.min(a.w * a.h, b.w * b.h);
  // Intersección sobre el menor: también descarta una caja dentro de otra.
  return min ? inter / min : 0;
}

/** Aplica el efecto a cada caja activa sobre `ctx` (que ya contiene la imagen). */
function applyEffects(ctx: CanvasRenderingContext2D, source: CanvasImageSource, boxes: Box[], scale: number, effect: Effect, strength: number, shape: Shape, pad: number) {
  for (const b of boxes) {
    if (!b.on) continue;
    const px = b.w * pad;
    const py = b.h * pad;
    const x = Math.max(0, (b.x - px) * scale);
    const y = Math.max(0, (b.y - py) * scale);
    const w = Math.min(ctx.canvas.width - x, (b.w + px * 2) * scale);
    const h = Math.min(ctx.canvas.height - y, (b.h + py * 2) * scale);
    if (w < 2 || h < 2) continue;

    ctx.save();
    ctx.beginPath();
    if (shape === 'ellipse') ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    else ctx.rect(x, y, w, h);
    ctx.clip();

    if (effect === 'solid') {
      ctx.fillStyle = '#111110';
      ctx.fillRect(x, y, w, h);
    } else if (effect === 'pixelate') {
      // Bloques: entre 4 y 16 por lado según la intensidad.
      const blocks = Math.max(3, Math.round(18 - strength * 0.14));
      const small = createCanvas(blocks, Math.max(2, Math.round(blocks * (h / w))));
      getContext(small).drawImage(source, x, y, w, h, 0, 0, small.width, small.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, small.width, small.height, x, y, w, h);
      ctx.imageSmoothingEnabled = true;
    } else {
      // Desenfoque con margen (pad = blur × 3) para no oscurecer los bordes.
      const radius = Math.max(4, (Math.max(w, h) * strength) / 400);
      const m = Math.ceil(radius * 3);
      const tmp = createCanvas(Math.ceil(w + m * 2), Math.ceil(h + m * 2));
      const tctx = getContext(tmp);
      tctx.filter = `blur(${radius}px)`;
      tctx.drawImage(source, x - m, y - m, w + m * 2, h + m * 2, 0, 0, tmp.width, tmp.height);
      ctx.drawImage(tmp, m, m, w, h, x, y, w, h);
    }
    ctx.restore();
  }
}

/**
 * Difumina automáticamente las caras de una foto. Detecta con BlazeFace
 * (MediaPipe) a varias escalas —la imagen entera y cuadrículas de 2×2 y 3×3—
 * porque el modelo de rango corto está pensado para caras grandes y así
 * también encuentra las pequeñas de una foto de grupo. Cada cara se puede
 * activar o desactivar con un toque, y se pueden añadir zonas a mano
 * (matrículas, carteles, una cara que no se haya detectado).
 */
function DifuminarCarasTool() {
  const t = useT();
  const { image, error: uploadError, isDragging, clearImage, onDrop, onDragOver, onDragLeave, onFileChange } = useImageUpload();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [effect, setEffect] = useState<Effect>('blur');
  const [shape, setShape] = useState<Shape>('ellipse');
  const [strength, setStrength] = useState(60);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [draft, setDraft] = useState<Box | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const PAD = 0.18;

  const detect = useCallback(async (el: HTMLImageElement) => {
    setDetecting(true);
    setError(null);
    try {
      const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.45,
      });
      const W = el.naturalWidth;
      const H = el.naturalHeight;
      const found: Box[] = [];
      const run = (sx: number, sy: number, sw: number, sh: number) => {
        const k = Math.min(1, 1024 / Math.max(sw, sh));
        const c = createCanvas(Math.round(sw * k), Math.round(sh * k));
        getContext(c).drawImage(el, sx, sy, sw, sh, 0, 0, c.width, c.height);
        for (const d of detector.detect(c).detections) {
          const bb = d.boundingBox;
          if (!bb) continue;
          found.push({ x: sx + bb.originX / k, y: sy + bb.originY / k, w: bb.width / k, h: bb.height / k, on: true, score: d.categories[0]?.score ?? 0 });
        }
      };
      run(0, 0, W, H);
      for (const n of [2, 3]) {
        const tw = W / n;
        const th = H / n;
        const ox = tw * 0.25;
        const oy = th * 0.25;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const sx = Math.max(0, i * tw - ox);
            const sy = Math.max(0, j * th - oy);
            run(sx, sy, Math.min(W - sx, tw + ox * 2), Math.min(H - sy, th + oy * 2));
          }
        }
      }
      detector.close();
      // Supresión de duplicados: se queda la de mayor confianza.
      found.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const kept: Box[] = [];
      for (const b of found) if (!kept.some((k) => iou(k, b) > 0.35)) kept.push(b);
      setBoxes(kept);
      if (!kept.length) setError(t('No se ha detectado ninguna cara. Puedes marcarlas a mano arrastrando sobre la foto.'));
    } catch (err) {
      console.error('[DifuminarCarasTool] Error:', err);
      setError(t('No se ha podido cargar el detector de caras. Comprueba tu conexión o marca las caras a mano arrastrando sobre la foto.'));
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    setBoxes([]);
    setImg(null);
    if (!image) return;
    loadImage(image.url).then((el) => { setImg(el); void detect(el); });
  }, [image, detect]);

  // Vista previa con los efectos aplicados.
  useEffect(() => {
    const c = previewRef.current;
    if (!c || !img) return;
    const k = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const ctx = getContext(c);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const base = createCanvas(c.width, c.height);
    getContext(base).drawImage(img, 0, 0, c.width, c.height);
    applyEffects(ctx, base, boxes, k, effect, strength, shape, PAD);
  }, [img, boxes, effect, strength, shape]);

  function toImage(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * (img?.naturalWidth ?? 1), y: ((e.clientY - r.top) / r.height) * (img?.naturalHeight ?? 1) };
  }

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    if ((e.target as Element).closest('[data-box]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toImage(e);
    start.current = { ...p, moved: false };
    setDraft({ x: p.x, y: p.y, w: 0, h: 0, on: true, manual: true });
  }
  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!start.current) return;
    const p = toImage(e);
    const s = start.current;
    s.moved = true;
    setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y), on: true, manual: true });
  }
  function onUp() {
    if (draft && draft.w > 8 && draft.h > 8) setBoxes((b) => [...b, draft]);
    setDraft(null);
    start.current = null;
  }

  async function handleDownload() {
    if (!img || !image) return;
    const out = createCanvas(img.naturalWidth, img.naturalHeight);
    const ctx = getContext(out);
    ctx.drawImage(img, 0, 0);
    const base = createCanvas(img.naturalWidth, img.naturalHeight);
    getContext(base).drawImage(img, 0, 0);
    applyEffects(ctx, base, boxes, 1, effect, strength, shape, PAD);
    const png = image.file.type === 'image/png';
    const blob = await canvasToBlob(out, png ? 'image/png' : 'image/jpeg', 0.92);
    triggerDownload(blob, getOutputFilename(image.file.name, t('anonimizada'), png ? 'png' : 'jpg'));
  }

  const active = boxes.filter((b) => b.on).length;
  const seg = (on: boolean) => `flex-1 px-3 py-2 rounded-lg border text-sm ${on ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] font-semibold' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`;

  if (!image) {
    return (
      <div className="max-w-2xl">
        <ImageUploader image={null} error={uploadError} isDragging={isDragging} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onFileChange={onFileChange} onClear={clearImage} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#F8F8F8]">
          <canvas ref={previewRef} className="block w-full h-auto" />
          {img && (
            <svg
              viewBox={`0 0 ${img.naturalWidth} ${img.naturalHeight}`}
              className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              {boxes.map((b, i) => (
                <rect
                  key={i}
                  data-box
                  x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(b.w, b.h) * 0.08}
                  fill="transparent"
                  stroke={b.on ? '#E84827' : '#FFFFFF'}
                  strokeWidth={2.5}
                  strokeDasharray={b.on ? undefined : '6 4'}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer"
                  onClick={() => setBoxes((list) => list.map((x, n) => (n === i ? { ...x, on: !x.on } : x)))}
                />
              ))}
              {draft && <rect x={draft.x} y={draft.y} width={draft.w} height={draft.h} fill="rgba(232,72,39,0.15)" stroke="#E84827" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />}
            </svg>
          )}
          {detecting && (
            <p className="absolute inset-x-0 top-3 mx-auto w-fit text-xs font-medium bg-black/70 text-white px-3 py-1.5 rounded-full">{t('Buscando caras…')}</p>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
          <Plus size={13} /> {t('Toca un recuadro para activarlo o desactivarlo. Arrastra sobre la foto para añadir una zona a mano.')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <p className="text-sm text-[var(--color-text)] flex items-center gap-2">
            <ScanFace size={16} className="text-[var(--color-tools-icon)]" />
            {detecting ? t('Detectando…') : t('{a} de {n} zonas ocultas', { a: active, n: boxes.length })}
          </p>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">{t('Efecto')}</p>
            <div className="flex gap-2">
              <button className={seg(effect === 'blur')} onClick={() => setEffect('blur')}>{t('Difuminar')}</button>
              <button className={seg(effect === 'pixelate')} onClick={() => setEffect('pixelate')}>{t('Pixelar')}</button>
              <button className={seg(effect === 'solid')} onClick={() => setEffect('solid')}>{t('Tapar')}</button>
            </div>
          </div>
          {effect !== 'solid' && (
            <label className="block text-sm text-[var(--color-text-secondary)]">
              {t('Intensidad')}
              <input type="range" min={20} max={100} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="w-full accent-[var(--color-accent)] mt-1" />
            </label>
          )}
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">{t('Forma')}</p>
            <div className="flex gap-2">
              <button className={seg(shape === 'ellipse')} onClick={() => setShape('ellipse')}>{t('Óvalo')}</button>
              <button className={seg(shape === 'rect')} onClick={() => setShape('rect')}>{t('Rectángulo')}</button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={!img || detecting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 transition-colors"
        >
          <Download size={16} />
          {t('Descargar imagen')}
        </button>
        {error && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>}
        <button onClick={clearImage} className="w-full text-sm text-[var(--color-accent)] hover:underline">{t('Usar otra imagen')}</button>
      </div>
    </div>
  );
}

export default withLang(DifuminarCarasTool);
