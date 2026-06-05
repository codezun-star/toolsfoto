import { useState, useCallback, useRef } from 'react';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, ImagePlus, X, GripVertical } from 'lucide-react';

interface ImgFile {
  file: File;
  name: string;
  previewUrl: string;
}

const DURATION_OPTIONS = [1, 2, 3, 5];
const RESOLUTION_OPTIONS = [
  { label: '720p (1280×720)', w: 1280, h: 720 },
  { label: '1080p (1920×1080)', w: 1920, h: 1080 },
];
const MAX_IMAGES = 30;

export default function FotogramasAVideoTool() {
  const [images, setImages] = useState<ImgFile[]>([]);
  const [duration, setDuration] = useState(2);
  const [resIdx, setResIdx] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIdx = useRef<number | null>(null);

  const addFiles = useCallback((files: File[]) => {
    setImages(prev => {
      const slots = MAX_IMAGES - prev.length;
      if (slots <= 0) return prev;
      const valid = files.filter(f => f.type.startsWith('image/')).slice(0, slots);
      const newImgs: ImgFile[] = valid.map(f => ({ file: f, name: f.name, previewUrl: URL.createObjectURL(f) }));
      return [...prev, ...newImgs];
    });
  }, []);

  function removeImage(idx: number) {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }

  function handleClear() {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    if (resultUrl) revokeURL(resultUrl);
    setImages([]);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  function onDragStart(idx: number) { dragIdx.current = idx; }
  function onDragEnd() { dragIdx.current = null; }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    setImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
  }

  async function process() {
    if (images.length < 2) { setError('Añade al menos 2 imágenes.'); return; }
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const { w, h } = RESOLUTION_OPTIONS[resIdx];
      const scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:-1:-1:color=black,setpts=PTS-STARTPTS`;

      const inputArgs: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const ext = images[i].name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const name = `img${i}.${ext}`;
        await ff.writeFile(name, new Uint8Array(await images[i].file.arrayBuffer()));
        inputArgs.push('-loop', '1', '-t', String(duration), '-i', name);
      }

      const filterParts = images.map((_, i) => `[${i}:v]${scaleFilter}[v${i}]`);
      const concatIn = images.map((_, i) => `[v${i}]`).join('');
      const filterComplex = `${filterParts.join(';')};${concatIn}concat=n=${images.length}:v=1:a=0[out]`;

      const args = [
        ...inputArgs,
        '-filter_complex', filterComplex,
        '-map', '[out]',
        '-r', '25',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4',
      ];

      try { await ff.exec(args); } catch (err) { console.error('[FotogramasAVideo] FFmpeg:', err); throw err; }

      const data = await ff.readFile('output.mp4') as Uint8Array;
      if (!data || data.length === 0) throw new Error('archivo vacío');

      for (let i = 0; i < images.length; i++) {
        const ext = images[i].name.split('.').pop()?.toLowerCase() ?? 'jpg';
        try { await ff.deleteFile(`img${i}.${ext}`); } catch { /* ignore */ }
      }
      try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al crear el vídeo. Asegúrate de que las imágenes son JPG, PNG o WebP válidos.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `slideshow_${images.length}fotos.mp4`;
    a.click();
  }

  return (
    <div className="space-y-6">
      {!processing && !resultUrl && (
        <>
          <div
            className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)] cursor-pointer transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]">
              <ImagePlus size={24} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--color-text)]">Añade tus fotos</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Arrastra aquí o haz clic · JPG, PNG, WebP · Máx. {MAX_IMAGES} imágenes</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) { addFiles(Array.from(e.target.files)); e.target.value = ''; } }}
            />
          </div>

          {images.length > 0 && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-text)]">{images.length} foto{images.length !== 1 ? 's' : ''} · Arrastra para reordenar</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {images.map((img, i) => (
                    <div
                      key={img.previewUrl}
                      className="relative group rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)] aspect-video cursor-grab"
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={(e) => onDragOver(e, i)}
                      onDragEnd={onDragEnd}
                    >
                      <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute top-1 left-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={12} />
                      </div>
                      <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Duración por foto</p>
                  <div className="flex gap-2 flex-wrap">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          duration === d
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Duración total: ~{images.length * duration}s
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Resolución de salida</p>
                  <div className="flex gap-2 flex-wrap">
                    {RESOLUTION_OPTIONS.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => setResIdx(i)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          resIdx === i
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={process}
                className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
              >
                Crear vídeo slideshow
              </button>
              <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                Eliminar todas las fotos
              </button>
            </>
          )}
        </>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            {progress === 0 ? 'Cargando procesador…' : `Creando vídeo… ${progress}%`}
          </p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Slideshow de <strong className="text-[var(--color-text)]">{images.length} fotos</strong> ·{' '}
            <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar vídeo
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Crear otro slideshow
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
