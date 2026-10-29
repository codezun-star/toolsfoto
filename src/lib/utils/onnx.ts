/// <reference path="../../../node_modules/onnxruntime-web/types.d.ts" />
import type { InferenceSession } from 'onnxruntime-web';

/**
 * ONNX Runtime Web para las herramientas de IA (`mejorar-calidad-imagen`, `borrar-objetos-foto`).
 *
 * - Se usa el paquete `onnxruntime-web/webgpu`: con WebGPU (Chrome, Edge,
 *   Safari 26) la inferencia va en la GPU y es decenas de veces más rápida; si
 *   no hay WebGPU o el modelo usa operaciones que la GPU no admite, ORT cae
 *   solo al backend WASM.
 * - Los binarios WASM de ORT se cargan de jsDelivr con la versión exacta del
 *   paquete instalado (1.21.0, la misma que trae `@imgly/background-removal`).
 * - Un hilo: el sitio no activa el cross-origin isolation (ver la nota de
 *   COOP/COEP), así que no hay `SharedArrayBuffer` para el multihilo.
 * - Los modelos se guardan en la Cache Storage `ai-models-v1` con su URL de
 *   origen como clave. Hugging Face redirige a URLs firmadas que cambian en
 *   cada petición, y sin esto la caché HTTP no serviría y se volverían a
 *   descargar decenas de MB cada vez. No empieza por `tf-`, así que el
 *   service worker (`app-sw.js`) no la borra al actualizarse.
 */

const ORT_VERSION = '1.21.0';
const MODEL_CACHE = 'ai-models-v1';

type Ort = typeof import('onnxruntime-web');

let ortPromise: Promise<Ort> | null = null;

export function loadOrt(): Promise<Ort> {
  ortPromise ??= import('onnxruntime-web/webgpu').then((ort) => {
    ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
    ort.env.wasm.numThreads = 1;
    return ort as unknown as Ort;
  });
  return ortPromise;
}

/** Descarga un modelo con progreso (0-1), usando la caché de modelos si ya está. */
export async function fetchModel(url: string, onProgress?: (p: number) => void): Promise<ArrayBuffer> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open(MODEL_CACHE);
    const hit = await cache.match(url);
    if (hit) {
      onProgress?.(1);
      return hit.arrayBuffer();
    }
  } catch { /* sin Cache Storage (modo privado): se descarga sin guardar */ }

  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} al descargar el modelo`);
  const total = Number(res.headers.get('content-length') || 0);
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    loaded += value.length;
    if (total) onProgress?.(loaded / total);
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const p of parts) { bytes.set(p, offset); offset += p.length; }

  if (cache) {
    try {
      await cache.put(url, new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream' } }));
    } catch { /* cuota llena: funciona igual, solo que no se guarda */ }
  }
  onProgress?.(1);
  return bytes.buffer;
}

/** WebGPU utilizable: no basta con `navigator.gpu`, hace falta un adaptador. */
export async function hasWebGpu(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    return !!gpu && (await gpu.requestAdapter()) !== null;
  } catch {
    return false;
  }
}

/**
 * Crea una sesión. Con `gpu: true` y WebGPU disponible, la inferencia va en la
 * GPU (no bloquea la página). En otro caso usa WASM en un worker (`proxy`):
 * sin él, una inferencia larga congelaría la página entera durante segundos.
 * El modo se fija en la primera sesión de la página (ORT no deja cambiarlo
 * después de inicializarse), así que cada herramienta usa siempre el mismo.
 */
export async function createSession(model: ArrayBuffer, opts: { gpu?: boolean } = {}): Promise<InferenceSession> {
  const ort = await loadOrt();
  const gpu = !!opts.gpu && await hasWebGpu();
  if (!gpu) ort.env.wasm.proxy = true;
  try {
    return await ort.InferenceSession.create(model, {
      executionProviders: gpu ? ['webgpu', 'wasm'] : ['wasm'],
      graphOptimizationLevel: 'all',
    });
  } catch (err) {
    if (!gpu) throw err;
    // Algunas GPU fallan al compilar el grafo: se reintenta solo con WASM.
    return ort.InferenceSession.create(model, { executionProviders: ['wasm'] });
  }
}
