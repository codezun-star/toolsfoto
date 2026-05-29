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

interface Parts {
  url1: string; size1: number;
  url2: string; size2: number;
}

export default function DividirAudioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [splitAt, setSplitAt] = useState(30);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parts, setParts] = useState<Parts | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (parts) {
      revokeURL(parts.url1);
      revokeURL(parts.url2);
    }
    setAudio(null);
    setParts(null);
    setError(null);
  }

  async function process() {
    if (!audio) return;
    if (parts) { revokeURL(parts.url1); revokeURL(parts.url2); setParts(null); }
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg(setProgress);
      const ext = getOutputExt(audio.name);
      const buf = await audio.file.arrayBuffer();
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));

      // Part 1: from start to splitAt
      await ff.exec(['-i', `input.${ext}`, '-t', String(splitAt), `part1.${ext}`]);
      const data1 = await ff.readFile(`part1.${ext}`) as Uint8Array;
      if (!data1 || data1.length === 0) throw new Error('La parte 1 quedó vacía. Prueba con otro punto de corte.');
      try { await ff.deleteFile(`part1.${ext}`); } catch { /* ignore */ }

      // Part 2: from splitAt to end
      await ff.exec(['-i', `input.${ext}`, '-ss', String(splitAt), `part2.${ext}`]);
      const data2 = await ff.readFile(`part2.${ext}`) as Uint8Array;
      if (!data2 || data2.length === 0) throw new Error('La parte 2 quedó vacía. El punto de corte puede estar más allá de la duración del audio.');
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile(`part2.${ext}`); } catch { /* ignore */ }

      const mime = MIME[ext] ?? 'audio/mpeg';
      const blob1 = new Blob([data1], { type: mime });
      const blob2 = new Blob([data2], { type: mime });
      setParts({
        url1: URL.createObjectURL(blob1), size1: blob1.size,
        url2: URL.createObjectURL(blob2), size2: blob2.size,
      });
      setProgress(100);
    } catch (err) {
      console.error('[DividirAudio] Error FFmpeg:', err);
      setError('Error al dividir el audio. Asegúrate de que el tiempo de corte está dentro de la duración del archivo.');
    } finally {
      setProcessing(false);
    }
  }

  function dl(url: string, suffix: string) {
    if (!audio) return;
    const ext = getOutputExt(audio.name);
    const a = document.createElement('a');
    a.href = url;
    a.download = audio.name.replace(/\.[^.]+$/, `_${suffix}.${ext}`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !parts && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Punto de división</h2>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-text)]">Dividir en el segundo: {splitAt}s</label>
              <input type="range" value={splitAt} min={1} max={3600} step={1} onChange={(e) => setSplitAt(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-text)]">O introduce el valor exacto (segundos)</label>
              <input
                type="number"
                value={splitAt}
                min={1}
                step={0.1}
                onChange={(e) => setSplitAt(Number(e.target.value))}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)]"
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Parte 1: 0 s – {splitAt} s &nbsp;|&nbsp; Parte 2: {splitAt} s – final
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Dividir audio
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

      {parts && (
        <div className="space-y-3">
          {([
            { url: parts.url1, size: parts.size1, label: 'Parte 1', suffix: 'parte1' },
            { url: parts.url2, size: parts.size2, label: 'Parte 2', suffix: 'parte2' },
          ] as const).map(({ url, size, label, suffix }) => (
            <div key={label} className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--color-text)]">{label}</span>
                <span className="text-sm text-[var(--color-text-muted)]">{formatBytes(size)}</span>
              </div>
              <audio src={url} controls className="w-full" />
              <button
                onClick={() => dl(url, suffix)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm"
              >
                <Download size={16} />
                Descargar {label}
              </button>
            </div>
          ))}
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Dividir otro audio
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
