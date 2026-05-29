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

interface Fragment { url: string; size: number; label: string; }

export default function AudioAFragmentosTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [fragments, setFragments] = useState(4);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Fragment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (results) results.forEach((r) => revokeURL(r.url));
    setAudio(null);
    setResults(null);
    setError(null);
  }

  async function process() {
    if (!audio) return;
    if (results) { results.forEach((r) => revokeURL(r.url)); setResults(null); }
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      // Get duration via Web Audio API
      const arrayBuffer = await audio.file.arrayBuffer();
      const audioCtx = new AudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      await audioCtx.close();
      const totalDuration = decoded.duration;
      const segDuration = totalDuration / fragments;

      const ff = await createFFmpeg(setProgress);
      const ext = getOutputExt(audio.name);
      await ff.writeFile(`input.${ext}`, new Uint8Array(await audio.file.arrayBuffer()));

      const mime = MIME[ext] ?? 'audio/mpeg';
      const parts: Fragment[] = [];

      for (let i = 0; i < fragments; i++) {
        const start = i * segDuration;
        const outName = `frag${i}.${ext}`;
        await ff.exec(['-i', `input.${ext}`, '-ss', String(start), '-t', String(segDuration), outName]);
        const data = await ff.readFile(outName) as Uint8Array;
        try { await ff.deleteFile(outName); } catch { /* ignore */ }
        const blob = new Blob([data], { type: mime });
        parts.push({ url: URL.createObjectURL(blob), size: blob.size, label: `Fragmento ${i + 1}` });
        setProgress(Math.round(((i + 1) / fragments) * 100));
      }

      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      setResults(parts);
      setProgress(100);
    } catch (err) {
      console.error('[AudioAFragmentos] Error FFmpeg:', err);
      setError('Error al dividir el audio en fragmentos.');
    } finally {
      setProcessing(false);
    }
  }

  function dl(frag: Fragment, index: number) {
    if (!audio) return;
    const ext = getOutputExt(audio.name);
    const a = document.createElement('a');
    a.href = frag.url;
    a.download = audio.name.replace(/\.[^.]+$/, `_frag${index + 1}.${ext}`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !results && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Número de fragmentos</h2>
            <div className="flex gap-2 flex-wrap">
              {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setFragments(n)}
                  className={`w-12 h-12 rounded-xl border text-sm font-bold transition-colors ${
                    fragments === n
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">El audio se dividirá en {fragments} partes iguales.</p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Dividir en {fragments} fragmentos
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Procesando fragmento… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {results && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--color-text)]">{results.length} fragmentos listos para descargar</p>
          {results.map((frag, i) => (
            <div key={frag.label} className="p-4 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text)]">{frag.label}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(frag.size)}</span>
              </div>
              <audio src={frag.url} controls className="w-full" />
              <button
                onClick={() => dl(frag, i)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm"
              >
                <Download size={14} />
                Descargar {frag.label}
              </button>
            </div>
          ))}
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otro audio
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
