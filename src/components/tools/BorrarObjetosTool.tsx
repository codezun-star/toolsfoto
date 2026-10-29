import { useCallback, useEffect, useRef, useState } from 'react';
import type { InferenceSession } from 'onnxruntime-web';
import { Eraser, Undo2, Download, Wand2, RotateCcw } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import ImageUploader from '@/components/ui/ImageUploader';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';
import { triggerDownload, getOutputFilename } from '@/lib/utils/download';
import { loadOrt, fetchModel, createSession } from '@/lib/utils/onnx';

/**
 * LaMa (Large Mask Inpainting, Apache-2.0) en la versión ONNX de OpenCV Zoo:
 * entrada `image` [1,3,512,512] RGB 0-1 y `mask` [1,1,512,512] 0/1; salida
 * `output` [1,3,512,512] RGB 0-255. 92 MB, servido desde Hugging Face (el
 * límite de 25 MB por archivo de Cloudflare Pages impide alojarlo aquí).
 */
const MODEL_URL = 'https://huggingface.co/opencv/inpainting_lama/resolve/main/inpainting_lama_2025jan.onnx';
const SIZE = 512;
const MAX_SIDE = 2400;

type Stroke = { r: number; points: Array<[number, number]> };

/**
 * Borra objetos, personas o textos de una foto: se pinta encima con un pincel
 * y LaMa rellena la zona con lo que debería haber detrás. Se recorta un
 * cuadrado alrededor de lo pintado (con contexto), se reduce a 512 px, se
 * pinta y se vuelve a pegar solo la zona marcada, con el borde suavizado,
 * sobre la foto original: el resto de la imagen conserva su resolución.
 */
export default function BorrarObjetosTool() {
  const { image, error: uploadError, isDragging, clearImage, onDrop, onDragOver, onDragLeave, onFileChange } = useImageUpload();
  const viewRef = useRef<HTMLCanvasElement>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const history = useRef<ImageData[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brush, setBrush] = useState(30);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const drawing = useRef<Stroke | null>(null);
  // La sesión se crea una vez y se reutiliza en cada borrado.
  const sessionRef = useRef<InferenceSession | null>(null);

  useEffect(() => () => { void sessionRef.current?.release(); }, []);

  // Lienzo de trabajo con la foto (limitada a 2400 px de lado).
  useEffect(() => {
    if (!image) { workRef.current = null; setSize(null); return; }
    let cancel = false;
    loadImage(image.url).then((img) => {
      if (cancel) return;
      const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * k);
      const h = Math.round(img.naturalHeight * k);
      const work = createCanvas(w, h);
      getContext(work).drawImage(img, 0, 0, w, h);
      workRef.current = work;
      history.current = [];
      setStrokes([]);
      setEdits(0);
      setSize({ w, h });
    });
    return () => { cancel = true; };
  }, [image]);

  const paint = useCallback(() => {
    const view = viewRef.current;
    const work = workRef.current;
    if (!view || !work) return;
    view.width = work.width;
    view.height = work.height;
    const ctx = getContext(view);
    ctx.drawImage(work, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#E84827';
    ctx.fillStyle = '#E84827';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of [...strokes, ...(drawing.current ? [drawing.current] : [])]) {
      ctx.lineWidth = s.r * 2;
      ctx.beginPath();
      s.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.points.length === 1) {
        ctx.arc(s.points[0][0], s.points[0][1], s.r, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.stroke();
    }
    ctx.restore();
  }, [strokes]);

  useEffect(() => { paint(); }, [paint, size, edits]);

  function toCanvas(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * e.currentTarget.width, ((e.clientY - r.top) / r.height) * e.currentTarget.height];
  }

  function brushInPixels(el: HTMLCanvasElement) {
    // El tamaño del pincel se expresa en píxeles de pantalla.
    return (brush / 2) * (el.width / el.getBoundingClientRect().width);
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (loading) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = { r: brushInPixels(e.currentTarget), points: [toCanvas(e)] };
    paint();
  }
  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current.points.push(toCanvas(e));
    paint();
  }
  function onUp() {
    const s = drawing.current;
    drawing.current = null;
    if (s) setStrokes((prev) => [...prev, s]);
  }

  async function handleErase() {
    const work = workRef.current;
    if (!work || !strokes.length) return;
    setLoading(true);
    setError(null);
    try {
      const { width: W, height: H } = work;

      // Máscara a tamaño completo. `extra` engorda los trazos: unos píxeles para
      // cubrir el borde del objeto, y algo más en la que se usa para pegar, para
      // que el difuminado del borde no deje asomar restos.
      const drawMask = (extra: number) => {
        const c = createCanvas(W, H);
        const ctx = getContext(c);
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const st of strokes) {
          const r = st.r + extra;
          ctx.lineWidth = r * 2;
          ctx.beginPath();
          st.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          if (st.points.length === 1) { ctx.arc(st.points[0][0], st.points[0][1], r, 0, Math.PI * 2); ctx.fill(); } else ctx.stroke();
        }
        return c;
      };
      const grow = Math.max(3, Math.round(Math.max(W, H) / 400));
      const maskFull = drawMask(grow);
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (const st of strokes) {
        for (const [x, y] of st.points) {
          x0 = Math.min(x0, x - st.r); y0 = Math.min(y0, y - st.r);
          x1 = Math.max(x1, x + st.r); y1 = Math.max(y1, y + st.r);
        }
      }

      // Recorte cuadrado con contexto alrededor: el doble de lo pintado, mínimo 256 px.
      const side = Math.min(Math.max(W, H), Math.max(256, (Math.max(x1 - x0, y1 - y0)) * 2.2));
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      const sx = Math.round(Math.max(0, Math.min(W - Math.min(side, W), cx - side / 2)));
      const sy = Math.round(Math.max(0, Math.min(H - Math.min(side, H), cy - side / 2)));
      const sw = Math.round(Math.min(side, W));
      const sh = Math.round(Math.min(side, H));

      const crop = createCanvas(SIZE, SIZE);
      const cctx = getContext(crop);
      cctx.imageSmoothingQuality = 'high';
      cctx.drawImage(work, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
      const cmask = createCanvas(SIZE, SIZE);
      const cmctx = getContext(cmask);
      cmctx.drawImage(maskFull, sx, sy, sw, sh, 0, 0, SIZE, SIZE);

      const img = cctx.getImageData(0, 0, SIZE, SIZE).data;
      const msk = cmctx.getImageData(0, 0, SIZE, SIZE).data;
      const plane = SIZE * SIZE;
      const imageT = new Float32Array(3 * plane);
      const maskT = new Float32Array(plane);
      for (let i = 0; i < plane; i++) {
        imageT[i] = img[i * 4] / 255;
        imageT[plane + i] = img[i * 4 + 1] / 255;
        imageT[2 * plane + i] = img[i * 4 + 2] / 255;
        maskT[i] = msk[i * 4] > 20 ? 1 : 0;
      }

      const ort = await loadOrt();
      if (!sessionRef.current) {
        setStatus('Descargando el modelo de IA…');
        const model = await fetchModel(MODEL_URL, (p) => setStatus(`Descargando el modelo de IA… ${Math.round(p * 100)}%`));
        setStatus('Preparando la IA…');
        sessionRef.current = await createSession(model);
      }
      const session = sessionRef.current;
      setStatus('Borrando…');
      const out = await session.run({
        image: new ort.Tensor('float32', imageT, [1, 3, SIZE, SIZE]),
        mask: new ort.Tensor('float32', maskT, [1, 1, SIZE, SIZE]),
      });
      const data = out[session.outputNames[0]].data as Float32Array;

      const filled = cctx.createImageData(SIZE, SIZE);
      for (let i = 0; i < plane; i++) {
        filled.data[i * 4] = data[i];
        filled.data[i * 4 + 1] = data[plane + i];
        filled.data[i * 4 + 2] = data[2 * plane + i];
        filled.data[i * 4 + 3] = 255;
      }
      cctx.putImageData(filled, 0, 0);

      // Se pega solo lo pintado (máscara difuminada) sobre el original.
      const patch = createCanvas(sw, sh);
      const pctx = getContext(patch);
      pctx.imageSmoothingQuality = 'high';
      pctx.drawImage(crop, 0, 0, SIZE, SIZE, 0, 0, sw, sh);
      const feather = Math.max(1.5, sw / 300);
      pctx.globalCompositeOperation = 'destination-in';
      pctx.filter = `blur(${feather}px)`;
      pctx.drawImage(drawMask(grow + feather * 2), sx, sy, sw, sh, 0, 0, sw, sh);

      const wctx = getContext(work);
      history.current.push(wctx.getImageData(0, 0, W, H));
      if (history.current.length > 10) history.current.shift();
      wctx.drawImage(patch, sx, sy);
      setStrokes([]);
      setEdits((n) => n + 1);
    } catch (err) {
      console.error('[BorrarObjetosTool] Error:', err);
      setError('No se ha podido borrar. La primera vez se descarga el modelo de IA (92 MB): comprueba tu conexión y vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  }

  function undoErase() {
    const work = workRef.current;
    const prev = history.current.pop();
    if (!work || !prev) return;
    getContext(work).putImageData(prev, 0, 0);
    setEdits((n) => n + 1);
  }

  async function handleDownload() {
    const work = workRef.current;
    if (!work || !image) return;
    const jpg = image.file.type === 'image/jpeg';
    const blob = await canvasToBlob(work, jpg ? 'image/jpeg' : 'image/png', 0.95);
    triggerDownload(blob, getOutputFilename(image.file.name, 'sin-objetos', jpg ? 'jpg' : 'png'));
  }

  if (!image) {
    return (
      <div className="max-w-2xl">
        <ImageUploader image={null} error={uploadError} isDragging={isDragging} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onFileChange={onFileChange} onClear={clearImage} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-30 p-3 bg-white rounded-xl border border-[var(--color-border)] shadow-sm flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          Pincel
          <input type="range" min={8} max={90} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="accent-[var(--color-accent)] w-28" />
          <span className="inline-block rounded-full bg-[var(--color-accent)] opacity-60" style={{ width: Math.min(28, brush / 2.5), height: Math.min(28, brush / 2.5) }} />
        </label>
        <button onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length || loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm disabled:opacity-40">
          <Undo2 size={14} /> Deshacer trazo
        </button>
        <button onClick={undoErase} disabled={!history.current.length || loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm disabled:opacity-40">
          <RotateCcw size={14} /> Deshacer borrado
        </button>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleErase}
            disabled={!strokes.length || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-40"
          >
            <Wand2 size={15} /> {loading ? status : 'Borrar lo marcado'}
          </button>
          <button onClick={handleDownload} disabled={loading || edits === 0} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-text)] text-white text-sm font-semibold disabled:opacity-40">
            <Download size={15} /> Descargar
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-[var(--color-text-muted)]">
          La primera vez se descarga el modelo de IA (92 MB). Cada borrado tarda entre 10 y 40 segundos según la potencia de tu dispositivo; puedes seguir usando la página mientras tanto.
        </p>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#F8F8F8]">
        <canvas
          ref={viewRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`block w-full h-auto touch-none ${loading ? 'opacity-70' : 'cursor-crosshair'}`}
          aria-label="Pinta sobre lo que quieres borrar"
        />
        {!strokes.length && edits === 0 && (
          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-medium bg-black/60 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Eraser size={14} /> Pinta encima de lo que quieras borrar
          </p>
        )}
      </div>
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>{size ? `${size.w} × ${size.h} px` : ''}</span>
        <button onClick={clearImage} className="text-[var(--color-accent)] hover:underline">Usar otra imagen</button>
      </div>
    </div>
  );
}
