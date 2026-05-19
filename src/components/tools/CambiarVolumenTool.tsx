import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

function getOutputExt(filename: string): string {
  const m = filename.match(/\.(\w+)$/);
  const ext = m?.[1]?.toLowerCase() ?? 'mp3';
  return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext) ? ext : 'mp3';
}

const DB_PRESETS = [-20, -15, -10, -6, -3, 0, 3, 6, 10, 15, 20];

export default function CambiarVolumenTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [db, setDb] = useState(0);
  const [normalize, setNormalize] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
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
      const ext = getOutputExt(audio.name);
      const ff = await createFFmpeg(setProgress);
      const filterArg = normalize
        ? 'loudnorm'
        : `volume=${db}dB`;
      const blob = await runFFmpeg(ff, audio.file, `input.${ext}`, ['-af', filterArg], `output.${ext}`);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al ajustar el volumen. Asegúrate de que el archivo es un formato válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const ext = getOutputExt(audio.name);
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, `_volumen.${ext}`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[var(--color-text)]">Ajuste de volumen</p>
              <span className={['text-sm font-bold tabular-nums', db > 0 ? 'text-[var(--color-accent)]' : db < 0 ? 'text-blue-600' : 'text-[var(--color-text-muted)]'].join(' ')}>
                {db > 0 ? `+${db}` : db} dB
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={db}
              onChange={e => setDb(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
              <span>-20 dB</span>
              <span>0 dB</span>
              <span>+20 dB</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {DB_PRESETS.map(v => (
                <button
                  key={v}
                  onClick={() => setDb(v)}
                  className={['px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors', db === v ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-tools-border)]'].join(' ')}
                >
                  {v > 0 ? `+${v}` : v} dB
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg)] transition-colors">
            <input
              type="checkbox"
              checked={normalize}
              onChange={e => setNormalize(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-accent)]"
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">Normalizar audio</p>
              <p className="text-xs text-[var(--color-text-muted)]">Ajusta automáticamente al nivel máximo sin distorsión (ignora el slider)</p>
            </div>
          </label>

          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            {normalize ? 'Normalizar audio' : `Aplicar ${db > 0 ? '+' : ''}${db} dB`}
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
        </div>
      )}

      {resultUrl && audio && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <audio src={resultUrl} controls className="w-full" />
          <p className="text-sm text-[var(--color-text-secondary)]">Tamaño: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar audio
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
