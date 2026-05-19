import { useState, useRef } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { formatBytes } from '@/lib/utils/format';
import Slider from '@/components/ui/Slider';
import { Download, Loader2 } from 'lucide-react';

function getOutputExt(filename: string): string {
  const m = filename.match(/\.(\w+)$/);
  const ext = m?.[1]?.toLowerCase() ?? 'mp3';
  return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext) ? ext : 'mp3';
}

export default function AgregarFadeAudioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [fadeIn, setFadeIn] = useState(2);
  const [fadeOut, setFadeOut] = useState(2);
  const [applyFadeIn, setApplyFadeIn] = useState(true);
  const [applyFadeOut, setApplyFadeOut] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  function handleFile(f: AudioFile) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setAudio(f);
    setAudioUrl(URL.createObjectURL(f.file));
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  function handleClear() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setAudio(null);
    setAudioUrl(null);
    setResultUrl(null);
    setResultSize(0);
    setDuration(0);
    setError(null);
  }

  async function process() {
    if (!audio || (!applyFadeIn && !applyFadeOut)) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ext = getOutputExt(audio.name);
      const ff = await createFFmpeg(setProgress);
      const filters: string[] = [];
      if (applyFadeIn) filters.push(`afade=t=in:st=0:d=${fadeIn}`);
      if (applyFadeOut && duration > 0) filters.push(`afade=t=out:st=${Math.max(0, duration - fadeOut)}:d=${fadeOut}`);
      const filterStr = filters.join(',');
      const blob = await runFFmpeg(ff, audio.file, `input.${ext}`, ['-af', filterStr], `output.${ext}`);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al aplicar el fade. Inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const ext = getOutputExt(audio.name);
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, `_fade.${ext}`);
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
            onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
            className="w-full"
          />
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Configuración del fade</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={applyFadeIn} onChange={e => setApplyFadeIn(e.target.checked)} className="accent-[var(--color-accent)] w-4 h-4" />
              <span className="text-sm font-medium text-[var(--color-text)]">Fade in (entrada)</span>
            </label>
            {applyFadeIn && <Slider label="Duración fade in" value={fadeIn} min={0.5} max={Math.min(10, duration || 10)} step={0.5} unit="s" onChange={setFadeIn} />}

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={applyFadeOut} onChange={e => setApplyFadeOut(e.target.checked)} className="accent-[var(--color-accent)] w-4 h-4" />
              <span className="text-sm font-medium text-[var(--color-text)]">Fade out (salida)</span>
            </label>
            {applyFadeOut && <Slider label="Duración fade out" value={fadeOut} min={0.5} max={Math.min(10, duration || 10)} step={0.5} unit="s" onChange={setFadeOut} />}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button
            onClick={process}
            disabled={!applyFadeIn && !applyFadeOut}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-40"
          >
            Aplicar fade
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium">{progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <audio src={resultUrl} controls className="w-full" />
          <p className="text-sm text-[var(--color-text-muted)] text-center">{formatBytes(resultSize)}</p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar audio con fade
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otro audio
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
