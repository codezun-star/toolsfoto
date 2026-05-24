import { useState } from 'react';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { Download, Loader2 } from 'lucide-react';

const WAVE_TYPES = [
  { label: 'Seno', value: 'sine' },
  { label: 'Cuadrada', value: 'square' },
  { label: 'Triangular', value: 'triangle' },
  { label: 'Sierra', value: 'sawtooth' },
];

const NOTE_FREQS: Record<string, number> = {
  'A4 (440 Hz)': 440,
  'A3 (220 Hz)': 220,
  'C4 (261 Hz)': 261.63,
  'E4 (330 Hz)': 329.63,
  'G4 (392 Hz)': 392,
};

export default function GenerarTonoTool() {
  const [freq, setFreq] = useState(440);
  const [duration, setDuration] = useState(3);
  const [wave, setWave] = useState('sine');
  const [volume, setVolume] = useState(0.5);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setResultUrl(null);
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

      await ff.exec([
        '-f', 'lavfi',
        '-i', `${wave}=${freq}:sample_rate=44100`,
        '-t', String(duration),
        '-af', `volume=${volume}`,
        'output.mp3',
      ]);

      const data = await ff.readFile('output.mp3') as Uint8Array;
      try { await ff.deleteFile('output.mp3'); } catch { /* ignore */ }

      const blob = new Blob([data], { type: 'audio/mpeg' });
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[GenerarTono] Error FFmpeg:', err);
      setError('Error al generar el tono. Inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `tono_${freq}hz_${duration}s.mp3`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
        <h2 className="font-bold text-[var(--color-text)]">Generador de tono de referencia</h2>

        <div>
          <p className="text-sm font-medium text-[var(--color-text)] mb-2">Notas de referencia</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(NOTE_FREQS).map(([label, f]) => (
              <button
                key={label}
                onClick={() => setFreq(Math.round(f))}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  freq === Math.round(f)
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--color-text)] block mb-1">Frecuencia (Hz)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={20}
              max={20000}
              step={1}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="flex-1 accent-[var(--color-accent)]"
            />
            <input
              type="number"
              value={freq}
              min={20}
              max={20000}
              onChange={(e) => setFreq(Math.min(20000, Math.max(20, Number(e.target.value))))}
              className="w-20 px-2 py-1.5 border border-[var(--color-border)] rounded-lg text-sm text-right focus:outline-none focus:border-[var(--color-accent)]"
            />
            <span className="text-sm text-[var(--color-text-muted)]">Hz</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--color-text)] mb-2">Tipo de onda</p>
          <div className="grid grid-cols-4 gap-2">
            {WAVE_TYPES.map((w) => (
              <button
                key={w.value}
                onClick={() => setWave(w.value)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  wave === w.value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--color-text)] block mb-1">Duración (seg)</label>
            <input
              type="number"
              value={duration}
              min={1}
              max={60}
              onChange={(e) => setDuration(Math.min(60, Math.max(1, Number(e.target.value))))}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text)] block mb-1">Volumen</label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full mt-2 accent-[var(--color-accent)]"
            />
          </div>
        </div>
      </div>

      {!processing && !resultUrl && (
        <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
          Generar tono de {freq} Hz
        </button>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Generando…`}</p>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm font-medium text-[var(--color-text)]">Tono generado: {freq} Hz · {duration}s · {WAVE_TYPES.find(w => w.value === wave)?.label}</p>
          <audio controls src={resultUrl} className="w-full" />
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar tono MP3
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Generar otro tono
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
