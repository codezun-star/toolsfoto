import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import Slider from '@/components/ui/Slider';
import { Download, Loader2 } from 'lucide-react';

const POSITIONS = [
  { label: 'Centro', x: '(w-text_w)/2', y: '(h-text_h)/2' },
  { label: 'Superior izquierda', x: '10', y: '10' },
  { label: 'Superior derecha', x: 'w-text_w-10', y: '10' },
  { label: 'Inferior izquierda', x: '10', y: 'h-text_h-10' },
  { label: 'Inferior derecha', x: 'w-text_w-10', y: 'h-text_h-10' },
] as const;

export default function MarcaAguaVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [text, setText] = useState('© Mi Vídeo');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(60);
  const [posIdx, setPosIdx] = useState(0);
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
    setProgress(0);
  }

  async function process() {
    if (!video || !text.trim()) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg((p) => setProgress(p));
      const pos = POSITIONS[posIdx];
      const alpha = (opacity / 100).toFixed(2);
      // Escape special characters for FFmpeg drawtext
      const safeText = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
      const drawtextFilter = `drawtext=text='${safeText}':fontsize=${fontSize}:fontcolor=white@${alpha}:x=${pos.x}:y=${pos.y}:shadowcolor=black@${alpha}:shadowx=2:shadowy=2`;
      const blob = await runFFmpeg(
        ff,
        video.file,
        'input.mp4',
        ['-vf', drawtextFilter, '-c:a', 'copy'],
        'output.mp4',
      );
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al añadir la marca de agua. Comprueba el texto y el formato del vídeo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.file.name.replace(/\.[^.]+$/, '_marcaagua.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-5">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Marca de agua</h2>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Texto</label>
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Escribe tu marca de agua..."
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Posición</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {POSITIONS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPosIdx(i)}
                    className={['px-3 py-2 rounded-xl border text-xs font-medium transition-colors', posIdx === i ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <Slider label="Tamaño de fuente" value={fontSize} min={12} max={120} step={2} unit="px" onChange={setFontSize} />
            <Slider label="Opacidad" value={opacity} min={10} max={100} step={5} unit="%" onChange={setOpacity} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button
            onClick={process}
            disabled={!text.trim()}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-40"
          >
            Añadir marca de agua
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">{progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}</p>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(video.file.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar vídeo con marca de agua
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
