/**
 * Detecta el archivo que una herramienta acaba de descargar, para ofrecer
 * "¿Y ahora?" (`NextSteps.tsx`) sin tocar cada una de las herramientas.
 *
 * Todas descargan igual: `URL.createObjectURL(blob)` → `<a download>.click()`
 * → `URL.revokeObjectURL()`, casi siempre seguido y con el `<a>` fuera del
 * DOM. Por eso no basta con escuchar clics en el documento:
 *   1. Se envuelve `URL.createObjectURL` para recordar qué Blob hay detrás de
 *      cada `blob:` (y `revokeObjectURL` para olvidarlo). No retiene nada que
 *      el navegador no retuviera ya: la URL viva mantiene el Blob igual.
 *   2. Se envuelve `HTMLAnchorElement.prototype.click` y se escucha el clic
 *      real en enlaces `<a download href="blob:…">` del documento.
 * En ambos casos el Blob se lee del mapa en el momento del clic, antes de que
 * la herramienta revoque la URL.
 *
 * Emite `tf:result` en `window` con `{ file: File }`.
 */

export const RESULT_EVENT = 'tf:result';

export interface ResultDetail {
  file: File;
}

let installed = false;

export function installResultCapture(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const blobs = new Map<string, Blob>();
  const create = URL.createObjectURL.bind(URL);
  const revoke = URL.revokeObjectURL.bind(URL);

  URL.createObjectURL = (obj: Blob | MediaSource): string => {
    const url = create(obj);
    if (obj instanceof Blob) blobs.set(url, obj);
    return url;
  };
  URL.revokeObjectURL = (url: string): void => {
    blobs.delete(url);
    revoke(url);
  };

  let last: { anchor: HTMLAnchorElement; at: number } | null = null;

  const emit = (a: HTMLAnchorElement) => {
    if (!a.hasAttribute('download') || !a.href.startsWith('blob:')) return;
    // El clic programático y el del documento pueden llegar los dos.
    const now = performance.now();
    if (last && last.anchor === a && now - last.at < 500) return;
    last = { anchor: a, at: now };
    const blob = blobs.get(a.href);
    if (!blob || blob.size === 0) return;
    const name = a.download || 'archivo';
    const file = blob instanceof File ? blob : new File([blob], name, { type: blob.type });
    window.dispatchEvent(new CustomEvent<ResultDetail>(RESULT_EVENT, { detail: { file } }));
  };

  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    try { emit(this); } catch { /* nunca bloquear la descarga */ }
    click.call(this);
  };

  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[download]');
    if (a instanceof HTMLAnchorElement) {
      try { emit(a); } catch { /* idem */ }
    }
  }, true);
}
