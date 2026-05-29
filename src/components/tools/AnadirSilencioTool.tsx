import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const MIME: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' };

function getExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ext in MIME ? ext : 'mp3';
}

export default function AnadirSilencioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [silenceStart, setSilenceStart] = useState(1);
  const [silenceEnd, setSilenceEnd] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setAudio(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!audio) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const ext = getExt(audio.name);
      const buf = await audio.file.arrayBuffer();
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));

      // Build filter: adelay adds delay at start (in ms), apad adds silence at end
      const filters: string[] = [];
      if (silenceStart > 0) filters.push(`adelay=${silenceStart * 1000}|${silenceStart * 1000}`);
      if (silenceEnd > 0) filters.push(`apad=pad_dur=${silenceEnd}`);
      const af = filters.length > 0 ? filters.join(',') : 'anull';

      try {
        await ff.exec(['-i', `input.${ext}`, '-af', af, `output.${ext}`]);
      } catch (err) {
        console.error('[AnadirSilencio] Error FFmpeg:', err);
        throw err;
      }

      const data = (await ff.readFile(`output.${ext}`)) as Uint8Array;
      if (!data || data.length === 0) throw new Error('El procesador produjo un archivo vacío. Prueba con otro formato de audio.');
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile(`output.${ext}`); } catch { /* ignore */ }

      const blob = new Blob([data], { type: MIME[ext] ?? 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al añadir el silencio. Asegúrate de que el archivo es un formato de audio válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, '_con_silencio.$&').replace('.$&', `.${getExt(audio.name)}`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-5">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
            <h2 className="font-bold text-[var(--color-text)]">Silencio a añadir</h2>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-[var(--color-text)]">Al inicio</label>
                <span className="text-sm font-mono font-bold text-[var(--color-accent)]">{silenceStart}s</span>
              </div>
              <input type="range" min={0} max={10} step={0.5} value={silenceStart} onChange={(e) => setSilenceStart(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1"><span>0s</span><span>10s</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-[var(--color-text)]">Al final</label>
                <span className="text-sm font-mono font-bold text-[var(--color-accent)]">{silenceEnd}s</span>
              </div>
              <input type="range" min={0} max={10} step={0.5} value={silenceEnd} onChange={(e) => setSilenceEnd(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1"><span>0s</span><span>10s</span></div>
            </div>
            {silenceStart === 0 && silenceEnd === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">Configura al menos un segundo de silencio al inicio o al final.</p>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button
            onClick={process}
            disabled={silenceStart === 0 && silenceEnd === 0}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50"
          >
            Añadir silencio
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

      {resultUrl && audio && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <audio src={resultUrl} controls className="w-full" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Original: <strong className="text-[var(--color-text)]">{formatBytes(audio.size)}</strong></span>
            <span className="text-[var(--color-text-secondary)]">Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar audio con silencio
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
