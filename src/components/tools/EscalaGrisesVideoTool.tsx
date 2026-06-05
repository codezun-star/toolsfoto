import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const MODES = [
  { label: 'Escala de grises', filter: 'hue=s=0', description: 'Elimina todo el color. Aspecto clásico en blanco y negro.' },
  { label: 'Sepia', filter: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131', description: 'Tono marrón cálido. Efecto vintage y nostálgico.' },
  { label: 'Negativo', filter: 'negate', description: 'Invierte todos los colores del vídeo.' },
];

export default function EscalaGrisesVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [mode, setMode] = useState(0);
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
        ['-vf', MODES[mode].filter, '-c:a', 'copy'],
        'output.mp4',
      );
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al procesar el vídeo. Asegúrate de que el archivo es un MP4 o WebM válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const suffix = ['_grises', '_sepia', '_negativo'][mode];
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, `${suffix}.mp4`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODES.map((m, i) => (
              <button
                key={i}
                onClick={() => setMode(i)}
                className={[
                  'px-4 py-4 rounded-xl border text-left transition-colors space-y-1',
                  mode === i
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                    : 'border-[var(--color-border)] bg-white hover:border-[var(--color-tools-border)]',
                ].join(' ')}
              >
                <p className={`text-sm font-semibold ${mode === i ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>
                  {m.label}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{m.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Aplicar {MODES[mode].label.toLowerCase()}
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
            <span className="text-[var(--color-text-secondary)]">Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] font-medium">{MODES[mode].label}</span>
          </div>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar vídeo
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
