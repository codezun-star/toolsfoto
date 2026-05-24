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

const PRESETS = [
  { label: 'Normal', bass: 0, mid: 0, treble: 0 },
  { label: 'Bajos potenciados', bass: 6, mid: 0, treble: -2 },
  { label: 'Pop', bass: 2, mid: 1, treble: 3 },
  { label: 'Rock', bass: 4, mid: -1, treble: 4 },
  { label: 'Voz', bass: -2, mid: 4, treble: 2 },
  { label: 'Clásica', bass: -2, mid: 0, treble: 2 },
];

export default function EcualizadorAudioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [bass, setBass] = useState(0);
  const [mid, setMid] = useState(0);
  const [treble, setTreble] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(p: typeof PRESETS[0]) {
    setBass(p.bass);
    setMid(p.mid);
    setTreble(p.treble);
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
      const buf = await audio.file.arrayBuffer();
      const ext = getOutputExt(audio.name);
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));

      // bass = lowshelf at 100 Hz, mid = peaking at 1000 Hz, treble = highshelf at 8000 Hz
      const filters: string[] = [];
      if (bass !== 0) filters.push(`bass=g=${bass}`);
      if (treble !== 0) filters.push(`treble=g=${treble}`);
      if (mid !== 0) filters.push(`equalizer=f=1000:t=h:width=500:g=${mid}`);

      const afFilter = filters.length > 0 ? filters.join(',') : 'anull';

      await ff.exec(['-i', `input.${ext}`, '-af', afFilter, `output.${ext}`]);
      const data = await ff.readFile(`output.${ext}`) as Uint8Array;
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile(`output.${ext}`); } catch { /* ignore */ }

      const mimeMap: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' };
      const blob = new Blob([data], { type: mimeMap[ext] ?? 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[EcualizadorAudio] Error FFmpeg:', err);
      setError('Error al ecualizar el audio. Asegúrate de que el archivo es un formato de audio válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const ext = getOutputExt(audio.name);
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, `_ecualizado.${ext}`);
    a.click();
  }

  const Slider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-[var(--color-text)]">{label}</span>
        <span className={`font-mono font-semibold ${value > 0 ? 'text-[var(--color-accent)]' : value < 0 ? 'text-blue-500' : 'text-[var(--color-text-muted)]'}`}>
          {value >= 0 ? '+' : ''}{value} dB
        </span>
      </div>
      <input
        type="range"
        min={-12}
        max={12}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>-12</span><span>0</span><span>+12</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-5">
            <h2 className="font-bold text-[var(--color-text)]">Ecualizador de 3 bandas</h2>

            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Presets</p>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <Slider label="Graves (100 Hz)" value={bass} onChange={setBass} />
            <Slider label="Medios (1 kHz)" value={mid} onChange={setMid} />
            <Slider label="Agudos (8 kHz)" value={treble} onChange={setTreble} />
          </div>

          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Aplicar ecualización
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
            Ecualizado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar audio ecualizado
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
