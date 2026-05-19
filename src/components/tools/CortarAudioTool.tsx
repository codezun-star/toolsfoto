import { useState, useRef } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

function toSeconds(val: string): number {
  const parts = val.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(val) || 0;
}

function toTimeStr(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getOutputExt(filename: string): string {
  const m = filename.match(/\.(\w+)$/);
  const ext = m?.[1]?.toLowerCase() ?? 'mp3';
  return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext) ? ext : 'mp3';
}

export default function CortarAudioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:10');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  function handleFile(f: AudioFile) {
    if (audioUrl) revokeURL(audioUrl);
    setAudio(f);
    setAudioUrl(URL.createObjectURL(f.file));
  }

  function handleClear() {
    if (audioUrl) revokeURL(audioUrl);
    if (resultUrl) revokeURL(resultUrl);
    setAudio(null);
    setAudioUrl(null);
    setResultUrl(null);
    setResultSize(0);
    setAudioDuration(0);
    setStartTime('00:00');
    setEndTime('00:10');
    setError(null);
  }

  function onAudioLoaded() {
    const d = audioRef.current?.duration ?? 0;
    setAudioDuration(d);
    setEndTime(toTimeStr(Math.min(d, 10)));
  }

  async function process() {
    if (!audio) return;
    const start = toSeconds(startTime);
    const end = toSeconds(endTime);
    if (end <= start) { setError('El tiempo de fin debe ser mayor que el de inicio.'); return; }
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ext = getOutputExt(audio.name);
      const ff = await createFFmpeg(setProgress);
      const blob = await runFFmpeg(ff, audio.file, `input.${ext}`, ['-ss', String(start), '-to', String(end), '-c', 'copy'], `output.${ext}`);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al cortar el audio. Prueba con un rango de tiempo diferente.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, '_cortado.' + getOutputExt(audio.name));
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu audio" onFile={handleFile} onClear={handleClear} current={audio} />

      {audioUrl && audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            onLoadedMetadata={onAudioLoaded}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">
                Inicio {audioDuration > 0 && <span className="font-normal normal-case">(máx. {toTimeStr(audioDuration)})</span>}
              </label>
              <input
                type="text"
                placeholder="mm:ss"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Fin</label>
              <input
                type="text"
                placeholder="mm:ss"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Cortar audio
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            {progress === 0 ? 'Cargando procesador…' : `Cortando… ${progress}%`}
          </p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <audio src={resultUrl} controls className="w-full" />
          <p className="text-sm text-[var(--color-text-muted)] text-center">{formatBytes(resultSize)}</p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar audio cortado
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Cortar otro audio
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
