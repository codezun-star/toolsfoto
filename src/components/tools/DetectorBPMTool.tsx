import { useState, useRef } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { Loader2, Music } from 'lucide-react';

function detectBPM(audioBuffer: AudioBuffer): number {
  // Analyze the channel with more content
  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Apply a simple low-pass filter envelope to find beats
  const windowSize = Math.floor(sampleRate * 0.02); // 20ms windows
  const hopSize = Math.floor(sampleRate * 0.01);   // 10ms hop
  const energies: number[] = [];

  for (let i = 0; i + windowSize < channel.length; i += hopSize) {
    let energy = 0;
    for (let j = i; j < i + windowSize; j++) energy += channel[j] * channel[j];
    energies.push(energy / windowSize);
  }

  // Find onset strength (difference of energy)
  const onsets: number[] = [];
  for (let i = 1; i < energies.length; i++) {
    onsets.push(Math.max(0, energies[i] - energies[i - 1]));
  }

  // Normalize
  const maxOnset = Math.max(...onsets);
  if (maxOnset === 0) return 0;
  const normOnsets = onsets.map((o) => o / maxOnset);

  // Threshold-based beat detection
  const thresh = 0.3;
  const beatTimes: number[] = [];
  const minIntervalSamples = Math.floor((60 / 220) * (sampleRate / hopSize)); // max 220 BPM
  let lastBeat = -minIntervalSamples;

  for (let i = 1; i < normOnsets.length - 1; i++) {
    if (normOnsets[i] > thresh && normOnsets[i] > normOnsets[i - 1] && normOnsets[i] >= normOnsets[i + 1]) {
      if (i - lastBeat >= minIntervalSamples) {
        beatTimes.push(i * hopSize / sampleRate);
        lastBeat = i;
      }
    }
  }

  if (beatTimes.length < 4) return 0;

  // Compute inter-beat intervals
  const intervals: number[] = [];
  for (let i = 1; i < beatTimes.length; i++) intervals.push(beatTimes[i] - beatTimes[i - 1]);

  // Histogram of BPMs from intervals
  const bpmHist = new Map<number, number>();
  for (const iv of intervals) {
    if (iv <= 0) continue;
    const bpm = Math.round(60 / iv);
    if (bpm < 40 || bpm > 220) continue;
    // Also consider half and double time
    for (const b of [bpm, bpm * 2, Math.round(bpm / 2)]) {
      if (b >= 60 && b <= 200) bpmHist.set(b, (bpmHist.get(b) ?? 0) + 1);
    }
  }

  if (bpmHist.size === 0) return 0;
  let bestBPM = 0;
  let bestCount = 0;
  for (const [bpm, count] of bpmHist) {
    if (count > bestCount) { bestCount = count; bestBPM = bpm; }
  }
  return bestBPM;
}

export default function DetectorBPMTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function handleClear() {
    setAudio(null);
    setBpm(null);
    setError(null);
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
  }

  async function analyze() {
    if (!audio) return;
    setProcessing(true);
    setBpm(null);
    setError(null);
    try {
      const buf = await audio.file.arrayBuffer();
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const audioBuffer = await ctx.decodeAudioData(buf);
      await ctx.close();
      audioCtxRef.current = null;

      // Analyze up to the first 3 minutes for performance
      const maxSamples = Math.min(audioBuffer.length, audioBuffer.sampleRate * 180);
      const trimmed = new AudioBuffer({
        length: maxSamples,
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
      });
      for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
        trimmed.getChannelData(c).set(audioBuffer.getChannelData(c).subarray(0, maxSamples));
      }

      const result = detectBPM(trimmed);
      setBpm(result > 0 ? result : null);
      if (result === 0) setError('No se pudo detectar el BPM. Prueba con una pista con ritmo más marcado.');
    } catch {
      setError('Error al analizar el audio. Comprueba el formato del archivo.');
    } finally {
      setProcessing(false);
    }
  }

  function getBPMLabel(b: number): string {
    if (b < 70) return 'Muy lento (larghetto)';
    if (b < 90) return 'Lento (andante)';
    if (b < 110) return 'Moderado (moderato)';
    if (b < 130) return 'Rápido (allegro)';
    if (b < 160) return 'Muy rápido (vivace)';
    return 'Extremadamente rápido (presto)';
  }

  return (
    <div className="space-y-6">
      <AudioUploader onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && bpm === null && !processing && (
        <button onClick={analyze} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
          Detectar BPM
        </button>
      )}

      {processing && (
        <div className="p-8 text-center space-y-3">
          <Loader2 size={32} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Analizando ritmo… (puede tardar unos segundos)</p>
        </div>
      )}

      {bpm !== null && (
        <div className="space-y-4">
          <div className="p-8 bg-white rounded-xl border border-[var(--color-tools-border)] text-center space-y-2">
            <Music size={32} className="mx-auto text-[var(--color-tools-icon)]" />
            <div className="text-6xl font-extrabold text-[var(--color-accent)]">{bpm}</div>
            <div className="text-lg font-semibold text-[var(--color-text)]">BPM</div>
            <div className="text-sm text-[var(--color-text-secondary)]">{getBPMLabel(bpm)}</div>
          </div>

          <div className="p-4 bg-[var(--color-tools-bg)] border border-[var(--color-tools-border)] rounded-xl">
            <p className="text-xs text-[var(--color-text-secondary)] font-semibold mb-2">Equivalencias musicales</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[bpm, Math.round(bpm / 2), bpm * 2].filter((b) => b >= 40 && b <= 300).map((b, i) => (
                <div key={i} className="p-2 bg-white rounded-lg border border-[var(--color-border)]">
                  <div className="text-lg font-bold text-[var(--color-text)]">{b}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{i === 0 ? 'Original' : i === 1 ? 'Mitad' : 'Doble'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={analyze} className="flex-1 py-2.5 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
              Analizar de nuevo
            </button>
            <button onClick={handleClear} className="flex-1 py-2.5 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
              Analizar otro audio
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
