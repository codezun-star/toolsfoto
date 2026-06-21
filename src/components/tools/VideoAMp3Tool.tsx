import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const BITRATES = [128, 192, 256, 320];

export default function VideoAMp3Tool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [bitrate, setBitrate] = useState(192);
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
      const blob = await runFFmpeg(ff, video.file, 'input_src', ['-vn', '-acodec', 'libmp3lame', '-b:a', `${bitrate}k`], 'output.mp3');
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al extraer el audio. Asegúrate de que el vídeo tiene pista de audio.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, '.mp3');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Calidad MP3 (bitrate)</p>
            <div className="grid grid-cols-4 gap-3">
              {BITRATES.map((b) => (
                <button key={b} onClick={() => setBitrate(b)} className={['px-3 py-3 rounded-xl border text-sm font-semibold transition-colors', bitrate === b ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)] text-[var(--color-text-secondary)]'].join(' ')}>{b} kbps</button>
              ))}
            </div>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">Extraer MP3</button>
          <p className="text-xs text-[var(--color-text-muted)] text-center">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Extrayendo… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5"><div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <audio controls src={resultUrl} className="w-full" />
          <p className="text-sm text-[var(--color-text-secondary)]">MP3 ({bitrate} kbps): <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"><Download size={18} /> Descargar MP3</button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otro vídeo</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
