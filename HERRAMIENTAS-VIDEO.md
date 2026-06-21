> Parte de la documentación de ToolsFoto.
> Ver índice general en [HERRAMIENTAS.md](HERRAMIENTAS.md)

## Vídeo (42)

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
| `/fundido-video` | `FundidoVideoTool.tsx` | Básicas | FFmpeg.wasm — filtros `fade` + `afade` (fade in/out configurable en seg) |
| `/escala-grises-video` | `EscalaGrisesVideoTool.tsx` | Básicas | FFmpeg.wasm — `hue=s=0` (grises), `colorchannelmixer` (sepia), `negate` (negativo) |
| `/fotogramas-a-video` | `FotogramasAVideoTool.tsx` | Básicas | FFmpeg.wasm — filter_complex `scale+pad+concat` multi-input; hasta 30 imágenes |
| `/gif-a-video` | `GifAVideoTool.tsx` | Básicas | FFmpeg.wasm — `-f gif` → H.264 MP4 con `pix_fmt yuv420p` |
| `/denoise-video` | `DenoiseVideoTool.tsx` | Básicas | FFmpeg.wasm — filtro `hqdn3d` (3 niveles: suave/medio/intenso) |
| `/comprimir-gif` | `ComprimirGifTool.tsx` | Básicas | FFmpeg.wasm — `palettegen`/`paletteuse` + ajuste de scale, fps y colores |
| `/video-a-mp3` | `VideoAMp3Tool.tsx` | Básicas | FFmpeg.wasm — `-vn` + libmp3lame, bitrate ajustable |
| `/mov-a-mp4` | `MovAMp4Tool.tsx` | Básicas | FFmpeg.wasm — libx264 + aac (vía `VideoToMp4Base`) |
| `/avi-a-mp4` | `AviAMp4Tool.tsx` | Básicas | FFmpeg.wasm — libx264 + aac (vía `VideoToMp4Base`) |
| `/mkv-a-mp4` | `MkvAMp4Tool.tsx` | Básicas | FFmpeg.wasm — libx264 + aac (vía `VideoToMp4Base`) |
| `/webm-a-mp4` | `WebmAMp4Tool.tsx` | Básicas | FFmpeg.wasm — libx264 + aac (vía `VideoToMp4Base`) |
| `/comprimir-para-whatsapp` | `ComprimirWhatsappTool.tsx` | Básicas | FFmpeg.wasm — presets scale+CRF 720/480/360p |
| `/dividir-video` | `DividirVideoTool.tsx` | Básicas | FFmpeg.wasm — segment muxer `-c copy` según duración |
| `/recorte-cuadrado-video` | `CuadradoVideoTool.tsx` | Básicas | FFmpeg.wasm — `crop`/`pad` a relación 1:1 |
| `/difuminar-video` | `DifuminarVideoTool.tsx` | Básicas | FFmpeg.wasm — filtro `boxblur` con intensidad ajustable |
| `/quitar-fondo-verde` | `QuitarFondoVerdeTool.tsx` | Básicas | FFmpeg.wasm — `colorkey` + `overlay` sobre color sólido |
