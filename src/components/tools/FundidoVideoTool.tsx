import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const FADE_OPTIONS = [0, 0.5, 1, 2];

function labelFor(s: number) {
  return s === 0 ? 'Sin fundido' : `${s}s`;
}

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);
    const timeout = setTimeout(() => { cleanup(); resolve(0); }, 8000);
    v.onloadedmetadata = () => { clearTimeout(timeout); cleanup(); resolve(v.duration); };
    v.onerror = () => { clearTimeout(timeout); cleanup(); resolve(0); };
    v.src = url;
  });
}

export default function FundidoVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [fadeIn, setFadeIn] = useState(1);
  const [fadeOut, setFadeOut] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setVideo(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!video) return;
    if (fadeIn === 0 && fadeOut === 0) {
      setError('Selecciona al menos un fundido de entrada o de salida.');
      return;
    }
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const duration = await getVideoDuration(video.file);
      if (duration <= 0) throw new Error('no se pudo leer la duración');

      const fadeOutSt = Math.max(0, duration - fadeOut);

      const vFilters: string[] = [];
      const aFilters: string[] = [];
      if (fadeIn > 0) {
        vFilters.push(`fade=t=in:st=0:d=${fadeIn}`);
        aFilters.push(`afade=t=in:st=0:d=${fadeIn}`);
      }
      if (fadeOut > 0) {
        vFilters.push(`fade=t=out:st=${fadeOutSt}:d=${fadeOut}`);
        aFilters.push(`afade=t=out:st=${fadeOutSt}:d=${fadeOut}`);
      }

      const ff = await createFFmpeg(setProgress);
      const ext = video.name.split('.').pop()?.toLowerCase() ?? 'mp4';
      const inputName = `input.${ext}`;
      await ff.writeFile(inputName, new Uint8Array(await video.file.arrayBuffer()));

      const args = ['-i', inputName];
      if (vFilters.length) args.push('-vf', vFilters.join(','));
      else args.push('-c:v', 'copy');
      if (aFilters.length) args.push('-af', aFilters.join(','), '-c:a', 'aac');
      else args.push('-c:a', 'copy');
      if (vFilters.length) args.push('-c:v', 'libx264');
      args.push('output.mp4');

      try { await ff.exec(args); } catch (err) { console.error('[FundidoVideo] FFmpeg:', err); throw err; }

      const data = await ff.readFile('output.mp4') as Uint8Array;
      if (!data || data.length === 0) throw new Error('archivo vacío');
      try { await ff.deleteFile(inputName); } catch { /* ignore */ }
      try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al aplicar el fundido. Asegúrate de que el archivo es un vídeo MP4 o WebM válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, '_fundido.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Fundido de entrada (inicio)</p>
              <div className="flex gap-2 flex-wrap">
                {FADE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFadeIn(s)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      fadeIn === s
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                    }`}
                  >
                    {labelFor(s)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Fundido de salida (final)</p>
              <div className="flex gap-2 flex-wrap">
                {FADE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFadeOut(s)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      fadeOut === s
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                    }`}
                  >
                    {labelFor(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Aplicar fundido
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            {progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}
          </p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
            {fadeIn > 0 && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]">Entrada {fadeIn}s</span>}
            {fadeOut > 0 && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]">Salida {fadeOut}s</span>}
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar vídeo con fundido
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otro vídeo
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
