import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

interface Dim { w: number; h: number }

function getDimensions(file: File): Promise<Dim> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve({ w: v.videoWidth, h: v.videoHeight }); };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('metadata')); };
    v.src = url;
  });
}

const KEYS = [
  { label: 'Verde', value: '0x00d000' },
  { label: 'Azul', value: '0x0000d0' },
];

export default function QuitarFondoVerdeTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [key, setKey] = useState('0x00d000');
  const [bg, setBg] = useState('#ffffff');
  const [similarity, setSimilarity] = useState(0.3);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setVideo(null);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  async function process() {
    if (!video) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultUrl(null);
    try {
      const { w, h } = await getDimensions(video.file);
      const width = w || 1280;
      const height = h || 720;
      const bgHex = '0x' + bg.replace('#', '');
      const { fetchFile } = await import('@ffmpeg/util');
      const ff = await createFFmpeg(setProgress);
      await ff.writeFile('input_src', await fetchFile(video.file));
      const filter = `color=c=${bgHex}:s=${width}x${height}[bg];[0:v]colorkey=${key}:${similarity}:0.1[fg];[bg][fg]overlay=shortest=1[out]`;
      try {
        await ff.exec(['-i', 'input_src', '-filter_complex', filter, '-map', '[out]', '-map', '0:a?', '-vcodec', 'libx264', '-preset', 'veryfast', '-crf', '23', '-acodec', 'aac', 'output.mp4']);
      } catch (err) {
        console.error('[QuitarFondoVerde] Error FFmpeg:', err);
        throw err;
      }
      const data = (await ff.readFile('output.mp4')) as Uint8Array;
      if (!data || data.length === 0) throw new Error('vacío');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      try { await ff.deleteFile('input_src'); } catch { /* ignore */ }
      try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al procesar el chroma. Ajusta la tolerancia o prueba con otro vídeo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, '-sinfondo.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo con fondo de color" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Color a eliminar</p>
            <div className="grid grid-cols-2 gap-3">
              {KEYS.map((k) => (
                <button key={k.value} onClick={() => setKey(k.value)} className={['py-2.5 rounded-xl border text-sm font-semibold transition-colors', key === k.value ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}>{k.label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[var(--color-text)]">Color de fondo nuevo</label>
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-14 rounded border border-[var(--color-border)] cursor-pointer" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><label className="font-medium text-[var(--color-text)]">Tolerancia</label><span className="text-[var(--color-text-secondary)]">{similarity.toFixed(2)}</span></div>
            <input type="range" min={0.1} max={0.6} step={0.05} value={similarity} onChange={(e) => setSimilarity(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">Quitar fondo de color</button>
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

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <video controls src={resultUrl} className="w-full rounded-lg max-h-72 mx-auto" />
          <p className="text-sm text-center text-[var(--color-text-secondary)]">Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"><Download size={18} /> Descargar MP4</button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otro vídeo</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
