import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Undo2, Trash2, PenLine, Type } from 'lucide-react';
import { canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';
import { triggerDownload } from '@/lib/utils/download';

type Point = { x: number; y: number; p: number };
type Stroke = { color: string; width: number; points: Point[] };
type Mode = 'draw' | 'type';

const COLORS = ['#111110', '#1E3A8A', '#1D4ED8', '#7F1D1D'];
const SCRIPT_FONTS = [
  { label: 'Caligráfica', css: '"Segoe Script", "Brush Script MT", "Snell Roundhand", "URW Chancery L", cursive' },
  { label: 'Pincel', css: '"Brush Script MT", "Segoe Script", "Apple Chancery", cursive' },
  { label: 'Elegante', css: '"Lucida Handwriting", "Snell Roundhand", "Segoe Script", cursive' },
  { label: 'Sencilla', css: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive' },
];
const CANVAS_W = 900;
const CANVAS_H = 380;

/** Dibuja un trazo con curvas suaves y grosor según la velocidad/presión. */
function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  const pts = s.points;
  if (!pts.length) return;
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, s.width * 0.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const prevMid = i > 1 ? { x: (pts[i - 2].x + a.x) / 2, y: (pts[i - 2].y + a.y) / 2 } : a;
    ctx.lineWidth = s.width * (0.55 + b.p * 0.9);
    ctx.beginPath();
    ctx.moveTo(prevMid.x, prevMid.y);
    ctx.quadraticCurveTo(a.x, a.y, mid.x, mid.y);
    ctx.stroke();
  }
}

/** Recorta un canvas a su contenido (píxeles no transparentes) con un margen. */
function trimCanvas(src: HTMLCanvasElement, pad: number): HTMLCanvasElement | null {
  const ctx = getContext(src);
  const { width, height } = src;
  const data = ctx.getImageData(0, 0, width, height).data;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(width - 1, x1 + pad); y1 = Math.min(height - 1, y1 + pad);
  const out = createCanvas(x1 - x0 + 1, y1 - y0 + 1);
  getContext(out).drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/**
 * Crear firma digital: se dibuja con el dedo, el ratón o un lápiz (con
 * presión si el dispositivo la da) o se escribe con letra manuscrita, y se
 * descarga como PNG transparente recortado, listo para PDF, Word o correo.
 */
export default function CrearFirmaTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('draw');
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [name, setName] = useState('');
  const [font, setFont] = useState(SCRIPT_FONTS[0].css);
  const [scale, setScale] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const drawing = useRef<Stroke | null>(null);
  const last = useRef<{ x: number; y: number; t: number } | null>(null);

  const render = useCallback((ctx: CanvasRenderingContext2D, factor = 1) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.scale(factor, factor);
    if (mode === 'draw') {
      for (const s of strokes) drawStroke(ctx, s);
      if (drawing.current) drawStroke(ctx, drawing.current);
    } else if (name.trim()) {
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let size = 110;
      ctx.font = `${size}px ${font}`;
      while (ctx.measureText(name).width > CANVAS_W - 60 && size > 30) {
        size -= 4;
        ctx.font = `${size}px ${font}`;
      }
      ctx.fillText(name, CANVAS_W / 2, CANVAS_H / 2);
    }
    ctx.restore();
  }, [mode, strokes, name, font, color]);

  useEffect(() => {
    const c = canvasRef.current;
    if (c) render(getContext(c));
  }, [render]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * CANVAS_W, y: ((e.clientY - r.top) / r.height) * CANVAS_H };
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== 'draw') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pos(e);
    drawing.current = { color, width, points: [{ ...p, p: e.pressure || 0.5 }] };
    last.current = { ...p, t: e.timeStamp };
    render(getContext(e.currentTarget));
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const s = drawing.current;
    if (!s) return;
    const p = pos(e);
    const prev = last.current;
    // Sin presión real (ratón, dedo), el trazo adelgaza al ir rápido, como una pluma.
    let pressure = e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5;
    if (prev && e.pointerType !== 'pen') {
      const v = Math.hypot(p.x - prev.x, p.y - prev.y) / Math.max(1, e.timeStamp - prev.t);
      pressure = Math.max(0.15, Math.min(0.85, 0.85 - v * 0.25));
    }
    s.points.push({ ...p, p: pressure });
    last.current = { ...p, t: e.timeStamp };
    render(getContext(e.currentTarget));
  }

  function onUp() {
    const s = drawing.current;
    drawing.current = null;
    if (s) setStrokes((prev) => [...prev, s]);
  }

  async function handleDownload() {
    setError(null);
    const big = createCanvas(CANVAS_W * scale, CANVAS_H * scale);
    render(getContext(big), scale);
    const trimmed = trimCanvas(big, 12 * scale);
    if (!trimmed) {
      setError(mode === 'draw' ? 'Dibuja tu firma antes de descargarla.' : 'Escribe tu nombre antes de descargar la firma.');
      return;
    }
    try {
      const blob = await canvasToBlob(trimmed, 'image/png');
      triggerDownload(blob, 'firma.png');
    } catch {
      setError('No se ha podido generar la imagen. Inténtalo de nuevo.');
    }
  }

  const empty = mode === 'draw' ? strokes.length === 0 : !name.trim();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([['draw', 'Dibujar', PenLine], ['type', 'Escribir', Type]] as const).map(([m, label, Icon]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === m ? 'bg-[var(--color-accent)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {mode === 'type' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="Escribe tu nombre"
            className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-accent)]"
            aria-label="Estilo de letra"
          >
            {SCRIPT_FONTS.map((f) => <option key={f.label} value={f.css}>{f.label}</option>)}
          </select>
        </div>
      )}

      <div className="relative rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`w-full h-auto block ${mode === 'draw' ? 'cursor-crosshair touch-none' : ''}`}
          style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
          aria-label="Zona de firma"
        />
        <div className="pointer-events-none absolute left-[8%] right-[8%] bottom-[22%] border-b border-dashed border-[var(--color-border)]" />
        {empty && mode === 'draw' && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-[var(--color-text-muted)]">Firma aquí con el dedo, el ratón o un lápiz</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-colors"
              style={{ background: c, borderColor: color === c ? 'var(--color-accent)' : 'transparent' }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        {mode === 'draw' && (
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            Grosor
            <input type="range" min={2} max={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="accent-[var(--color-accent)]" />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          Resolución
          <select value={scale} onChange={(e) => setScale(Number(e.target.value))} className="px-2 py-1 rounded-lg border border-[var(--color-border)] bg-white text-sm">
            <option value={1}>Normal</option>
            <option value={2}>Alta</option>
            <option value={3}>Muy alta</option>
          </select>
        </label>
        {mode === 'draw' && (
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm disabled:opacity-40">
              <Undo2 size={14} /> Deshacer
            </button>
            <button onClick={() => setStrokes([])} disabled={!strokes.length} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm disabled:opacity-40">
              <Trash2 size={14} /> Borrar
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleDownload}
        disabled={empty}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Download size={16} />
        Descargar firma (PNG transparente)
      </button>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
}
