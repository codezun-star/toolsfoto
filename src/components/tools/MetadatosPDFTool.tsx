import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import { Download, Loader2, Info } from 'lucide-react';

interface Meta {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  creationDate: string;
}

export default function MetadatosPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [edit, setEdit] = useState<Omit<Meta, 'creator' | 'creationDate'>>({ title: '', author: '', subject: '', keywords: '' });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleFile(f: File) {
    setFile(f);
    setMeta(null);
    setError(null);
    setSaved(false);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const m: Meta = {
        title: doc.getTitle() ?? '',
        author: doc.getAuthor() ?? '',
        subject: doc.getSubject() ?? '',
        keywords: doc.getKeywords() ?? '',
        creator: doc.getCreator() ?? '',
        creationDate: doc.getCreationDate()?.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) ?? '',
      };
      setMeta(m);
      setEdit({ title: m.title, author: m.author, subject: m.subject, keywords: m.keywords });
    } catch (err) {
      console.error('[MetadatosPDF] Error al leer:', err);
      setError('No se pudieron leer los metadatos del PDF. El archivo puede estar dañado o ser un PDF escaneado sin metadatos.');
    }
  }

  function handleClear() {
    setFile(null);
    setMeta(null);
    setEdit({ title: '', author: '', subject: '', keywords: '' });
    setError(null);
    setSaved(false);
  }

  async function save() {
    if (!file) return;
    setProcessing(true);
    setProgress(10);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await file.arrayBuffer();
      setProgress(40);
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      if (edit.title !== undefined) doc.setTitle(edit.title);
      if (edit.author !== undefined) doc.setAuthor(edit.author);
      if (edit.subject !== undefined) doc.setSubject(edit.subject);
      if (edit.keywords !== undefined) doc.setKeywords([edit.keywords]);
      setProgress(70);
      const bytes = await doc.save();
      setProgress(100);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, '_metadatos.pdf');
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
    } catch (err) {
      console.error('[MetadatosPDF] Error al guardar:', err);
      setError('Error al guardar los metadatos. Asegúrate de que el PDF no está protegido con contraseña.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PdfUploader onFile={handleFile} onClear={handleClear} current={file} />

      {meta && !processing && (
        <div className="space-y-5">
          {(meta.creator || meta.creationDate) && (
            <div className="p-4 bg-[var(--color-tools-bg)] rounded-xl border border-[var(--color-tools-border)] space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Info size={14} className="text-[var(--color-tools-icon)]" />
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Metadatos de solo lectura</p>
              </div>
              {meta.creator && (
                <div className="flex gap-2 text-sm">
                  <span className="text-[var(--color-text-muted)] w-28 shrink-0">Creador:</span>
                  <span className="text-[var(--color-text)]">{meta.creator}</span>
                </div>
              )}
              {meta.creationDate && (
                <div className="flex gap-2 text-sm">
                  <span className="text-[var(--color-text-muted)] w-28 shrink-0">Fecha creación:</span>
                  <span className="text-[var(--color-text)]">{meta.creationDate}</span>
                </div>
              )}
            </div>
          )}

          <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
            <h2 className="font-bold text-[var(--color-text)]">Editar metadatos</h2>
            {([
              ['title', 'Título'],
              ['author', 'Autor'],
              ['subject', 'Asunto'],
              ['keywords', 'Palabras clave'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">{label}</label>
                <input
                  type="text"
                  value={edit[key]}
                  onChange={(e) => setEdit((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder={`${label} del documento…`}
                />
              </div>
            ))}
          </div>

          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
              Metadatos guardados correctamente. El PDF se ha descargado con los nuevos datos.
            </div>
          )}

          <button
            onClick={save}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-xl hover:bg-[#C93D1E] transition-colors"
          >
            <Download size={18} />
            Guardar y descargar PDF
          </button>
        </div>
      )}

      {processing && (
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] text-center space-y-3">
          <Loader2 size={28} className="animate-spin mx-auto text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Guardando metadatos… {progress}%</p>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}
    </div>
  );
}
