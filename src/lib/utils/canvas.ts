export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality: number = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Error al generar el archivo de imagen'));
      },
      type,
      quality,
    );
  });
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');
  return ctx;
}

export function imageToObjectURL(img: HTMLImageElement): string {
  const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = getContext(canvas);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL();
}

export function fileToObjectURL(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeURL(url: string): void {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}
