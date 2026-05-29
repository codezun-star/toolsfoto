import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const FPS_PRESETS = [60, 30, 25, 24, 15, 10];

export default function ReducirFPSTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [fps, setFps] = useState(30);
  const [customFps, setCustomFps] = useState('');
  const [useCustom, setUseCustom] = useState(false);
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

  const targetFps = useCustom ? (Number(customFps) || 30) : fps;

  async function process() {
    if (!video) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const buf = await video.file.arrayBuffer();
      const ext = video.name.split('.').pop()?.toLowerCase() ?? 'mp4';
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));

      await ff.exec([
        '-i', `input.${ext}`,
        '-vf', `fps=${targetFps}`,
        '-c:v', 'libx264', '-c:a', 'copy',
        'output.mp4',
      ]);

      const data = await ff.readFile('output.mp4') as Uint8Array;
      if (!data || data.length === 0) throw new Error('El procesador produjo un archivo vacío. Prueba con otro formato de vídeo.');
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[ReducirFPS] Error FFmpeg:', err);
      setError('Error al cambiar los FPS. Asegúrate de que el archivo es un vídeo válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, `_${targetFps}fps.mp4`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Fotogramas por segundo (FPS)</h2>
            <div className="flex gap-2 flex-wrap">
              {FPS_PRESETS.map((f) => (
                <button
                  key={f}
                  onClick={() => { setFps(f); setUseCustom(false); }}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    !useCustom && fps === f
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {f} fps
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="custom"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="accent-[var(--color-accent)]"
              />
              <label htmlFor="custom" className="text-sm font-medium text-[var(--color-text)]">FPS personalizado</label>
              {useCustom && (
                <input
                  type="number"
                  value={customFps}
                  min={1}
                  max={120}
                  placeholder="ej: 20"
                  onChange={(e) => setCustomFps(e.target.value)}
                  className="w-24 px-2 py-1.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
                />
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">Solo se reducen los FPS, no se aumentan. Si el vídeo ya tiene menos FPS del objetivo, el resultado no cambia.</p>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Cambiar a {targetFps} FPS
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Original: <strong className="text-[var(--color-text)]">{formatBytes(video.size)}</strong> →
            {targetFps} FPS: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar vídeo a {targetFps} FPS
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
