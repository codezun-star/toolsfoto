import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { Eye, EyeOff } from 'lucide-react';

interface PdfFile { file: File; name: string; size: number }

export default function EliminarPasswordPDFTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() { setPdf(null); setError(null); setPassword(''); }

  async function handleUnlock() {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await pdf.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, {
        password,
        ignoreEncryption: false,
      });
      const out = await doc.save({ useObjectStreams: true });
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, '_sin_contraseña.pdf');
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo desbloquear el PDF. Comprueba que la contraseña sea correcta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <PdfUploader label="Sube el PDF protegido" onFile={(f) => { setPdf({ file: f, name: f.name, size: f.size }); setError(null); }} onClear={handleClear} current={pdf} />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Contraseña actual</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Introduce la contraseña con la que está protegido el PDF. Si no conoces la contraseña, no podemos ayudarte a desbloquear el archivo.
          </p>

          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleUnlock(); }}
              placeholder="Contraseña actual del PDF"
              className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Todo el proceso ocurre en tu navegador. La contraseña nunca se envía a ningún servidor.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton
          onClick={handleUnlock}
          disabled={!pdf || loading}
          loading={loading}
          label="Desbloquear y descargar PDF"
          className="w-full"
        />
      </div>
    </div>
  );
}
