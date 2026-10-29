import { toBlobPart } from './bytes';

/**
 * Empaqueta archivos en un ZIP con `fflate` (import dinámico, 8 KB).
 * Los nombres repetidos se numeran ("foto.jpg", "foto (2).jpg"…). Se guarda
 * sin recomprimir (nivel 0): JPG, PNG, WebP y PDF ya van comprimidos y
 * volver a hacerlo solo gastaría tiempo.
 */
export async function makeZip(entries: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  const { zipSync } = await import('fflate');
  const used = new Set<string>();
  const files: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (const { name, blob } of entries) {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let unique = name;
    for (let n = 2; used.has(unique.toLowerCase()); n++) unique = `${base} (${n})${ext}`;
    used.add(unique.toLowerCase());
    files[unique] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }];
  }
  const bytes = zipSync(files);
  return new Blob([toBlobPart(bytes)], { type: 'application/zip' });
}
