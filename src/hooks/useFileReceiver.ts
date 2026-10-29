import { useEffect, useRef } from 'react';
import { registerReceiver } from '@/lib/utils/incoming';

/**
 * Hace que un uploader reciba archivos pegados (Ctrl+V) y los que llegan por
 * el buzón (otra herramienta, "Compartir" desde otra app, la extensión).
 * Ver `src/lib/utils/incoming.ts`.
 *
 * Las funciones se leen desde refs: el receptor se registra una sola vez al
 * montar y siempre usa la versión más reciente de cada callback.
 */
export function useFileReceiver(
  accepts: (file: File) => boolean,
  receive: (file: File) => void,
  isEmpty: () => boolean,
  multiple = false,
): void {
  const ref = useRef({ accepts, receive, isEmpty });
  ref.current = { accepts, receive, isEmpty };

  useEffect(() => registerReceiver({
    accepts: (f) => ref.current.accepts(f),
    receive: (f) => ref.current.receive(f),
    isEmpty: () => ref.current.isEmpty(),
    multiple,
  }), [multiple]);
}
