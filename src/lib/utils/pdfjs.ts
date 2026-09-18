/**
 * Carga `pdfjs-dist` (build **legacy**) con su worker de la misma versión.
 *
 * pdf.js exige que la API y el worker coincidan exactamente; si no, lanza
 * `The API version "X" does not match the Worker version "Y"` y la herramienta
 * falla entera. Antes cada tool fijaba `workerSrc` a un worker 3.11.174 de
 * cdnjs mientras el bundle traía la 5.x de `package.json`: las 10 herramientas
 * que usan pdfjs estaban rotas.
 *
 * Aquí el worker se importa del propio paquete con `?url`, así que lo empaqueta
 * Vite y su versión es siempre la instalada. Además deja de depender de un CDN
 * externo, en línea con la promesa del sitio de procesarlo todo en local.
 *
 * Se usa la build `legacy` a propósito. La build moderna de pdf.js 5.x usa
 * `Map.prototype.getOrInsertComputed`, que ni siquiera Chrome 141 implementa
 * todavía: con ella el render revienta con
 * `this[#e].getOrInsertComputed is not a function` en cualquier navegador
 * actual. La build `legacy` trae ese código transpilado y con polyfills, que es
 * exactamente para lo que existe.
 *
 * Usar SIEMPRE esta función en las herramientas; nunca fijar `workerSrc` a mano.
 */
export async function loadPdfjs() {
  const [pdfjsLib, workerUrl] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url').then(m => m.default),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjsLib;
}
