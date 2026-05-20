import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import Slider from '@/components/ui/Slider';
import { Download, Loader2 } from 'lucide-react';

type PosId = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const POSITIONS: { label: string; id: PosId }[] = [
  { label: 'Centro', id: 'center' },
  { label: 'Superior izquierda', id: 'top-left' },
  { label: 'Superior derecha', id: 'top-right' },
  { label: 'Inferior izquierda', id: 'bottom-left' },
  { label: 'Inferior derecha', id: 'bottom-right' },
];

function calcXY(
  id: PosId,
  vw: number,
  vh: number,
  tw: number,
  th: number,
  margin: number,
): { x: number; y: number } {
  switch (id) {
    case 'center':       return { x: (vw - tw) / 2, y: (vh - th) / 2 };
    case 'top-left':     return { x: margin, y: margin };
    case 'top-right':    return { x: vw - tw - margin, y: margin };
    case 'bottom-left':  return { x: margin, y: vh - th - margin };
    case 'bottom-right': return { x: vw - tw - margin, y: vh - th - margin };
  }
}

function getVideoDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const vid = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (w: number, h: number) => { URL.revokeObjectURL(url); resolve({ w, h }); };
    vid.onloadedmetadata = () => done(vid.videoWidth || 1280, vid.videoHeight || 720);
    vid.onerror = () => done(1280, 720);
    setTimeout(() => done(1280, 720), 5000);
    vid.src = url;
    vid.load();
  });
}

export default function MarcaAguaVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [text, setText] = useState('© Mi Vídeo');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(60);
  const [posIdx, setPosIdx] = useState(0);
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
    setProgress(0);
  }

  async function process() {
    if (!video || !text.trim()) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg((p) => setProgress(p));

      // Get real video dimensions so the overlay canvas matches exactly
      const { w: vw, h: vh } = await getVideoDimensions(video.file);

      // Render text on a transparent canvas — avoids drawtext font issues in WASM
      const canvas = document.createElement('canvas');
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d')!;
      const alpha = opacity / 100;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textBaseline = 'top';

      const textWidth = ctx.measureText(text).width;
      const textHeight = fontSize * 1.2;
      const margin = Math.round(fontSize * 0.5);
      const { x, y } = calcXY(POSITIONS[posIdx].id, vw, vh, textWidth, textHeight, margin);

      ctx.shadowColor = `rgba(0,0,0,${(alpha * 0.8).toFixed(2)})`;
      ctx.shadowBlur = fontSize / 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      ctx.fillText(text, x, y);

      const watermarkBlob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png'),
      );

      const { fetchFile } = await import('@ffmpeg/util');
      await ff.writeFile('input.mp4', await fetchFile(video.file));
      await ff.writeFile('watermark.png', new Uint8Array(await watermarkBlob.arrayBuffer()));

      await ff.exec([
        '-i', 'input.mp4',
        '-i', 'watermark.png',
        '-filter_complex', '[0:v][1:v]overlay=0:0',
        '-c:a', 'copy',
        'output.mp4',
      ]);

      const data = (await ff.readFile('output.mp4')) as Uint8Array;
      for (const name of ['input.mp4', 'watermark.png', 'output.mp4']) {
        try { await ff.deleteFile(name); } catch { /* ignore */ }
      }

      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Error al añadir la marca de agua. Comprueba el formato del vídeo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.file.name.replace(/\.[^.]+$/, '_marcaagua.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-5">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Marca de agua</h2>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Texto</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe tu marca de agua..."
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Posición</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {POSITIONS.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setPosIdx(i)}
                    className={['px-3 py-2 rounded-xl border text-xs font-medium transition-colors', posIdx === i ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'].join(' ')}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <Slider label="Tamaño de fuente" value={fontSize} min={12} max={120} step={2} unit="px" onChange={setFontSize} />
            <Slider label="Opacidad" value={opacity} min={10} max={100} step={5} unit="%" onChange={setOpacity} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button
            onClick={process}
            disabled={!text.trim()}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-40"
          >
            Añadir marca de agua
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm mt-3">{progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}</p>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(video.file.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar vídeo con marca de agua
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Procesar otro vídeo
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
