import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

function crc32(data: Uint8Array): number {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ t[(crc ^ data[i]) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const u16 = (n: number, b: Uint8Array, o: number) => { b[o] = n & 0xff; b[o + 1] = (n >> 8) & 0xff; };
  const u32 = (n: number, b: Uint8Array, o: number) => { b[o] = n & 0xff; b[o + 1] = (n >> 8) & 0xff; b[o + 2] = (n >> 16) & 0xff; b[o + 3] = (n >> 24) & 0xff; };
  const parts: Uint8Array[] = [];
  const cd: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const nb = new TextEncoder().encode(f.name);
    const crc = crc32(f.data);
    const lh = new Uint8Array(30 + nb.length);
    u32(0x04034b50, lh, 0); u16(20, lh, 4); u16(0, lh, 6); u16(0, lh, 8); u16(0, lh, 10); u16(0, lh, 12);
    u32(crc, lh, 14); u32(f.data.length, lh, 18); u32(f.data.length, lh, 22); u16(nb.length, lh, 26); u16(0, lh, 28);
    lh.set(nb, 30);
    parts.push(lh, f.data);
    const ce = new Uint8Array(46 + nb.length);
    u32(0x02014b50, ce, 0); u16(20, ce, 4); u16(20, ce, 6); u16(0, ce, 8); u16(0, ce, 10); u16(0, ce, 12); u16(0, ce, 14);
    u32(crc, ce, 16); u32(f.data.length, ce, 20); u32(f.data.length, ce, 24);
    u16(nb.length, ce, 28); u16(0, ce, 30); u16(0, ce, 32); u16(0, ce, 34); u16(0, ce, 36); u32(0, ce, 38); u32(offset, ce, 42);
    ce.set(nb, 46);
    cd.push(ce);
    offset += lh.length + f.data.length;
  }
  const cdOff = offset;
  const cdB = new Uint8Array(cd.reduce((s, c) => s + c.length, 0));
  let p = 0; for (const c of cd) { cdB.set(c, p); p += c.length; }
  const eocd = new Uint8Array(22);
  u32(0x06054b50, eocd, 0); u16(0, eocd, 4); u16(0, eocd, 6); u16(files.length, eocd, 8); u16(files.length, eocd, 10);
  u32(cdB.length, eocd, 12); u32(cdOff, eocd, 16); u16(0, eocd, 20);
  const all = [...parts, cdB, eocd];
  const out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
  let pp = 0; for (const a of all) { out.set(a, pp); pp += a.length; }
  return out;
}

const FPS_OPTIONS = [
  { label: '0.5 fps (cada 2s)', value: 0.5 },
  { label: '1 fps (cada segundo)', value: 1 },
  { label: '2 fps', value: 2 },
  { label: '5 fps', value: 5 },
];

export default function ExtraerFotogramasTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [fps, setFps] = useState(1);
  const [format, setFormat] = useState<'png' | 'jpg'>('jpg');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [zipSize, setZipSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    if (resultUrl) revokeURL(resultUrl);
    setVideo(null);
    setResultUrl(null);
    setFrameCount(0);
    setZipSize(0);
    setError(null);
    setProgress(0);
  }

  async function process() {
    if (!video) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const ff = await createFFmpeg((p) => setProgress(Math.round(p * 0.8)));
      const buf = await video.file.arrayBuffer();
      await ff.writeFile('input.mp4', new Uint8Array(buf));

      const ext = format === 'png' ? 'png' : 'jpg';
      const outPattern = `frame_%04d.${ext}`;
      const args = ['-i', 'input.mp4', '-vf', `fps=${fps}`, '-q:v', format === 'jpg' ? '3' : '1', outPattern];
      try { await ff.exec(args); } catch (err) { console.error('[ExtraerFotogramas] FFmpeg:', err); throw err; }

      await ff.deleteFile('input.mp4').catch(() => {});

      // Read all generated frames
      const files: { name: string; data: Uint8Array }[] = [];
      for (let i = 1; ; i++) {
        const name = `frame_${String(i).padStart(4, '0')}.${ext}`;
        try {
          const data = await ff.readFile(name) as Uint8Array;
          files.push({ name, data });
          await ff.deleteFile(name).catch(() => {});
          setProgress(80 + Math.round((i / Math.max(i, 10)) * 20));
        } catch { break; }
        if (i > 500) break; // safety
      }

      if (files.length === 0) throw new Error('No se extrajeron fotogramas.');
      setFrameCount(files.length);
      const zip = buildZip(files);
      const blob = new Blob([zip], { type: 'application/zip' });
      setZipSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al extraer fotogramas: ${msg}`);
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${video.file.name.replace(/\.[^.]+$/, '')}_fotogramas.zip`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader onFile={setVideo} onClear={handleClear} current={video} />

      {video && !resultUrl && !processing && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Frecuencia de extracción</label>
            <div className="flex flex-wrap gap-2">
              {FPS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFps(o.value)}
                  className={['px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors', fps === o.value ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'].join(' ')}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Formato de imagen</label>
            <div className="flex gap-2">
              {(['jpg', 'png'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={['px-4 py-1.5 rounded-lg text-sm font-medium border uppercase transition-colors', format === f ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'].join(' ')}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">Los fotogramas se empaquetan en un ZIP descargable. Máximo 500 frames. La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Extraer fotogramas
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm">{progress === 0 ? 'Cargando procesador…' : `Extrayendo fotogramas… ${progress}%`}</p>
          {progress > 0 && <div className="w-full bg-[var(--color-border)] rounded-full h-2"><div className="bg-[var(--color-accent)] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>}
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <div className="flex justify-between text-sm">
            <span><strong>{frameCount}</strong> fotograma{frameCount !== 1 ? 's' : ''} extraído{frameCount !== 1 ? 's' : ''}</span>
            <span>ZIP: <strong className="text-[var(--color-accent)]">{formatBytes(zipSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} /> Descargar ZIP ({frameCount} imágenes)
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otro vídeo</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
