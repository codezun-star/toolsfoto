import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

type Mode = 'crop' | 'pad';

export default function CuadradoVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [mode, setMode] = useState<Mode>('crop');
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
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const vf = mode === 'crop'
        ? "crop='min(iw,ih)':'min(iw,ih)'"
        : "scale='if(gt(iw,ih),iw,ih)':'if(gt(iw,ih),iw,ih)':force_original_aspect_ratio=decrease,pad='max(iw,ih)':'max(iw,ih)':(ow-iw)/2:(oh-ih)/2:black";
      const blob = await runFFmpeg(ff, video.file, 'input_src', ['-vf', vf, '-vcodec', 'libx264', '-preset', 'veryfast', '-crf', '23', '-acodec', 'aac'], 'output.mp4');
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al procesar el vídeo. Inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, '-cuadrado.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode('crop')} className={['px-4 py-3 rounded-xl border text-left transition-colors', mode === 'crop' ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)]'].join(' ')}>
              <span className={['block text-sm font-bold', mode === 'crop' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'].join(' ')}>Recortar</span>
              <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">Sin bordes, recorta los lados</span>
            </button>
            <button onClick={() => setMode('pad')} className={['px-4 py-3 rounded-xl border text-left transition-colors', mode === 'pad' ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)]'].join(' ')}>
              <span className={['block text-sm font-bold', mode === 'pad' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'].join(' ')}>Rellenar</span>
              <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">Bordes negros, sin recortar</span>
            </button>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">Hacer cuadrado (1:1)</button>
          <p className="text-xs text-[var(--color-text-muted)] text-center">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5"><div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <video controls src={resultUrl} className="w-full rounded-lg max-h-72 mx-auto" />
          <p className="text-sm text-center text-[var(--color-text-secondary)]">Vídeo cuadrado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"><Download size={18} /> Descargar MP4</button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otro vídeo</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
