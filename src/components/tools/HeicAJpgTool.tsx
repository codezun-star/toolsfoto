import { useState, useRef } from 'react';
import { Download, Loader2, Upload, X } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';
import { revokeURL } from '@/lib/utils/canvas';

type HeicFn = (o: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>;

export default function HeicAJpgTool() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [quality, setQuality] = useState(0.9);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearResult() { if (resultUrl) revokeURL(resultUrl); setResultUrl(null); setResultSize(0); }
  function handleClear() { clearResult(); setFile(null); setError(null); }

  function pick(f: File | undefined) {
    if (!f) return;
    const ok = /\.(heic|heif)$/i.test(f.name) || f.type === 'image/heic' || f.type === 'image/heif';
    if (!ok) { setError('Selecciona un archivo HEIC o HEIF (.heic / .heif).'); return; }
    clearResult();
    setError(null);
    setFile(f);
  }

  async function convert() {
    if (!file) return;
    clearResult();
    setError(null);
    setProcessing(true);
    try {
      const mod = (await import('heic2any')) as unknown as { default: HeicFn };
      const out = await mod.default({ blob: file, toType: format, quality });
      const blob = Array.isArray(out) ? out[0] : out;
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('No se pudo convertir el archivo. Asegúrate de que es un HEIC/HEIF válido.');
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const ext = format === 'image/png' ? 'png' : 'jpg';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace(/\.(heic|heif)$/i, '') + '.' + ext;
    a.click();
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)] cursor-pointer transition-colors">
          <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]"><Upload size={24} /></div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text)]">Sube tu archivo HEIC</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Arrastra aquí o haz clic · .heic / .heif</p>
          </div>
          <input ref={inputRef} type="file" accept=".heic,.heif,image/heic,image/heif" className="hidden"
            onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
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

      {file && !resultUrl && !processing && (
        <div className="space-y-4">
          <div className="flex gap-3">
            {([['image/jpeg', 'JPG'], ['image/png', 'PNG']] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => setFormat(val)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${format === val ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'}`}>
                Convertir a {lbl}
              </button>
            ))}
          </div>
          {format === 'image/jpeg' && (
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1.5">Calidad JPG: {Math.round(quality * 100)}%</label>
              <input type="range" min="0.4" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
            </div>
          )}
          <button onClick={convert} className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            Convertir
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Convirtiendo HEIC…</p>
        </div>
      )}

      {resultUrl && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <img src={resultUrl} alt="Resultado de la conversión" className="rounded-lg max-w-full mx-auto border border-[var(--color-border)]" />
          <p className="text-sm text-center text-[var(--color-text-muted)]">{formatBytes(resultSize)}</p>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors">
            <Download size={18} /> Descargar {format === 'image/png' ? 'PNG' : 'JPG'}
          </button>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">Convertir otro</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}

      <p className="text-xs text-[var(--color-text-muted)]">La primera conversión descarga el decodificador HEIC (~1 MB). Todo se procesa en tu navegador; el archivo no se sube a ningún servidor.</p>
    </div>
  );
}
