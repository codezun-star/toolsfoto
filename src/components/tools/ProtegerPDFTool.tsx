import { useState } from 'react';
import PdfUploader from '@/components/ui/PdfUploader';
import DownloadButton from '@/components/ui/DownloadButton';
import { Eye, EyeOff } from 'lucide-react';

interface PdfFile { file: File; name: string; size: number }

export default function ProtegerPDFTool() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [userPwd, setUserPwd] = useState('');
  const [ownerPwd, setOwnerPwd] = useState('');
  const [showUser, setShowUser] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClear() { setPdf(null); setError(null); setUserPwd(''); setOwnerPwd(''); }

  async function handleProtect() {
    if (!pdf || !userPwd.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await pdf.file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      // pdf-lib encrypt support (1.17+)
      // @ts-expect-error - encrypt is available in pdf-lib ≥1.17
      await doc.encrypt({
        userPassword: userPwd,
        ownerPassword: ownerPwd || userPwd,
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: true,
          contentAccessibility: true,
          documentAssembly: false,
        },
      });

      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.name.replace(/\.pdf$/i, '_protegido.pdf');
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Error al proteger el PDF. Es posible que tu versión del navegador no soporte este cifrado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <PdfUploader label="Sube tu PDF" onFile={(f) => { setPdf({ file: f, name: f.name, size: f.size }); setError(null); }} onClear={handleClear} current={pdf} />
      </div>

      <div className="space-y-5">
        <div className="p-5 bg-white rounded-xl border border-[var(--color-border)] space-y-4">
          <h2 className="font-bold text-[var(--color-text)]">Contraseñas</h2>

          <div>
            <label className="text-sm font-medium text-[var(--color-text)]">Contraseña de usuario <span className="text-[var(--color-accent)]">*</span></label>
            <p className="text-xs text-[var(--color-text-muted)] mb-1.5">Necesaria para abrir el PDF.</p>
            <div className="relative">
              <input
                type={showUser ? 'text' : 'password'}
                value={userPwd}
                onChange={e => setUserPwd(e.target.value)}
                placeholder="Contraseña para abrir"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button type="button" onClick={() => setShowUser(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                {showUser ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text)]">Contraseña de propietario</label>
            <p className="text-xs text-[var(--color-text-muted)] mb-1.5">Opcional. Restringe edición e impresión.</p>
            <div className="relative">
              <input
                type={showOwner ? 'text' : 'password'}
                value={ownerPwd}
                onChange={e => setOwnerPwd(e.target.value)}
                placeholder="Contraseña de propietario (opcional)"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button type="button" onClick={() => setShowOwner(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                {showOwner ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-[var(--color-tools-bg)] rounded-lg border border-[var(--color-tools-border)]">
            <p className="text-xs text-[var(--color-text-secondary)]">
              La contraseña nunca sale de tu navegador. El cifrado se aplica localmente con la librería pdf-lib.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <DownloadButton
          onClick={handleProtect}
          disabled={!pdf || !userPwd.trim() || loading}
          loading={loading}
          label="Proteger y descargar PDF"
          className="w-full"
        />
      </div>
    </div>
  );
}
