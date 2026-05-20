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

**Cada vez que se añada una herramienta nueva, se DEBE actualizar este CLAUDE.md:**
1. Añadir fila en la tabla del dominio correspondiente (Imagen / PDF / Vídeo / Audio / Developer).
2. Actualizar el contador de herramientas en la sección "Comandos" (páginas del build).
3. Actualizar `src/lib/constants/tools.ts` — entrada con `domain` correcto.
4. Actualizar `src/lib/constants/seo.ts` — título, descripción y canonical.
5. Añadir el componente `src/components/tools/NombreTool.tsx`.
6. Añadir la página `src/pages/slug.astro` con al menos 5 `faqs`.
7. Si la herramienta usa un uploader nuevo, documentarlo en la sección de UI.

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
│   ├── pages/                   # Páginas Astro (una por herramienta + legales)
│   │   ├── index.astro          # Homepage con tabs por dominio
│   │   ├── comprimir.astro      # (y el resto de slugs, uno por herramienta)
│   │   ├── privacidad.astro / terminos.astro / cookies.astro
│   │   └── aviso-legal.astro / contacto.astro
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.astro          # Nav: Inicio, Imágenes, PDF, Vídeo, Audio, Dev
│   │   │   ├── Footer.astro          # 5 columnas: Imágenes, PDF, Vídeo, Audio, ToolsFoto
│   │   │   ├── ToolLayout.astro      # Wrapper: SEO + breadcrumb + relacionadas + FAQs
│   │   │   └── LegalLayout.astro     # Wrapper páginas legales: SEO + breadcrumb + prose
│   │   ├── tools/               # Un componente React por herramienta (76 total)
│   │   └── ui/
│   │       ├── HomeTools.tsx       # Tabs del home (imagen/pdf/video/audio/developer)
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
│   │       ├── tools.ts            # Metadata de las 76 herramientas — ToolMeta + ToolDomain
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

## Las 76 herramientas

### Imagen (28)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/comprimir` | `CompressorTool.tsx` | Básicas | `browser-image-compression` + Web Worker |
| `/redimensionar` | `ResizerTool.tsx` | Básicas | Canvas API |
| `/recortar` | `CropperTool.tsx` | Básicas | Canvas API (área arrastrable manual) |
| `/convertir` | `ConverterTool.tsx` | Básicas | Canvas API (`toBlob` con MIME type) |
| `/girar` | `RotatorTool.tsx` | Básicas | Canvas API + `ctx.rotate` + `ctx.scale` |
| `/redondear` | `RoundCornersTool.tsx` | Básicas | Canvas clip path (quadraticCurveTo) |
| `/recorte-circular` | `CircularCropTool.tsx` | Básicas | Canvas `ctx.ellipse()` clip |
| `/marco` | `FrameTool.tsx` | Básicas | Canvas `fillRect` + `drawImage` offset |
| `/desenfoque` | `BlurTool.tsx` | Básicas | Canvas `filter: blur()` + padding bordes |
| `/marca-de-agua` | `WatermarkTool.tsx` | Creativas | Canvas API (texto e imagen overlay) |
| `/meme` | `MemeTool.tsx` | Creativas | Canvas API (fuente Impact, word-wrap manual) |
| `/blancoynegro` | `GrayscaleTool.tsx` | Creativas | Canvas `filter: grayscale(1)` + brillo/contraste |
| `/invertir` | `InvertTool.tsx` | Creativas | `getImageData` + inversión byte a byte |
| `/paleta` | `PaletteTool.tsx` | Creativas | Sampleo de píxeles + cuantización por frecuencia |
| `/collage` | `CollageTool.tsx` | Creativas | Canvas multi-imagen con 5 layouts, gap y color de fondo |
| `/texto` | `TextOverlayTool.tsx` | Creativas | Canvas `fillText` con 7 posiciones, 4 fuentes, contorno |
| `/editor` | `EditorTool.tsx` | Avanzadas | CSS `filter` para preview, Canvas para export |
| `/eliminar-fondo` | `BackgroundRemoverTool.tsx` | Avanzadas | `@imgly/background-removal` (import dinámico) |
| `/html-a-imagen` | `HtmlToImageTool.tsx` | Avanzadas | `html2canvas` (import dinámico) + iframe sandbox |
| `/pixelar` | `PixelateTool.tsx` | Avanzadas | Canvas API (selección de regiones + pixelado por bloques) |
| `/sombra` | `ShadowTool.tsx` | Avanzadas | Canvas `shadowBlur/shadowOffsetX/Y` con padding |
| `/espejo` | `EspejoTool.tsx` | Básicas | Canvas `ctx.scale(-1,1)` / `ctx.scale(1,-1)` — PNG |
| `/foto-carnet` | `FotoCarnetTool.tsx` | Básicas | Canvas center-crop a tamaños oficiales (DNI, pasaporte, visa…) |
| `/redimensionar-redes` | `RedimensionarRedesTool.tsx` | Básicas | 12 presets sociales — modo recortar o contener con fondo |
| `/efecto-vintage` | `EfectoVintageTool.tsx` | Creativas | 5 efectos: sepia, vintage (viñeta), cine (grano), polaroid, noir |
| `/thumbnail-youtube` | `ThumbnailYoutubeTool.tsx` | Creativas | Canvas 1280×720 JPEG — overlay + texto con word-wrap |
| `/imagenes-a-gif` | `ImagenesAGifTool.tsx` | Creativas | FFmpeg.wasm concat demuxer + palettegen/paletteuse |
| `/imagen-a-webp` | `ImagenAWebpTool.tsx` | Básicas | Canvas API `toBlob('image/webp', quality)` |
| `/ajustar-hsb` | `AjustarHSBTool.tsx` | Creativas | Canvas `ctx.filter` hue-rotate/saturate/brightness/contrast |
| `/efecto-boceto` | `EfectoBocetoTool.tsx` | Creativas | Canvas grayscale + invert + blur → color dodge blend manual |
| `/cambiar-fondo` | `CambiarFondoTool.tsx` | Básicas | Canvas `fillRect` con color + `drawImage` |
| `/mosaico` | `MosaicoTool.tsx` | Creativas | Canvas `drawImage` en bucle NxM tiles |
| `/efecto-duotono` | `EfectoDuotonoTool.tsx` | Creativas | `getImageData` + mapeo luminosidad → dos colores |

### PDF (20)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/comprimir-pdf` | `ComprimirPDFTool.tsx` | Básicas | pdf-lib `save({ useObjectStreams: true })` |
| `/unir-pdfs` | `UnirPDFsTool.tsx` | Básicas | pdf-lib `copyPages` multi-doc |
| `/dividir-pdf` | `DividirPDFTool.tsx` | Básicas | pdf-lib `copyPages` por página o rango |
| `/pdf-a-jpg` | `PDFaJPGTool.tsx` | Básicas | pdfjs-dist `getPage().render()` + canvas + CDN worker |
| `/jpg-a-pdf` | `JPGaPDFTool.tsx` | Básicas | pdf-lib `embedJpg/embedPng` + `addPage` |
| `/rotar-pdf` | `RotarPDFTool.tsx` | Básicas | pdf-lib `page.setRotation(degrees(n))` |
| `/extraer-paginas-pdf` | `ExtraerPaginasPDFTool.tsx` | Básicas | pdf-lib `copyPages` con rango personalizado |
| `/extraer-texto-pdf` | `ExtraerTextoPDFTool.tsx` | Avanzadas | pdfjs-dist `getTextContent()` + CDN worker |
| `/proteger-pdf` | `ProtegerPDFTool.tsx` | Avanzadas | pdf-lib `doc.encrypt({ userPassword, ownerPassword })` |
| `/eliminar-password-pdf` | `EliminarPasswordPDFTool.tsx` | Avanzadas | pdf-lib `PDFDocument.load(bytes, { password })` + save |
| `/marca-agua-pdf` | `MarcaAguaPDFTool.tsx` | Básicas | pdf-lib `page.drawText()` con `rotate: degrees(45)` + opacity |
| `/numerar-paginas-pdf` | `NumerarPaginasPDFTool.tsx` | Básicas | pdf-lib `page.drawText()` — posición, formato y número inicial |
| `/firmar-pdf` | `FirmarPDFTool.tsx` | Avanzadas | Canvas drawing pad → `embedPng` → `page.drawImage()` |
| `/pdf-a-png` | `PDFaPNGTool.tsx` | Básicas | pdfjs-dist `render()` + `canvas.toBlob('image/png')` |
| `/reordenar-paginas-pdf` | `ReordenarPaginasPDFTool.tsx` | Básicas | pdfjs-dist thumbnails + pdf-lib `copyPages(src, order)` |
| `/recortar-pdf` | `RecortarPDFTool.tsx` | Básicas | pdf-lib `page.setCropBox()` — márgenes en mm → pt (×2.8346) |
| `/anadir-texto-pdf` | `AnadirTextoPDFTool.tsx` | Básicas | pdf-lib `page.drawText()` — hasta 5 bloques, posición X/Y%, color |
| `/eliminar-paginas-pdf` | `EliminarPaginasPDFTool.tsx` | Básicas | pdf-lib `copyPages` conservando solo páginas no eliminadas |
| `/anadir-imagen-pdf` | `AnadirImagenPDFTool.tsx` | Básicas | pdf-lib `embedJpg/embedPng` + `page.drawImage()` con posición % |
| `/pdf-en-blanco` | `PDFEnBlancoTool.tsx` | Básicas | pdf-lib `addPage([w, h])` con tamaños estándar y orientación |

### Vídeo (15)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/comprimir-video` | `ComprimirVideoTool.tsx` | Básicas | FFmpeg.wasm — libx264 CRF (20/28/36), acodec aac |
| `/convertir-video` | `ConvertirVideoTool.tsx` | Básicas | FFmpeg.wasm — MP4 (libx264/aac) o WebM (libvpx/libvorbis) |
| `/extraer-audio` | `ExtraerAudioTool.tsx` | Básicas | FFmpeg.wasm — `-vn` + libmp3lame / pcm_s16le / aac |
| `/video-a-gif` | `VideoAGifTool.tsx` | Básicas | FFmpeg.wasm — palettegen+paletteuse, FPS y ancho configurables |
| `/recortar-video` | `RecortarVideoTool.tsx` | Básicas | FFmpeg.wasm — `-ss … -to … -c copy` (sin re-encode) |
| `/cambiar-velocidad` | `CambiarVelocidadTool.tsx` | Básicas | FFmpeg.wasm — `setpts` + `atempo` (chaining para 0.25x) |
| `/anadir-audio-video` | `AnadirAudioVideoTool.tsx` | Básicas | FFmpeg.wasm — reemplazar (`-map 0:v:0 -map 1:a:0`) o mezclar (`amix`) |
| `/rotar-video` | `RotarVideoTool.tsx` | Básicas | FFmpeg.wasm — `transpose=1/2` (90° CW/CCW), `transpose=1,transpose=1` (180°) |
| `/unir-videos` | `UnirVideosTool.tsx` | Básicas | FFmpeg.wasm — concat demuxer + re-encode libx264, hasta 10 clips |
| `/silenciar-video` | `SilenciarVideoTool.tsx` | Básicas | FFmpeg.wasm — `-an -c:v copy` (stream copy, sin re-encode) |
| `/capturar-fotograma` | `CapturarFotogramaTool.tsx` | Básicas | FFmpeg.wasm — `-ss {t} -frames:v 1` → PNG |
| `/voltear-video` | `VoltearVideoTool.tsx` | Básicas | FFmpeg.wasm — `hflip`, `vflip` o ambos |
| `/recortar-area-video` | `RecortarAreaVideoTool.tsx` | Básicas | FFmpeg.wasm — filtro `crop=w:h:x:y` |
| `/cambiar-resolucion-video` | `CambiarResolucionVideoTool.tsx` | Básicas | FFmpeg.wasm — `scale=w:h:force_original_aspect_ratio=decrease,pad` |
| `/marca-agua-video` | `MarcaAguaVideoTool.tsx` | Básicas | FFmpeg.wasm — filtro `drawtext` con posición y opacidad |

### Audio (10)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/comprimir-audio` | `ComprimirAudioTool.tsx` | Básicas | FFmpeg.wasm — libmp3lame, bitrate configurable (64k–320k) |
| `/convertir-audio` | `ConvertirAudioTool.tsx` | Básicas | FFmpeg.wasm — MP3 / WAV / OGG / AAC |
| `/cortar-audio` | `CortarAudioTool.tsx` | Básicas | FFmpeg.wasm — `-ss … -to … -c copy`, preserva formato original |
| `/unir-audios` | `UnirAudiosTool.tsx` | Básicas | FFmpeg.wasm — re-encode a mp3 + concat demuxer (`list.txt`) |
| `/cambiar-volumen` | `CambiarVolumenTool.tsx` | Básicas | FFmpeg.wasm — `volume=${db}dB` o filtro `loudnorm` para normalizar |
| `/velocidad-audio` | `VelocidadAudioTool.tsx` | Básicas | FFmpeg.wasm — `atempo` con chaining para <0.5× o >2× |
| `/revertir-audio` | `RevertirAudioTool.tsx` | Básicas | FFmpeg.wasm — filtro `areverse`, preserva formato original |
| `/agregar-fade-audio` | `AgregarFadeAudioTool.tsx` | Básicas | FFmpeg.wasm — filtro `afade=t=in/out:st:d` encadenado |
| `/mezclar-audios` | `MezclarAudiosTool.tsx` | Básicas | FFmpeg.wasm — `amix=inputs=2:duration=longest` con volume por pista |
| `/cambiar-tono` | `CambiarTonoTool.tsx` | Básicas | FFmpeg.wasm — `asetrate=44100*2^(s/12),aresample=44100` |

### Developer (18)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/svg-a-png` | `SvgAPngTool.tsx` | Básicas | Canvas API + `new Image()` con blob URL SVG |
| `/colores-imagen` | `ColoresImagenTool.tsx` | Básicas | Canvas 200×200 sampleo + cuantización 4-bit |
| `/eliminar-exif` | `EliminarExifTool.tsx` | Básicas | Canvas API re-export (strips all metadata) |
| `/imagen-a-base64` | `ImagenABase64Tool.tsx` | Básicas | `FileReader.readAsArrayBuffer` + `btoa` |
| `/generar-favicon` | `GenerarFaviconTool.tsx` | Básicas | Canvas múltiples tamaños + HTML tags generator |
| `/generar-qr` | `GenerarQRTool.tsx` | Básicas | `qrcode` (import dinámico) — `QRCode.toCanvas()`, colores y corrección de errores |
| `/formatear-json` | `FormatearJSONTool.tsx` | Básicas | `JSON.parse/stringify` nativo — format (2/4 espacios), minify, validate |
| `/codificar-url` | `CodificarURLTool.tsx` | Básicas | `encodeURIComponent/decodeURIComponent/encodeURI/decodeURI` — live output |
| `/convertir-color` | `ConvertirColorTool.tsx` | Básicas | Conversión pura HEX↔RGB↔HSL↔HSB sin librerías |
| `/base64-texto` | `Base64TextoTool.tsx` | Básicas | `btoa/atob` con TextEncoder para Unicode — encode/decode live |
| `/minificador-css` | `MinificadorCSSTool.tsx` | Básicas | Minificación y formateo CSS puro en JS — sin dependencias |
| `/csv-a-json` | `CsvAJsonTool.tsx` | Básicas | Parser CSV propio con soporte de comillas — CSV↔JSON bidireccional |
| `/calcular-hash` | `CalcularHashTool.tsx` | Básicas | Web Crypto API — SHA-1/256/384/512 sobre texto o archivo |
| `/regex-tester` | `RegexTesterTool.tsx` | Básicas | `RegExp` nativo JS — resaltado de coincidencias + grupos de captura |
| `/generador-uuid` | `GeneradorUUIDTool.tsx` | Básicas | `crypto.randomUUID()` — UUID v4 hasta 100 de una vez |
| `/contador-palabras` | `ContadorPalabrasTool.tsx` | Básicas | JS puro — palabras, chars, frases, párrafos, tiempo de lectura |
| `/convertir-timestamp` | `ConvertirTimestampTool.tsx` | Básicas | `Date` nativo — Unix↔fecha local/UTC/ISO 8601 bidireccional |
| `/minificador-html` | `MinificadorHTMLTool.tsx` | Básicas | JS puro regex — elimina comments, colapsa whitespace, formatea |

### Páginas legales (5)

| Ruta | Descripción |
|---|---|
| `/privacidad` | Política de privacidad — sin recopilación de datos |
| `/terminos` | Términos de uso |
| `/cookies` | Política de cookies — no se usan cookies de seguimiento |
| `/aviso-legal` | Aviso legal LSSI/RGPD |
| `/contacto` | Solo email, sin formulario |

Todas las páginas legales usan `LegalLayout.astro` y tienen `noindex, follow`.

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

### Patrones de color picker en tools
1. Array de colores preset como botones circulares `w-7 h-7 rounded-full`.
2. Un `<label>` con `<input type="color">` invisible como selector custom.
3. El borde cambia a `var(--color-accent)` cuando el color está seleccionado.

### HomeTools.tsx — tabs del home
- `src/components/ui/HomeTools.tsx` — componente React montado con `client:load` en `index.astro`.
- 5 tabs: `imagen | pdf | video | audio | developer`.
- Routing por hash: lee `window.location.hash` al montar, escucha `hashchange`, actualiza con `history.replaceState`.
- Tab bar con `overflow-x-auto scrollbar-none` para scroll horizontal en móvil.

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
**El build genera actualmente 102 páginas HTML estáticas** (33 imagen + 20 PDF + 15 vídeo + 10 audio + 18 developer + home + 5 legales).

---

## Notas importantes

- El **warning de Node.js imports** (`fs`, `util`, `stream`…) del paquete `qrcode` es esperado. Sus renderers PNG/SVG importan módulos Node, pero `GenerarQRTool.tsx` solo usa `QRCode.toCanvas()` (browser-safe) vía import dinámico. No afecta al funcionamiento.
- El **warning de chunk size** en el build es esperado. `@imgly/background-removal` (~50 MB), `pdfjs-dist` y `@ffmpeg/ffmpeg` son grandes. Todos se cargan bajo demanda con import dinámico.
- Astro detecta el adapter de Cloudflare y habilita "Cloudflare Images" y "KV sessions" — esos mensajes en el build son informativos, no errores.
- El `output: "static"` en `astro.config.mjs` genera HTML estático puro. No hay server-side rendering.
- La depreciación de `punycode` en los logs de build/dev es un warning de Node.js interno de las dependencias, no del código propio.
- **ToolsFoto no usa cookies de seguimiento ni analíticas.** El único almacenamiento local es la caché del modelo de IA de `@imgly/background-removal`, que gestiona el propio navegador. No se necesita banner de consentimiento de cookies.
- **Hero background:** `public/hero-bg.jpg` — gradiente full-spectrum (rosa/naranja/azul), 1920px, ~73 KB. Overlay `from-black/75 via-black/55 to-black/30` para legibilidad del texto.
