import { useState, useCallback } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import { useImageUpload } from '@/hooks/useImageUpload';
import { formatBytes } from '@/lib/utils/format';
import { Copy, Check } from 'lucide-react';

type Format = 'html' | 'css' | 'json' | 'js' | 'raw';

interface Example { label: string; fmt: Format; code: (b64: string, mime: string) => string }

const EXAMPLES: Example[] = [
  { label: 'HTML', fmt: 'html', code: (b64, mime) => `<img src="data:${mime};base64,${b64}" alt="imagen" />` },
  { label: 'CSS', fmt: 'css', code: (b64, mime) => `background-image: url("data:${mime};base64,${b64}");` },
  { label: 'JSON', fmt: 'json', code: (b64, mime) => `{\n  "image": "data:${mime};base64,${b64}"\n}` },
  { label: 'JS', fmt: 'js', code: (b64, mime) => `const imgSrc = "data:${mime};base64,${b64}";` },
  { label: 'Solo Base64', fmt: 'raw', code: (b64) => b64 },
];

export default function ImagenABase64Tool() {
  const upload = useImageUpload();
  const [base64, setBase64] = useState('');
  const [mime, setMime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<Format>('html');
  const [copied, setCopied] = useState(false);

  const convert = useCallback(async () => {
    if (!upload.image) return;
    setLoading(true);
    setError(null);
    try {
      const arrayBuffer = await upload.image.file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      setBase64(btoa(binary));
      setMime(upload.image.file.type || 'image/jpeg');
    } catch {
      setError('Error al convertir la imagen a Base64.');
    } finally {
      setLoading(false);
    }
  }, [upload.image]);

  function handleCopy() {
    const active = EXAMPLES.find(e => e.fmt === activeFormat);
    if (!active || !base64) return;
    navigator.clipboard.writeText(active.code(base64, mime)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const activeCode = base64 ? (EXAMPLES.find(e => e.fmt === activeFormat)?.code(base64, mime) ?? '') : '';
  const b64SizeKb = base64 ? Math.round(base64.length * 0.75 / 1024) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ImageUploader image={upload.image} error={upload.error} isDragging={upload.isDragging}
            onDrop={upload.onDrop} onDragOver={upload.onDragOver} onDragLeave={upload.onDragLeave}
            onFileChange={upload.onFileChange} onClear={() => { upload.clearImage(); setBase64(''); setMime(''); }} />

          {upload.image && base64 && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-[var(--color-bg)] rounded-lg">
                <p className="text-[var(--color-text-muted)]">Tamaño original</p>
                <p className="font-bold text-[var(--color-text)] mt-1">{formatBytes(upload.image.file.size)}</p>
              </div>
              <div className="p-3 bg-[var(--color-bg)] rounded-lg">
                <p className="text-[var(--color-text-muted)]">Tamaño Base64</p>
                <p className="font-bold text-[var(--color-text)] mt-1">~{b64SizeKb} KB (+33%)</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-tools-bg)] rounded-xl border border-[var(--color-tools-border)]">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Base64 incrementa el tamaño un 33% aprox. Recomendado solo para imágenes pequeñas
              (&lt;10 KB) para evitar peticiones HTTP adicionales. Para imágenes grandes, usa un
              servidor de estáticos.
            </p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button onClick={convert} disabled={!upload.image || loading}
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Convirtiendo…' : 'Convertir a Base64'}
          </button>
        </div>
      </div>

      {base64 && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[var(--color-text)]">Código generado</h2>
            <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-bg)] transition-colors">
              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {EXAMPLES.map(e => (
              <button key={e.fmt} onClick={() => setActiveFormat(e.fmt)}
                className={['px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', activeFormat === e.fmt ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}>
                {e.label}
              </button>
            ))}
          </div>
          <textarea
            readOnly
            value={activeCode}
            rows={5}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)] bg-[var(--color-bg)] resize-none focus:outline-none leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
