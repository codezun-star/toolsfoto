import { takeStashedFiles } from './inbox';
import { currentPath } from './path';

/**
 * Entrada de archivos que no vienen del selector ni de arrastrar:
 *   - Pegar con Ctrl+V / Cmd+V una imagen o un archivo copiado.
 *   - El buzón (`inbox.ts`): resultado de otra herramienta, "Compartir" desde
 *     otra app o la extensión de navegador.
 *
 * Los uploaders se registran como receptores (vía `useFileReceiver`) en el
 * orden en que se montan. Cada archivo va al primer receptor que lo acepta y
 * está vacío; si todos tienen ya archivo, al primero que lo acepta (pegar
 * equivale a pulsar "Cambiar"). Así una herramienta con dos uploaders
 * (vídeo + audio, imagen + PDF) recibe cada archivo en el suyo.
 */

export interface FileReceiver {
  accepts: (file: File) => boolean;
  isEmpty: () => boolean;
  receive: (file: File) => void;
  /** Admite varios archivos a la vez (unir PDFs, imágenes a PDF…). */
  multiple?: boolean;
}

const receivers: FileReceiver[] = [];
let listening = false;
let inboxChecked = false;

/** Entrega archivos a los receptores. Devuelve cuántos encontraron destino. */
export function deliverFiles(files: File[]): number {
  const used = new Set<FileReceiver>();
  let delivered = 0;
  for (const file of files) {
    const candidates = receivers.filter((r) => !used.has(r) && r.accepts(file));
    const target = candidates.find((r) => r.isEmpty()) ?? candidates[0];
    if (!target) continue;
    if (!target.multiple) used.add(target);
    target.receive(file);
    delivered++;
  }
  return delivered;
}

function onPaste(e: ClipboardEvent) {
  const files = Array.from(e.clipboardData?.files ?? []);
  if (!files.length) return;
  if (deliverFiles(files) > 0) e.preventDefault();
}

function checkInbox() {
  if (inboxChecked) return;
  inboxChecked = true;
  // Se espera un instante para que se registren todos los uploaders de la
  // página (las islas de React hidratan en orden, pero no a la vez).
  window.setTimeout(() => {
    takeStashedFiles(currentPath(location.pathname)).then((files) => {
      if (files.length) deliverFiles(files);
    });
  }, 60);
}

export function registerReceiver(receiver: FileReceiver): () => void {
  receivers.push(receiver);
  if (!listening) {
    listening = true;
    document.addEventListener('paste', onPaste);
  }
  checkInbox();
  return () => {
    const i = receivers.indexOf(receiver);
    if (i >= 0) receivers.splice(i, 1);
  };
}
