import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

function getOutputExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'aac') return ext;
  return 'mp3';
}

const MIME: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' };

export default function CambiarPitchSinTempoTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [cents, setCents] = useState(0);
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
    if (!audio || cents === 0) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const ext = getOutputExt(audio.name);
      const buf = await audio.file.arrayBuffer();
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));

      // Pitch shift by cents without changing tempo:
      // 1. Change sample rate to shift pitch (asetrate)
      // 2. Resample back to original (aresample)
      // 3. Compensate speed with atempo (inverse ratio)
      const ratio = Math.pow(2, cents / 1200);
      const baseRate = 44100;
      const newRate = Math.round(baseRate * ratio);
      const tempoCompensation = 1 / ratio;

      // Clamp atempo to [0.5, 2.0] — chain if needed
      let filter: string;
      if (tempoCompensation >= 0.5 && tempoCompensation <= 2.0) {
        filter = `asetrate=${newRate},aresample=${baseRate},atempo=${tempoCompensation.toFixed(6)}`;
      } else if (tempoCompensation < 0.5) {
        filter = `asetrate=${newRate},aresample=${baseRate},atempo=0.5,atempo=${(tempoCompensation / 0.5).toFixed(6)}`;
      } else {
        filter = `asetrate=${newRate},aresample=${baseRate},atempo=2.0,atempo=${(tempoCompensation / 2.0).toFixed(6)}`;
      }

      await ff.exec(['-i', `input.${ext}`, '-af', filter, `output.${ext}`]);
      const data = await ff.readFile(`output.${ext}`) as Uint8Array;
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile(`output.${ext}`); } catch { /* ignore */ }
      const blob = new Blob([data], { type: MIME[ext] ?? 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[CambiarPitchSinTempo] Error FFmpeg:', err);
      setError('Error al procesar el audio. Prueba con un valor de cents diferente.');
    } finally {
      setProcessing(false);
    }
  }

  const semitones = (cents / 100).toFixed(2);
  const sign = cents > 0 ? '+' : '';

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Ajuste de pitch</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--color-text)]">Cents</label>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-[var(--color-accent)]">{sign}{cents}</span>
                  <span className="text-sm text-[var(--color-text-muted)] ml-1">cents ({sign}{semitones} semitonos)</span>
                </div>
              </div>
              <input
                type="range"
                value={cents}
                min={-1200}
                max={1200}
                step={1}
                onChange={(e) => setCents(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                <span>−1200 (−1 oct)</span>
                <span>0</span>
                <span>+1200 (+1 oct)</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[-1200, -700, -500, -100, 100, 500, 700, 1200].map((c) => (
                <button
                  key={c}
                  onClick={() => setCents(c)}
                  className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                    cents === c ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {c > 0 ? `+${c}` : c}¢
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button
            onClick={process}
            disabled={cents === 0}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-60"
          >
            Cambiar pitch
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
          <p className="text-sm text-[var(--color-text-secondary)]">
            Pitch desplazado <strong className="text-[var(--color-accent)]">{sign}{cents} cents</strong> ({sign}{semitones} semitonos) sin cambiar el tempo.
            Tamaño: <strong>{formatBytes(resultSize)}</strong>
          </p>
          <audio src={resultUrl} controls className="w-full" />
          <button
            onClick={() => {
              const ext = getOutputExt(audio.name);
              const a = document.createElement('a');
              a.href = resultUrl!;
              a.download = audio.name.replace(/\.[^.]+$/, `_pitch${sign}${cents}c.${ext}`);
              a.click();
            }}
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
