/**
 * Adapta los bytes que devuelven `pdf-lib` (`doc.save()`), los empaquetadores
 * ZIP/ICO propios y `FFmpeg` (`ff.readFile()`) al tipo que acepta el
 * constructor de `Blob`.
 *
 * Desde TypeScript 5.7 `Uint8Array` está parametrizado por el tipo de su
 * buffer, y el valor por defecto —`ArrayBufferLike`— incluye
 * `SharedArrayBuffer`, que `BlobPart` no admite. En este sitio el buffer nunca
 * puede ser compartido: el core de FFmpeg es de 1 hilo (`@ffmpeg/core`, no
 * `core-mt`) y no se activa el cross-origin isolation, requisito de
 * `SharedArrayBuffer`. El estrechamiento es por tanto seguro.
 *
 * Usar siempre esta función en lugar de `new Blob([bytes.buffer])`: pasar el
 * buffer entero ignora el offset y la longitud de la vista, y adjuntaría bytes
 * de más si el `Uint8Array` fuese un subrango.
 */
export function toBlobPart(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return bytes as Uint8Array<ArrayBuffer>;
}
