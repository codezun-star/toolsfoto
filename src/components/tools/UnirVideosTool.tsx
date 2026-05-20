import { useState, useRef } from 'react';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, Trash2, Plus } from 'lucide-react';

interface VideoItem { id: number; file: File; url: string }

export default function UnirVideosTool() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newItems: VideoItem[] = Array.from(files)
      .filter((f) => f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name))
      .slice(0, 10 - videos.length)
      .map((file) => ({ id: nextId.current++, file, url: URL.createObjectURL(file) }));
    setVideos((prev) => [...prev, ...newItems]);
  }

  function removeVideo(id: number) {
    setVideos((prev) => {
      const item = prev.find((v) => v.id === id);
      if (item) revokeURL(item.url);
      return prev.filter((v) => v.id !== id);
    });
  }

  function handleClear() {
    videos.forEach((v) => revokeURL(v.url));
    if (resultUrl) revokeURL(resultUrl);
    setVideos([]);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
    setProgress(0);
  }

  async function process() {
    if (videos.length < 2) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg((p) => setProgress(p));
      const listLines: string[] = [];
      for (let i = 0; i < videos.length; i++) {
        const name = `input${i}.mp4`;
        const buf = await videos[i].file.arrayBuffer();
        await ff.writeFile(name, new Uint8Array(buf));
        listLines.push(`file '${name}'`);
      }
      const listContent = listLines.join('\n');
      await ff.writeFile('list.txt', new TextEncoder().encode(listContent));
      await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', 'output.mp4']);
      const data = await ff.readFile('output.mp4') as Uint8Array;
      await ff.deleteFile('list.txt');
      await ff.deleteFile('output.mp4');
      for (let i = 0; i < videos.length; i++) await ff.deleteFile(`input${i}.mp4`);
      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[UnirVideos] Error FFmpeg:', err);
      setError('Error al unir los vídeos. Asegúrate de que todos los archivos son vídeos válidos.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'videos_unidos.mp4';
    a.click();
  }

  return (
    <div className="space-y-6">
      {videos.length === 0 && !resultUrl && (
        <div
          className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-accent)] transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        >
          <Plus size={28} className="mx-auto text-[var(--color-text-muted)] mb-2" />
          <p className="text-sm font-semibold text-[var(--color-text)]">Sube tus vídeos</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">MP4, WebM, MOV, AVI · Máximo 10 clips</p>
        </div>
      )}

      <input ref={inputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />

      {videos.length > 0 && !resultUrl && (
        <div className="space-y-4">
          <div className="space-y-2">
            {videos.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--color-border)]">
                <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] rounded-full text-xs font-bold flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{v.file.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(v.file.size)}</p>
                </div>
                <button onClick={() => removeVideo(v.id)} className="text-[var(--color-text-muted)] hover:text-red-600 transition-colors flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {videos.length < 10 && (
            <button onClick={() => inputRef.current?.click()} className="w-full py-2.5 border border-dashed border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors flex items-center justify-center gap-2">
              <Plus size={16} />
              Añadir más vídeos ({videos.length}/10)
            </button>
          )}

          {videos.length < 2 && (
            <p className="text-xs text-[var(--color-text-muted)] text-center">Añade al menos 2 vídeos para unirlos.</p>
          )}

          {videos.length >= 2 && (
            <>
              <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
              <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
                Unir {videos.length} vídeos
              </button>
            </>
          )}
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">{progress === 0 ? 'Cargando procesador…' : `Uniendo vídeos… ${progress}%`}</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm"><strong>{videos.length} vídeos</strong> unidos → <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar vídeo unido
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Unir otros vídeos
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
