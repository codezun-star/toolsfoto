import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';

const FORMATS = [
  { label: 'TikTok / Reels', width: 1080, height: 1920, desc: '9:16 · 1080×1920' },
  { label: 'Stories', width: 1080, height: 1920, desc: '9:16 · 1080×1920' },
  { label: 'YouTube Shorts', width: 1080, height: 1920, desc: '9:16 · 1080×1920' },
  { label: 'Cuadrado', width: 1080, height: 1080, desc: '1:1 · 1080×1080' },
];

const BG_COLORS = ['#000000', '#ffffff', '#1a1a2e', '#16213e'];

export default function ConvertirVerticalTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [formatIdx, setFormatIdx] = useState(0);
  const [bgColor, setBgColor] = useState('#000000');
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
      const ff = await createFFmpeg(setProgress);
      const buf = await video.file.arrayBuffer();
      const ext = video.name.split('.').pop()?.toLowerCase() ?? 'mp4';
      const fmt = FORMATS[formatIdx];
      const r = parseInt(bgColor.slice(1, 3), 16);
      const g = parseInt(bgColor.slice(3, 5), 16);
      const b = parseInt(bgColor.slice(5, 7), 16);

      await ff.writeFile(`input.${ext}`, new Uint8Array(buf));

      // Scale to fit inside target dimensions, pad with background color
      const filter = `scale=${fmt.width}:${fmt.height}:force_original_aspect_ratio=decrease,pad=${fmt.width}:${fmt.height}:(ow-iw)/2:(oh-ih)/2:color=${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;

      await ff.exec([
        '-i', `input.${ext}`,
        '-vf', filter,
        '-c:v', 'libx264', '-c:a', 'copy',
        '-movflags', '+faststart',
        'output.mp4',
      ]);

      const data = await ff.readFile('output.mp4') as Uint8Array;
      try { await ff.deleteFile(`input.${ext}`); } catch { /* ignore */ }
      try { await ff.deleteFile('output.mp4'); } catch { /* ignore */ }

      const blob = new Blob([data], { type: 'video/mp4' });
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[ConvertirVertical] Error FFmpeg:', err);
      setError('Error al procesar el vídeo. Asegúrate de que el archivo es un vídeo válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const fmt = FORMATS[formatIdx];
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.name.replace(/\.[^.]+$/, `_${fmt.width}x${fmt.height}.mp4`);
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader label="Sube tu vídeo horizontal" onFile={setVideo} onClear={handleClear} current={video} />

      {video && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Formato de salida</h2>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map((f, i) => (
                <button
                  key={f.label + i}
                  onClick={() => setFormatIdx(i)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    formatIdx === i
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${formatIdx === i ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{f.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{f.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--color-text)] mb-2">Color de fondo (barras)</p>
              <div className="flex items-center gap-2">
                {BG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBgColor(c)}
                    style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #ccc' : undefined }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? 'border-[var(--color-accent)] scale-110' : 'border-transparent'}`}
                  />
                ))}
                <label className="cursor-pointer">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="sr-only" />
                  <div style={{ backgroundColor: bgColor }} className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: bgColor }}>+</div>
                </label>
              </div>
            </div>
          </div>

          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Convertir a formato vertical
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Procesando… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
        </div>
      )}

      {resultUrl && video && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Original: <strong className="text-[var(--color-text)]">{formatBytes(video.size)}</strong> →
            Vertical: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong>
          </p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} />
            Descargar vídeo vertical
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
