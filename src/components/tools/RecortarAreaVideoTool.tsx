import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

export default function RecortarAreaVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [cropW, setCropW] = useState(1280);
  const [cropH, setCropH] = useState(720);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
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
    if (cropW <= 0 || cropH <= 0) { setError('El ancho y alto deben ser mayores que 0.'); return; }
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg((p) => setProgress(p));
      const cropFilter = `crop=${cropW}:${cropH}:${cropX}:${cropY}`;
      const blob = await runFFmpeg(
        ff,
        video.file,
        'input.mp4',
        ['-vf', cropFilter, '-c:a', 'copy'],
        'output.mp4',
      );
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al recortar. Comprueba que las dimensiones no excedan el tamaño del vídeo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.file.name.replace(/\.[^.]+$/, '_recortado.mp4');
    a.click();
  }

  const inputClass = 'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]';

  return (
    <div className="space-y-6">
      <VideoUploader onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-5">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Área de recorte (píxeles)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Ancho</label>
                <input type="number" min={1} value={cropW} onChange={e => setCropW(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Alto</label>
                <input type="number" min={1} value={cropH} onChange={e => setCropH(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Inicio X (horizontal)</label>
                <input type="number" min={0} value={cropX} onChange={e => setCropX(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Inicio Y (vertical)</label>
                <input type="number" min={0} value={cropY} onChange={e => setCropY(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              El punto (0, 0) está en la esquina superior izquierda del vídeo. Las dimensiones deben caber dentro del vídeo original.
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Recortar área
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">{progress === 0 ? 'Cargando procesador…' : `Recortando… ${progress}%`}</p>
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
            Descargar vídeo recortado
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Recortar otro vídeo
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
