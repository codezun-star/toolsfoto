import { useState, useCallback, useRef } from 'react';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, Upload, X, MonitorPlay } from 'lucide-react';

interface GifFile {
  file: File;
  name: string;
  size: number;
  previewUrl: string;
}

const QUALITY_LEVELS = [
  { label: 'Alta calidad', crf: '18', description: 'Menor compresión, mayor tamaño' },
  { label: 'Equilibrada', crf: '23', description: 'Recomendado para la mayoría de GIFs' },
  { label: 'Ligera', crf: '28', description: 'Mayor compresión, menor tamaño' },
];

const MAX_SIZE = 100 * 1024 * 1024;

export default function GifAVideoTool() {
  const [gif, setGif] = useState<GifFile | null>(null);
  const [quality, setQuality] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.gif') && file.type !== 'image/gif') {
      setError('El archivo debe ser un GIF animado (.gif).');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(`El GIF no puede superar ${formatBytes(MAX_SIZE)}.`);
      return;
    }
    if (gif) URL.revokeObjectURL(gif.previewUrl);
    if (resultUrl) revokeURL(resultUrl);
    setError(null);
    setResultUrl(null);
    setResultSize(0);
    setGif({ file, name: file.name, size: file.size, previewUrl: URL.createObjectURL(file) });
  }, [gif, resultUrl]);

  function handleClear() {
    if (gif) URL.revokeObjectURL(gif.previewUrl);
    if (resultUrl) revokeURL(resultUrl);
    setGif(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!gif) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      await ff.writeFile('input.gif', new Uint8Array(await gif.file.arrayBuffer()));

      try {
        await ff.exec([
          '-f', 'gif',
          '-i', 'input.gif',
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          '-c:v', 'libx264',
          '-crf', QUALITY_LEVELS[quality].crf,
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          'output.mp4',
        ]);
      } catch (err) { console.error('[GifAVideo] FFmpeg:', err); throw err; }

      const data = await ff.readFile('output.mp4') as Uint8Array;
      if (!data || data.length === 0) throw new Error('archivo vacío');
      try { await ff.deleteFile('input.gif'); } catch { /* ignore */ }
      try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al convertir el GIF. Asegúrate de que el archivo es un GIF animado válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !gif) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = gif.name.replace(/\.gif$/i, '.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      {!gif ? (
        <div
          className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)] cursor-pointer transition-colors"
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]">
            <Upload size={24} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text)]">Sube tu GIF animado</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Arrastra aquí o haz clic · Solo .gif · Máx. 100 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".gif,image/gif"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }}
          />
        </div>
      ) : (
        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] shrink-0">
            <MonitorPlay size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">{gif.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatBytes(gif.size)}</p>
          </div>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
            aria-label="Eliminar GIF"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {gif && !processing && !resultUrl && (
        <div className="space-y-4">
          {gif.previewUrl && (
            <div className="flex justify-center">
              <img src={gif.previewUrl} alt="Preview del GIF" className="max-h-40 rounded-lg border border-[var(--color-border)]" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {QUALITY_LEVELS.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuality(i)}
                className={[
                  'px-4 py-3 rounded-xl border text-sm text-left transition-colors space-y-1',
                  quality === i
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)]',
                ].join(' ')}
              >
                <p className={`font-semibold ${quality === i ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{q.label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{q.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Convertir GIF a MP4
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            {progress === 0 ? 'Cargando procesador…' : `Convirtiendo… ${progress}%`}
          </p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && gif && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          {(() => {
            const pct = Math.round((1 - resultSize / gif.size) * 100);
            return (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">GIF: <strong className="text-[var(--color-text)]">{formatBytes(gif.size)}</strong></span>
                <span className="text-[var(--color-tools-icon)] font-bold">→</span>
                <span className="text-[var(--color-text-secondary)]">MP4: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] font-medium">
                  {pct >= 0 ? `-${pct}%` : `+${Math.abs(pct)}%`}
                </span>
              </div>
            );
          })()}
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar MP4
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Convertir otro GIF
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
