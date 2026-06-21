import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes, formatReduction } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const PRESETS = [
  { id: 0, label: 'HD 720p', desc: 'Buena calidad', args: ['-vf', 'scale=-2:720', '-crf', '28', '-b:a', '96k'] },
  { id: 1, label: 'Estándar 480p', desc: 'Equilibrado', args: ['-vf', 'scale=-2:480', '-crf', '30', '-b:a', '64k'] },
  { id: 2, label: 'Ligero 360p', desc: 'Máxima compresión', args: ['-vf', 'scale=-2:360', '-crf', '32', '-b:a', '48k'] },
];

export default function ComprimirWhatsappTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [preset, setPreset] = useState(1);
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
      const args = ['-vcodec', 'libx264', '-preset', 'veryfast', ...PRESETS[preset].args, '-acodec', 'aac', '-movflags', '+faststart'];
      const blob = await runFFmpeg(ff, video.file, 'input_src', args, 'output.mp4');
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al comprimir el vídeo. Inténtalo con otro archivo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, '-whatsapp.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Nivel de compresión</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => setPreset(p.id)} className={['px-4 py-3 rounded-xl border text-left transition-colors', preset === p.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)]'].join(' ')}>
                  <span className={['block text-sm font-bold', preset === p.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'].join(' ')}>{p.label}</span>
                  <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">Comprimir para WhatsApp</button>
          <p className="text-xs text-[var(--color-text-muted)] text-center">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Comprimiendo… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5"><div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Original: <strong className="text-[var(--color-text)]">{formatBytes(video.size)}</strong></span>
            <span className="text-[var(--color-text-secondary)]">Comprimido: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          {resultSize < video.size && <p className="text-xs text-center text-[var(--color-tools-icon)] font-semibold">Reducción del {formatReduction(video.size, resultSize)}</p>}
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"><Download size={18} /> Descargar MP4</button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Comprimir otro vídeo</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
