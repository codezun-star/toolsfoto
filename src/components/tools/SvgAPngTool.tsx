import { useState, useRef, useCallback } from 'react';
import DownloadButton from '@/components/ui/DownloadButton';
import { Upload, X } from 'lucide-react';

interface SvgFile { name: string; content: string; originalWidth: number; originalHeight: number }

export default function SvgAPngTool() {
  const [svg, setSvg] = useState<SvgFile | null>(null);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [lockRatio, setLockRatio] = useState(true);
  const [bgMode, setBgMode] = useState<'transparent' | 'color'>('transparent');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      setError('Selecciona un archivo SVG.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'image/svg+xml');
      const root = doc.documentElement;
      const vb = root.getAttribute('viewBox')?.split(/[\s,]+/) ?? [];
      const w = parseFloat(root.getAttribute('width') ?? vb[2] ?? '512') || 512;
      const h = parseFloat(root.getAttribute('height') ?? vb[3] ?? '512') || 512;
      setSvg({ name: file.name, content, originalWidth: w, originalHeight: h });
      setWidth(Math.round(w));
      setHeight(Math.round(h));
      setError(null);
      setPreviewUrl(null);
    };
    reader.readAsText(file);
  }, []);

  function handleWidthChange(v: number) {
    setWidth(v);
    if (lockRatio && svg) setHeight(Math.round(v / (svg.originalWidth / svg.originalHeight)));
  }
  function handleHeightChange(v: number) {
    setHeight(v);
    if (lockRatio && svg) setWidth(Math.round(v * (svg.originalWidth / svg.originalHeight)));
  }

  async function handleConvert() {
    if (!svg) return;
    setLoading(true);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    try {
      const blob = new Blob([svg.content], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      await new Promise<void>((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          if (bgMode === 'color') { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, width, height); }
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          canvas.toBlob(b => {
            if (!b) { rej(); return; }
            const pUrl = URL.createObjectURL(b);
            setPreviewUrl(pUrl);
            res();
          }, 'image/png');
        };
        img.onerror = rej;
        img.src = url;
      });
    } catch {
      setError('Error al convertir el SVG. Comprueba que el archivo sea un SVG válido.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!previewUrl || !svg) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = svg.name.replace(/\.svg$/i, `_${width}x${height}.png`);
    a.click();
  }

  function handleClear() { if (previewUrl) URL.revokeObjectURL(previewUrl); setSvg(null); setPreviewUrl(null); setError(null); }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {!svg ? (
          <label
            className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)] cursor-pointer transition-colors"
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]"><Upload size={24} /></div>
            <div className="text-center">
              <p className="font-semibold text-[var(--color-text)]">Sube tu SVG</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Arrastra o haz clic · .svg</p>
            </div>
            <input ref={inputRef} type="file" accept=".svg,image/svg+xml" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = ''; } }} />
          </label>
        ) : (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">{svg.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Tamaño original: {svg.originalWidth}×{svg.originalHeight}</p>
            </div>
            <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"><X size={16} /></button>
          </div>
        )}

        {previewUrl && (
          <div className="p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <p className="text-sm font-bold text-[var(--color-text)] mb-3">Vista previa PNG ({width}×{height})</p>
            <div className="rounded-lg overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAAAAACoWZBhAAAAF0lEQVQI12P4BAI/QICBFCaYBPNJYQIAkUZftTbC4sAAAAASUVORK5CYII=')] bg-repeat">
              <img src={previewUrl} alt="PNG preview" className="w-full object-contain max-h-64" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Opciones de exportación</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text)]">Ancho (px)</label>
              <input type="number" value={width} min={1} max={8000} onChange={e => handleWidthChange(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text)]">Alto (px)</label>
              <input type="number" value={height} min={1} max={8000} onChange={e => handleHeightChange(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={lockRatio} onChange={e => setLockRatio(e.target.checked)} className="accent-[var(--color-accent)]" />
            <span className="text-sm text-[var(--color-text)]">Mantener proporción</span>
          </label>

          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Fondo</p>
            <div className="grid grid-cols-2 gap-2">
              {(['transparent', 'color'] as const).map(m => (
                <button key={m} onClick={() => setBgMode(m)}
                  className={['py-2 rounded-lg text-xs font-medium border transition-colors', bgMode === m ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}>
                  {m === 'transparent' ? 'Transparente' : 'Color sólido'}
                </button>
              ))}
            </div>
            {bgMode === 'color' && (
              <div className="flex items-center gap-2 mt-2">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 w-14 rounded border border-[var(--color-border)] cursor-pointer" />
                <span className="text-sm text-[var(--color-text-muted)]">{bgColor}</span>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={handleConvert} disabled={!svg || loading}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Convirtiendo…' : 'Convertir a PNG'}
          </button>
          <DownloadButton onClick={handleDownload} disabled={!previewUrl} loading={loading} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
