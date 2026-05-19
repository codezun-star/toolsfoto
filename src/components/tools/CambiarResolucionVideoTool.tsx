import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const PRESETS = [
  { label: '4K (3840×2160)', width: 3840, height: 2160 },
  { label: '1080p (1920×1080)', width: 1920, height: 1080 },
  { label: '720p (1280×720)', width: 1280, height: 720 },
  { label: '480p (854×480)', width: 854, height: 480 },
  { label: '360p (640×360)', width: 640, height: 360 },
  { label: 'Personalizado', width: 0, height: 0 },
] as const;

export default function CambiarResolucionVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [presetIdx, setPresetIdx] = useState(2);
  const [customW, setCustomW] = useState(1280);
  const [customH, setCustomH] = useState(720);
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
    if (!video) return;
    const isCustom = presetIdx === PRESETS.length - 1;
    const targetW = isCustom ? customW : PRESETS[presetIdx].width;
    const targetH = isCustom ? customH : PRESETS[presetIdx].height;
    if (targetW <= 0 || targetH <= 0) { setError('Las dimensiones deben ser mayores que 0.'); return; }

    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg((p) => setProgress(p));
      // scale mantiene aspect ratio forzando el ancho y calculando el alto par
      const scaleFilter = `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2`;
      const blob = await runFFmpeg(
        ff,
        video.file,
        'input.mp4',
        ['-vf', scaleFilter, '-c:a', 'copy'],
        'output.mp4',
      );
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al cambiar la resolución. Comprueba que el formato es compatible.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const isCustom = presetIdx === PRESETS.length - 1;
    const label = isCustom ? `${customW}x${customH}` : PRESETS[presetIdx].label.split(' ')[0];
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.file.name.replace(/\.[^.]+$/, `_${label}.mp4`);
    a.click();
  }

  const isCustom = presetIdx === PRESETS.length - 1;

  return (
    <div className="space-y-6">
      <VideoUploader onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-5">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Resolución de salida</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPresetIdx(i)}
                  className={['px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left', presetIdx === i ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {isCustom && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Ancho (px)</label>
                  <input type="number" min={1} value={customW} onChange={e => setCustomW(Number(e.target.value))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Alto (px)</label>
                  <input type="number" min={1} value={customH} onChange={e => setCustomH(Number(e.target.value))} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]" />
                </div>
              </div>
            )}
            <p className="text-xs text-[var(--color-text-muted)]">
              El vídeo se escala respetando su relación de aspecto. Si la relación no coincide, se añaden barras negras.
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Cambiar resolución
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
