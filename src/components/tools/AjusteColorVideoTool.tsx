import { useState } from 'react';
import VideoUploader, { type VideoFile } from '@/components/ui/VideoUploader';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2 } from 'lucide-react';
import Slider from '@/components/ui/Slider';

const PRESETS: { label: string; brightness: number; contrast: number; saturation: number; gamma: number }[] = [
  { label: 'Original', brightness: 0, contrast: 1, saturation: 1, gamma: 1 },
  { label: 'Vivid', brightness: 0.05, contrast: 1.1, saturation: 1.4, gamma: 0.95 },
  { label: 'Cine', brightness: -0.05, contrast: 1.2, saturation: 0.85, gamma: 1.1 },
  { label: 'Vintage', brightness: 0, contrast: 0.9, saturation: 0.7, gamma: 1.15 },
  { label: 'B&N', brightness: 0, contrast: 1.05, saturation: 0, gamma: 1 },
];

export default function AjusteColorVideoTool() {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [gamma, setGamma] = useState(1);
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

  function applyPreset(p: typeof PRESETS[0]) {
    setBrightness(p.brightness);
    setContrast(p.contrast);
    setSaturation(p.saturation);
    setGamma(p.gamma);
  }

  async function process() {
    if (!video) return;
    if (resultUrl) revokeURL(resultUrl);
    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const filter = `eq=brightness=${brightness.toFixed(3)}:contrast=${contrast.toFixed(3)}:saturation=${saturation.toFixed(3)}:gamma=${gamma.toFixed(3)}`;
      const blob = await runFFmpeg(
        await createFFmpeg((p) => setProgress(p)),
        video.file,
        'input.mp4',
        ['-vf', filter, '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy'],
        'output.mp4'
      );
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err) {
      console.error('[AjusteColorVideo] Error:', err);
      setError('Error al procesar el vídeo. Comprueba el formato del archivo.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !video) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = video.file.name.replace(/\.[^.]+$/, '_color.mp4');
    a.click();
  }

  return (
    <div className="space-y-6">
      <VideoUploader onFile={setVideo} onClear={handleClear} current={video} />

      {video && !resultUrl && !processing && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => applyPreset(p)} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-[var(--color-text)]">Brillo</label>
                <span className="text-sm font-mono text-[var(--color-accent)]">{brightness > 0 ? '+' : ''}{brightness.toFixed(2)}</span>
              </div>
              <Slider min={-0.5} max={0.5} step={0.01} value={brightness} onChange={setBrightness} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-[var(--color-text)]">Contraste</label>
                <span className="text-sm font-mono text-[var(--color-accent)]">{contrast.toFixed(2)}x</span>
              </div>
              <Slider min={0.5} max={2.0} step={0.05} value={contrast} onChange={setContrast} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-[var(--color-text)]">Saturación</label>
                <span className="text-sm font-mono text-[var(--color-accent)]">{saturation.toFixed(2)}x</span>
              </div>
              <Slider min={0} max={3.0} step={0.05} value={saturation} onChange={setSaturation} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-[var(--color-text)]">Gamma</label>
                <span className="text-sm font-mono text-[var(--color-accent)]">{gamma.toFixed(2)}</span>
              </div>
              <Slider min={0.1} max={3.0} step={0.05} value={gamma} onChange={setGamma} />
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Aplicar ajuste de color
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
          <div className="flex justify-between text-sm">
            <span>Original: <strong>{formatBytes(video!.size)}</strong></span>
            <span>Resultado: <strong className="text-[var(--color-accent)]">{formatBytes(resultSize)}</strong></span>
          </div>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} /> Descargar MP4
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Procesar otro vídeo</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
