> Parte de la documentación de ToolsFoto.
> Ver índice general en [HERRAMIENTAS.md](HERRAMIENTAS.md)

## Imagen (48)

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
| `/comparar-imagenes` | `CompararImagenesTool.tsx` | Básicas | CSS `clip-path: inset()` + pointer events — slider antes/después |
| `/placeholder` | `PlaceholderTool.tsx` | Básicas | Canvas API — color, texto y presets de proporción |
| `/efecto-glitch` | `EfectoGlitchTool.tsx` | Creativas | Canvas `getImageData` — desplazamiento RGB + cortes aleatorios |
| `/tilt-shift` | `TiltShiftTool.tsx` | Creativas | Canvas blur con padding + gradient mask `destination-in` |
| `/imagen-a-ico` | `ImagenAICOTool.tsx` | Básicas | Binary ICO builder — PNG embebido, múltiples tamaños |
