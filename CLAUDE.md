# ToolsFoto v2 — Contexto del proyecto para Claude

## Descripción general

**ToolsFoto** es una plataforma web de herramientas para archivos digitales: imágenes, PDF, vídeo, audio y developers.
- Dominio: https://toolsfoto.com
- Carpeta: `C:\Users\Jose\toolsfoto-v2`
- Todos los archivos se procesan 100% en el navegador. Ningún archivo sale del dispositivo del usuario.
- Sin backend, sin base de datos, sin autenticación.
- Contacto público: `codezun@gmail.com`

---

## Regla obligatoria: documentar cada herramienta nueva

**Cada vez que se añada una herramienta nueva, se DEBE actualizar:**
1. Añadir fila en el archivo de dominio correspondiente (`HERRAMIENTAS-IMAGEN.md`, `HERRAMIENTAS-PDF.md`, `HERRAMIENTAS-VIDEO.md`, `HERRAMIENTAS-AUDIO.md` o `HERRAMIENTAS-DEV.md`) y actualizar el contador total en `HERRAMIENTAS.md`.
2. Actualizar el contador de páginas en la sección "Comandos" de este CLAUDE.md.
3. Actualizar `src/lib/constants/tools.ts` — entrada con `domain` correcto.
4. Actualizar `src/lib/constants/seo.ts` — título, descripción y canonical.
5. Añadir el componente `src/components/tools/NombreTool.tsx`.
6. Añadir la página `src/pages/slug.astro` con al menos 5 `faqs`.
7. Registrar el icono Lucide en `src/components/ui/ToolCard.tsx` (import + ICONS record).
8. Si la herramienta usa un uploader nuevo, documentarlo en la sección de UI.

## Regla obligatoria: checklist al añadir un artículo al blog

**Cada vez que se añada un artículo nuevo, se DEBE:**
1. Crear `src/content/blog/[slug].md` con frontmatter válido (ver schema en la sección Blog).
2. Verificar que el slug NO contiene año (`-2026`, `-2025`, etc.).
3. Ejecutar `npm run build` — debe completar sin errores de schema.
4. Actualizar el contador de páginas en la sección "Comandos" de este CLAUDE.md (+1).

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Astro 6 (`output: "static"`) |
| UI interactiva | React 19 (islands con `client:load`) |
| Lenguaje | TypeScript estricto — sin `any` |
| Estilos | Tailwind CSS v4 (vía `@tailwindcss/vite`, sin `tailwind.config.js`) |
| Iconos | Lucide React exclusivamente — cero emojis en la UI |
| Deploy | Cloudflare Pages (`@astrojs/cloudflare` adapter) |
| SEO | `@astrojs/sitemap` (sitemap automático) |

### Dependencias clave de procesamiento

| Librería | Uso | Carga |
|---|---|---|
| `browser-image-compression` | Compresión client-side con Web Worker | Estática |
| `@imgly/background-removal` | Eliminación de fondo con IA (ISNet, ~50 MB) | Dinámica `import()` |
| `html2canvas` | Captura de HTML como imagen | Dinámica `import()` |
| `pdf-lib` | Merge, split, rotate, protect, extract pages en PDF | Dinámica `import()` |
| `pdfjs-dist` | Renderizado y extracción de texto de PDFs | Dinámica `import()` + worker CDN |
| `@ffmpeg/ffmpeg` + `@ffmpeg/util` | Procesamiento vídeo/audio client-side con WASM | Dinámica vía `createFFmpeg()` |
| Canvas API nativa | Todas las herramientas de imagen y la mayoría de developer | — |

#### FFmpeg.wasm — detalles de integración

**Arquitectura de carga (crítico — leer antes de tocar ffmpeg.ts):**

`@ffmpeg/ffmpeg@0.12.15` crea un Web Worker clásico internamente. Ese Worker carga el core con esta lógica:
```js
try { importScripts(coreURL) }         // intenta UMD/classic
catch {
  self.createFFmpegCore = (await import(coreURL)).default  // fallback ESM
  if (!self.createFFmpegCore) throw error                  // UMD no tiene export default → undefined → falla
}
```
**Por eso `coreURL` DEBE apuntar a la build ESM (`/dist/esm/ffmpeg-core.js`), no a UMD.**
Usar `/dist/umd/ffmpeg-core.js` hace que `import().default === undefined` y lanza "failed to import ffmpeg-core.js".
El WASM es binario (sin exports), por lo que puede venir de cualquier build (se usa `umd/ffmpeg-core.wasm`).

**Por qué no se auto-hospeda el WASM en Cloudflare Pages:**
`ffmpeg-core.wasm` pesa 30.64 MiB. Cloudflare Pages tiene un límite de 25 MiB por archivo. Es imposible servirlo como asset estático.

**Cloudflare Worker proxy (ya desplegado):**
- URL: `https://ffmpeg-proxy.jose-zuniga1145.workers.dev`
- Código en `worker/worker.js`, config en `worker/wrangler.toml`
- Proxea únicamente requests a `https://unpkg.com` (allowlist hardcodeada)
- Añade `CORS: *`, `Cross-Origin-Resource-Policy: cross-origin` y `Cache-Control: immutable`
- Para desplegar cambios: `cd worker && npx wrangler deploy --config wrangler.toml`

**URLs actuales en `src/lib/utils/ffmpeg.ts`:**
```ts
const _PROXY = 'https://ffmpeg-proxy.jose-zuniga1145.workers.dev/?url=https://unpkg.com/@ffmpeg/core@0.12.6/dist/';
const CORE_URL = `${_PROXY}esm/ffmpeg-core.js`;   // ESM — obligatorio
const WASM_URL = `${_PROXY}umd/ffmpeg-core.wasm`; // binario — da igual la build
```

**Headers COOP/COEP (`public/_headers`):**
El sitio sirve estos headers en todas las rutas para habilitar SharedArrayBuffer (aunque el core de 1 hilo no lo requiere, los headers son necesarios para que `toBlobURL` funcione en todos los contextos):
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: cross-origin
```

**Compatibilidad verificada de CDNs externos con `require-corp`:**
- `unpkg.com` → devuelve `CORP: cross-origin` ✓
- `cdnjs.cloudflare.com` → devuelve `CORP: cross-origin` ✓
- `staticimgly.com` (`@imgly`) → devuelve `CORP: cross-origin` ✓

**Limitación conocida — filtro `drawtext` de FFmpeg:**
El filtro `drawtext` requiere fontconfig y fuentes del sistema. En el entorno WASM del navegador no existen. **Nunca usar `drawtext`.** Para superponer texto en vídeo usar canvas overlay + filtro `overlay=0:0` (ver `MarcaAguaVideoTool.tsx`).

**Utilidades en `src/lib/utils/ffmpeg.ts`:**
- `createFFmpeg(onProgress?)` — instancia y carga FFmpeg. Llama siempre a esta función, nunca `new FFmpeg()` directamente.
- `runFFmpeg(ff, inputFile, inputName, args, outputName)` — escribe el archivo, ejecuta, lee el resultado, limpia. Usar para herramientas de **1 input, 1 output**.
- Para herramientas con múltiples inputs/outputs (unir, mezclar, GIF…), usar `ff.exec()` directamente pero gestionar manualmente `writeFile`/`readFile`/`deleteFile` y el bloque try/catch con `console.error`.

#### PDF.js worker CDN
```
https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
```
Asignar antes de usar: `pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN`

---

## Estructura de carpetas

```
toolsfoto-v2/
├── src/
│   ├── content.config.ts        # Schema Zod del blog (Content Layer API, Astro 6)
│   ├── content/
│   │   └── blog/                # Artículos .md — el nombre del archivo ES la URL
│   ├── pages/                   # Páginas Astro (una por herramienta + categorías + blog + legales)
│   │   ├── index.astro          # Homepage con tabs por dominio
│   │   ├── comprimir.astro      # (y el resto de slugs — NO MOVER NI RENOMBRAR, están indexados)
│   │   ├── imagen.astro         # Categoría: todas las herramientas de imagen con paginación
│   │   ├── pdf.astro            # Categoría: todas las herramientas de PDF con paginación
│   │   ├── video.astro          # Categoría: todas las herramientas de vídeo con paginación
│   │   ├── audio.astro          # Categoría: todas las herramientas de audio con paginación
│   │   ├── developer.astro      # Categoría: todas las herramientas developer con paginación
│   │   ├── blog/
│   │   │   ├── index.astro      # Listado de artículos ordenados por fecha
│   │   │   └── [slug].astro     # Artículo individual con JSON-LD Article + prose
│   │   ├── privacidad.astro / terminos.astro / cookies.astro
│   │   └── aviso-legal.astro / contacto.astro
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.astro          # Nav: Inicio, Imágenes, PDF, Vídeo, Audio, Dev, Blog
│   │   │   ├── Footer.astro          # 5 columnas: Imágenes, PDF, Vídeo, Audio, ToolsFoto (incluye Blog)
│   │   │   ├── ToolLayout.astro      # Wrapper: SEO + breadcrumb + relacionadas + FAQs
│   │   │   └── LegalLayout.astro     # Wrapper páginas legales: SEO + breadcrumb + prose
│   │   ├── HomeTools.tsx        # Tabs del home — 12 destacadas por categoría + botón Ver todas
│   │   ├── tools/               # Un componente React por herramienta
│   │   └── ui/
│   │       ├── CategoryGrid.tsx    # Grid paginado reutilizable para páginas de categoría
│   │       ├── ImageUploader.tsx   # Dropzone para imágenes (drag & drop + click)
│   │       ├── PdfUploader.tsx     # Dropzone para PDFs (drag & drop + click)
│   │       ├── VideoUploader.tsx   # Dropzone para vídeo (mp4/webm/mov/avi/mkv, max 500 MB)
│   │       ├── AudioUploader.tsx   # Dropzone para audio (mp3/wav/ogg/aac/flac/m4a, max 200 MB)
│   │       ├── DownloadButton.tsx
│   │       ├── Slider.tsx
│   │       └── ToolCard.tsx        # Card del home
│   ├── hooks/
│   │   ├── useImageUpload.ts       # Validación, preview, drag & drop, revokeURL
│   │   └── useDownload.ts          # Wrapper sobre triggerDownload()
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── canvas.ts           # loadImage(), canvasToBlob(), createCanvas(), getContext(), revokeURL()
│   │   │   ├── download.ts         # triggerDownload(), getOutputFilename()
│   │   │   ├── ffmpeg.ts           # createFFmpeg(onProgress?), runFFmpeg(ff, file, name, args, out)
│   │   │   └── format.ts           # formatBytes(), formatDimensions(), formatReduction(), mimeToExtension()
│   │   └── constants/
│   │       ├── tools.ts            # Metadata de las herramientas — ToolMeta + ToolDomain
│   │       └── seo.ts              # Títulos, descriptions, canonicals por página + SITE object
│   └── styles/
│       └── global.css             # @import "tailwindcss" + @theme con tokens de diseño
├── public/
│   ├── hero-bg.jpg              # Imagen de fondo del hero (gradiente full-spectrum, ~73 KB)
│   ├── favicon.svg / favicon.ico / robots.txt
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## Las 121 herramientas

> Las tablas completas están divididas por categoría para no sobrecargar este archivo:
> [`HERRAMIENTAS-IMAGEN.md`](./HERRAMIENTAS-IMAGEN.md) · [`HERRAMIENTAS-PDF.md`](./HERRAMIENTAS-PDF.md) · [`HERRAMIENTAS-VIDEO.md`](./HERRAMIENTAS-VIDEO.md) · [`HERRAMIENTAS-AUDIO.md`](./HERRAMIENTAS-AUDIO.md) · [`HERRAMIENTAS-DEV.md`](./HERRAMIENTAS-DEV.md)
> El índice general con slugs rápidos está en [`HERRAMIENTAS.md`](./HERRAMIENTAS.md).
> **Total: 179 herramientas — 48 imagen · 32 PDF · 26 vídeo · 42 audio · 31 developer + 5 legales**

Al añadir una herramienta nueva, actualizar el archivo de dominio correspondiente y el índice en `HERRAMIENTAS.md`.

---

## Blog — Content Collections

El blog usa el **Content Layer API de Astro 6** con archivos `.md` en `src/content/blog/`. Los artículos no llevan imágenes ni covers — solo texto Markdown.

### Archivos del sistema

| Archivo | Descripción |
|---|---|
| `src/content.config.ts` | Schema Zod con `glob` loader (Astro 6) |
| `src/pages/blog/index.astro` | Listado de artículos ordenados por fecha |
| `src/pages/blog/[slug].astro` | Template individual con JSON-LD Article, prose styles, compartir y CTA |
| `src/content/blog/*.md` | Artículos — el nombre del archivo ES la URL |

### Schema de artículo (`src/content.config.ts`)

```ts
{
  titulo: string,                // obligatorio
  descripcion?: string,          // para SEO y cards del listado
  categoria: 'herramientas' | 'tips' | 'tutoriales' | 'actualizaciones' | 'general',
  fecha: string,                 // ISO "YYYY-MM-DD" — solo para ordenación, no aparece en la URL
  keywords: string[],            // para meta keywords y JSON-LD Article
  autor: string,                 // default: 'Equipo ToolsFoto'
  publicado: boolean,            // default: true — false oculta el artículo sin borrar el archivo
}
```

### Cómo crear un artículo nuevo

1. Crear `src/content/blog/[slug].md` — el nombre del archivo ES la URL final (`/blog/slug`).
2. Completar el frontmatter con los campos del schema.
3. El cuerpo puede ser Markdown estándar: H2, H3, listas, tablas, blockquotes, `código`.
4. Ejecutar `npm run build` para verificar que no hay errores de schema.

Ejemplo mínimo:
```md
---
titulo: "Título del artículo"
descripcion: "Descripción para SEO y cards (máx 160 chars)."
categoria: "tutoriales"
fecha: "2026-05-28"
keywords: ["keyword 1", "keyword 2", "keyword 3"]
---

## Primera sección

Contenido del artículo...
```

### Reglas evergreen (OBLIGATORIO)

- **NUNCA incluir el año en el slug, título ni keywords.**
  - Correcto: `como-comprimir-imagenes`, "Cómo comprimir imágenes"
  - Incorrecto: `como-comprimir-imagenes-2026`, "Cómo comprimir imágenes 2026"
- El campo `fecha` solo sirve para ordenar artículos — no sale en la URL ni en rutas generadas, y **no se muestra al usuario en ningún lugar de la UI** (ni en el listado `/blog` ni dentro del artículo). Se mantiene en el frontmatter y en el JSON-LD (`datePublished`) por SEO, pero nunca se renderiza como texto visible.
- El slug viene del nombre del archivo `.md`, no de ningún campo del frontmatter.
- Usar `publicado: false` para ocultar un artículo sin borrarlo.

### Prose styles del artículo

`src/pages/blog/[slug].astro` incluye un bloque `<style is:global>` con la clase `.prose` que estiliza el HTML generado por Markdown. Cubre: `h2`, `h3`, `p`, `ul`, `ol`, `strong`, `a`, `table` (th/td), `blockquote`, `code` (inline), `pre code` (bloques), `hr`, `img`. Los colores respetan el sistema de diseño de ToolsFoto (`var(--color-accent)` para links subrayados, `var(--color-text)` para headings).

### Rutas del blog en la navegación

El blog está enlazado desde:
- **Header.astro** — link "Blog" en nav escritorio y menú móvil (activo con `bg-[var(--color-accent-bg)]` si `currentPath.startsWith('/blog')`)
- **Footer.astro** — link "Blog" en la columna "ToolsFoto"

### Sitemap

El sitemap se genera automáticamente con `@astrojs/sitemap` — las rutas `/blog/*` quedan incluidas sin configuración adicional en cada build.

---

## Sistema de diseño

Todos los tokens están definidos en `src/styles/global.css` con `@theme {}` de Tailwind v4.
Úsalos como variables CSS (`var(--color-accent)`) o como clases de Tailwind (`bg-[var(--color-accent)]`).

### Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#F5F3EF` | Fondo general de la app |
| `--color-surface` | `#FFFFFF` | Cards, paneles, superficies |
| `--color-border` | `#E8E4DE` | Bordes de cards e inputs |
| `--color-text` | `#111110` | Texto principal |
| `--color-text-secondary` | `#706C66` | Texto secundario, labels |
| `--color-text-muted` | `#A8A49E` | Placeholders, hints |
| `--color-accent` | `#E84827` | CTAs, hover, foco activo |
| `--color-accent-bg` | `#FEF0ED` | Fondo hover de botones acento |
| `--color-tools-bg` | `#EEF8F2` | Fondo sección herramientas |
| `--color-tools-border` | `#D4EDE0` | Bordes sección herramientas |
| `--color-tools-icon` | `#5A9E7A` | Color de iconos en tool cards |

### Tipografía
- System font stack: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Headings: `font-extrabold` (peso 800)
- No se usan fuentes externas (Google Fonts, etc.)

---

## Reglas de código

### Reglas absolutas (no negociables)

1. **Sin `any` en TypeScript.** Siempre tipar correctamente.
2. **Sin emojis en la interfaz.** Solo iconos de Lucide React. (Excepción: emojis en el hero mock de index.astro como contenido estático.)
3. **`canvasToBlob()` y `loadImage()` solo en `src/lib/utils/canvas.ts`.** Nunca duplicar estas funciones en otros archivos.
4. **`URL.revokeObjectURL()` siempre** después de usar una blob URL. Usar `revokeURL()` del utils.
5. **Errores async con mensajes en español** visibles al usuario (no solo `console.error`).
6. **Cada herramienta es un componente React independiente** en `src/components/tools/`. Se monta con `client:load` en la página Astro correspondiente.
7. **Al añadir una herramienta nueva, actualizar CLAUDE.md** — tabla del dominio, contador del build, y cualquier patrón nuevo que introduzca.

### Patrones por tipo de herramienta

#### Herramientas de imagen
- Usar `useImageUpload` para gestión de archivo + preview + drag & drop.
- Usar `useDownload` (wrappea `triggerDownload()`) para la descarga.
- Toda manipulación de píxeles via `loadImage()` / `canvasToBlob()` de `canvas.ts`.

#### Herramientas de PDF
- Usar `PdfUploader.tsx` (componente standalone, no hook).
- Gestionar descarga directamente: `URL.createObjectURL` → `<a>.click()` → `URL.revokeObjectURL`.
- `pdf-lib` y `pdfjs-dist` siempre con import dinámico (`await import(...)`).

#### Herramientas de vídeo y audio
- Usar `VideoUploader.tsx` (vídeo) o `AudioUploader.tsx` (audio) para la subida.
- Usar `createFFmpeg(onProgress?)` de `ffmpeg.ts` — **nunca instanciar `FFmpeg` directamente**.
- **1 input, 1 output simple:** usar `runFFmpeg(ff, file, inputName, args, outputName)` — gestiona write/exec/read/cleanup automáticamente.
- **Múltiples inputs u outputs** (unir, mezclar, GIF desde imágenes…): usar `ff.exec()` directamente. Patrón obligatorio:
  ```ts
  const ff = await createFFmpeg(setProgress);
  // writeFile de cada input
  try {
    await ff.exec([...args]);
  } catch (err) {
    console.error('[NombreTool] Error FFmpeg:', err);
    throw err;
  }
  // readFile del output → Blob
  // deleteFile de todos los archivos (inputs + outputs) en bloques try/catch ignorados
  // llamar setProgress(100) antes de salir
  ```
- Mostrar estado "Cargando procesador…" cuando `progress === 0` y aún no ha terminado.
- Mostrar siempre la nota: *"La primera vez descarga el procesador (~30 MB). Las siguientes veces es instantáneo."*
- Gestionar descarga igual que PDF: `URL.createObjectURL` → `<a>.click()` → `revokeURL()` (de `canvas.ts`).
- MIME types de audio: `{ mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' }` — usar siempre un objeto/map, no cadena de ternarios, para no olvidar formatos.
- **NO usar el filtro `drawtext` de FFmpeg** — falla en WASM (sin fontconfig). Para texto en vídeo: renderizar en canvas → exportar PNG → `overlay=0:0` (ver `MarcaAguaVideoTool.tsx`).

#### Herramientas developer
- Canvas API directamente cuando el input es imagen.
- `FileReader` para operaciones de bytes sin renderizado.

### Patrones establecidos

- **`ToolMeta` en `tools.ts`** tiene los campos: `slug, name, description, longDescription, category, domain, icon, color, related`.
  - `domain`: `'imagen' | 'pdf' | 'video' | 'audio' | 'developer'` — determina en qué tab del home aparece la herramienta y la URL de la miga de pan.
- **Todas las páginas de herramienta usan `ToolLayout.astro`** que acepta `slug` y `faqs?: Array<{q, a}>`.
  - Pasar siempre al menos 5 FAQs para generar JSON-LD FAQPage.
- **Páginas legales usan `LegalLayout.astro`** — no añadir `noindex` manualmente, ya lo incluye.
- **Imports de librerías pesadas** deben ser dinámicos: `@imgly/background-removal`, `html2canvas`, `pdf-lib`, `pdfjs-dist`, `@ffmpeg/ffmpeg`, `@ffmpeg/util`.
- **Para herramientas que exportan PNG transparente** (redondear, recorte-circular, sombra, svg-a-png): usar `image/png` en `canvasToBlob`, nunca `image/jpeg`.
- **Canvas blur con padding:** al aplicar `ctx.filter = 'blur(Xpx)'`, añadir un canvas temporal más grande (pad = blur × 3) para evitar oscurecimiento en los bordes, luego recortar al tamaño original.
- **Herramienta Collage:** gestiona su propio estado de imágenes (array de `{url, file}`) sin `useImageUpload`, porque admite múltiples archivos. Revocar URLs al eliminar imágenes.
- **UnirAudios:** re-encodifica cada archivo a mp3 individualmente antes del concat demuxer, para evitar errores de formato mixto.
- **RecortarVideo / CortarAudio:** usar `-c copy` para evitar re-encode y preservar calidad.

#### Herramientas developer sin input de archivo
Algunas herramientas developer no reciben archivos: trabajan solo con texto o generan contenido. Patrón:
- Estado local (`useState`) para el input de texto y el output.
- Descarga vía `new Blob([text], { type: 'text/plain' })` → `URL.createObjectURL` → `<a>.click()` → `URL.revokeObjectURL`.
- Sin `useImageUpload`, sin `useDownload`, sin `PdfUploader`.

#### Generación de contraseñas seguras
- Usar `crypto.getRandomValues(new Uint32Array(length))` — nunca `Math.random()`.
- Patrón: `Array.from(uint32arr, n => pool[n % pool.length]).join('')`.
- Pools separados: `UPPER`, `LOWER`, `NUMS`, `SYMS` — al menos uno activo siempre.

#### Conversor de unidades con base unit
- Cada unidad define `{ label, toBase: (v: number) => number, fromBase: (v: number) => number }`.
- Conversión: `fromBase(toBase(value))` — siempre a través de la unidad base.
- Temperatura requiere fórmulas no lineales (Celsius = base; Fahrenheit = `(v-32)*5/9`; Kelvin = `v-273.15`).
- Valores extremos: usar `toExponential(6)` cuando `|n| >= 1e12` o `|n| < 1e-6`.

#### Búsqueda binaria de calidad JPEG (ComprimirObjetivo)
- `lo=0.01, hi=1.0`, hasta `ITERS=15` iteraciones, converge en ±0.003 de calidad.
- `const mid = (lo + hi) / 2; const blob = await canvasToBlob(canvas, 'image/jpeg', mid);`
- Si `blob.size <= targetBytes` → guardar como `best`, subir `lo`; si no → bajar `hi`.
- Siempre exporta JPEG (transparencia → fondo blanco).

#### Gradiente CSS con Canvas API (FondoDegradado)
- Gradiente lineal: convertir dirección string → ángulo radián, usar vectores `sin/cos` para los puntos de inicio y fin del gradiente desde el centro.
- Gradiente radial: `createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.sqrt(w*w+h*h)/2)`.
- Siempre dibujar el gradiente primero, luego `ctx.drawImage(img, 0, 0)` encima.
- Exportar como PNG (`image/png`) para preservar transparencia de la imagen original.

### Patrones de color picker en tools
1. Array de colores preset como botones circulares `w-7 h-7 rounded-full`.
2. Un `<label>` con `<input type="color">` invisible como selector custom.
3. El borde cambia a `var(--color-accent)` cuando el color está seleccionado.

### HomeTools.tsx — tabs del home
- `src/components/HomeTools.tsx` — componente React montado con `client:load` en `index.astro`.
- 5 tabs: `imagen | pdf | video | audio | developer`.
- Cada tab muestra **12 herramientas destacadas** (las más populares/representativas), no todas.
- El badge del tab muestra el **total real** de herramientas de esa categoría (no el 12).
- Al final de cada tab hay un botón **"Ver todas las herramientas de X (N) →"** que enlaza a la página de categoría (`/imagen`, `/pdf`, `/video`, `/audio`, `/developer`).
- Las 12 herramientas destacadas por categoría están definidas en constantes al inicio del archivo: `IMAGEN_FEATURED`, `PDF_FEATURED`, `VIDEO_FEATURED`, `AUDIO_FEATURED`, `DEV_FEATURED`.
- Routing por hash: lee `window.location.hash` al montar, escucha `hashchange`, actualiza con `history.replaceState`.
- Tab bar con `overflow-x-auto scrollbar-none` para scroll horizontal en móvil.

### Páginas de categoría
Cada dominio tiene una página estática que lista **todas** sus herramientas con paginación automática.

| URL | Archivo | Herramientas |
|---|---|---|
| `/imagen` | `src/pages/imagen.astro` | 48 (2 páginas) |
| `/pdf` | `src/pages/pdf.astro` | 32 (2 páginas) |
| `/video` | `src/pages/video.astro` | 26 (1 página) |
| `/audio` | `src/pages/audio.astro` | 23 (1 página) |
| `/developer` | `src/pages/developer.astro` | 31 (2 páginas) |

**`CategoryGrid.tsx`** (`src/components/ui/CategoryGrid.tsx`) — componente React reutilizable:
- Recibe `domain: ToolDomain` como prop, filtra `TOOLS` internamente.
- Muestra 24 herramientas por página (`PER_PAGE = 24`).
- Los controles de paginación (Anterior / números / Siguiente) solo se renderizan si hay más de una página.
- Al cambiar de página hace `window.scrollTo({ top: 0 })` para volver al inicio.
- Se monta con `client:load` en cada página de categoría.

**Regla de URLs:** las URLs de herramientas individuales (`/comprimir`, `/redimensionar`, etc.) están indexadas en Google y **no se tocan bajo ningún concepto**. Nunca mover ni renombrar archivos en `src/pages/` que correspondan a herramientas. Las páginas de categoría son archivos nuevos que no colisionan con ningún slug de herramienta.

### Lucide icons en .astro templates
En archivos `.astro`, los componentes React (incluidos iconos Lucide) necesitan `className`, no `class`. También necesitan `client:load` si se usan en una zona interactiva.

### Imports con alias `@/`
El alias `@/` apunta a `src/`. Úsalo siempre:
```ts
import { loadImage } from '@/lib/utils/canvas';
import { createFFmpeg, runFFmpeg } from '@/lib/utils/ffmpeg';
import { useImageUpload } from '@/hooks/useImageUpload';
```

---

## SEO — cómo funciona

Cada página tiene su metadata en `src/lib/constants/seo.ts` bajo `PAGE_SEO[slug]`.
`ToolLayout.astro` lee ese objeto y genera automáticamente:
- `<title>`, `<meta name="description">`, `<link rel="canonical">`
- OpenGraph y Twitter Card
- JSON-LD `SoftwareApplication` schema
- JSON-LD `FAQPage` schema (si se pasan `faqs`)

`LegalLayout.astro` genera el mismo SEO básico pero añade `noindex, follow`.

El home (`index.astro`) tiene su propio JSON-LD de tipo `WebApplication`.

El sitemap se genera automáticamente con `@astrojs/sitemap` en cada build.

---

## Comandos

```bash
npm run dev      # Servidor de desarrollo en localhost:4321
npm run build    # Build de producción → dist/
npm run preview  # Preview del build local
```

El build genera archivos estáticos en `dist/`. Para Cloudflare Pages, apuntar el directorio de output a `dist/`.
**El build genera actualmente 223 páginas HTML estáticas** (herramientas + home + legales + blog index + artículos del blog). Al agregar una herramienta o un artículo, el contador sube en 1.

---

## Notas importantes

- El **warning de Node.js imports** (`fs`, `util`, `stream`…) del paquete `qrcode` es esperado. Sus renderers PNG/SVG importan módulos Node, pero `GenerarQRTool.tsx` solo usa `QRCode.toCanvas()` (browser-safe) vía import dinámico. No afecta al funcionamiento.
- El **warning de chunk size** en el build es esperado. `@imgly/background-removal` (~50 MB), `pdfjs-dist` y `@ffmpeg/ffmpeg` son grandes. Todos se cargan bajo demanda con import dinámico.
- Astro detecta el adapter de Cloudflare y habilita "Cloudflare Images" y "KV sessions" — esos mensajes en el build son informativos, no errores.
- El `output: "static"` en `astro.config.mjs` genera HTML estático puro. No hay server-side rendering.
- La depreciación de `punycode` en los logs de build/dev es un warning de Node.js interno de las dependencias, no del código propio.
- **ToolsFoto no usa cookies de seguimiento ni analíticas.** El único almacenamiento local es la caché del modelo de IA de `@imgly/background-removal`, que gestiona el propio navegador. No se necesita banner de consentimiento de cookies.
- **Hero background:** `public/hero-bg.jpg` — gradiente full-spectrum (rosa/naranja/azul), 1920px, ~73 KB. Overlay `from-black/75 via-black/55 to-black/30` para legibilidad del texto.
