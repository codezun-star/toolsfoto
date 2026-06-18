import { useState } from 'react';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { revokeURL } from '@/lib/utils/canvas';
import { formatBytes } from '@/lib/utils/format';
import { Download, Loader2, Upload, X } from 'lucide-react';

export default function ComprimirGifTool() {
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState('keep');
  const [fps, setFps] = useState('keep');
  const [colors, setColors] = useState('128');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function clearResult() { if (resultUrl) revokeURL(resultUrl); setResultUrl(null); setResultSize(0); }
  function handleClear() { clearResult(); setFile(null); setError(null); }

  function pick(f: File | undefined) {
    if (!f) return;
    if (f.type !== 'image/gif' && !/\.gif$/i.test(f.name)) { setError('Selecciona un archivo GIF (.gif).'); return; }
    clearResult();
    setError(null);
    setFile(f);
  }

  async function process() {
    if (!file) return;
    clearResult();
    setError(null);
    setProcessing(true);
    setProgress(0);
    try {
      const filters: string[] = [];
      if (fps !== 'keep') filters.push(`fps=${fps}`);
      if (width !== 'keep') filters.push(`scale=${width}:-1:flags=lanczos`);
      const chain = filters.length ? filters.join(',') + ',' : '';
      const vf = `${chain}split[s0][s1];[s0]palettegen=max_colors=${colors}[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5`;
      const ff = await createFFmpeg(setProgress);
      const blob = await runFFmpeg(ff, file, 'input.gif', ['-vf', vf], 'output.gif');
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError('Error al comprimir el GIF. Prueba a reducir el ancho, los FPS o el número de colores.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace(/\.gif$/i, '') + '-comprimido.gif';
    a.click();
  }

  const reduction = file && resultSize ? Math.round((1 - resultSize / file.size) * 100) : 0;

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)] cursor-pointer transition-colors">
          <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]"><Upload size={24} /></div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text)]">Sube tu GIF</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Arrastra aquí o haz clic · .gif</p>
          </div>
          <input type="file" accept="image/gif,.gif" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      ) : (
        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] shrink-0"><Upload size={20} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">{file.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatBytes(file.size)}</p>
          </div>
          <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors" aria-label="Quitar"><X size={16} /></button>
        </div>
      )}

      {file && !processing && !resultUrl && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Ancho</label>
              <select value={width} onChange={(e) => setWidth(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]">
                <option value="keep">Original</option>
                <option value="480">480 px</option>
                <option value="320">320 px</option>
                <option value="240">240 px</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">FPS</label>
              <select value={fps} onChange={(e) => setFps(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]">
                <option value="keep">Original</option>
                <option value="15">15 fps</option>
                <option value="10">10 fps</option>
                <option value="8">8 fps</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Colores</label>
              <select value={colors} onChange={(e) => setColors(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)]">
                <option value="256">256</option>
                <option value="128">128</option>
                <option value="64">64</option>
                <option value="32">32</option>
              </select>
            </div>
          </div>
          <button onClick={process} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">Comprimir GIF</button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">{progress === 0 ? 'Cargando procesador…' : `Comprimiendo… ${progress}%`}</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5"><div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <img src={resultUrl} alt="GIF comprimido" className="rounded-lg max-w-full mx-auto border border-[var(--color-border)]" />
          <p className="text-sm text-center text-[var(--color-text-muted)]">
            {formatBytes(resultSize)}{reduction > 0 ? ` · ${reduction}% menos` : ''}
          </p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"><Download size={18} /> Descargar GIF</button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Comprimir otro</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}

      <p className="text-xs text-[var(--color-text-muted)]">La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo.</p>
    </div>
  );
}
