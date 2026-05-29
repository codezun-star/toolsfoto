import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { Loader2 } from 'lucide-react';

const NOTE_NAMES = ['Do', 'Do#/Reb', 'Re', 'Re#/Mib', 'Mi', 'Fa', 'Fa#/Solb', 'Sol', 'Sol#/Lab', 'La', 'La#/Sib', 'Si'];
const NOTE_NAMES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function freqToNote(freq: number): { note: string; noteEn: string; octave: number; cents: number } {
  const A4 = 440;
  const semitones = 12 * Math.log2(freq / A4);
  const semitoneRound = Math.round(semitones);
  const noteIndex = ((semitoneRound % 12) + 12) % 12;
  const octave = Math.floor(semitoneRound / 12) + 4;
  const exactSemitones = 12 * Math.log2(freq / A4);
  const cents = Math.round((exactSemitones - semitoneRound) * 100);
  return {
    note: NOTE_NAMES[noteIndex] ?? '?',
    noteEn: NOTE_NAMES_EN[noteIndex] ?? '?',
    octave,
    cents,
  };
}

function detectPitch(data: Float32Array, sampleRate: number): number {
  // Autocorrelation-based pitch detection
  const SIZE = 2048;
  const buf = data.slice(0, SIZE);
  let maxCorr = 0;
  let bestLag = -1;
  const minLag = Math.floor(sampleRate / 2000);  // 2000 Hz max
  const maxLag = Math.floor(sampleRate / 50);    // 50 Hz min

  for (let lag = minLag; lag < maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      corr += (buf[i] ?? 0) * (buf[i + lag] ?? 0);
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag === -1 || maxCorr < 0.01) return 0;
  return sampleRate / bestLag;
}

export default function DetectarTonoTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ freq: number; note: string; noteEn: string; octave: number; cents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    setAudio(null);
    setResult(null);
    setError(null);
  }

  async function process() {
    if (!audio) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      const arrayBuffer = await audio.file.arrayBuffer();
      const audioCtx = new AudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();

      const data = decoded.getChannelData(0);
      // Take a 2048-sample window from the middle of the audio
      const mid = Math.floor(decoded.length / 2);
      const chunk = data.slice(mid, mid + 2048);
      const freq = detectPitch(chunk, decoded.sampleRate);

      if (freq < 20 || freq > 20000) {
        setError('No se detectó un tono claro. Prueba con audio que contenga un tono musical definido.');
        return;
      }

      const noteInfo = freqToNote(freq);
      setResult({ freq: Math.round(freq * 100) / 100, ...noteInfo });
    } catch (err) {
      console.error('[DetectarTono] Error:', err);
      setError('No se pudo analizar el audio. Asegúrate de que es un formato compatible.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !result && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Se analizará el fragmento central del audio para detectar el tono dominante. Funciona mejor con instrumentos solistas o voces.
          </p>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Detectar tono
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Detectando tono…</p>
        </div>
      )}

      {result && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-5">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-[var(--color-accent)]">{result.noteEn}{result.octave}</p>
            <p className="text-2xl font-bold text-[var(--color-text)] mt-1">{result.note}</p>
            <p className="text-lg text-[var(--color-text-secondary)] mt-1">{result.freq} Hz</p>
            {result.cents !== 0 && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {result.cents > 0 ? `+${result.cents}` : result.cents} cents
              </p>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] text-center">
            Análisis del fragmento central del audio mediante autocorrelación
          </div>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Analizar otro audio
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
