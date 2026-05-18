import { useCallback, useRef, useState } from 'react';
import { Video, X, Upload } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

const MAX_SIZE = 500 * 1024 * 1024;
const ACCEPT = 'video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi,.mkv';

export interface VideoFile {
  file: File;
  name: string;
  size: number;
}

interface Props {
  label?: string;
  onFile: (f: VideoFile) => void;
  onClear: () => void;
  current: VideoFile | null;
  error?: string | null;
}

export default function VideoUploader({ label = 'Sube tu vídeo', onFile, onClear, current, error }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) return;
    if (file.size > MAX_SIZE) return;
    onFile({ file, name: file.name, size: file.size });
  }, [onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  if (current) {
    return (
      <div className="p-4 bg-white rounded-xl border border-[var(--color-border)] flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)] shrink-0">
          <Video size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)] truncate">{current.name}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatBytes(current.size)}</p>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          aria-label="Eliminar archivo"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        className={[
          'flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
          dragging
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
            : 'border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-bg)]',
        ].join(' ')}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
      >
        <div className="p-3 rounded-xl bg-[var(--color-tools-bg)] text-[var(--color-tools-icon)]">
          <Upload size={24} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-[var(--color-text)]">{label}</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Arrastra aquí o haz clic · MP4, WebM, MOV · Máx. 500 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }}
        />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
