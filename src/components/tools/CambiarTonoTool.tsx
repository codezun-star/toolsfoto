import { useState, useRef } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import Slider from '@/components/ui/Slider';
import { Download, Loader2 } from 'lucide-react';

function getOutputExt(filename: string): string {
  const m = filename.match(/\.(\w+)$/);
  const ext = m?.[1]?.toLowerCase() ?? 'mp3';
  return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext) ? ext : 'mp3';
}

export default function CambiarTonoTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [semitones, setSemitones] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  function handleFile(f: AudioFile) {
    if (audioUrl) revokeURL(audioUrl);
    if (resultUrl) revokeURL(resultUrl);
    setAudio(f);
    setAudioUrl(URL.createObjectURL(f.file));
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  function handleClear() {
    if (audioUrl) revokeURL(audioUrl);
    if (resultUrl) revokeURL(resultUrl);
    setAudio(null);
    setAudioUrl(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!audio || semitones === 0) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ext = getOutputExt(audio.name);
      const ff = await createFFmpeg(setProgress);
      // asetrate cambia la velocidad (y el tono), aresample restaura la velocidad original
      // Cada semitono = multiplicar frecuencia por 2^(1/12)
      const pitchFactor = Math.pow(2, semitones / 12);
      const originalRate = 44100;
      const newRate = Math.round(originalRate * pitchFactor);
      const filter = `asetrate=${newRate},aresample=${originalRate}`;
      const blob = await runFFmpeg(ff, audio.file, `input.${ext}`, ['-af', filter], `output.${ext}`);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al cambiar el tono. Inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const ext = getOutputExt(audio.name);
    const sign = semitones >= 0 ? '+' : '';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, `_tono${sign}${semitones}.${ext}`);
    a.click();
  }

  const semitonLabel = semitones === 0 ? 'Sin cambio' : semitones > 0 ? `+${semitones} semitonos (más agudo)` : `${semitones} semitonos (más grave)`;

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu audio" onFile={handleFile} onClear={handleClear} current={audio} />

      {audioUrl && audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <audio ref={audioRef} src={audioUrl} controls className="w-full" />
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Ajuste de tono</h2>
            <Slider label="Semitonos" value={semitones} min={-12} max={12} step={1} onChange={setSemitones} />
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">{semitonLabel}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              12 semitonos = 1 octava. La velocidad de reproducción no cambia, solo el tono.
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button
            onClick={process}
            disabled={semitones === 0}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-40"
          >
            Cambiar tono
          </button>
          {semitones === 0 && (
            <p className="text-xs text-[var(--color-text-muted)] text-center">Mueve el slider para cambiar el tono</p>
          )}
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
            Descargar audio con tono ajustado
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
