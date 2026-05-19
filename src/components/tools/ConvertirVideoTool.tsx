import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const FORMATS = [
  { label: 'MP4 (H.264)', ext: 'mp4', args: ['-vcodec', 'libx264', '-acodec', 'aac', '-crf', '23'] },
  { label: 'WebM (VP8)', ext: 'webm', args: ['-vcodec', 'libvpx', '-acodec', 'libvorbis', '-crf', '10', '-b:v', '1M'] },
];

export default function ConvertirVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [format, setFormat] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
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
      const fmt = FORMATS[format];
      const ff = await createFFmpeg(setProgress);
      const blob = await runFFmpeg(ff, video.file, 'input_src', fmt.args, `output.${fmt.ext}`);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al convertir el vídeo. Asegúrate de que el archivo es un MP4 o WebM válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const fmt = FORMATS[format];
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, `.${fmt.ext}`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Formato de salida</p>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setFormat(i)}
                  className={[
                    'px-4 py-3 rounded-xl border text-sm font-semibold transition-colors',
                    format === i
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)] text-[var(--color-text-secondary)]',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Convertir vídeo
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            {progress === 0 ? 'Cargando procesador…' : `Convirtiendo… ${progress}%`}
          </p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Original: <strong className="text-[var(--color-text)]">{formatBytes(video.size)}</strong></span>
            <span className="text-[var(--color-text-secondary)]">Convertido: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar {FORMATS[format].label}
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Convertir otro vídeo
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
