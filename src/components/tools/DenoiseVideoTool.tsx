import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const LEVELS = [
  {
    label: 'Suave',
    params: '2:1.5:2.5:1.5',
    description: 'Elimina ruido leve sin afectar el detalle. Ideal para vídeos con poco grano.',
  },
  {
    label: 'Medio',
    params: '4:3:5:3',
    description: 'Buen equilibrio entre reducción de ruido y preservación de detalles.',
  },
  {
    label: 'Intenso',
    params: '6:4:8:4',
    description: 'Elimina grano fuerte. Puede suavizar ligeramente los detalles finos.',
  },
];

export default function DenoiseVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [level, setLevel] = useState(1);
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
      const blob = await runFFmpeg(
        ff,
        video.file,
        'input.mp4',
        ['-vf', `hqdn3d=${LEVELS[level].params}`, '-c:a', 'copy'],
        'output.mp4',
      );
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al reducir el ruido. Asegúrate de que el archivo es un vídeo MP4 o WebM válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, `_denoise_${LEVELS[level].label.toLowerCase()}.mp4`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LEVELS.map((l, i) => (
              <button
                key={i}
                onClick={() => setLevel(i)}
                className={[
                  'px-4 py-4 rounded-xl border text-left transition-colors space-y-1',
                  level === i
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                    : 'border-[var(--color-border)] bg-white hover:border-[var(--color-tools-border)]',
                ].join(' ')}
              >
                <p className={`text-sm font-semibold ${level === i ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>
                  {l.label}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{l.description}</p>
              </button>
            ))}
          </div>
          <div className="p-4 bg-[var(--color-tools-bg)] rounded-xl border border-[var(--color-tools-border)]">
            <p className="text-xs text-[var(--color-text-secondary)]">
              El filtro <strong>hqdn3d</strong> analiza el vídeo espacial y temporalmente para eliminar el ruido digital. No requiere referencia de un frame limpio.
            </p>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Reducir ruido — {LEVELS[level].label}
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
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Original: <strong className="text-[var(--color-text)]">{formatBytes(video.size)}</strong></span>
            <span className="text-[var(--color-tools-icon)] font-bold">→</span>
            <span className="text-[var(--color-text-secondary)]">Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] font-medium">{LEVELS[level].label}</span>
          </div>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar vídeo sin ruido
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
