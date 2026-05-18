import { Download, Loader2 } from 'lucide-react';

interface Props {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function DownloadButton({ onClick, loading = false, disabled = false, label = 'Descargar', className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
        'bg-[var(--color-accent)] text-white hover:bg-[#C93D1E] active:scale-[0.98]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        className,
      ].join(' ')}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Download size={18} />
      )}
      {loading ? 'Procesando...' : label}
    </button>
  );
}
