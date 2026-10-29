import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import ImageUploader from '@/components/ui/ImageUploader';
import { loadImage, canvasToBlob, createCanvas, getContext } from '@/lib/utils/canvas';
import { triggerDownload, getOutputFilename } from '@/lib/utils/download';

type Mode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

/**
 * Matrices de Machado, Oliveira y Fernandes (2009), severidad 1.0, que se
 * aplican sobre RGB lineal (no sobre sRGB). Son la referencia que usan las
 * herramientas de accesibilidad de Chrome y Firefox.
 */
const MATRICES: Record<Exclude<Mode, 'normal' | 'achromatopsia'>, number[]> = {
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
};

const MODES: Array<{ id: Mode; label: string; desc: string }> = [
  { id: 'normal', label: 'Visión normal', desc: 'Referencia' },
  { id: 'deuteranopia', label: 'Deuteranopia', desc: 'Sin verde · ~6 % de los hombres (incl. deuteranomalía)' },
  { id: 'protanopia', label: 'Protanopia', desc: 'Sin rojo · ~2 % de los hombres (incl. protanomalía)' },
  { id: 'tritanopia', label: 'Tritanopia', desc: 'Sin azul · muy poco frecuente' },
  { id: 'achromatopsia', label: 'Acromatopsia', desc: 'Sin color · muy poco frecuente' },
];

// Tablas sRGB ↔ lineal (precalculadas para que el filtro sea rápido).
const TO_LIN = new Float32Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; TO_LIN[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
const toSrgb = (v: number) => {
  const c = v <= 0 ? 0 : v >= 1 ? 1 : v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(c * 255);
};

function simulate(src: ImageData, mode: Mode): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  if (mode === 'normal') return out;
  const d = out.data;
  const m = mode === 'achromatopsia' ? null : MATRICES[mode];
  for (let i = 0; i < d.length; i += 4) {
    const r = TO_LIN[d[i]], g = TO_LIN[d[i + 1]], b = TO_LIN[d[i + 2]];
    if (!m) {
      const y = toSrgb(0.2126 * r + 0.7152 * g + 0.0722 * b);
      d[i] = d[i + 1] = d[i + 2] = y;
    } else {
      d[i] = toSrgb(m[0] * r + m[1] * g + m[2] * b);
      d[i + 1] = toSrgb(m[3] * r + m[4] * g + m[5] * b);
      d[i + 2] = toSrgb(m[6] * r + m[7] * g + m[8] * b);
    }
  }
  return out;
}

/**
 * Simulador de daltonismo: muestra cómo ve una imagen (una captura de tu web,
 * un gráfico, un mapa) una persona con cada tipo de daltonismo, para
 * comprobar que la información no depende solo del color.
 */
export default function SimuladorDaltonismoTool() {
  const { image, error, isDragging, clearImage, onDrop, onDragOver, onDragLeave, onFileChange } = useImageUpload();
  const [base, setBase] = useState<ImageData | null>(null);
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    setBase(null);
    if (!image) return;
    loadImage(image.url).then((img) => {
      // Vista previa a 900 px de lado como máximo; la descarga va a tamaño real.
      const k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = createCanvas(Math.round(img.naturalWidth * k), Math.round(img.naturalHeight * k));
      const ctx = getContext(c);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      setBase(ctx.getImageData(0, 0, c.width, c.height));
    });
  }, [image]);

  useEffect(() => {
    if (!base) return;
    for (const { id } of MODES) {
      const c = refs.current[id];
      if (!c) continue;
      c.width = base.width;
      c.height = base.height;
      getContext(c).putImageData(simulate(base, id), 0, 0);
    }
  }, [base]);

  async function download(mode: Mode) {
    if (!image) return;
    const img = await loadImage(image.url);
    const c = createCanvas(img.naturalWidth, img.naturalHeight);
    const ctx = getContext(c);
    ctx.drawImage(img, 0, 0);
    ctx.putImageData(simulate(ctx.getImageData(0, 0, c.width, c.height), mode), 0, 0);
    triggerDownload(await canvasToBlob(c, 'image/png'), getOutputFilename(image.file.name, mode, 'png'));
  }

  if (!image) {
    return (
      <div className="max-w-2xl">
        <ImageUploader image={null} error={error} isDragging={isDragging} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onFileChange={onFileChange} onClear={clearImage} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={clearImage} className="text-sm text-[var(--color-accent)] hover:underline">Usar otra imagen</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODES.map(({ id, label, desc }) => (
          <figure key={id} className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-white">
            <canvas ref={(el) => { refs.current[id] = el; }} className="block w-full h-auto bg-[var(--color-bg)]" />
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span>
                <span className="block text-sm font-bold text-[var(--color-text)]">{label}</span>
                <span className="block text-xs text-[var(--color-text-muted)]">{desc}</span>
              </span>
              {id !== 'normal' && (
                <button onClick={() => void download(id)} className="p-2 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)]" aria-label={`Descargar simulación de ${label}`}>
                  <Download size={16} />
                </button>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
