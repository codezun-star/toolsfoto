import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const MIME_MAP: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac', m4a: 'audio/mp4' };

function getExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? 'mp3';
}

// Build atempo chain to compensate for pitch shift (preserve speed)
function buildAtempo(ratio: number): string {
  const filters: string[] = [];
  let r = ratio;
  while (r < 0.5) { filters.push('atempo=0.5'); r /= 0.5; }
  while (r > 2.0) { filters.push('atempo=2.0'); r /= 2.0; }
  if (Math.abs(r - 1.0) > 0.001) filters.push(`atempo=${r.toFixed(6)}`);
  return filters.length > 0 ? filters.join(',') : 'atempo=1.0';
}

export default function AfinarAudioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [semitones, setSemitones] = useState(0);
  const [preserveSpeed, setPreserveSpeed] = useState(true);
  const [vibrato, setVibrato] = useState(false);
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
    setProgress(0);
  }

  async function process() {
    if (!audio) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg((p) => setProgress(Math.round(p * 0.9)));
      const ext = getExt(audio.file.name);
      const outExt = ext === 'mp3' || ext === 'ogg' || ext === 'aac' ? ext : 'mp3';
      const inputName = `input.${ext}`;
      const outputName = `output.${outExt}`;
      const buf = await audio.file.arrayBuffer();
      await ff.writeFile(inputName, new Uint8Array(buf));

      const pitchRatio = Math.pow(2, semitones / 12);
      const newRate = Math.round(44100 * pitchRatio);
      const filterParts: string[] = [`asetrate=${newRate}`, 'aresample=44100'];
      if (preserveSpeed) filterParts.push(buildAtempo(1 / pitchRatio));
      if (vibrato) filterParts.push('vibrato=f=5:d=0.3');

      const args = ['-i', inputName, '-af', filterParts.join(','), outputName];
      try { await ff.exec(args); } catch (err) { console.error('[AfinarAudio] FFmpeg error:', err); throw err; }

      const data = await ff.readFile(outputName) as Uint8Array;
      if (!data || data.length === 0) throw new Error('El procesador produjo un archivo vacío.');
      await ff.deleteFile(inputName).catch(() => {});
      await ff.deleteFile(outputName).catch(() => {});

      const mime = MIME_MAP[outExt] ?? 'audio/mpeg';
      const blob = new Blob([data], { type: mime });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al afinar el audio. Comprueba el formato del archivo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const ext = getExt(audio.file.name);
    const outExt = ext === 'mp3' || ext === 'ogg' || ext === 'aac' ? ext : 'mp3';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.file.name.replace(/\.[^.]+$/, `_afinado_${semitones > 0 ? '+' : ''}${semitones}st.${outExt}`);
    a.click();
  }

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const A4_NOTE = 9; // A is index 9
  const targetNote = NOTE_NAMES[(A4_NOTE + semitones + 1200) % 12];

  return (
    <div className="space-y-6">
      <AudioUploader onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !resultUrl && !processing && (
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--color-text)]">Ajuste de tono</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">
                {semitones > 0 ? '+' : ''}{semitones} semitonos {semitones !== 0 && `(→ ${targetNote})`}
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={semitones}
              onChange={(e) => setSemitones(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
              <span>-12 (una octava abajo)</span>
              <span>0</span>
              <span>+12 (una octava arriba)</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={preserveSpeed} onChange={(e) => setPreserveSpeed(e.target.checked)} className="w-4 h-4 accent-[var(--color-accent)] rounded" />
              <div>
                <span className="text-sm font-semibold text-[var(--color-text)]">Preservar velocidad (time-stretching)</span>
                <p className="text-xs text-[var(--color-text-muted)]">Mantiene la duración original al cambiar el tono</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={vibrato} onChange={(e) => setVibrato(e.target.checked)} className="w-4 h-4 accent-[var(--color-accent)] rounded" />
              <div>
                <span className="text-sm font-semibold text-[var(--color-text)]">Efecto vibrato (estilo autotune)</span>
                <p className="text-xs text-[var(--color-text-muted)]">Añade modulación de tono para efecto vocal</p>
              </div>
            </label>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} disabled={semitones === 0 && !vibrato} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50">
            Afinar audio
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm">{progress === 0 ? 'Cargando procesador…' : `Afinando… ${progress}%`}</p>
          {progress > 0 && <div className="w-full bg-[var(--color-border)] rounded-full h-2"><div className="bg-[var(--color-accent)] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>}
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <audio src={resultUrl} controls className="w-full" />
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(audio!.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} /> Descargar audio afinado
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Afinar otro audio</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
