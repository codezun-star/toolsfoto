import { useState, useRef } from 'react';
import AudioUploader, { type AudioFile } from '@/components/ui/AudioUploader';
import { Copy, Download, Check } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

export default function AudioABase64Tool() {
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [base64, setBase64] = useState('');
  const [dataUri, setDataUri] = useState('');
  const [withPrefix, setWithPrefix] = useState(true);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleClear() {
    setAudio(null);
    setBase64('');
    setDataUri('');
    setError(null);
    setCopied(false);
  }

  async function process() {
    if (!audio) return;
    setProcessing(true);
    setError(null);
    setBase64('');
    setDataUri('');
    setCopied(false);
    try {
      const arrayBuffer = await audio.file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]!);
      }
      const b64 = btoa(binary);
      const ext = audio.name.split('.').pop()?.toLowerCase() ?? 'mp3';
      const mimeMap: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac', m4a: 'audio/mp4' };
      const mime = mimeMap[ext] ?? 'audio/mpeg';
      setBase64(b64);
      setDataUri(`data:${mime};base64,${b64}`);
    } catch (err) {
      console.error('[AudioABase64] Error:', err);
      setError('Error al procesar el archivo de audio.');
    } finally {
      setProcessing(false);
    }
  }

  function copy() {
    const value = withPrefix ? dataUri : base64;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function download() {
    const value = withPrefix ? dataUri : base64;
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = audio ? audio.name.replace(/\.[^.]+$/, '.txt') : 'audio-base64.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  const displayValue = withPrefix ? dataUri : base64;

  return (
    <div className="space-y-6">
      <AudioUploader label="Sube tu archivo de audio" onFile={setAudio} onClear={handleClear} current={audio} />

      {audio && !base64 && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Archivo: <strong>{audio.name}</strong> — {formatBytes(audio.size)}.
            {audio.size > 5 * 1024 * 1024 && ' El resultado será muy largo; considera usarlo solo para archivos pequeños.'}
          </p>
          <button
            onClick={process}
            disabled={processing}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors disabled:opacity-60"
          >
            {processing ? 'Convirtiendo…' : 'Convertir a Base64'}
          </button>
        </div>
      )}

      {base64 && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-[var(--color-tools-border)] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold text-[var(--color-text)]">Resultado</h2>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input type="checkbox" checked={withPrefix} onChange={(e) => setWithPrefix(e.target.checked)} className="accent-[var(--color-accent)]" />
                Incluir prefijo data URI
              </label>
            </div>
            <textarea
              ref={textareaRef}
              readOnly
              value={displayValue}
              rows={6}
              className="w-full text-xs font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 resize-none text-[var(--color-text)]"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Longitud: {displayValue.length.toLocaleString()} caracteres (~{formatBytes(displayValue.length)})
            </p>
            <div className="flex gap-3">
              <button
                onClick={copy}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors text-sm"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={download}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[var(--color-accent)] text-[var(--color-accent)] font-semibold rounded-xl hover:bg-[var(--color-accent-bg)] transition-colors text-sm"
              >
                <Download size={16} />
                Descargar .txt
              </button>
            </div>
          </div>
          <button onClick={handleClear} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            Convertir otro audio
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
