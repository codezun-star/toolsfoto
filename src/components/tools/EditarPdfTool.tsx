import { useEffect, useRef, useState } from 'react';
import { Type, Highlighter, Square, PenLine, Hand, Undo2, Download, Trash2 } from 'lucide-react';
import PdfUploader from '@/components/ui/PdfUploader';
import { loadPdfjs } from '@/lib/utils/pdfjs';
import { toBlobPart } from '@/lib/utils/bytes';
import { revokeURL } from '@/lib/utils/canvas';

type Tool = 'move' | 'text' | 'highlight' | 'whiteout' | 'draw';

type Annot =
  | { kind: 'text'; page: number; x: number; y: number; text: string; size: number; color: string }
  | { kind: 'highlight' | 'whiteout'; page: number; x: number; y: number; w: number; h: number; color: string }
  | { kind: 'draw'; page: number; points: Array<[number, number]>; width: number; color: string };

/** Lo que necesitamos de un viewport de pdf.js: tamaño y conversión a puntos PDF. */
interface View { width: number; height: number; scale: number; rotation: number; toPdf: (x: number, y: number) => number[] }

const MAX_PAGES = 80;
const COLORS = ['#111110', '#E84827', '#1D4ED8', '#15803D'];
const HIGHLIGHT = '#FDE047';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Editor de PDF: añade texto, resalta, tapa (corrector blanco) y dibuja a
 * mano alzada sobre las páginas. Las anotaciones se guardan en coordenadas
 * del render y se pasan a puntos PDF con `viewport.convertToPdfPoint`, que
 * tiene en cuenta la rotación de la página y su CropBox. pdf-lib las escribe
 * sobre el PDF original, sin rasterizarlo.
 */
export default function EditarPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [annots, setAnnots] = useState<Annot[]>([]);
  const [tool, setTool] = useState<Tool>('text');
  const [text, setText] = useState('Texto');
  const [size, setSize] = useState(16);
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Annot | null>(null);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const start = useRef<{ x: number; y: number } | null>(null);

  // Renderiza las páginas al cargar el PDF.
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const pdfjsLib = await loadPdfjs();
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const total = Math.min(doc.numPages, MAX_PAGES);
        const list: View[] = [];
        const pages = [];
        for (let i = 1; i <= total; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(2, 820 / base.width);
          const vp = page.getViewport({ scale });
          list.push({ width: vp.width, height: vp.height, scale, rotation: vp.rotation, toPdf: (x, y) => vp.convertToPdfPoint(x, y) });
          pages.push({ page, vp });
        }
        if (cancelled) return;
        setViews(list);
        // Espera a que React monte los canvas y pinta cada página.
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        for (let i = 0; i < pages.length; i++) {
          const canvas = canvasRefs.current[i];
          if (!canvas || cancelled) continue;
          const { page, vp } = pages[i];
          const hi = page.getViewport({ scale: vp.scale * dpr });
          canvas.width = Math.ceil(hi.width);
          canvas.height = Math.ceil(hi.height);
          await page.render({ canvas, viewport: hi }).promise;
        }
        if (doc.numPages > MAX_PAGES) setError(`Se muestran las ${MAX_PAGES} primeras páginas de ${doc.numPages}. El resto se conserva sin cambios al guardar.`);
      } catch (err) {
        console.error('[EditarPdfTool] Error al abrir:', err);
        setError('No se ha podido abrir el PDF. Si está protegido con contraseña, quítasela primero.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  function clear() {
    setFile(null);
    setViews([]);
    setAnnots([]);
    setError(null);
  }

  function point(e: React.PointerEvent<SVGSVGElement>, v: View) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * v.width, y: ((e.clientY - r.top) / r.height) * v.height };
  }

  function onDown(e: React.PointerEvent<SVGSVGElement>, page: number) {
    if (tool === 'move') return;
    const v = views[page];
    const p = point(e, v);
    if (tool === 'text') {
      if (!text.trim()) return;
      setAnnots((a) => [...a, { kind: 'text', page, x: p.x, y: p.y, text, size, color }]);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = p;
    if (tool === 'draw') setDraft({ kind: 'draw', page, points: [[p.x, p.y]], width: Math.max(2, size / 6), color });
    else setDraft({ kind: tool, page, x: p.x, y: p.y, w: 0, h: 0, color: tool === 'highlight' ? HIGHLIGHT : '#FFFFFF' });
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>, page: number) {
    if (!draft || draft.page !== page || !start.current) return;
    const p = point(e, views[page]);
    if (draft.kind === 'draw') {
      setDraft({ ...draft, points: [...draft.points, [p.x, p.y]] });
    } else if (draft.kind === 'highlight' || draft.kind === 'whiteout') {
      const s = start.current;
      setDraft({ ...draft, x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
    }
  }

  function onUp() {
    if (draft) {
      const keep = draft.kind === 'draw' ? draft.points.length > 1 : draft.kind !== 'text' && draft.w > 3 && draft.h > 3;
      if (keep) setAnnots((a) => [...a, draft]);
    }
    setDraft(null);
    start.current = null;
  }

  async function handleSave() {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const { PDFDocument, StandardFonts, rgb, degrees, LineCapStyle } = await import('pdf-lib');
      const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const clean = (s: string) => Array.from(s).map((ch) => { try { font.encodeText(ch); return ch; } catch { return '?'; } }).join('');

      for (const a of annots) {
        const v = views[a.page];
        const page = pdf.getPage(a.page);
        const [r, g, b] = hexToRgb(a.color);
        if (a.kind === 'text') {
          const [x, y] = v.toPdf(a.x, a.y);
          page.drawText(clean(a.text), { x, y, size: a.size / v.scale, font, color: rgb(r, g, b), rotate: degrees(v.rotation) });
        } else if (a.kind === 'highlight' || a.kind === 'whiteout') {
          const [x1, y1] = v.toPdf(a.x, a.y);
          const [x2, y2] = v.toPdf(a.x + a.w, a.y + a.h);
          page.drawRectangle({
            x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1),
            color: rgb(r, g, b), opacity: a.kind === 'highlight' ? 0.4 : 1,
          });
        } else if (a.kind === 'draw') {
          const pts = a.points.map(([x, y]) => v.toPdf(x, y));
          for (let i = 1; i < pts.length; i++) {
            page.drawLine({
              start: { x: pts[i - 1][0], y: pts[i - 1][1] },
              end: { x: pts[i][0], y: pts[i][1] },
              thickness: a.width / v.scale,
              color: rgb(r, g, b),
              lineCap: LineCapStyle.Round,
            });
          }
        }
      }
      const out = await pdf.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([toBlobPart(out)], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name.replace(/\.pdf$/i, '') + '-editado.pdf';
      link.click();
      revokeURL(url);
    } catch (err) {
      console.error('[EditarPdfTool] Error al guardar:', err);
      setError('No se ha podido guardar el PDF. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  const TOOLS: Array<[Tool, string, typeof Type]> = [
    ['text', 'Texto', Type],
    ['highlight', 'Resaltar', Highlighter],
    ['whiteout', 'Tapar', Square],
    ['draw', 'Dibujar', PenLine],
    ['move', 'Desplazar', Hand],
  ];

  const renderAnnot = (a: Annot, key: string | number) => {
    if (a.kind === 'text') {
      return <text key={key} x={a.x} y={a.y} fontSize={a.size} fill={a.color} fontFamily="Helvetica, Arial, sans-serif">{a.text}</text>;
    }
    if (a.kind === 'draw') {
      return <polyline key={key} points={a.points.map((p) => p.join(',')).join(' ')} fill="none" stroke={a.color} strokeWidth={a.width} strokeLinecap="round" strokeLinejoin="round" />;
    }
    return (
      <rect
        key={key} x={a.x} y={a.y} width={a.w} height={a.h} fill={a.color}
        fillOpacity={a.kind === 'highlight' ? 0.4 : 1}
        stroke={a.kind === 'whiteout' ? '#E8E4DE' : 'none'} strokeDasharray="4 3"
      />
    );
  };

  if (!file) {
    return (
      <div className="max-w-2xl">
        <PdfUploader label="Sube el PDF que quieres editar" onFile={(f) => { setFile(f); setAnnots([]); }} onClear={clear} current={null} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PdfUploader onFile={(f) => { setFile(f); setAnnots([]); }} onClear={clear} current={file} />

      {/* Barra de herramientas fija al hacer scroll por las páginas */}
      <div className="sticky top-16 z-30 p-3 bg-white rounded-xl border border-[var(--color-border)] shadow-sm space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {TOOLS.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tool === id ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
          <div className="flex gap-1.5 ml-auto">
            <button onClick={() => setAnnots((a) => a.slice(0, -1))} disabled={!annots.length} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm disabled:opacity-40" title="Deshacer">
              <Undo2 size={15} /> <span className="hidden sm:inline">Deshacer</span>
            </button>
            <button onClick={() => setAnnots([])} disabled={!annots.length} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm disabled:opacity-40" title="Quitar todos los cambios">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tool === 'text' && (
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe el texto y toca la página"
              className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
            />
          )}
          {(tool === 'text' || tool === 'draw') && (
            <>
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-full border-2" style={{ background: c, borderColor: color === c ? 'var(--color-accent)' : 'transparent' }} aria-label={`Color ${c}`} />
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                {tool === 'text' ? 'Tamaño' : 'Grosor'}
                <input type="range" min={8} max={48} value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-[var(--color-accent)] w-24" />
              </label>
            </>
          )}
          <p className="text-xs text-[var(--color-text-muted)]">
            {tool === 'text' && 'Toca la página donde quieras colocar el texto.'}
            {tool === 'highlight' && 'Arrastra sobre el texto que quieras resaltar.'}
            {tool === 'whiteout' && 'Arrastra para tapar con blanco lo que quieras ocultar.'}
            {tool === 'draw' && 'Dibuja a mano alzada sobre la página.'}
            {tool === 'move' && 'Modo lectura: desplázate sin añadir nada.'}
          </p>
        </div>
      </div>

      {loading && <p className="text-sm text-[var(--color-text-secondary)]">Cargando páginas…</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="space-y-6">
        {views.map((v, i) => (
          <figure key={i} className="mx-auto" style={{ maxWidth: v.width }}>
            <div className="relative shadow-sm border border-[var(--color-border)] bg-white">
              <canvas ref={(el) => { canvasRefs.current[i] = el; }} className="block w-full h-auto" style={{ aspectRatio: `${v.width} / ${v.height}` }} />
              <svg
                viewBox={`0 0 ${v.width} ${v.height}`}
                className={`absolute inset-0 w-full h-full ${tool === 'move' ? '' : 'touch-none cursor-crosshair'}`}
                onPointerDown={(e) => onDown(e, i)}
                onPointerMove={(e) => onMove(e, i)}
                onPointerUp={onUp}
                onPointerCancel={onUp}
              >
                {annots.map((a, n) => (a.page === i ? renderAnnot(a, n) : null))}
                {draft && draft.page === i && renderAnnot(draft, 'draft')}
              </svg>
            </div>
            <figcaption className="text-center text-xs text-[var(--color-text-muted)] mt-1.5">Página {i + 1}</figcaption>
          </figure>
        ))}
      </div>

      {annots.length > 0 && (
        <div className="sticky bottom-[calc(var(--tf-tabbar-h,0px)+var(--tf-anchor-h,0px)+12px)] z-30">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm shadow-lg hover:bg-[#C93D1E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={16} />
            {saving ? 'Guardando…' : `Descargar PDF editado (${annots.length} ${annots.length === 1 ? 'cambio' : 'cambios'})`}
          </button>
        </div>
      )}
    </div>
  );
}
