import type { Worker as TesseractWorker } from 'tesseract.js';

/**
 * OCR con Tesseract.js (WASM). Lo usan `ImagenATextoTool` y `OcrPdfTool`.
 *
 * `tesseract.js` se importa en dinámico. El worker, el core WASM y los datos
 * de idioma se descargan de jsDelivr la primera vez (los datos de cada idioma
 * pesan entre 2 y 15 MB) y el navegador los guarda en IndexedDB, así que las
 * siguientes veces arranca al momento. Las imágenes nunca salen del
 * dispositivo: lo que viaja es el motor, no los archivos.
 */

export interface OcrLanguage { code: string; label: string }

export const OCR_LANGUAGES: OcrLanguage[] = [
  { code: 'spa', label: 'Español' },
  { code: 'eng', label: 'Inglés' },
  { code: 'spa+eng', label: 'Español + inglés' },
  { code: 'por', label: 'Portugués' },
  { code: 'fra', label: 'Francés' },
  { code: 'deu', label: 'Alemán' },
  { code: 'ita', label: 'Italiano' },
  { code: 'cat', label: 'Catalán' },
];

/** Traduce el estado interno de Tesseract a un texto para el usuario. */
export function ocrStatusLabel(status: string): string {
  if (status.includes('loading tesseract core')) return 'Cargando el motor de OCR…';
  if (status.includes('loading language')) return 'Descargando el idioma…';
  if (status.includes('initializ')) return 'Preparando…';
  if (status.includes('recognizing')) return 'Reconociendo texto…';
  return 'Procesando…';
}

/**
 * Crea un worker de OCR para `lang` (códigos de Tesseract, varios con `+`).
 * `onProgress` recibe 0-1 y el estado. Llamar a `terminate()` al acabar.
 */
export async function createOcrWorker(
  lang: string,
  onProgress?: (progress: number, status: string) => void,
): Promise<TesseractWorker> {
  const { createWorker, OEM } = await import('tesseract.js');
  return createWorker(lang.split('+'), OEM.LSTM_ONLY, {
    logger: (m) => onProgress?.(m.progress, m.status),
  });
}
