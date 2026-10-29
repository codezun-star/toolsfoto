import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { revokeURL } from '@/lib/utils/canvas';

interface Props {
  text: string;
  filename: string;
  mime?: string;
}

/** Botones «Copiar» y «Descargar» para el resultado de las herramientas de texto. */
export default function CopyDownload({ text, filename, mime = 'text/plain' }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    revokeURL(url);
  }

  const btn = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white text-xs font-medium hover:bg-[var(--color-bg)] disabled:opacity-40 transition-colors';
  return (
    <div className="flex gap-2">
      <button onClick={copy} disabled={!text} className={btn}>
        {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
      <button onClick={download} disabled={!text} className={btn}>
        <Download size={13} />
        Descargar
      </button>
    </div>
  );
}
