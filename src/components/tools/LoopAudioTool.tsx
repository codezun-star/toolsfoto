import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

export default function LoopAudioTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [times, setTimes] = useState(3);
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
    if (!audio) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const { fetchFile } = await import('@ffmpeg/util');
      const ff = await createFFmpeg(setProgress);
      await ff.writeFile('input_audio', await fetchFile(audio.file));
      try {
        await ff.exec(['-stream_loop', String(times - 1), '-i', 'input_audio', '-acodec', 'libmp3lame', '-b:a', '192k', 'output.mp3']);
      } catch (err) {
        console.error('[LoopAudio] Error FFmpeg:', err);
        throw err;
      }
      const data = (await ff.readFile('output.mp3')) as Uint8Array;
      if (!data || data.length === 0) throw new Error('vacío');
      const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
      try { await ff.deleteFile('input_audio'); } catch { /* ignore */ }
      try { await ff.deleteFile('output.mp3'); } catch { /* ignore */ }
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al repetir el audio. Inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, `-x${times}.mp3`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><label className="font-medium text-[var(--color-text)]">Número de repeticiones</label><span className="text-[var(--color-accent)] font-bold">{times}×</span></div>
            <input type="range" min={2} max={20} value={times} onChange={(e) => setTimes(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">Repetir audio {times} veces</button>
          <p className="text-xs text-[var(--color-text-muted)] text-center">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5"><div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {resultUrl && audio && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">Audio repetido {times}×: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"><Download size={18} /> Descargar MP3</button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otro archivo</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
