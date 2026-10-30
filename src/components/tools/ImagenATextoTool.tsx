import { useState } from 'react';
import { Copy, Check, Download, ScanText } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import ImageUploader from '@/components/ui/ImageUploader';
import { revokeURL } from '@/lib/utils/canvas';
import { createOcrWorker, ocrStatusLabel, OCR_LANGUAGES } from '@/lib/utils/ocr';
import { useT, withLang } from '@/i18n/react';

function ImagenATextoTool() {
  const t = useT();
  const { image, error: uploadError, isDragging, clearImage, onDrop, onDragOver, onDragLeave, onFileChange } = useImageUpload();
  const [lang, setLang] = useState('spa');
  const [text, setText] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    clearImage();
    setText('');
    setConfidence(null);
    setError(null);
  }

  async function handleRecognize() {
    if (!image) return;
    setLoading(true);
    setError(null);
    setText('');
    setConfidence(null);
    setProgress(0);
    setStatus(t('Cargando el motor de OCR…'));
    try {
      const worker = await createOcrWorker(lang, (p, s) => {
        setStatus(t(ocrStatusLabel(s)));
        if (s.includes('recognizing')) setProgress(Math.round(p * 100));
      });
      try {
        const { data } = await worker.recognize(image.file);
        const result = data.text.replace(/\n{3,}/g, '\n\n').trim();
        if (!result) {
          setError(t('No se ha encontrado texto en la imagen. Prueba con una foto más nítida, mejor iluminada o con el idioma correcto.'));
        } else {
          setText(result);
          setConfidence(Math.round(data.confidence));
        }
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      console.error('[ImagenATextoTool] Error OCR:', err);
      setError(t('No se ha podido reconocer el texto. Comprueba tu conexión (la primera vez se descarga el motor de OCR) e inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(image?.file.name ?? 'imagen').replace(/\.[^.]+$/, '')}-${t('texto')}.txt`;
    a.click();
    revokeURL(url);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ImageUploader
          image={image}
          error={uploadError}
          isDragging={isDragging}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onFileChange={onFileChange}
          onClear={reset}
        />

        <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] space-y-3">
          <label className="block text-sm font-semibold text-[var(--color-text)]" htmlFor="ocr-lang">{t('Idioma del texto')}</label>
          <select
            id="ocr-lang"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          >
            {OCR_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{t(l.label)}</option>)}
          </select>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('Elegir el idioma correcto mejora mucho el resultado con tildes, eñes y palabras propias del idioma.')}
          </p>
        </div>

        <button
          onClick={handleRecognize}
          disabled={!image || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#C93D1E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ScanText size={16} />
          {loading ? status : t('Extraer texto')}
        </button>

        {loading && (
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('La primera vez descarga el motor de OCR y el idioma (unos 10 MB). Las siguientes veces es instantáneo.')}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {t('Texto reconocido')}
            {confidence !== null && (
              <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">{t('Confianza: {c}%', { c: confidence })}</span>
            )}
          </p>
          {text && (
            <div className="flex gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-bg)] transition-colors">
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? t('Copiado') : t('Copiar')}
              </button>
              <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-bg)] transition-colors">
                <Download size={13} />
                .txt
              </button>
            </div>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('Aquí aparecerá el texto de la imagen. Podrás corregirlo antes de copiarlo.')}
          rows={18}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)] bg-white resize-y focus:outline-none focus:border-[var(--color-accent)] leading-relaxed"
        />
      </div>
    </div>
  );
}

export default withLang(ImagenATextoTool);
