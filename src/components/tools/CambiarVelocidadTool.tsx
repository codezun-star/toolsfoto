import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const SPEEDS = [
  { value: 0.25, label: '0.25×', desc: 'Cámara lenta extrema' },
  { value: 0.5, label: '0.5×', desc: 'Cámara lenta' },
  { value: 0.75, label: '0.75×', desc: 'Ligeramente lento' },
  { value: 1.25, label: '1.25×', desc: 'Ligeramente rápido' },
  { value: 1.5, label: '1.5×', desc: 'Rápido' },
  { value: 2, label: '2×', desc: 'Doble velocidad' },
];

function buildAtempoFilter(speed: number): string {
  // atempo accepts 0.5-2.0 per filter; chain for outside range
  if (speed >= 0.5 && speed <= 2.0) return `atempo=${speed}`;
  if (speed < 0.5) return `atempo=${speed * 2},atempo=0.5`;
  return `atempo=2.0,atempo=${speed / 2}`;
}

export default function CambiarVelocidadTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [speed, setSpeed] = useState(1.5);
  const [keepAudio, setKeepAudio] = useState(true);
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
      await ff.writeFile('input.mp4', new Uint8Array(buf));

      const ptsFactor = 1 / speed;
      const videoFilter = `setpts=${ptsFactor}*PTS`;

      let args: string[];
      if (keepAudio) {
        const audioFilter = buildAtempoFilter(speed);
        args = [
          '-i', 'input.mp4',
          '-filter_complex', `[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]`,
          '-map', '[v]', '-map', '[a]',
          '-c:v', 'libx264', '-crf', '23', '-preset', 'fast',
          '-c:a', 'aac',
          'output.mp4',
        ];
      } else {
        args = [
          '-i', 'input.mp4',
          '-filter:v', videoFilter,
          '-an',
          '-c:v', 'libx264', '-crf', '23', '-preset', 'fast',
          'output.mp4',
        ];
      }

      await ff.exec(args);
      const data = await ff.readFile('output.mp4') as Uint8Array;
      if (!data || data.length === 0) throw new Error('El procesador produjo un archivo vacío. Prueba con otro formato de vídeo.');
      await ff.deleteFile('input.mp4');
      await ff.deleteFile('output.mp4');

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[CambiarVelocidad] Error FFmpeg:', err);
      setError('Error al cambiar la velocidad del vídeo. Asegúrate de que es un MP4 o WebM válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, `_${speed}x.mp4`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-3">Velocidad</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className={[
                    'px-4 py-3 rounded-xl border text-left transition-colors',
                    speed === s.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)]',
                  ].join(' ')}
                >
                  <span className={`block text-base font-extrabold ${speed === s.value ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{s.label}</span>
                  <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={keepAudio} onChange={(e) => setKeepAudio(e.target.checked)} className="w-4 h-4 accent-[var(--color-accent)]" />
            <div>
              <span className="text-sm font-medium text-[var(--color-text)]">Conservar audio (con ajuste de velocidad)</span>
              <p className="text-xs text-[var(--color-text-muted)]">El audio se acelera/ralentiza al mismo ritmo que el vídeo</p>
            </div>
          </label>

          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Cambiar velocidad
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            {progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}
          </p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Original: <strong className="text-[var(--color-text)]">{formatBytes(video.size)}</strong></span>
            <span className="text-[var(--color-text-secondary)]">Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar vídeo ({speed}×)
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
