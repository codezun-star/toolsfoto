import { useState, useRef } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { canvasToBlob, revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download } from 'lucide-react';

export default function MiniaturaVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [format, setFormat] = useState<'png' | 'jpg'>('jpg');
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
  }

  async function capture() {
    const vid = videoRef.current;
    if (!vid || !video) return;
    setError(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth || 1280;
      canvas.height = vid.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(vid, 0, 0);
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpg' ? 0.92 : undefined;
      const blob = await canvasToBlob(canvas, mime, quality);
      if (resultUrl) revokeURL(resultUrl);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al capturar el frame. Asegúrate de que el vídeo está cargado.');
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.file.name.replace(/\.[^.]+$/, `_miniatura_${time}s.${format}`);
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

      {video && duration > 0 && (
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--color-text)]">Segundo del frame</label>
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

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Formato de exportación</label>
            <div className="flex gap-2">
              {(['jpg', 'png'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={['px-4 py-1.5 rounded-lg text-sm font-medium border uppercase transition-colors', format === f ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'].join(' ')}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button onClick={capture} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Capturar miniatura
          </button>
          <p className="text-xs text-[var(--color-text-muted)] text-center">Captura directa desde el vídeo — sin necesidad de procesador adicional</p>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-4">
          <img src={resultUrl} alt="Miniatura capturada" className="w-full rounded-xl border border-[var(--color-border)]" />
          <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-3">
            <p className="text-sm">Tamaño: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
            <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
              <Download size={18} /> Descargar {format.toUpperCase()}
            </button>
            <button onClick={capture} className="w-full py-2 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors">
              Capturar otro frame
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
