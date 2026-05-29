import { useState } from 'react';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const NOISE_TYPES = [
  { label: 'Ruido blanco', value: 'white', description: 'Todas las frecuencias con igual energía' },
  { label: 'Ruido rosa', value: 'pink', description: 'Más energía en bajas frecuencias, suena más natural' },
  { label: 'Ruido marrón', value: 'brown', description: 'Aún más bajas frecuencias, como lluvia o viento' },
];

export default function GenerarRuidoBlancTool() {
  const [noiseType, setNoiseType] = useState('white');
  const [duration, setDuration] = useState(30);
  const [amplitude, setAmplitude] = useState(0.5);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      // anoisesrc generates noise: d=duration, color=type, amplitude=amp
      await ff.exec([
        '-f', 'lavfi',
        '-i', `anoisesrc=d=${duration}:color=${noiseType}:amplitude=${amplitude}`,
        '-ar', '44100',
        '-ac', '2',
        '-b:a', '192k',
        'output.mp3',
      ]);
      const data = await ff.readFile('output.mp3') as Uint8Array;
      try { await ff.deleteFile('output.mp3'); } catch { /* ignore */ }
      const blob = new Blob([data], { type: 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[GenerarRuidoBlanc] Error FFmpeg:', err);
      setError('Error al generar el ruido. Intenta con una duración más corta.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `ruido_${noiseType}_${duration}s.mp3`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
        <h2 className="font-bold text-[var(--color-text)]">Configuración del ruido</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">Tipo de ruido</label>
          <div className="space-y-2">
            {NOISE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setNoiseType(t.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  noiseType === t.value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                }`}
              >
                <p className={`text-sm font-semibold ${noiseType === t.value ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{t.label}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--color-text)]">Duración: {duration}s ({Math.floor(duration / 60)}m {duration % 60}s)</label>
          <input type="range" value={duration} min={5} max={3600} step={5} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>5s</span><span>30 min</span><span>1h</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--color-text)]">Amplitud: {amplitude.toFixed(2)}</label>
          <input type="range" value={amplitude} min={0.05} max={1.0} step={0.05} onChange={(e) => setAmplitude(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          <p className="text-xs text-[var(--color-text-muted)]">Volumen del ruido generado. 1.0 = máximo.</p>
        </div>
      </div>

      {!processing && !resultUrl && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Generar ruido
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Generando… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {NOISE_TYPES.find((t) => t.value === noiseType)?.label} · {duration}s · <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <audio src={resultUrl} controls className="w-full" />
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar MP3
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Generar nuevo ruido
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
