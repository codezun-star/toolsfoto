import { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface ImgState {
  file: File;
  url: string;
}

function DropZone({ label, img, onDrop }: { label: string; img: ImgState | null; onDrop: (f: File) => void }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) return;
    onDrop(f);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }}
      className={['relative rounded-xl border-2 border-dashed overflow-hidden transition-colors', over ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]' : 'border-[var(--color-border)] bg-white'].join(' ')}
      style={{ minHeight: 180 }}
    >
      {img ? (
        <img src={img.url} alt={label} className="w-full h-full object-contain" style={{ maxHeight: 220 }} />
      ) : (
        <button onClick={() => inputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 cursor-pointer" style={{ minHeight: 180 }}>
          <Upload size={28} className="text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-secondary)] font-medium">{label}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {img && (
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-white/90 border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          Cambiar
        </button>
      )}
    </div>
  );
}

export default function CompararImagenesTool() {
  const [imgA, setImgA] = useState<ImgState | null>(null);
  const [imgB, setImgB] = useState<ImgState | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function loadImg(side: 'a' | 'b', file: File) {
    const url = URL.createObjectURL(file);
    if (side === 'a') {
      if (imgA) URL.revokeObjectURL(imgA.url);
      setImgA({ file, url });
    } else {
      if (imgB) URL.revokeObjectURL(imgB.url);
      setImgB({ file, url });
    }
  }

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); }, [onPointerMove]);

  function startDrag(e: React.PointerEvent) {
    dragging.current = true;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    e.preventDefault();
  }

  const ready = imgA && imgB;

  return (
    <div className="space-y-6">
      {!ready && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Imagen A (Antes)</label>
            <DropZone label="Subir imagen A" img={imgA} onDrop={(f) => loadImg('a', f)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Imagen B (Después)</label>
            <DropZone label="Subir imagen B" img={imgB} onDrop={(f) => loadImg('b', f)} />
          </div>
        </div>
      )}

      {ready && (
        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative select-none overflow-hidden rounded-xl border border-[var(--color-border)] cursor-col-resize"
            style={{ userSelect: 'none' }}
          >
            <img src={imgB.url} alt="Después" className="w-full block" draggable={false} />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
              <img src={imgA.url} alt="Antes" className="w-full block" draggable={false} />
            </div>
            {/* Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-col-resize"
              style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
              onPointerDown={startDrag}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-[var(--color-border)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 4l-3 4 3 4M11 4l3 4-3 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            {/* Labels */}
            <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-bold bg-black/60 text-white rounded-md">Antes</span>
            <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-bold bg-black/60 text-white rounded-md">Después</span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <p className="text-xs text-center text-[var(--color-text-muted)]">Arrastra el divisor o usa el slider para comparar las imágenes</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { if (imgA) { URL.revokeObjectURL(imgA.url); setImgA(null); } }}
              className="py-2 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
            >
              Cambiar imagen A
            </button>
            <button
              onClick={() => { if (imgB) { URL.revokeObjectURL(imgB.url); setImgB(null); } }}
              className="py-2 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
            >
              Cambiar imagen B
            </button>
          </div>
        </div>
      )}

      {!ready && (
        <p className="text-sm text-[var(--color-text-muted)] text-center">Sube dos imágenes para compararlas con el slider interactivo</p>
      )}
    </div>
  );
}
