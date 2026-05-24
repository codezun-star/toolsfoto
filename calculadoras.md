# ToolsFoto — Registro completo de herramientas

> Este archivo documenta todas las herramientas de ToolsFoto organizadas por dominio.
> Se usa como referencia de control para no sobrecargar CLAUDE.md.
> **Total: 121 herramientas · 147 páginas HTML estáticas**

---

## Imagen (43)

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
| `/comprimir-objetivo` | `ComprimirObjetivoTool.tsx` | Básicas | Canvas API — búsqueda binaria de calidad JPEG |
| `/fondo-degradado` | `FondoDegradadoTool.tsx` | Creativas | Canvas `createLinearGradient`/`createRadialGradient` |
| `/nitidez` | `NitidezTool.tsx` | Básicas | Canvas API — unsharp mask con getImageData |
| `/ajustar-niveles` | `AjustarNivelesTool.tsx` | Básicas | Canvas `getImageData` — punto negro, blanco y gamma |
| `/efecto-oleo` | `EfectoOleoTool.tsx` | Creativas | Canvas `getImageData` — oil painting por vecindad de píxeles |
| `/desvanecer-bordes` | `DesvanecerBordesTool.tsx` | Creativas | Canvas `destination-in` con gradiente radial o lineal |
| `/ruido` | `RuidoTool.tsx` | Creativas | Canvas `getImageData` — ruido aleatorio por píxel |
| `/posterizar` | `PosterizarTool.tsx` | Creativas | Canvas `getImageData` — cuantización de niveles de color |
| `/vigneta` | `VignetaTool.tsx` | Creativas | Canvas gradiente radial superpuesto sobre imagen |
| `/solarizar` | `SolarizarTool.tsx` | Creativas | Canvas `getImageData` — efecto Sabattier por umbral |

---

## PDF (28)

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
| `/metadatos-pdf` | `MetadatosPDFTool.tsx` | Básicas | pdf-lib `getTitle/setTitle/getAuthor/setAuthor…` |
| `/intercalar-pdfs` | `IntercalarPDFsTool.tsx` | Básicas | pdf-lib `copyPages` alternando páginas A1, B1, A2, B2… |
| `/escalar-pdf` | `EscalarPDFTool.tsx` | Básicas | pdf-lib `embedPage` + `drawPage` — fit to page |
| `/encabezado-pie-pdf` | `EncabezadoPiePDFTool.tsx` | Básicas | pdf-lib `page.drawText()` centrado en cabecera y pie |
| `/duplicar-paginas-pdf` | `DuplicarPaginasPDFTool.tsx` | Básicas | pdf-lib `copyPages` — inserta N copias tras la página original |
| `/insertar-pagina-pdf` | `InsertarPaginaPDFTool.tsx` | Básicas | pdf-lib — inserta páginas en blanco en posición elegida |
| `/fondo-color-pdf` | `FondoColorPDFTool.tsx` | Básicas | pdf-lib `drawRectangle` + `embedPage` — fondo de color |
| `/aplanar-pdf` | `AplanarPDFTool.tsx` | Básicas | pdf-lib `doc.getForm().flatten()` — aplana formularios |

---

## Vídeo (21)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/comprimir-video` | `ComprimirVideoTool.tsx` | Básicas | FFmpeg.wasm — libx264 CRF (20/28/36), acodec aac |
| `/convertir-video` | `ConvertirVideoTool.tsx` | Básicas | FFmpeg.wasm — MP4 (libx264/aac) o WebM (libvpx/libvorbis) |
| `/extraer-audio` | `ExtraerAudioTool.tsx` | Básicas | FFmpeg.wasm — `-vn` + libmp3lame / pcm_s16le / aac |
| `/video-a-gif` | `VideoAGifTool.tsx` | Básicas | FFmpeg.wasm — palettegen+paletteuse, FPS y ancho configurables |
| `/recortar-video` | `RecortarVideoTool.tsx` | Básicas | FFmpeg.wasm — `-ss … -to … -c copy` (sin re-encode) |
| `/cambiar-velocidad` | `CambiarVelocidadTool.tsx` | Básicas | FFmpeg.wasm — `setpts` + `atempo` (chaining para 0.25x) |
| `/anadir-audio-video` | `AnadirAudioVideoTool.tsx` | Básicas | FFmpeg.wasm — reemplazar (`-map 0:v:0 -map 1:a:0`) o mezclar (`amix`) |
| `/rotar-video` | `RotarVideoTool.tsx` | Básicas | FFmpeg.wasm — `transpose=1/2` (90° CW/CCW) |
| `/unir-videos` | `UnirVideosTool.tsx` | Básicas | FFmpeg.wasm — concat demuxer + re-encode libx264 |
| `/silenciar-video` | `SilenciarVideoTool.tsx` | Básicas | FFmpeg.wasm — `-an -c:v copy` (stream copy) |
| `/capturar-fotograma` | `CapturarFotogramaTool.tsx` | Básicas | FFmpeg.wasm — `-ss {t} -frames:v 1` → PNG |
| `/voltear-video` | `VoltearVideoTool.tsx` | Básicas | FFmpeg.wasm — `hflip`, `vflip` o ambos |
| `/recortar-area-video` | `RecortarAreaVideoTool.tsx` | Básicas | FFmpeg.wasm — filtro `crop=w:h:x:y` |
| `/cambiar-resolucion-video` | `CambiarResolucionVideoTool.tsx` | Básicas | FFmpeg.wasm — `scale=w:h:force_original_aspect_ratio=decrease,pad` |
| `/marca-agua-video` | `MarcaAguaVideoTool.tsx` | Básicas | FFmpeg.wasm — canvas overlay + filtro `overlay=0:0` |
| `/bucle-video` | `BucleVideoTool.tsx` | Básicas | FFmpeg.wasm — concat demuxer con `list.txt` |
| `/audio-a-video` | `AudioAVideoTool.tsx` | Básicas | FFmpeg.wasm — `-loop 1 -i img` o `lavfi color` + audio → MP4 |
| `/revertir-video` | `RevertirVideoTool.tsx` | Básicas | FFmpeg.wasm — filtros `reverse` + `areverse` |
| `/reducir-fps` | `ReducirFPSTool.tsx` | Básicas | FFmpeg.wasm — `-vf fps=N`, copia el audio |
| `/convertir-vertical` | `ConvertirVerticalTool.tsx` | Básicas | FFmpeg.wasm — `scale+pad` filtro 9:16 y 1:1 |
| `/boomerang-video` | `BoomerangVideoTool.tsx` | Creativas | FFmpeg.wasm — `reverse+areverse` → concat orig+reversed |
| `/ajustar-volumen-video` | `AjustarVolumenVideoTool.tsx` | Básicas | FFmpeg.wasm — `-af volume=${db}dB -c:v copy` |

---

## Audio (19)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/comprimir-audio` | `ComprimirAudioTool.tsx` | Básicas | FFmpeg.wasm — libmp3lame, bitrate configurable (64k–320k) |
| `/convertir-audio` | `ConvertirAudioTool.tsx` | Básicas | FFmpeg.wasm — MP3 / WAV / OGG / AAC |
| `/cortar-audio` | `CortarAudioTool.tsx` | Básicas | FFmpeg.wasm — `-ss … -to … -c copy` |
| `/unir-audios` | `UnirAudiosTool.tsx` | Básicas | FFmpeg.wasm — re-encode a mp3 + concat demuxer |
| `/cambiar-volumen` | `CambiarVolumenTool.tsx` | Básicas | FFmpeg.wasm — `volume=${db}dB` o filtro `loudnorm` |
| `/velocidad-audio` | `VelocidadAudioTool.tsx` | Básicas | FFmpeg.wasm — `atempo` con chaining para <0.5× o >2× |
| `/revertir-audio` | `RevertirAudioTool.tsx` | Básicas | FFmpeg.wasm — filtro `areverse` |
| `/agregar-fade-audio` | `AgregarFadeAudioTool.tsx` | Básicas | FFmpeg.wasm — filtro `afade=t=in/out:st:d` |
| `/mezclar-audios` | `MezclarAudiosTool.tsx` | Básicas | FFmpeg.wasm — `amix=inputs=2:duration=longest` |
| `/cambiar-tono` | `CambiarTonoTool.tsx` | Básicas | FFmpeg.wasm — `asetrate=44100*2^(s/12),aresample=44100` |
| `/anadir-silencio` | `AnadirSilencioTool.tsx` | Básicas | FFmpeg.wasm — `adelay` + `apad` |
| `/convertir-a-mono` | `ConvertirAMonoTool.tsx` | Básicas | FFmpeg.wasm — `-ac 1` |
| `/eco-audio` | `EcoAudioTool.tsx` | Básicas | FFmpeg.wasm — filtro `aecho` con presets |
| `/convertir-a-estereo` | `ConvertirAEstereoTool.tsx` | Básicas | FFmpeg.wasm — `-ac 2` |
| `/eliminar-silencio` | `EliminarSilencioTool.tsx` | Básicas | FFmpeg.wasm — `silenceremove` |
| `/normalizar-audio` | `NormalizarAudioTool.tsx` | Básicas | FFmpeg.wasm — `loudnorm=I=target:TP=-1:LRA=7` |
| `/ecualizador-audio` | `EcualizadorAudioTool.tsx` | Básicas | FFmpeg.wasm — filtros `bass`, `treble`, `equalizer` (3 bandas) |
| `/reducir-ruido-audio` | `ReducirRuidoAudioTool.tsx` | Básicas | FFmpeg.wasm — filtro `anlmdn` adaptativo |
| `/generar-tono` | `GenerarTonoTool.tsx` | Básicas | FFmpeg.wasm lavfi — `sine`, formas de onda configurables |

---

## Developer (30)

| Slug | Componente | Categoría | Tecnología |
|---|---|---|---|
| `/svg-a-png` | `SvgAPngTool.tsx` | Básicas | Canvas API + `new Image()` con blob URL SVG |
| `/colores-imagen` | `ColoresImagenTool.tsx` | Básicas | Canvas 200×200 sampleo + cuantización 4-bit |
| `/eliminar-exif` | `EliminarExifTool.tsx` | Básicas | Canvas API re-export (strips all metadata) |
| `/imagen-a-base64` | `ImagenABase64Tool.tsx` | Básicas | `FileReader.readAsArrayBuffer` + `btoa` |
| `/generar-favicon` | `GenerarFaviconTool.tsx` | Básicas | Canvas múltiples tamaños + HTML tags generator |
| `/generar-qr` | `GenerarQRTool.tsx` | Básicas | `qrcode` (import dinámico) — `QRCode.toCanvas()` |
| `/formatear-json` | `FormatearJSONTool.tsx` | Básicas | `JSON.parse/stringify` nativo |
| `/codificar-url` | `CodificarURLTool.tsx` | Básicas | `encodeURIComponent/decodeURIComponent` |
| `/convertir-color` | `ConvertirColorTool.tsx` | Básicas | Conversión pura HEX↔RGB↔HSL↔HSB |
| `/base64-texto` | `Base64TextoTool.tsx` | Básicas | `btoa/atob` con TextEncoder para Unicode |
| `/minificador-css` | `MinificadorCSSTool.tsx` | Básicas | Minificación y formateo CSS puro en JS |
| `/csv-a-json` | `CsvAJsonTool.tsx` | Básicas | Parser CSV propio con soporte de comillas |
| `/calcular-hash` | `CalcularHashTool.tsx` | Básicas | Web Crypto API — SHA-1/256/384/512 |
| `/regex-tester` | `RegexTesterTool.tsx` | Básicas | `RegExp` nativo JS — resaltado de coincidencias |
| `/generador-uuid` | `GeneradorUUIDTool.tsx` | Básicas | `crypto.randomUUID()` — UUID v4 |
| `/contador-palabras` | `ContadorPalabrasTool.tsx` | Básicas | JS puro — palabras, chars, frases, párrafos |
| `/convertir-timestamp` | `ConvertirTimestampTool.tsx` | Básicas | `Date` nativo — Unix↔fecha local/UTC/ISO 8601 |
| `/minificador-html` | `MinificadorHTMLTool.tsx` | Básicas | JS puro regex — elimina comments y whitespace |
| `/generador-contrasenas` | `GeneradorContrasenasTool.tsx` | Básicas | `crypto.getRandomValues(Uint32Array)` |
| `/conversor-unidades` | `ConversorUnidadesTool.tsx` | Básicas | JS puro — 8 categorías, conversión vía base unit |
| `/lorem-ipsum` | `LoremIpsumTool.tsx` | Básicas | JS puro — párrafos/frases/palabras, corpus latino |
| `/gradiente-css` | `GradienteCssTool.tsx` | Básicas | CSS gradient builder — lineal/radial, hasta 5 stops |
| `/minificador-js` | `MinificadorJSTool.tsx` | Básicas | JS puro regex — elimina comentarios y espacios |
| `/formateador-sql` | `FormateadorSQLTool.tsx` | Básicas | JS puro — keywords en mayúsculas, saltos de línea |
| `/jwt-decoder` | `JwtDecoderTool.tsx` | Básicas | `atob` + base64url decode — header, payload, signature |
| `/esquema-colores` | `EsquemaColoresTool.tsx` | Básicas | JS puro HSL — 6 esquemas de color armoniosos |
| `/comparar-texto` | `CompararTextoTool.tsx` | Básicas | Algoritmo LCS — diff línea a línea con resaltado |
| `/conversor-base` | `ConversorBaseTool.tsx` | Básicas | `parseInt/toString` nativo — dec/bin/hex/oct + nibbles |
| `/entidades-html` | `EntidadesHTMLTool.tsx` | Básicas | JS puro + `textarea.innerHTML` — codificar/decodificar |

---

## Páginas legales (5)

| Ruta | Descripción |
|---|---|
| `/privacidad` | Política de privacidad — sin recopilación de datos |
| `/terminos` | Términos de uso |
| `/cookies` | Política de cookies — no se usan cookies de seguimiento |
| `/aviso-legal` | Aviso legal LSSI/RGPD |
| `/contacto` | Solo email, sin formulario |

---

*Última actualización: 2026-05-23 — 121 herramientas, 147 páginas HTML estáticas*
