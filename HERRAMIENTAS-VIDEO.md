> Parte de la documentación de ToolsFoto.
> Ver índice general en [HERRAMIENTAS.md](HERRAMIENTAS.md)

## Vídeo (26)

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
| `/anadir-subtitulos` | `AnadirSubtitulosTool.tsx` | Básicas | FFmpeg.wasm — canvas SRT overlay + filtro `overlay=0:0:enable='between(t,...)'` |
| `/extraer-fotogramas` | `ExtraerFotogramasTool.tsx` | Avanzadas | FFmpeg.wasm — `-vf fps=N` + ZIP builder puro (CRC32 inline) |
| `/ajuste-color-video` | `AjusteColorVideoTool.tsx` | Básicas | FFmpeg.wasm — filtro `eq=brightness:contrast:saturation:gamma` |
| `/miniatura-video` | `MiniaturaVideoTool.tsx` | Básicas | HTML5 `<video>` + Canvas `drawImage` — sin FFmpeg, instantáneo |
