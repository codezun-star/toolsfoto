import { useRef } from 'react';
import { Upload, ImageIcon, X, RefreshCw } from 'lucide-react';
import { formatBytes, formatDimensions } from '@/lib/utils/format';
import type { ImageFile } from '@/hooks/useImageUpload';

interface Props {
  image: ImageFile | null;
  error: string | null;
  isDragging: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export default function ImageUploader({
  image, error, isDragging,
  onDrop, onDragOver, onDragLeave, onFileChange, onClear,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (image) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="relative">
          <img
            src={image.url}
            alt="Vista previa"
            className="w-full max-h-80 object-contain bg-[#F8F8F8]"
          />
          <button
            onClick={onClear}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 border border-[var(--color-border)] hover:bg-red-50 hover:border-red-200 transition-colors"
            title="Eliminar imagen"
          >
            <X size={16} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>
        <div className="px-4 py-3 flex items-center justify-between border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <ImageIcon size={14} className="text-[var(--color-text-muted)] shrink-0" />
            <span className="text-sm text-[var(--color-text-secondary)] truncate">{image.file.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(image.file.size)}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{formatDimensions(image.width, image.height)}</span>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline"
            >
              <RefreshCw size={12} />
              Cambiar
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          'w-full rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer text-center',
          isDragging
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
            : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)]',
        ].join(' ')}
      >
        <div className={[
          'p-3 rounded-full transition-colors',
          isDragging ? 'bg-[var(--color-accent-bg)]' : 'bg-[var(--color-bg)]',
        ].join(' ')}>
          <Upload size={24} className={isDragging ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
        </div>
        <div>
          <p className="font-semibold text-[var(--color-text)]">
            {isDragging ? 'Suelta la imagen aquí' : 'Arrastra tu imagen o haz clic'}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">JPG, PNG, WebP, AVIF, GIF · Máximo 50 MB</p>
        </div>
      </button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
