import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { formatBytes } from '@/lib/utils/format';
import { Loader2, Clock, Mic, Volume2, Activity } from 'lucide-react';

interface AudioMeta {
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
  fileSize: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function MedirDuracionTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [meta, setMeta] = useState<AudioMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    setAudio(null);
    setMeta(null);
    setError(null);
  }

  async function process() {
    if (!audio) return;
    setProcessing(true);
    setError(null);
    setMeta(null);
    try {
      const arrayBuffer = await audio.file.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();
      const bitrateKbps = Math.round((audio.size * 8) / audioBuffer.duration / 1000);
      setMeta({
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        bitrate: bitrateKbps,
        fileSize: audio.size,
      });
    } catch (err) {
      console.error('[MedirDuracion] Error:', err);
      setError('No se pudo analizar el archivo. Asegúrate de que es un formato de audio compatible.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !meta && (
        <button
          onClick={process}
          className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
        >
          Analizar audio
        </button>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Analizando…</p>
        </div>
      )}

      {meta && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Resultados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { Icon: Clock, label: 'Duración', value: formatDuration(meta.duration) },
              { Icon: Activity, label: 'Sample Rate', value: `${meta.sampleRate.toLocaleString()} Hz` },
              { Icon: Mic, label: 'Canales', value: meta.channels === 1 ? '1 (Mono)' : meta.channels === 2 ? '2 (Estéreo)' : `${meta.channels}` },
              { Icon: Volume2, label: 'Bitrate estimado', value: `${meta.bitrate} kbps` },
              { Icon: Clock, label: 'Tamaño del archivo', value: formatBytes(meta.fileSize) },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-lg">
                <div className="p-2 rounded-lg bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{value}</p>
                </div>
              </div>
            ))}
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
