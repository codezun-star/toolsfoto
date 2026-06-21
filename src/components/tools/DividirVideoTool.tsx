import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

interface Part { url: string; size: number; index: number }

function getDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('metadata')); };
    v.src = url;
  });
}

export default function DividirVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [parts, setParts] = useState(2);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Part[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    results.forEach((r) => revokeURL(r.url));
    setVideo(null);
    setResults([]);
    setError(null);
  }

  async function process() {
    if (!video) return;
    results.forEach((r) => revokeURL(r.url));
    setResults([]);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const duration = await getDuration(video.file);
      const segTime = Math.max(1, duration / parts);
      const { fetchFile } = await import('@ffmpeg/util');
      const ff = await createFFmpeg(setProgress);
      await ff.writeFile('input_src', await fetchFile(video.file));
      try {
        await ff.exec(['-i', 'input_src', '-c', 'copy', '-map', '0', '-f', 'segment', '-segment_time', String(segTime), '-reset_timestamps', '1', 'part_%03d.mp4']);
      } catch (err) {
        console.error('[DividirVideo] Error FFmpeg:', err);
        throw err;
      }
      const out: Part[] = [];
      for (let i = 0; i < parts + 4; i++) {
        const name = `part_${String(i).padStart(3, '0')}.mp4`;
        try {
          const data = (await ff.readFile(name)) as Uint8Array;
          if (data && data.length > 0) {
            out.push({ url: URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })), size: data.length, index: i });
          }
          try { await ff.deleteFile(name); } catch { /* ignore */ }
        } catch {
          break;
        }
      }
      try { await ff.deleteFile('input_src'); } catch { /* ignore */ }
      if (out.length === 0) throw new Error('sin partes');
      setResults(out);
      setProgress(100);
    } catch {
      setError('Error al dividir el vídeo. Inténtalo con otro archivo.');
    } finally {
      setProcessing(false);
    }
  }

  function downloadPart(p: Part) {
    if (!video) return;
    const a = document.createElement('a');
    a.href = p.url;
    a.download = video.name.replace(/\.[^.]+$/, `-parte${p.index + 1}.mp4`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && results.length === 0 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><label className="font-medium text-[var(--color-text)]">Número de partes</label><span className="text-[var(--color-accent)] font-bold">{parts}</span></div>
            <input type="range" min={2} max={10} value={parts} onChange={(e) => setParts(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">Dividir en {parts} partes</button>
          <p className="text-xs text-[var(--color-text-muted)] text-center">La primera vez descarga el procesador (~30 MB). El corte se hace por copia directa (sin pérdida de calidad).</p>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Dividiendo… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5"><div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">{results.length} partes generadas</p>
          <div className="space-y-2">
            {results.map((p) => (
              <div key={p.index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[var(--color-border)]">
                <span className="text-sm text-[var(--color-text)]">Parte {p.index + 1} · <span className="text-[var(--color-text-muted)]">{formatBytes(p.size)}</span></span>
                <button onClick={() => downloadPart(p)} className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold rounded-lg hover:bg-[#C93D1E] transition-colors"><Download size={12} /> MP4</button>
              </div>
            ))}
          </div>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Dividir otro vídeo</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
