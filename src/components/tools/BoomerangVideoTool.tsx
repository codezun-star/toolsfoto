import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

export default function BoomerangVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [loops, setLoops] = useState(1);
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
      const buf = await video.file.arrayBuffer();
      const ext = video.name.split('.').pop()?.toLowerCase() ?? 'mp4';
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));

      // Create reversed version
      await ff.exec(['-i', `input.${ext}`, '-vf', 'reverse', '-af', 'areverse', 'reversed.mp4']);

      // Build concat list: orig + reversed, repeated loops times
      let listContent = '';
      await ff.writeFile('orig_copy.mp4', await ff.readFile(`input.${ext}`) as Uint8Array);
      for (let i = 0; i < loops; i++) {
        listContent += `file 'orig_copy.mp4'\nfile 'reversed.mp4'\n`;
      }
      await ff.writeFile('list.txt', listContent);

      await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp4']);

      const data = await ff.readFile('output.mp4') as Uint8Array;
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile('reversed.mp4'); } catch { /* ignore */ }
      try { await ff.deleteFile('orig_copy.mp4'); } catch { /* ignore */ }
      try { await ff.deleteFile('list.txt'); } catch { /* ignore */ }
      try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[BoomerangVideo] Error FFmpeg:', err);
      setError('Error al procesar el vídeo. Asegúrate de que el archivo es un vídeo válido y no es demasiado largo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, `_boomerang.mp4`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Repeticiones del boomerang</h2>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setLoops(n)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    loops === n
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {n}× ({n * 2} clips)
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              El efecto boomerang combina el vídeo original seguido de su versión invertida. Resultado: vídeo ida + vuelta × repeticiones.
              Recomendado para clips cortos (menos de 10 segundos) para evitar archivos muy grandes.
            </p>
          </div>

          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Crear efecto boomerang
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
            Boomerang: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar vídeo boomerang
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
