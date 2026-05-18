import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const QUALITY_LEVELS = [
  { label: 'Alta (tamaño mayor)', crf: '20' },
  { label: 'Media (equilibrio)', crf: '28' },
  { label: 'Baja (tamaño mínimo)', crf: '36' },
];

export default function ComprimirVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [quality, setQuality] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setVideo(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!video) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const crf = QUALITY_LEVELS[quality].crf;
      const blob = await runFFmpeg(ff, video.file, 'input.mp4', ['-vcodec', 'libx264', '-crf', crf, '-preset', 'fast', '-acodec', 'aac'], 'output.mp4');
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al comprimir el vídeo. Asegúrate de que el archivo es un MP4 o WebM válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, '_comprimido.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo (MP4 o WebM)" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Calidad de compresión</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {QUALITY_LEVELS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuality(i)}
                  className={[
                    'px-4 py-3 rounded-xl border text-sm font-medium text-left transition-colors',
                    quality === i
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)] text-[var(--color-text-secondary)]',
                  ].join(' ')}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Comprimir vídeo
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            {progress === 0 ? 'Cargando procesador…' : `Comprimiendo… ${progress}%`}
          </p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Original: <strong className="text-[var(--color-text)]">{formatBytes(video.size)}</strong></span>
            <span className="text-[var(--color-tools-icon)] font-bold">→</span>
            <span className="text-[var(--color-text-secondary)]">Comprimido: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] font-medium">
              -{Math.round((1 - resultSize / video.size) * 100)}%
            </span>
          </div>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar vídeo comprimido
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
