import { useState, useRef } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { Download, Loader2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

export default function CapturarFotogramaTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleVideo(vf: VideoFile) {
    setVideo(vf);
    const url = URL.createObjectURL(vf.file);
    setVideoUrl(url);
  }

  function handleClear() {
    if (videoUrl) revokeURL(videoUrl);
    if (resultUrl) revokeURL(resultUrl);
    setVideo(null);
    setVideoUrl(null);
    setResultUrl(null);
    setResultSize(0);
    setDuration(0);
    setTime(0);
    setError(null);
    setProgress(0);
  }

  async function process() {
    if (!video) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg((p) => setProgress(p));
      const buf = await video.file.arrayBuffer();
      await ff.writeFile('input.mp4', new Uint8Array(buf));
      await ff.exec(['-ss', String(time), '-i', 'input.mp4', '-frames:v', '1', '-q:v', '2', 'frame.png']);
      const data = await ff.readFile('frame.png') as Uint8Array;
      await ff.deleteFile('input.mp4');
      await ff.deleteFile('frame.png');
      const blob = new Blob([data], { type: 'image/png' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[CapturarFotograma] Error FFmpeg:', err);
      setError('Error al capturar el fotograma. Comprueba el formato del vídeo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.file.name.replace(/\.[^.]+$/, `_fotograma_${time}s.png`);
    a.click();
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return (
    <div className="space-y-6">
      <VideoUploader onFile={handleVideo} onClear={handleClear} current={video} />

      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full rounded-xl border border-[var(--color-border)]"
          onLoadedMetadata={(e) => {
            const d = Math.floor((e.target as HTMLVideoElement).duration);
            setDuration(d);
            setTime(0);
          }}
          controls
        />
      )}

      {video && duration > 0 && !processing && !resultUrl && (
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--color-text)]">Tiempo del fotograma</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">{formatTime(time)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={duration}
              value={time}
              onChange={(e) => {
                const t = Number(e.target.value);
                setTime(t);
                if (videoRef.current) videoRef.current.currentTime = t;
              }}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
              <span>0:00</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Capturar fotograma
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">{progress === 0 ? 'Cargando procesador…' : `Extrayendo fotograma… ${progress}%`}</p>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-4">
          <img src={resultUrl} alt="Fotograma capturado" className="w-full rounded-xl border border-[var(--color-border)]" />
          <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
            <p className="text-sm">Tamaño: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
            <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
              <Download size={18} />
              Descargar PNG
            </button>
            <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
              Capturar de otro vídeo
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
