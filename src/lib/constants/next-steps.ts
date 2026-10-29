/**
 * "¿Y ahora?": herramientas que se ofrecen para seguir trabajando con el
 * archivo que se acaba de descargar (`NextSteps.tsx`), según su tipo.
 *
 * Solo deben figurar herramientas cuyo uploader recibe archivos del buzón
 * (`useFileReceiver`): `ImageUploader`/`useImageUpload`, `PdfUploader`,
 * `VideoUploader`, `AudioUploader`, `JPGaPDFTool` y `UnirPDFsTool`.
 * Si no, el usuario llegaría a la página con el uploader vacío.
 */

export type FileKind = 'image' | 'pdf' | 'video' | 'audio';

export const NEXT_STEPS: Record<FileKind, string[]> = {
  image: ['comprimir', 'redimensionar', 'recortar', 'convertir', 'eliminar-fondo', 'jpg-a-pdf', 'marca-de-agua', 'imagen-a-texto'],
  pdf: ['comprimir-pdf', 'unir-pdfs', 'editar-pdf', 'firmar-pdf', 'pdf-a-word', 'proteger-pdf', 'numerar-paginas-pdf', 'pdf-a-jpg'],
  video: ['comprimir-video', 'recortar-video', 'video-a-gif', 'extraer-audio', 'cambiar-velocidad', 'silenciar-video', 'anadir-subtitulos'],
  audio: ['comprimir-audio', 'cortar-audio', 'convertir-audio', 'normalizar-audio', 'cambiar-volumen', 'audio-a-video'],
};

/** `/compartir` ofrece, además de las de "¿Y ahora?", estas otras. */
export const SHARE_EXTRA: Record<FileKind, string[]> = {
  image: ['girar', 'recorte-circular', 'redimensionar-redes', 'foto-carnet', 'blancoynegro'],
  pdf: ['pdf-a-excel', 'ocr-pdf', 'rotar-pdf', 'dividir-pdf', 'eliminar-paginas-pdf'],
  video: ['convertir-video', 'rotar-video', 'video-a-mp3', 'comprimir-para-whatsapp'],
  audio: ['velocidad-audio', 'cambiar-tono', 'reducir-ruido-audio', 'eliminar-silencio'],
};

const EXT_KIND: Record<string, FileKind> = {
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', avif: 'image', gif: 'image',
  pdf: 'pdf',
  mp4: 'video', webm: 'video', mov: 'video', mkv: 'video', avi: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', aac: 'audio', flac: 'audio', m4a: 'audio',
};

/** Tipo de archivo para "¿Y ahora?". `null` si no hay herramientas para él (ZIP, TXT…). */
export function fileKind(file: File): FileKind | null {
  const t = file.type;
  if (t === 'application/pdf') return 'pdf';
  if (t.startsWith('image/') && t !== 'image/svg+xml' && t !== 'image/x-icon' && t !== 'image/vnd.microsoft.icon') return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_KIND[ext] ?? null;
}
