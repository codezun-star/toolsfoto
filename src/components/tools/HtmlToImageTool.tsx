import { useState, useRef } from 'react';
import DownloadButton from '@/components/ui/DownloadButton';
import { triggerDownload } from '@/lib/utils/download';
import { Code2 } from 'lucide-react';

const DEFAULT_HTML = `<div style="
  width: 800px;
  height: 418px;
  background: linear-gradient(135deg, #E84827 0%, #FF7A5A 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
  color: white;
  padding: 40px;
  box-sizing: border-box;
">
  <h1 style="font-size: 48px; font-weight: 800; margin: 0;">ToolsFoto</h1>
  <p style="font-size: 20px; margin-top: 12px; opacity: 0.9;">Herramientas de imagen gratis</p>
</div>`;

export default function HtmlToImageTool() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function handleCapture() {
    setLoading(true);
    setError(null);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const iframe = iframeRef.current;
      if (!iframe?.contentDocument?.body) throw new Error('No se pudo acceder al iframe');

      const el = iframe.contentDocument.body.firstElementChild as HTMLElement | null;
      if (!el) throw new Error('No hay elemento para capturar');

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: format === 'png' ? null : '#ffffff',
      });

      canvas.toBlob(
        (blob) => {
          if (!blob) { setError('No se pudo generar la imagen.'); setLoading(false); return; }
          triggerDownload(blob, `captura.${format}`);
          setLoading(false);
        },
        format === 'png' ? 'image/png' : 'image/jpeg',
        0.92,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al capturar el HTML.');
      setLoading(false);
    }
  }

  const iframeDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;}</style></head><body>${html}</body></html>`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Code2 size={16} className="text-[var(--color-text-secondary)]" />
          <label className="text-sm font-medium text-[var(--color-text)]">Código HTML</label>
        </div>
        <textarea
          value={html}
          onChange={e => setHtml(e.target.value)}
          rows={14}
          spellCheck={false}
          className="w-full px-3 py-3 rounded-xl border border-[var(--color-border)] font-mono text-xs bg-[#1E1E1E] text-[#D4D4D4] resize-none focus:outline-none focus:border-[var(--color-accent)]"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Define el tamaño del elemento raíz con width/height en el estilo inline para controlar las dimensiones de la imagen.
        </p>
      </div>

      <div className="space-y-5">
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="px-4 py-2 bg-[var(--color-bg)] border-b border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)]">
            Vista previa
          </div>
          <div className="bg-white overflow-auto" style={{ minHeight: '200px' }}>
            <iframe
              ref={iframeRef}
              srcDoc={iframeDoc}
              title="Vista previa HTML"
              sandbox="allow-same-origin"
              className="w-full border-0"
              style={{ height: '300px' }}
            />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] mb-3">Formato de salida</h2>
          <div className="flex gap-2">
            {(['png', 'jpg'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={['flex-1 py-2 rounded-lg text-sm font-bold border transition-colors uppercase',
                  format === f ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton onClick={handleCapture} loading={loading} label="Capturar imagen" className="w-full" />
      </div>
    </div>
  );
}
