import { useEffect, useRef, useState } from 'react';
import { Upload, X, Download, FolderArchive, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { canvasToBlob, createCanvas, getContext, revokeURL } from '@/lib/utils/canvas';
import { formatBytes, formatReduction } from '@/lib/utils/format';
import { triggerDownload } from '@/lib/utils/download';
import { makeZip } from '@/lib/utils/zip';
import { useFileReceiver } from '@/hooks/useFileReceiver';

export type BatchMode = 'compress' | 'resize' | 'convert';

type OutFormat = 'keep' | 'image/jpeg' | 'image/png' | 'image/webp';
type ResizeBy = 'width' | 'height' | 'percent' | 'fit';

interface Item {
  id: number;
  file: File;
  thumb: string;
  status: 'pending' | 'working' | 'done' | 'error';
  out?: Blob;
  outName?: string;
  w?: number;
  h?: number;
}

const MAX_FILES = 200;
const MAX_SIZE = 50 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const isHeic = (f: File) => /\.(heic|heif)$/i.test(f.name) || /image\/hei[cf]/.test(f.type);
const isImage = (f: File) => /^image\/(jpeg|png|webp|avif|gif|bmp)$/.test(f.type) || isHeic(f);

let nextId = 0;

/** Decodifica cualquier imagen admitida (incluido HEIC del iPhone) a un bitmap. */
async function decode(file: File): Promise<ImageBitmap> {
  if (isHeic(file)) {
    type HeicFn = (o: { blob: Blob; toType: string; quality: number }) => Promise<Blob | Blob[]>;
    const mod = (await import('heic2any')) as unknown as { default: HeicFn };
    const out = await mod.default({ blob: file, toType: 'image/jpeg', quality: 0.95 });
    return createImageBitmap(Array.isArray(out) ? out[0] : out);
  }
  return createImageBitmap(file);
}

function baseName(name: string) {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

interface Props { mode: BatchMode }

/**
 * Procesa muchas imágenes de una vez y las descarga juntas en un ZIP.
 * Lo comparten `/comprimir-varias-imagenes`, `/redimensionar-varias-imagenes`
 * y `/convertir-varias-imagenes` (prop `mode`). Las imágenes se procesan una
 * a una para no agotar la memoria con lotes grandes; acepta HEIC del iPhone.
 */
export default function BatchImageTool({ mode }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Opciones
  const [quality, setQuality] = useState(mode === 'compress' ? 75 : 90);
  const [maxWidth, setMaxWidth] = useState(mode === 'compress' ? 1920 : 0);
  const [format, setFormat] = useState<OutFormat>(mode === 'convert' ? 'image/jpeg' : 'keep');
  const [resizeBy, setResizeBy] = useState<ResizeBy>('width');
  const [size, setSize] = useState(1080);
  const [size2, setSize2] = useState(1080);
  const [percent, setPercent] = useState(50);
  const [noUpscale, setNoUpscale] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  useEffect(() => () => { itemsRef.current.forEach((i) => revokeURL(i.thumb)); }, []);

  function add(list: ArrayLike<File>) {
    const incoming = Array.from(list);
    const valid = incoming.filter((f) => isImage(f) && f.size <= MAX_SIZE);
    const room = MAX_FILES - itemsRef.current.length;
    const accepted = valid.slice(0, Math.max(0, room));
    const skipped = incoming.length - accepted.length;
    setError(skipped > 0
      ? `${skipped} ${skipped === 1 ? 'archivo no se ha añadido' : 'archivos no se han añadido'}: solo se admiten imágenes de hasta 50 MB y un máximo de ${MAX_FILES} por lote.`
      : null);
    if (!accepted.length) return;
    setItems((prev) => [...prev, ...accepted.map((file) => ({
      id: ++nextId, file, status: 'pending' as const,
      thumb: isHeic(file) ? '' : URL.createObjectURL(file),
    }))]);
  }

  useFileReceiver(isImage, (f) => add([f]), () => true, true);

  function remove(id: number) {
    setItems((prev) => {
      const it = prev.find((i) => i.id === id);
      if (it?.thumb) revokeURL(it.thumb);
      return prev.filter((i) => i.id !== id);
    });
  }

  function clearAll() {
    items.forEach((i) => i.thumb && revokeURL(i.thumb));
    setItems([]);
    setError(null);
  }

  /** Tamaño de salida según las opciones del modo. */
  function targetSize(w: number, h: number): [number, number] {
    if (mode === 'resize') {
      let k = 1;
      if (resizeBy === 'width') k = size / w;
      else if (resizeBy === 'height') k = size / h;
      else if (resizeBy === 'percent') k = percent / 100;
      else k = Math.min(size / w, size2 / h, 1);
      if (noUpscale && resizeBy !== 'percent') k = Math.min(k, 1);
      return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
    }
    if (maxWidth > 0 && w > maxWidth) return [maxWidth, Math.round(h * (maxWidth / w))];
    return [w, h];
  }

  function outType(file: File): string {
    if (format !== 'keep') return format;
    if (file.type === 'image/png' || file.type === 'image/webp') return file.type;
    return 'image/jpeg';
  }

  async function processOne(it: Item): Promise<Partial<Item>> {
    const bmp = await decode(it.file);
    const srcW = bmp.width;
    const [w, h] = targetSize(srcW, bmp.height);
    const type = outType(it.file);
    const canvas = createCanvas(w, h);
    const ctx = getContext(canvas);
    if (type === 'image/jpeg') {
      // JPG no admite transparencia: fondo blanco en vez de negro.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    let blob = await canvasToBlob(canvas, type, quality / 100);
    // Comprimir nunca debe engordar un archivo: si no gana, se queda el original.
    if (mode === 'compress' && blob.size >= it.file.size && type === it.file.type && w === srcW) blob = it.file;
    canvas.width = 0;
    canvas.height = 0;
    const suffix = mode === 'compress' ? '-comprimida' : mode === 'resize' ? `-${w}x${h}` : '';
    return { out: blob, outName: `${baseName(it.file.name)}${suffix}.${EXT[type] ?? 'jpg'}`, w, h };
  }

  async function run() {
    setRunning(true);
    setError(null);
    const queue = itemsRef.current.filter((i) => i.status !== 'done');
    for (const it of queue) {
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: 'working' } : x)));
      try {
        const res = await processOne(it);
        setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...res, status: 'done' } : x)));
      } catch (err) {
        console.error('[BatchImageTool] Error en', it.file.name, err);
        setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: 'error' } : x)));
      }
    }
    setRunning(false);
  }

  // Al cambiar opciones, lo ya procesado vuelve a quedar pendiente.
  useEffect(() => {
    setItems((prev) => prev.map((x) => (x.status === 'done' || x.status === 'error' ? { ...x, status: 'pending', out: undefined } : x)));
  }, [quality, maxWidth, format, resizeBy, size, size2, percent, noUpscale]);

  async function downloadZip() {
    const done = items.filter((i) => i.out && i.outName);
    if (!done.length) return;
    setZipping(true);
    try {
      const zip = await makeZip(done.map((i) => ({ name: i.outName as string, blob: i.out as Blob })));
      const name = mode === 'compress' ? 'imagenes-comprimidas' : mode === 'resize' ? 'imagenes-redimensionadas' : 'imagenes-convertidas';
      triggerDownload(zip, `${name}.zip`);
    } catch {
      setError('No se ha podido crear el ZIP. Si el lote es muy grande, descarga las imágenes por separado o divide el lote.');
    } finally {
      setZipping(false);
    }
  }

  const done = items.filter((i) => i.status === 'done');
  const totalIn = done.reduce((s, i) => s + i.file.size, 0);
  const totalOut = done.reduce((s, i) => s + (i.out?.size ?? 0), 0);
  const pending = items.filter((i) => i.status !== 'done').length;
  const seg = (on: boolean) => `px-3 py-2 rounded-lg border text-sm ${on ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] font-semibold' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`;
  const num = 'w-24 px-2.5 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-4">
        <label
          className={[
            'flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center',
            dragging ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)]',
          ].join(' ')}
          onDrop={(e) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
        >
          <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]"><Upload size={24} /></div>
          <div>
            <p className="font-semibold text-[var(--color-text)]">{items.length ? 'Añadir más imágenes' : 'Arrastra todas tus imágenes o haz clic'}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">JPG, PNG, WebP, AVIF, GIF y HEIC · Hasta {MAX_FILES} a la vez</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ''; }}
          />
        </label>

        {error && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>}

        {items.length > 0 && (
          <div className="rounded-xl border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
              <p className="text-sm font-semibold text-[var(--color-text)]">{items.length} {items.length === 1 ? 'imagen' : 'imágenes'}</p>
              <button onClick={clearAll} disabled={running} className="text-xs text-[var(--color-accent)] hover:underline disabled:opacity-40">Quitar todas</button>
            </div>
            <ul className="divide-y divide-[var(--color-border)] max-h-[480px] overflow-y-auto">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-10 h-10 rounded-md bg-[var(--color-bg)] overflow-hidden shrink-0 grid place-items-center text-[10px] text-[var(--color-text-muted)]">
                    {it.thumb ? <img src={it.thumb} alt="" className="w-full h-full object-cover" loading="lazy" /> : 'HEIC'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-text)] truncate">{it.outName ?? it.file.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatBytes(it.file.size)}
                      {it.out && <> → <span className="text-[var(--color-text-secondary)] font-medium">{formatBytes(it.out.size)}</span>{mode === 'compress' && ` (−${formatReduction(it.file.size, it.out.size)})`}</>}
                      {it.w && mode !== 'compress' && ` · ${it.w}×${it.h}`}
                    </p>
                  </div>
                  {it.status === 'working' && <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />}
                  {it.status === 'done' && (
                    <button onClick={() => it.out && it.outName && triggerDownload(it.out, it.outName)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-tools-icon)]" aria-label={`Descargar ${it.outName}`}>
                      <CheckCircle2 size={16} className="inline" /> <Download size={14} className="inline" />
                    </button>
                  )}
                  {it.status === 'error' && <span title="No se ha podido procesar"><AlertCircle size={16} className="text-red-600" /></span>}
                  {!running && (
                    <button onClick={() => remove(it.id)} className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)]" aria-label={`Quitar ${it.file.name}`}>
                      <X size={15} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <fieldset disabled={running} className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-4 disabled:opacity-60">
          {mode === 'resize' && (
            <>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Redimensionar por</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className={seg(resizeBy === 'width')} onClick={() => setResizeBy('width')}>Ancho</button>
                  <button className={seg(resizeBy === 'height')} onClick={() => setResizeBy('height')}>Alto</button>
                  <button className={seg(resizeBy === 'percent')} onClick={() => setResizeBy('percent')}>Porcentaje</button>
                  <button className={seg(resizeBy === 'fit')} onClick={() => setResizeBy('fit')}>Caber en</button>
                </div>
              </div>
              {resizeBy === 'percent' ? (
                <label className="block text-sm text-[var(--color-text-secondary)]">
                  {percent} % del tamaño original
                  <input type="range" min={5} max={200} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-full accent-[var(--color-accent)] mt-1" />
                </label>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <input type="number" min={1} max={12000} value={size} onChange={(e) => setSize(Math.max(1, Number(e.target.value)))} className={num} aria-label={resizeBy === 'height' ? 'Alto en píxeles' : 'Ancho en píxeles'} />
                  {resizeBy === 'fit' && <>×<input type="number" min={1} max={12000} value={size2} onChange={(e) => setSize2(Math.max(1, Number(e.target.value)))} className={num} aria-label="Alto máximo en píxeles" /></>}
                  px
                </div>
              )}
              {resizeBy !== 'percent' && (
                <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                  <input type="checkbox" checked={noUpscale} onChange={(e) => setNoUpscale(e.target.checked)} className="accent-[var(--color-accent)]" />
                  No ampliar las imágenes más pequeñas
                </label>
              )}
              <p className="text-xs text-[var(--color-text-muted)]">Se mantiene siempre la proporción de cada imagen.</p>
            </>
          )}

          {mode === 'compress' && (
            <label className="block text-sm text-[var(--color-text-secondary)]">
              Ancho máximo
              <select value={maxWidth} onChange={(e) => setMaxWidth(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm">
                <option value={0}>Mantener el tamaño</option>
                <option value={3840}>3840 px (4K)</option>
                <option value={2560}>2560 px</option>
                <option value={1920}>1920 px (Full HD, recomendado)</option>
                <option value={1280}>1280 px (web)</option>
                <option value={800}>800 px (miniaturas)</option>
              </select>
            </label>
          )}

          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Formato de salida</p>
            <div className="grid grid-cols-2 gap-2">
              {mode !== 'convert' && <button className={seg(format === 'keep')} onClick={() => setFormat('keep')}>Mismo</button>}
              <button className={seg(format === 'image/jpeg')} onClick={() => setFormat('image/jpeg')}>JPG</button>
              <button className={seg(format === 'image/png')} onClick={() => setFormat('image/png')}>PNG</button>
              <button className={seg(format === 'image/webp')} onClick={() => setFormat('image/webp')}>WebP</button>
            </div>
          </div>

          {mode === 'compress' && format === 'keep' && items.some((i) => i.file.type === 'image/png') && (
            <p className="text-xs text-[var(--color-text-muted)]">Los PNG apenas se reducen manteniendo el formato. Para aligerarlos de verdad, elige WebP (conserva la transparencia) o JPG.</p>
          )}

          {format !== 'image/png' && (
            <label className="block text-sm text-[var(--color-text-secondary)]">
              Calidad: {quality} %
              <input type="range" min={30} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-[var(--color-accent)] mt-1" />
            </label>
          )}
        </fieldset>

        <button
          onClick={run}
          disabled={!items.length || running || pending === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {running
            ? `Procesando ${done.length + 1} de ${items.length}…`
            : mode === 'compress' ? `Comprimir ${pending || ''} ${pending === 1 ? 'imagen' : 'imágenes'}`
            : mode === 'resize' ? `Redimensionar ${pending || ''} ${pending === 1 ? 'imagen' : 'imágenes'}`
            : `Convertir ${pending || ''} ${pending === 1 ? 'imagen' : 'imágenes'}`}
        </button>

        {done.length > 0 && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-3">
            <p className="text-sm text-[var(--color-text)]">
              <strong>{done.length}</strong> listas · {formatBytes(totalIn)} → <strong>{formatBytes(totalOut)}</strong>
              {mode === 'compress' && totalIn > 0 && <span className="text-[var(--color-tools-icon)] font-semibold"> (−{formatReduction(totalIn, totalOut)})</span>}
            </p>
            <button
              onClick={downloadZip}
              disabled={zipping}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-text)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <FolderArchive size={16} />
              {zipping ? 'Creando ZIP…' : 'Descargar todas (ZIP)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
