import { useState, useRef } from 'react';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, Plus, X, GripVertical } from 'lucide-react';

interface Frame { file: File; url: string }
const WIDTHS = [240, 320, 480, 640];

export default function ImagenesAGifTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [delay, setDelay] = useState(500);
  const [width, setWidth] = useState(480);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newFrames: Frame[] = [];
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      if (frames.length + newFrames.length >= 20) break;
      newFrames.push({ file: f, url: URL.createObjectURL(f) });
    }
    setFrames((prev) => [...prev, ...newFrames]);
  }

  function removeFrame(i: number) {
    setFrames((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, j) => j !== i);
    });
  }

  function move(i: number, dir: -1 | 1) {
    setFrames((prev) => {
      const arr = [...prev];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  async function generate() {
    if (frames.length < 2) { setError('Necesitas al menos 2 imágenes para crear un GIF.'); return; }
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);

      for (let i = 0; i < frames.length; i++) {
        const buf = await frames[i].file.arrayBuffer();
        await ff.writeFile(`frame${i}.jpg`, new Uint8Array(buf));
      }

      // concat list: each frame repeated for the delay
      const fps = Math.max(1, Math.round(1000 / delay));
      const framesPerImage = Math.max(1, Math.round(fps * delay / 1000));

      let concat = '';
      for (let i = 0; i < frames.length; i++) {
        for (let r = 0; r < framesPerImage; r++) {
          concat += `file 'frame${i}.jpg'\n`;
        }
      }
      await ff.writeFile('list.txt', concat);

      await ff.exec([
        '-f', 'concat', '-safe', '0', '-i', 'list.txt',
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        '-loop', '0', 'output.gif',
      ]);

      const data = await ff.readFile('output.gif') as Uint8Array;
      await ff.deleteFile('list.txt');
      await ff.deleteFile('output.gif');
      for (let i = 0; i < frames.length; i++) await ff.deleteFile(`frame${i}.jpg`);

      const blob = new Blob([data], { type: 'image/gif' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[ImagenesAGif] Error FFmpeg:', err);
      setError('Error al generar el GIF. Asegúrate de que las imágenes sean JPG o PNG válidos.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'animacion.gif';
    a.click();
  }

  function reset() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    setFrames([]);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {!resultUrl && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-accent)] transition-colors"
          >
            <Plus size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm font-medium text-[var(--color-text)]">Haz clic o arrastra imágenes aquí</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">JPG, PNG — máx. 20 fotogramas</p>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          </div>

          {frames.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[var(--color-text)]">{frames.length} fotograma{frames.length !== 1 ? 's' : ''} — ordénalos</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {frames.map((f, i) => (
                  <div key={f.url} className="relative group rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg)]">
                    <img src={f.url} alt={`Frame ${i + 1}`} className="w-full h-24 object-cover" />
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 rounded">{i + 1}</div>
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="bg-black/60 text-white rounded p-0.5 disabled:opacity-30"><GripVertical size={12} /></button>
                      <button onClick={() => removeFrame(i)} className="bg-red-500 text-white rounded p-0.5"><X size={12} /></button>
                    </div>
                  </div>
                ))}
                {frames.length < 20 && (
                  <button onClick={() => inputRef.current?.click()} className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-[var(--color-text-muted)]">
                    <Plus size={20} />
                    <span className="text-xs mt-1">Añadir</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Duración por fotograma</label>
                  <select value={delay} onChange={(e) => setDelay(Number(e.target.value))} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none">
                    <option value={100}>0.1s — muy rápido</option>
                    <option value={200}>0.2s — rápido</option>
                    <option value={500}>0.5s — normal</option>
                    <option value={1000}>1s — lento</option>
                    <option value={2000}>2s — muy lento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Ancho del GIF</label>
                  <div className="flex gap-2">
                    {WIDTHS.map((w) => (
                      <button key={w} onClick={() => setWidth(w)} className={['flex-1 py-2.5 text-sm rounded-xl border transition-colors font-medium', width === w ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={generate}
                disabled={processing || frames.length < 2}
                className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-60"
              >
                Crear GIF animado
              </button>
            </div>
          )}
        </>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Generando GIF… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-4">
          <img src={resultUrl} alt="GIF animado" className="max-w-full rounded-xl border border-[var(--color-border)] mx-auto block" />
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            {frames.length} fotogramas · {width}px · <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar GIF
          </button>
          <button onClick={reset} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Crear otro GIF
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
