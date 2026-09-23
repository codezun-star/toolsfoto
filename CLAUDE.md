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
| `pdfjs-dist` | Renderizado y extracción de texto de PDFs | Dinámica vía `loadPdfjs()` — build `legacy` + worker auto-hospedado |
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

**Headers (`public/_headers`):**
El sitio sirve únicamente este header en todas las rutas:
```
/*
  Cross-Origin-Resource-Policy: cross-origin
```

> **No reactivar `Cross-Origin-Embedder-Policy: require-corp` ni `Cross-Origin-Opener-Policy: same-origin`.**
> Esos dos headers activan el *cross-origin isolation* y **bloquean los scripts de anuncios** de terceros (Ezoic, Monetag…): sus subrecursos/iframes no envían `CORP` y `COOP: same-origin` rompe los popups/iframes de anuncios. Se retiraron a propósito para que los anuncios funcionen en todo el sitio.
> Quitarlos es **seguro**: el core de FFmpeg es de 1 hilo (`@ffmpeg/core@0.12.6`, no `core-mt`), **no usa `SharedArrayBuffer`**, y `toBlobURL` carga core/WASM como `blob:` del **mismo origen** (no requiere COEP/CORP). `@imgly/background-removal` también funciona sin aislamiento (onnxruntime-web cae al backend WASM de 1 hilo; solo pierde algo de velocidad, no funcionalidad).
> Los CDNs externos (`unpkg.com`, `cdnjs.cloudflare.com`, `staticimgly.com`) devuelven `CORP: cross-origin`, por lo que seguirían siendo compatibles si algún día se reactivara el aislamiento.

**Anuncios — Adsterra en todo el sitio (2026-08-28):**

| Pieza | Dónde vive | Qué hace |
|---|---|---|
| `public/ads/banner.html` | estático, fuera de Astro | Aloja **un** banner iframe de Adsterra. Recibe `?s=728x90` y valida el tamaño contra su mapa `UNITS`. |
| `src/components/ads/AdSlot.astro` | in-content | Hueco vacío (`<div class="tf-ad" data-ad="…">`). No pinta nada: lo rellena el loader. |
| `src/components/ads/AdNative.astro` | in-content | Contenedor del banner **nativo**. Id fijo de la red → **máximo uno por página**. |
| `src/components/layout/AdScripts.astro` | global vía `Footer.astro` | Social bar/popunder + estilos de todos los huecos + loader + anchor inferior + rails laterales. |

**Por qué cada banner va en su propio iframe (crítico — leer antes de tocar los anuncios):**
Los formatos iframe de Adsterra se configuran con la variable **global** `atOptions`, que el `invoke.js` lee al ejecutarse. Con dos o más banners en la misma página las configuraciones se pisan y solo renderiza uno (o ninguno, con el tamaño equivocado). Por eso cada unidad se carga dentro de `/ads/banner.html`, que le da su propio `window` y por tanto su propio `atOptions`. **Nunca pegar los snippets de `atOptions` directamente en una plantilla.**

**Las 9 unidades:**

| Formato | Key | Slot |
|---|---|---|
| 728x90 | `52da20bb…` | `leaderboard` / `anchor` en ≥760px |
| 468x60 | `a7ceeaaf…` | `leaderboard` / `anchor` en 500-759px |
| 320x50 | `2bd99f19…` | `leaderboard` / `anchor` en <500px |
| 300x250 | `53959aeb…` | `rectangle` |
| 160x600 | `224bdf72…` | rail derecho (`sky`) |
| 160x300 | `7bee5b15…` | rail izquierdo (`sky-small`) |
| Nativo | contenedor `934ea823…` | `AdNative`, uno por página |
| Social bar / popunder | `pl31073442…` | global, una vez por página |
| Social bar / popunder (2.ª) | `pl29628846…` | global, **inyectada en diferido** por JS — ver abajo |

**Segunda social bar (`pl29628846`) — carga no intrusiva:**
No va escrita en el HTML como la primera: la inyecta un bloque `is:inline` de
`AdScripts.astro` solo si se cumplen las cuatro condiciones, pensadas para que
no moleste ni penalice métricas:
1. Nunca antes de `load` + `requestIdleCallback` + `DELAY_MS` (7 s). No compite
   por red ni CPU con el render ni con el primer uso de la herramienta.
2. Como mucho una vez cada `COOLDOWN_MIN` (15 min) por pestaña, con marca de
   tiempo en `sessionStorage` (`tf-sb2`). Recorrer diez herramientas seguidas la
   dispara una vez, no diez.
3. Nunca en `/privacidad`, `/cookies`, `/terminos`, `/aviso-legal`, `/contacto`
   ni el 404.
4. Nunca con `navigator.connection.saveData` activado.

Para ajustar la agresividad, tocar `DELAY_MS` y `COOLDOWN_MIN`; para retirarla,
borrar ese bloque entero (no afecta al resto de anuncios). Si algún día se
detecta que las dos unidades `pl…` se pisan entre sí (ambas son popunder), dejar
solo una: el problema del eCPM que aplicaba a Monetag + Adsterra también aplica
a dos popunders de la misma red.

**Reglas del loader (`AdScripts.astro`):**
- Carga diferida con `IntersectionObserver` (`rootMargin: 600px`): el anuncio se pide cuando el hueco se acerca al viewport. No toca el LCP y sube la viewability.
- **No usar `display: none` en `.tf-ad`.** Un elemento oculto no tiene caja, el observer no lo notifica nunca y el hueco no llegaría a rellenarse. El hueco vacío usa `min-height: 1px` y márgenes a cero; los márgenes y la etiqueta "Publicidad" aparecen solo con `.is-filled`.
- El formato horizontal se elige en runtime por ancho real de pantalla. No se recarga al redimensionar: repetir la petición cuenta como refresco y la red lo penaliza.
- **Anchor inferior:** barra fija con botón de cerrar; la preferencia se guarda en `sessionStorage` (`tf-anchor=off`). Reserva su altura con `--tf-anchor-h` en el `padding-bottom` del `body` para no tapar el footer.
- **Rails laterales:** solo a partir de 1560px de ancho y 720px de alto. El contenido es `max-w-6xl` (1152px) centrado, así que por debajo de ese ancho un rail de 160px pisaría el contenido.
- Al añadir huecos por JS (p. ej. el in-content del blog), insertarlos antes de que corra el loader o llamar a `window.__tfAds.scan()`.

**Páginas legales:** `privacidad.astro` y `cookies.astro` describen la publicidad y sus cookies. **Si se cambia de red publicitaria hay que actualizarlas.** Nota pendiente: el sitio no tiene banner de consentimiento (CMP); para tráfico del EEE/Reino Unido con publicidad personalizada probablemente haga falta uno — decisión del usuario, no se ha añadido.

- **Monetag (desactivado, comentado):** los 3 scripts de `AdScripts.astro` y la meta de verificación `<meta name="monetag">` en los 5 heads (`ToolLayout`, `LegalLayout`, `index`, `blog/index`, `blog/[slug]`) están **comentados** con `{/* */}`. No descomentar sin decisión explícita del usuario: dos redes de popunder en la misma página se pisan y hunden el eCPM de ambas.
- **Ezoic (eliminado):** la integración JavaScript Standalone (`EzoicScripts.astro` + redirect `/ads.txt`) se integró y se eliminó por completo el 2026-07-10. Si se retoma, ver el registro de cambios para los detalles de la integración.

**Limitación conocida — filtro `drawtext` de FFmpeg:**
El filtro `drawtext` requiere fontconfig y fuentes del sistema. En el entorno WASM del navegador no existen. **Nunca usar `drawtext`.** Para superponer texto en vídeo usar canvas overlay + filtro `overlay=0:0` (ver `MarcaAguaVideoTool.tsx`).

**Utilidades en `src/lib/utils/ffmpeg.ts`:**
- `createFFmpeg(onProgress?)` — instancia y carga FFmpeg. Llama siempre a esta función, nunca `new FFmpeg()` directamente.
- `runFFmpeg(ff, inputFile, inputName, args, outputName)` — escribe el archivo, ejecuta, lee el resultado, limpia. Usar para herramientas de **1 input, 1 output**.
- Para herramientas con múltiples inputs/outputs (unir, mezclar, GIF…), usar `ff.exec()` directamente pero gestionar manualmente `writeFile`/`readFile`/`deleteFile` y el bloque try/catch con `console.error`.

#### PDF.js — cargar SIEMPRE con `loadPdfjs()`

`src/lib/utils/pdfjs.ts` expone `loadPdfjs()`, la única forma admitida de usar
pdfjs en el proyecto. **Nunca importar `pdfjs-dist` a pelo ni asignar
`GlobalWorkerOptions.workerSrc` a mano.**

```ts
import { loadPdfjs } from '@/lib/utils/pdfjs';
const pdfjsLib = await loadPdfjs();
```

Dos cosas críticas que resuelve, y por las que las 10 herramientas de pdfjs
estuvieron rotas:

1. **La versión del worker debe coincidir con la de la API.** pdf.js compara
   ambas y lanza `The API version "X" does not match the Worker version "Y"`.
   Antes cada tool fijaba `workerSrc` a un worker 3.11.174 de cdnjs mientras el
   bundle traía la 5.x de `package.json`. Ahora el worker se importa del propio
   paquete con `?url`, lo empaqueta Vite y su versión es siempre la instalada.
2. **Se usa la build `legacy`** (`pdfjs-dist/legacy/build/pdf.mjs`). La build
   moderna de la 5.x usa `Map.prototype.getOrInsertComputed`, que ni Chrome 141
   implementa: el render revienta con `getOrInsertComputed is not a function`
   en cualquier navegador actual. La `legacy` viene transpilada y con polyfills.

Ya no hay dependencia de CDN externa para pdfjs: el worker se sirve desde el
propio dominio.

**API de render (pdf.js 5.x):** `page.render({ canvas, viewport })`. El antiguo
`{ canvasContext, viewport }` ya no vale. Ojo con tipar el `page` como `object`
o `unknown` en helpers: TypeScript no detecta el cambio de API y la llamada se
queda atrás en silencio (pasó en `CompararPDFsTool` y `PDFaSVGTool`).

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
│   │   ├── ads/
│   │   │   ├── AdSlot.astro          # Hueco de anuncio in-content (lo rellena el loader)
│   │   │   └── AdNative.astro        # Banner nativo — máximo uno por página
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
│   │   │   ├── pdfjs.ts            # loadPdfjs() — única forma admitida de cargar pdfjs
│   │   │   ├── bytes.ts            # toBlobPart() — Uint8Array de pdf-lib/FFmpeg → BlobPart
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

## Las 241 herramientas

> Las tablas completas están divididas por categoría para no sobrecargar este archivo:
> [`HERRAMIENTAS-IMAGEN.md`](./HERRAMIENTAS-IMAGEN.md) · [`HERRAMIENTAS-PDF.md`](./HERRAMIENTAS-PDF.md) · [`HERRAMIENTAS-VIDEO.md`](./HERRAMIENTAS-VIDEO.md) · [`HERRAMIENTAS-AUDIO.md`](./HERRAMIENTAS-AUDIO.md) · [`HERRAMIENTAS-DEV.md`](./HERRAMIENTAS-DEV.md)
> El índice general con slugs rápidos está en [`HERRAMIENTAS.md`](./HERRAMIENTAS.md).
> **Total: 241 herramientas — 60 imagen · 43 PDF · 42 vídeo · 53 audio · 43 developer + 5 legales**

Al añadir una herramienta nueva, actualizar el archivo de dominio correspondiente y el índice en `HERRAMIENTAS.md`.

---

## Blog — Content Collections

El blog usa el **Content Layer API de Astro 6** con archivos `.md` en `src/content/blog/`. Los artículos no llevan imágenes ni covers — solo texto Markdown.

### Archivos del sistema

| Archivo | Descripción |
|---|---|
| `src/content.config.ts` | Schema Zod con `glob` loader (Astro 6) |
| `src/pages/blog/index.astro` | Listado de artículos ordenados por fecha |
| `src/pages/blog/[slug].astro` | Template individual con JSON-LD unificado en un `@graph` (`Organization`, `WebSite`, `WebPage`, `Article`, `BreadcrumbList`), prose styles, compartir y CTA |
| `src/content/blog/*.md` | Artículos — el nombre del archivo ES la URL |

### Schema de artículo (`src/content.config.ts`)

```ts
{
  titulo: string,                // obligatorio
  descripcion?: string,          // para SEO y cards del listado
  categoria: 'herramientas' | 'tips' | 'tutoriales' | 'actualizaciones' | 'general',
  fecha: string,                 // ISO "YYYY-MM-DD" — solo para ordenación, no aparece en la URL
  actualizado?: string,          // ISO "YYYY-MM-DD" — última revisión; alimenta `dateModified`. Nunca se renderiza
  herramientas: string[],        // slugs de TOOLS; se pintan al final del artículo. Default: []
  keywords: string[],            // para meta keywords y JSON-LD Article
  autor: string,                 // default: 'Equipo ToolsFoto'
  publicado: boolean,            // default: true — false oculta el artículo sin borrar el archivo
}
```

### Cómo crear un artículo nuevo

1. Crear `src/content/blog/[slug].md` — el nombre del archivo ES la URL final (`/blog/slug`).
2. Completar el frontmatter con los campos del schema.
3. Rellenar `herramientas` con 2-4 slugs de `TOOLS` relevantes: se pintan como
   cards al final del artículo, bajo "Herramientas para hacerlo". Es la vía
   principal por la que el blog pasa autoridad a las herramientas. **Un slug que
   no exista en `TOOLS` rompe el build a propósito**, con el artículo y el slug
   en el mensaje.
4. El cuerpo puede ser Markdown estándar: H2, H3, listas, tablas, blockquotes, `código`.
5. Ejecutar `npm run build` para verificar que no hay errores de schema.

Ejemplo mínimo:
```md
---
titulo: "Título del artículo"
descripcion: "Descripción para SEO y cards (máx 160 chars)."
categoria: "tutoriales"
fecha: "2026-05-28"
herramientas: ["comprimir", "redimensionar"]
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
8. **Todas las URLs sin trailing slash.** Nunca crear rutas ni enlaces con `/` al final. El sitio usa `trailingSlash: 'never'` en `astro.config.mjs` y `build.format: 'file'` (genera `page.html`, no `page/index.html`). Cloudflare Pages redirige automáticamente `/page/` → `/page` (301) vía `public/_redirects`. Cualquier enlace interno con slash final romperá el canonical y generará un redirect innecesario.

### Patrones por tipo de herramienta

#### Herramientas de imagen
- Usar `useImageUpload` para gestión de archivo + preview + drag & drop.
- Usar `useDownload` (wrappea `triggerDownload()`) para la descarga.
- Toda manipulación de píxeles via `loadImage()` / `canvasToBlob()` de `canvas.ts`.

#### Herramientas de PDF
- Usar `PdfUploader.tsx` (componente standalone, no hook).
- Gestionar descarga directamente: `URL.createObjectURL` → `<a>.click()` → `URL.revokeObjectURL`.
- `pdf-lib` siempre con import dinámico (`await import('pdf-lib')`).
- `pdfjs-dist` **solo** a través de `loadPdfjs()` de `@/lib/utils/pdfjs` (ver la sección de PDF.js).
- Al construir el `Blob` del resultado usar `toBlobPart(bytes)` de `@/lib/utils/bytes`, nunca `new Blob([bytes.buffer])`.

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
| `/imagen` | `src/pages/imagen.astro` | 60 (3 páginas) |
| `/pdf` | `src/pages/pdf.astro` | 43 (2 páginas) |
| `/video` | `src/pages/video.astro` | 42 (2 páginas) |
| `/audio` | `src/pages/audio.astro` | 53 (3 páginas) |
| `/developer` | `src/pages/developer.astro` | 43 (2 páginas) |

**`CategoryGrid.tsx`** (`src/components/ui/CategoryGrid.tsx`) — componente React reutilizable:
- Recibe `domain: ToolDomain` como prop, filtra `TOOLS` internamente.
- Muestra 24 herramientas por página (`PER_PAGE = 24`).
- **Renderiza SIEMPRE las cards de todas las herramientas del dominio y oculta con CSS (`hidden`) las que quedan fuera de la página actual. Nunca recortar el array con `slice()`:** los botones de paginación no son enlaces, así que si el HTML solo contuviera las 24 primeras cards el resto de la categoría se quedaría sin ningún `<a href>` que los rastreadores puedan seguir. Con el recorte activo había 50 herramientas sin un solo enlace interno en todo el sitio. `ToolCard` acepta `className` justamente para esto.
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

## AEO — optimización para motores de respuesta

El sitio está preparado para ser citado por ChatGPT, Perplexity, Claude, Google AI Overviews y asistentes similares.

| Pieza | Dónde vive | Notas |
|---|---|---|
| `llms.txt` | `src/pages/llms.txt.ts` | Endpoint estático. Se **genera en cada build** desde `TOOLS` y la colección `blog`: nunca hay que mantenerlo a mano. URL: `https://toolsfoto.com/llms.txt` |
| Reglas para bots de IA | `public/robots.txt` | `Allow: /` explícito para GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot y otros |
| JSON-LD unificado | `ToolLayout.astro` | Un solo `@graph` con `Organization`, `WebSite`, `WebPage`, `SoftwareApplication`, `BreadcrumbList`, `HowTo` y `FAQPage` (antes eran 4 `<script>` separados) |
| Bloque de respuesta directa | `ToolLayout.astro` | El párrafo bajo el H1 lleva la clase `aeo-answer` y es el objetivo de `speakable` |
| Frescura | `SITE.dateModified` en `seo.ts` | Alimenta `dateModified` del schema, `<meta name="last-modified">` y la línea "Actualizado el…" visible |
| Serialización del JSON-LD | `src/lib/utils/jsonld.ts` | **Usar `jsonLd()` siempre, nunca `JSON.stringify()`** para JSON-LD |

### `jsonLd()` — regla obligatoria

Todo bloque `<script type="application/ld+json">` debe serializarse con `jsonLd()` de `@/lib/utils/jsonld`, que escapa `<`, `>` y `&` como secuencias unicode.

```astro
---
import { jsonLd } from '@/lib/utils/jsonld';
const graph = jsonLd({ '@context': 'https://schema.org', '@graph': [...] });
---
<script is:inline type="application/ld+json" set:html={graph} />
```

El JSON resultante parsea idéntico al original, pero evita que un `</script>` dentro de cualquier texto (FAQ, descripción) cierre el bloque antes de tiempo, y que los comparadores sueltos rompan los parsers de HTML.

### Props AEO de `ToolLayout`

```astro
<ToolLayout
  slug="mi-herramienta"
  answer="Respuesta directa de 1-2 frases."   <!-- opcional: por defecto usa longDescription -->
  howTo={['Paso 1…', 'Paso 2…', 'Paso 3…']}   <!-- opcional: por defecto, el flujo estándar del dominio -->
  dateModified="2026-07-31"                    <!-- opcional: por defecto SITE.dateModified -->
  faqs={[…]}
>
```

Los pasos por defecto dependen del `domain`: las herramientas `developer` usan el flujo "introduce texto → ajusta → copia o descarga"; el resto usa "arrastra el archivo → ajusta → descarga".

### Reglas al añadir contenido

1. **No hace falta tocar `llms.txt`** — se regenera solo con cada `npm run build`.
2. Al revisar el contenido del sitio, actualizar `SITE.dateModified` en `seo.ts`.
3. Si una herramienta tiene una respuesta corta y concreta, pasarla en `answer`: es el texto que un motor de respuesta cita literalmente.
4. Mantener el mínimo de 5 FAQs — sin ellas no hay `FAQPage` y se pierde la vía principal de citación.

---

## Comandos

```bash
npm run dev      # Servidor de desarrollo en localhost:4321
npm run build    # Build de producción → dist/
npm run preview  # Preview del build local
```

El build genera archivos estáticos en `dist/`. Para Cloudflare Pages, apuntar el directorio de output a `dist/`.
**El build genera actualmente 303 páginas HTML estáticas** (herramientas + home + categorías + legales + 404 + blog index + artículos del blog). Al agregar una herramienta o un artículo, el contador sube en 1.

---

## Notas importantes

- El **warning de Node.js imports** (`fs`, `util`, `stream`…) del paquete `qrcode` es esperado. Sus renderers PNG/SVG importan módulos Node, pero `GenerarQRTool.tsx` solo usa `QRCode.toCanvas()` (browser-safe) vía import dinámico. No afecta al funcionamiento.
- El **warning de chunk size** en el build es esperado. `@imgly/background-removal` (~50 MB), `pdfjs-dist` y `@ffmpeg/ffmpeg` son grandes. Todos se cargan bajo demanda con import dinámico.
- Astro detecta el adapter de Cloudflare y habilita "Cloudflare Images" y "KV sessions" — esos mensajes en el build son informativos, no errores.
- El `output: "static"` en `astro.config.mjs` genera HTML estático puro. No hay server-side rendering.
- La depreciación de `punycode` en los logs de build/dev es un warning de Node.js interno de las dependencias, no del código propio.
- **Cookies:** el sitio usa Google Analytics 4 (gtag en los 5 heads) y publicidad de Adsterra, que instala cookies de terceros. El almacenamiento local propio se limita a la caché del modelo de IA de `@imgly/background-removal` y a la preferencia `tf-anchor` del anuncio inferior. No hay banner de consentimiento (CMP): pendiente de decisión del usuario si se quiere cubrir el EEE/Reino Unido.
- **Hero background:** `public/hero-bg.jpg` — gradiente full-spectrum (rosa/naranja/azul), 1920px, ~73 KB. Overlay `from-black/75 via-black/55 to-black/30` para legibilidad del texto.

---

## Registro de cambios

| Fecha | Acción |
|---|---|
| 2026-05-29 | SEO/URLs: `trailingSlash: 'never'` en `astro.config.mjs`. Canonical del home corregida en `seo.ts` (`toolsfoto.com/` → `toolsfoto.com`). Redirect 301 `/*/→/:splat` en `public/_redirects` (Cloudflare Pages) para normalizar URLs con slash final. |
| 2026-06-21 | +50 herramientas (10 por categoría) muy buscadas y +10 artículos de blog. Imagen 49→59 (conversores png/jpg/webp/gif, dividir/unir imagen, ASCII, ampliar, cambiar DPI), PDF 33→43 (pdf-a-webp, n-up, pares/impares, invertir orden, imagen larga, dividir mitad, cambiar tamaño, marca de agua con logo, dividir cada N, unir pdf+imágenes), Vídeo 32→42 (video-a-mp3, mov/avi/mkv/webm a mp4, comprimir WhatsApp, dividir, cuadrado, difuminar, chroma), Audio 43→53 (conversores a mp3/wav, loop, 8D, bass-boost), Developer 32→42 (slugify, mayúsculas, base64-a-imagen, contraste WCAG, box-shadow, meta tags, bytes, binario, morse, JSON→TS). Bases compartidas `AudioToMp3Base`/`VideoToMp4Base`. Total: 239 herramientas, 298 páginas. |
| 2026-06-25 | Anuncios Monetag en todo el sitio: nuevo componente `src/components/layout/AdScripts.astro` (3 scripts `is:inline`) incluido vía `Footer.astro` (presente en todas las páginas). Se retiraron `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Embedder-Policy: require-corp` de `public/_headers` porque bloqueaban los anuncios; es seguro porque el core FFmpeg de 1 hilo + `toBlobURL` (blob mismo origen) no necesitan cross-origin isolation. |
| 2026-07-09 | Migración a Ezoic (programa incubadora): Monetag comentado por completo (scripts en `AdScripts.astro` y metas de verificación en los 5 heads). Nuevo `EzoicScripts.astro` (CMP Gatekeeper + `sa.min.js` + init `ezstandalone` + analytics) incluido en el `<head>` de las 10 plantillas/páginas con head propio — las 298 páginas lo llevan. Redirect `/ads.txt` → `srv.adstxtmanager.com/19390/toolsfoto.com` en `public/_redirects`. |
| 2026-07-31 | Serialización segura del JSON-LD: nuevo `src/lib/utils/jsonld.ts` con `jsonLd()`, que escapa `<`, `>` y `&` como unicode. 33 páginas publicaban caracteres `<`/`>` sin escapar dentro del bloque JSON-LD; un `</script>` en cualquier texto cerraría el bloque antes de tiempo. Aplicado en `ToolLayout`, `index`, las 5 páginas de categoría y el blog. |
| 2026-07-31 | AEO (optimización para motores de respuesta). (1) Nuevo `src/pages/llms.txt.ts` — genera `/llms.txt` en cada build desde `TOOLS` + blog, agrupado por los 5 dominios. (2) `public/robots.txt` con `Allow` explícito para GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, meta-externalagent y otros. (3) `ToolLayout.astro`: los 4 `<script>` de JSON-LD se unifican en un `@graph` que añade `WebSite`, `WebPage` (con `speakable`) y `HowTo`; el `SoftwareApplication` gana `browserRequirements`, `featureList`, `dateModified` y `applicationCategory` por dominio (`DeveloperApplication` para developer, `BusinessApplication` para PDF). Nuevos props opcionales `answer`, `howTo` y `dateModified`. (4) `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large…">` en herramientas y home. (5) Bloque de respuesta directa con clase `aeo-answer` bajo el H1 + línea visible "Actualizado el…". (6) Home: los 3 `<script>` sueltos pasan a un `@graph` con `Organization`, `WebSite`, `CollectionPage`, `WebApplication` e `ItemList` de las 5 categorías. |
| 2026-07-10 | Sitio sin anuncios: Ezoic eliminado por completo (borrado `EzoicScripts.astro`, quitados sus includes de las 10 plantillas y el redirect `/ads.txt` de `public/_redirects`). Monetag permanece comentado (scripts de `AdScripts.astro` + metas de verificación en los 5 heads) por si se reactiva más adelante. Los headers COOP/COEP siguen retirados (regla vigente: no reactivarlos). |
| 2026-08-28 | Publicidad Adsterra en las 302 páginas. Nuevo `public/ads/banner.html` (host aislado: cada banner iframe en su propio `window` para que no se pisen los `atOptions` globales de la red) y nuevos `src/components/ads/AdSlot.astro` y `AdNative.astro`. `AdScripts.astro` pasa de 3 scripts comentados a la capa global de anuncios: social bar/popunder, estilos, loader con `IntersectionObserver`, anchor inferior descartable (`sessionStorage`) y 2 rails laterales a partir de 1560px. Huecos: `ToolLayout` (leaderboard + rectangle + nativo), home (leaderboard + nativo + rectangle), las 5 categorías (leaderboard + nativo), blog listado (leaderboard + nativo), artículo (leaderboard + rectangle in-content tras el 2.º H2 + nativo) y `LegalLayout` (leaderboard). `Disallow: /ads/` en `robots.txt`; `privacidad.astro` y `cookies.astro` actualizadas — antes afirmaban que no había publicidad ni cookies publicitarias. |
| 2026-08-06 | +2 herramientas y +2 artículos. Imagen 59→60: `/quitar-fondo-blanco` (`QuitarFondoBlancoTool.tsx`) — recorte por color con `getImageData`, distancia máxima por canal RGB, banda de suavizado del borde y vista previa sobre patrón a cuadros; exporta PNG. Developer 42→43: `/generador-cron` (`GeneradorCronTool.tsx`) — parser de expresiones cron de 5 campos (`*`, rangos, listas, pasos y nombres `MON`/`JAN`), traducción a español, validación por campo y cálculo de las 5 próximas ejecuciones. Artículos: `quitar-fondo-blanco-imagen-transparente` y `como-funcionan-las-expresiones-cron`. Nuevos iconos `Eraser` y `CalendarClock` en `ToolCard.tsx`. Total: 241 herramientas, 302 páginas. El sitemap y `/llms.txt` se regeneran solos en el build; el JSON-LD lo aporta `ToolLayout`. |
| 2026-09-18 | Auditoría SEO de todo el sitio y correcciones. (1) **50 herramientas no tenían ni un solo enlace interno en el HTML servido**: `CategoryGrid` recortaba el array con `slice()` y solo publicaba las 24 cards de la primera página, mientras la paginación son botones, no enlaces. Ahora renderiza todas las cards y oculta con CSS las de otras páginas (`ToolCard` acepta `className`); la UX no cambia (24 visibles) y las 241 herramientas quedan enlazadas. (2) El nav del header apuntaba a anclas del home (`/#imagen`) en vez de a las páginas de categoría reales: 10 enlaces × 303 páginas repuntados a `/imagen`, `/pdf`, `/video`, `/audio` y `/developer`, con estado activo. (3) Recuentos obsoletos en las descriptions de las 5 categorías (imagen decía 48 de 60, PDF 32 de 43, vídeo 31 de 42, audio 42 de 53, developer 31 de 43): ahora se derivan de `TOOLS` en `seo.ts` y no pueden volver a desfasarse. (4) 141 meta descriptions superaban el corte de Google (~160); se recortó la coletilla genérica repetida ("Completamente gratis.", "Sin registro, sin subir archivos.", …) y se reescribieron a mano las que no encajaban en el patrón: las 252 quedan entre 70 y 160 caracteres, media 138, sin duplicados. (5) Nueva `src/pages/404.astro` (noindex, fuera del sitemap) con salidas a las 5 categorías y a las herramientas más usadas. (6) `public/favicon.ico` (16/32/48) — los navegadores lo piden solo y devolvía 404. (7) `<meta name="robots">` con `max-snippet:-1` y `max-image-preview:large` en las 5 categorías, el listado del blog y los 49 artículos, que no lo llevaban; `/contacto` declara `index, follow` explícito. (8) Blog: JSON-LD unificado en un `@graph` con `dateModified`, `inLanguage`, `articleSection`, `image` e `isPartOf`, y `publisher.logo` pasa de `favicon.svg` a `favicon-192.png` (Google no admite SVG en `logo`); nuevo campo opcional `actualizado` en el frontmatter; el listado publica `Blog` + `ItemList` con los 49 artículos. (9) `LegalLayout` emite `@graph` con `WebPage`/`ContactPage` y `BreadcrumbList` — `/contacto`, que es indexable, no tenía ningún dato estructurado. (10) `theme-color` y `preconnect`/`dns-prefetch` a Google Tag en las 11 plantillas con head propio. Verificado sobre el HTML construido: 303 páginas, 0 herramientas huérfanas, 307 bloques JSON-LD que parsean, 0 títulos/descriptions/canonicals duplicados. |
| 2026-09-18 | Segunda tanda tras la auditoría: los 3 puntos que quedaron abiertos, y un fallo de producción que apareció al abrirlos. (1) **Las 10 herramientas de pdfjs estaban rotas**: fijaban `workerSrc` al worker 3.11.174 de cdnjs con pdfjs-dist 5.6.205 en el bundle, y pdf.js aborta si las versiones no coinciden; además la build moderna de la 5.x usa `Map.prototype.getOrInsertComputed`, que ni Chrome 141 implementa. Nuevo `src/lib/utils/pdfjs.ts` con `loadPdfjs()` (build `legacy` + worker del propio paquete vía `?url`, auto-hospedado). `page.render({ canvasContext })` → `{ canvas }` en los 10 sitios; en `CompararPDFsTool` y `PDFaSVGTool` el `page` estaba tipado como `object`/`unknown`, así que tsc no los veía. Verificado con Playwright sobre Chromium 141 y un PDF real: 10/10 producen salida (antes 0/10). (2) **tsc: 124 errores → 0.** `toBlobPart()` en el nuevo `src/lib/utils/bytes.ts` para los 92 casos de `Uint8Array<ArrayBufferLike>` vs `BlobPart`; `PdfUploader.current` estrechado a `{name,size}` (14 casos); `Slider.label` opcional; `EliminarPasswordPDFTool` pasaba a pdf-lib una opción `password` que no existe —la contraseña se ignoraba en silencio y el error culpaba al usuario—; `style` duplicado en `ConvertirVerticalTool`; namespace `JSX` (React 19) en `RegexTesterTool`; interfaz `SpeechRecognition` en `TranscribirAudioTool`. (3) **Blog → herramientas**: nuevo campo `herramientas` en el frontmatter de los 49 artículos (2-4 slugs, curados) y bloque "Herramientas para hacerlo" al final del artículo; un slug inexistente rompe el build. Antes el único enlace del cierre iba a `/`. (4) **Títulos**: los 26 que pasaban de 70 caracteres reescritos quitando el relleno "online gratis" pero conservando las keywords de cola larga del guión; ninguno pasa ya de 70 y la media baja a 55. Los de 61-70 se dejan a propósito: recortarlos tiraría términos como "DNI, pasaporte, visado" a cambio de estética en el SERP. |
| 2026-09-23 | Segunda unidad de social bar de Adsterra (`pl29628846`) añadida en `AdScripts.astro` con carga no intrusiva: se inyecta por JS tras `load` + idle + 7 s, como mucho una vez cada 15 min por pestaña (`sessionStorage` `tf-sb2`), nunca en las páginas legales/contacto/404 y nunca con el ahorro de datos activo. Las páginas legales no cambian: es la misma red (Adsterra) que ya declaran `privacidad.astro` y `cookies.astro`. |
