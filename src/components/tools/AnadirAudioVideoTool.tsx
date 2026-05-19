import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

export default function AnadirAudioVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [mode, setMode] = useState<'replace' | 'mix'>('replace');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function clearVideo() {
    if (resultUrl) revokeURL(resultUrl);
    setVideo(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  function clearAudio() {
    if (resultUrl) revokeURL(resultUrl);
    setAudio(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!video || !audio) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const vidBuf = await video.file.arrayBuffer();
      const audBuf = await audio.file.arrayBuffer();
      await ff.writeFile('video.mp4', new Uint8Array(vidBuf));
      await ff.writeFile('audio.mp3', new Uint8Array(audBuf));

      let args: string[];
      if (mode === 'replace') {
        args = [
          '-i', 'video.mp4', '-i', 'audio.mp3',
          '-c:v', 'copy',
          '-map', '0:v:0', '-map', '1:a:0',
          '-shortest',
          'output.mp4',
        ];
      } else {
        args = [
          '-i', 'video.mp4', '-i', 'audio.mp3',
          '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first[aout]',
          '-map', '0:v:0', '-map', '[aout]',
          '-c:v', 'copy',
          'output.mp4',
        ];
      }

      await ff.exec(args);
      const data = await ff.readFile('output.mp4') as Uint8Array;
      await ff.deleteFile('video.mp4');
      await ff.deleteFile('audio.mp3');
      await ff.deleteFile('output.mp4');

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al procesar. Verifica que los archivos son válidos y compatibles.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, '_con_audio.mp4');
    a.click();
  }

  function reset() {
    if (resultUrl) revokeURL(resultUrl);
    setVideo(null);
    setAudio(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Vídeo</p>
          <VideoUploader onFile={setVideo} onClear={clearVideo} current={video} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Audio a añadir</p>
          <AudioUploader onFile={setAudio} onClear={clearAudio} current={audio} />
        </div>
      </div>

      {video && audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Modo</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['replace', 'Reemplazar audio', 'Elimina el audio original del vídeo y añade el nuevo'],
                ['mix', 'Mezclar (música de fondo)', 'Superpone el nuevo audio sobre el existente'],
              ] as const).map(([id, label, desc]) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={[
                    'text-left px-4 py-3 rounded-xl border transition-colors',
                    mode === id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-tools-border)]',
                  ].join(' ')}
                >
                  <span className={`block text-sm font-bold ${mode === id ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{label}</span>
                  <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Procesar vídeo
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

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar vídeo con audio
          </button>
          <button onClick={reset} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otro vídeo
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
