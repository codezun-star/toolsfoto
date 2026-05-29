import { useState, useRef } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, Upload } from 'lucide-react';

interface SrtCue {
  start: number;
  end: number;
  text: string;
}

function parseSRT(raw: string): SrtCue[] {
  const cues: SrtCue[] = [];
  const blocks = raw.trim().split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    const timeLine = lines[1];
    const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!match) continue;
    const toSec = (h: string, m: string, s: string, ms: string) =>
      parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
    const start = toSec(match[1], match[2], match[3], match[4]);
    const end = toSec(match[5], match[6], match[7], match[8]);
    const text = lines.slice(2).join('\n').trim();
    if (text) cues.push({ start, end, text });
  }
  return cues;
}

function renderSubCanvas(text: string, vw: number, vh: number, fontSize: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, vw, vh);
  const lines = text.split('\n');
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const lineH = fontSize * 1.25;
  const totalH = lines.length * lineH;
  const startY = vh - 60 - totalH + lineH;
  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineH;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = fontSize * 0.12;
    ctx.strokeText(lines[i], vw / 2, y);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines[i], vw / 2, y);
  }
  return new Promise((res) => canvas.toBlob((b) => b!.arrayBuffer().then((ab) => res(new Uint8Array(ab))), 'image/png'));
}

function getVideoDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const vid = document.createElement('video');
    const url = URL.createObjectURL(file);
    vid.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve({ w: vid.videoWidth || 1280, h: vid.videoHeight || 720 }); };
    vid.onerror = () => { URL.revokeObjectURL(url); resolve({ w: 1280, h: 720 }); };
    setTimeout(() => { URL.revokeObjectURL(url); resolve({ w: 1280, h: 720 }); }, 5000);
    vid.src = url;
    vid.load();
  });
}

export default function AnadirSubtitulosTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [srtName, setSrtName] = useState('');
  const [fontSize, setFontSize] = useState(36);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const srtRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setVideo(null);
    setSrtFile(null);
    setSrtName('');
    setResultUrl(null);
    setResultSize(0);
    setError(null);
    setProgress(0);
  }

  function handleSrtFile(f: File) {
    setSrtFile(f);
    setSrtName(f.name);
  }

  async function process() {
    if (!video || !srtFile) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const srtText = await srtFile.text();
      const cues = parseSRT(srtText);
      if (cues.length === 0) throw new Error('No se encontraron subtítulos válidos en el archivo SRT.');

      const MAX_CUES = 30;
      const limitedCues = cues.slice(0, MAX_CUES);
      const { w: vw, h: vh } = await getVideoDimensions(video.file);
      const ff = await createFFmpeg((p) => setProgress(Math.round(p * 0.9)));

      const videoBuf = await video.file.arrayBuffer();
      await ff.writeFile('input.mp4', new Uint8Array(videoBuf));

      const subPngs: string[] = [];
      for (let i = 0; i < limitedCues.length; i++) {
        const pngBytes = await renderSubCanvas(limitedCues[i].text, vw, vh, fontSize);
        const name = `sub_${i}.png`;
        await ff.writeFile(name, pngBytes);
        subPngs.push(name);
      }

      // Build filtergraph
      const inputs: string[] = ['-i', 'input.mp4'];
      for (const name of subPngs) inputs.push('-i', name);

      let filterGraph = '[0:v]';
      for (let i = 0; i < limitedCues.length; i++) {
        const { start, end } = limitedCues[i];
        const inTag = i === 0 ? '[0:v]' : `[vo${i - 1}]`;
        const outTag = i === limitedCues.length - 1 ? '[vo]' : `[vo${i}]`;
        filterGraph = `${inTag}[${i + 1}:v]overlay=0:0:enable='between(t,${start.toFixed(3)},${end.toFixed(3)})'${outTag}`;
        if (i < limitedCues.length - 1) filterGraph += ';' + `[vo${i}]`;
      }
      // rebuild cleanly
      const filters: string[] = [];
      for (let i = 0; i < limitedCues.length; i++) {
        const { start, end } = limitedCues[i];
        const inV = i === 0 ? '0:v' : `v${i - 1}`;
        const outV = i === limitedCues.length - 1 ? 'vout' : `v${i}`;
        filters.push(`[${inV}][${i + 1}:v]overlay=0:0:enable='between(t,${start.toFixed(3)},${end.toFixed(3)})'[${outV}]`);
      }

      const args = [...inputs, '-filter_complex', filters.join(';'), '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-c:a', 'aac', '-preset', 'fast', 'output.mp4'];
      try {
        await ff.exec(args);
      } catch (err) {
        console.error('[AnadirSubtitulos] FFmpeg error:', err);
        throw err;
      }

      const data = await ff.readFile('output.mp4') as Uint8Array;
      if (!data || data.length === 0) throw new Error('El procesador produjo un archivo vacío. Prueba con otro formato de vídeo.');
      await ff.deleteFile('input.mp4').catch(() => {});
      await ff.deleteFile('output.mp4').catch(() => {});
      for (const name of subPngs) await ff.deleteFile(name).catch(() => {});

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al incrustar subtítulos: ${msg}`);
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.file.name.replace(/\.[^.]+$/, '_subtitulado.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader onFile={setVideo} onClear={handleClear} current={video} />

      {video && !resultUrl && !processing && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Archivo de subtítulos (.srt)</label>
            <div
              className={['flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors', srtFile ? 'border-[var(--color-tools-border)] bg-[var(--color-tools-bg)]' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)]'].join(' ')}
              onClick={() => srtRef.current?.click()}
            >
              <Upload size={20} className="text-[var(--color-text-muted)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">{srtFile ? srtName : 'Subir archivo .srt'}</span>
            </div>
            <input ref={srtRef} type="file" accept=".srt,.SRT" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleSrtFile(e.target.files[0]); }} />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--color-text)]">Tamaño de fuente</label>
              <span className="text-sm font-mono text-[var(--color-accent)]">{fontSize}px</span>
            </div>
            <input type="range" min={20} max={72} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">Máximo 30 subtítulos soportados. La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>

          <button onClick={process} disabled={!srtFile} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-50">
            Incrustar subtítulos
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm">{progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}</p>
          {progress > 0 && <div className="w-full bg-[var(--color-border)] rounded-full h-2"><div className="bg-[var(--color-accent)] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>}
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm">Tamaño: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} /> Descargar MP4 con subtítulos
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otro vídeo</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
