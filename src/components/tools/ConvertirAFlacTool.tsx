import { useState } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

export default function ConvertirAFlacTool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
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
      const ff = await createFFmpeg(setProgress);
      const ext = audio.name.split('.').pop()?.toLowerCase() ?? 'mp3';
      const buf = await audio.file.arrayBuffer();
      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));
      await ff.exec(['-i', `input.${ext}`, '-c:a', 'flac', 'output.flac']);
      const data = await ff.readFile('output.flac') as Uint8Array;
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile('output.flac'); } catch { /* ignore */ }
      const blob = new Blob([data], { type: 'audio/flac' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[ConvertirAFlac] Error FFmpeg:', err);
      setError('Error al convertir a FLAC. Asegúrate de que el archivo es un formato de audio compatible.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !audio) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = audio.name.replace(/\.[^.]+$/, '.flac');
    a.click();
  }

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-tools-bg)] border border-[var(--color-tools-border)] rounded-xl">
            <p className="text-sm text-[var(--color-text-secondary)]">
              FLAC es un formato sin pérdida: si el archivo de entrada ya es lossy (MP3, AAC…),
              el FLAC resultante preservará exactamente esa calidad sin degradarla más, pero tampoco la recuperará.
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button
            onClick={process}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            Convertir a FLAC
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Convirtiendo… ${progress}%`}</p>
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
            FLAC: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar FLAC
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Convertir otro audio
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
