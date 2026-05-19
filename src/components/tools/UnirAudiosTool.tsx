import { useState, useCallback } from 'react';
import { Upload, X, GripVertical, Download, Loader2 } from 'lucide-react';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';

interface AudioItem {
  id: string;
  file: File;
  name: string;
  size: number;
}

const ACCEPT = 'audio/mpeg,audio/wav,audio/ogg,audio/aac,.mp3,.wav,.ogg,.aac';
const MAX_SIZE = 200 * 1024 * 1024;

export default function UnirAudiosTool() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((files: FileList) => {
    const newItems: AudioItem[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('audio/') && !f.name.match(/\.(mp3|wav|ogg|aac)$/i)) continue;
      if (f.size > MAX_SIZE) continue;
      newItems.push({ id: `${f.name}-${Date.now()}-${Math.random()}`, file: f, name: f.name, size: f.size });
    }
    setItems(prev => [...prev, ...newItems]);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function moveItem(fromId: string, toId: string) {
    setItems(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(i => i.id === fromId);
      const toIdx = arr.findIndex(i => i.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
  }

  async function process() {
    if (items.length < 2) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const { fetchFile } = await import('@ffmpeg/util');
      const ff = await createFFmpeg(setProgress);

      const inputNames: string[] = [];
      for (let i = 0; i < items.length; i++) {
        const name = `audio${i}.mp3`;
        await ff.writeFile(name, await fetchFile(items[i].file));
        inputNames.push(name);
      }

      // Re-encode each to mp3 then concat
      const reencoded: string[] = [];
      for (let i = 0; i < inputNames.length; i++) {
        const out = `enc${i}.mp3`;
        await ff.exec(['-i', inputNames[i], '-acodec', 'libmp3lame', '-q:a', '2', out]);
        reencoded.push(out);
      }

      // Write concat list
      const listContent = reencoded.map(n => `file '${n}'`).join('\n');
      const enc = new TextEncoder();
      await ff.writeFile('list.txt', enc.encode(listContent));
      await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp3']);
      const data = (await ff.readFile('output.mp3')) as Uint8Array;

      for (const n of [...inputNames, ...reencoded]) { try { await ff.deleteFile(n); } catch { /* ignore */ } }
      try { await ff.deleteFile('list.txt'); } catch { /* ignore */ }
      try { await ff.deleteFile('output.mp3'); } catch { /* ignore */ }

      const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al unir los audios. Asegúrate de que todos los archivos son formatos válidos.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'audios_unidos.mp3';
    a.click();
  }

  function reset() {
    if (resultUrl) revokeURL(resultUrl);
    setItems([]);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <label
        className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)] cursor-pointer transition-colors"
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
      >
        <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]">
          <Upload size={24} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-[var(--color-text)]">Añadir archivos de audio</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">MP3, WAV, OGG, AAC · Máx. 200 MB por archivo</p>
        </div>
        <input type="file" accept={ACCEPT} multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
      </label>

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{items.length} archivos · arrastra para reordenar</p>
          {items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={e => e.dataTransfer.setData('id', item.id)}
              onDragOver={e => { e.preventDefault(); setDragOverId(item.id); }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={e => { e.preventDefault(); setDragOverId(null); const from = e.dataTransfer.getData('id'); moveItem(from, item.id); }}
              className={['p-3 bg-white rounded-xl border flex items-center gap-3 cursor-grab transition-colors', dragOverId === item.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)]'].join(' ')}
            >
              <GripVertical size={16} className="text-[var(--color-text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">{item.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(item.size)}</p>
              </div>
              <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length >= 2 && !processing && !resultUrl && (
        <button
          onClick={process}
          className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
        >
          Unir {items.length} audios
        </button>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            {progress === 0 ? 'Cargando procesador…' : `Uniendo… ${progress}%`}
          </p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <audio src={resultUrl} controls className="w-full" />
          <p className="text-sm text-[var(--color-text-muted)] text-center">{formatBytes(resultSize)}</p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar audio unido
          </button>
          <button onClick={reset} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Unir otros audios
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
