import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const PRESETS = [
  { label: 'Suave', threshold: -18, ratio: 2, attack: 40, release: 400, makeup: 3 },
  { label: 'Podcast', threshold: -12, ratio: 4, attack: 20, release: 250, makeup: 6 },
  { label: 'Máster', threshold: -6, ratio: 8, attack: 5, release: 100, makeup: 8 },
  { label: 'Heavy', threshold: -20, ratio: 10, attack: 5, release: 50, makeup: 10 },
];

function getOutputExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'aac') return ext;
  return 'mp3';
}

const MIME: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' };

export default function CompresorAudioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [threshold, setThreshold] = useState(-12);
  const [ratio, setRatio] = useState(4);
  const [attack, setAttack] = useState(20);
  const [release, setRelease] = useState(250);
  const [makeup, setMakeup] = useState(6);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(p: typeof PRESETS[0]) {
    setThreshold(p.threshold);
    setRatio(p.ratio);
    setAttack(p.attack);
    setRelease(p.release);
    setMakeup(p.makeup);
  }

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
      const ext = getOutputExt(audio.name);
      const buf = await audio.file.arrayBuffer();
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));
      const filter = `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=${attack}:release=${release}:makeup=${makeup}dB`;
      await ff.exec(['-i', `input.${ext}`, '-af', filter, `output.${ext}`]);
      const data = await ff.readFile(`output.${ext}`) as Uint8Array;
      if (!data || data.length === 0) throw new Error('El procesador produjo un archivo vacío. Prueba con otro formato de audio.');
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile(`output.${ext}`); } catch { /* ignore */ }
      const blob = new Blob([data], { type: MIME[ext] ?? 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[CompresorAudio] Error FFmpeg:', err);
      setError('Error al aplicar la compresión. Asegúrate de que el archivo es un formato válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const ext = getOutputExt(audio.name);
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, `_comprimido.${ext}`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Parámetros del compresor</h2>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="px-3 py-1.5 rounded-lg border text-sm font-medium border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            {[
              { label: `Umbral: ${threshold} dB`, value: threshold, min: -60, max: 0, step: 1, setter: setThreshold },
              { label: `Ratio: ${ratio}:1`, value: ratio, min: 1, max: 20, step: 0.5, setter: setRatio },
              { label: `Ataque: ${attack} ms`, value: attack, min: 1, max: 200, step: 1, setter: setAttack },
              { label: `Release: ${release} ms`, value: release, min: 10, max: 1000, step: 10, setter: setRelease },
              { label: `Makeup: +${makeup} dB`, value: makeup, min: 0, max: 20, step: 0.5, setter: setMakeup },
            ].map(({ label, value, min, max, step, setter }) => (
              <div key={label} className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text)]">{label}</label>
                <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => setter(Number(e.target.value) as never)} className="w-full accent-[var(--color-accent)]" />
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Aplicar compresor
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
            Original: <strong className="text-[var(--color-text)]">{formatBytes(audio.size)}</strong> →
            Comprimido: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <audio src={resultUrl} controls className="w-full" />
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar audio comprimido
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
