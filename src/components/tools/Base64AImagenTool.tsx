import { useState } from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

interface Result {
  url: string;
  size: number;
  ext: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = head.match(/data:([^;]+)/)?.[1] ?? 'image/png';
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

const EXT: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/bmp': 'bmp',
};

export default function Base64AImagenTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  function clear() {
    setResult((prev) => { if (prev) URL.revokeObjectURL(prev.url); return null; });
  }

  function decode() {
    setError(null);
    clear();
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      const dataUrl = trimmed.startsWith('data:') ? trimmed : `data:image/png;base64,${trimmed.replace(/\s/g, '')}`;
      const blob = dataUrlToBlob(dataUrl);
      if (blob.size === 0) throw new Error('vacío');
      const ext = EXT[blob.type] ?? 'png';
      setResult({ url: URL.createObjectURL(blob), size: blob.size, ext });
    } catch {
      setError('No se pudo decodificar. Pega una cadena Base64 o un data URI de imagen válido.');
    }
  }

  function download() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `imagen.${result.ext}`;
    a.click();
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Base64 o data URI</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="data:image/png;base64,iVBORw0KGgo… o solo la cadena Base64"
          rows={6}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-accent)] font-mono resize-y"
        />
      </div>

      <button
        onClick={decode}
        disabled={!input.trim()}
        className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <ImageIcon size={18} />
        Decodificar a imagen
      </button>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

      {result && (
        <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
          <img src={result.url} alt="Decodificada" className="max-h-72 mx-auto rounded-lg object-contain bg-[var(--color-bg)]" />
          <p className="text-sm text-center text-[var(--color-text-secondary)]">{result.ext.toUpperCase()} · {formatBytes(result.size)}</p>
          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Descargar imagen
          </button>
        </div>
      )}
    </div>
  );
}
