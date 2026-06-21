> Parte de la documentación de ToolsFoto.
> Ver índice general en [HERRAMIENTAS.md](HERRAMIENTAS.md)

## Audio (53)

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
| `/detector-bpm` | `DetectorBPMTool.tsx` | Avanzadas | Web Audio API — análisis de energía + detección de onsets, sin IA |
| `/separar-voz` | `SepararVozTool.tsx` | Avanzadas | FFmpeg.wasm — `pan` filter cancelación canal central → vocals + instrumental |
| `/transcribir-audio` | `TranscribirAudioTool.tsx` | Básicas | Web Speech API — `SpeechRecognition` continuo, 7 idiomas |
| `/afinar-audio` | `AfinarAudioTool.tsx` | Básicas | FFmpeg.wasm — `asetrate + aresample + atempo` chaining + vibrato |
| `/visualizar-forma-onda` | `VisualizarFormaOndaTool.tsx` | Básicas | Web Audio API `decodeAudioData` + Canvas API — renderiza forma de onda como PNG |
| `/convertir-a-m4a` | `ConvertirAM4ATool.tsx` | Básicas | FFmpeg.wasm — `-c:a aac` en contenedor M4A, calidades 128k/192k/320k |
| `/robotizar-voz` | `RobotizarVozTool.tsx` | Creativas | FFmpeg.wasm — `aecho` muy corto + `asetrate` + `vibrato` (4 presets) |
| `/dividir-audio` | `DividirAudioTool.tsx` | Básicas | FFmpeg.wasm — dos ejecuciones: `-t split` y `-ss split` para 2 partes |
| `/audio-a-fragmentos` | `AudioAFragmentosTool.tsx` | Básicas | FFmpeg.wasm + Web Audio API (duración) — N fragmentos con `-ss -t` loop |
| `/recortar-silencio-inicio` | `RecortarSilencioInicioTool.tsx` | Básicas | FFmpeg.wasm — `silenceremove` con `start_periods=1` y `stop_periods=-1` |
| `/insertar-audio` | `InsertarAudioTool.tsx` | Básicas | FFmpeg.wasm — `filter_complex` concat con `atrim` para [antes][insert][después] |
| `/reemplazar-segmento` | `ReemplazarSegmentoTool.tsx` | Básicas | FFmpeg.wasm — filtro `volume=enable='between(t,start,end)':volume=0` |
| `/audio-a-base64` | `AudioABase64Tool.tsx` | Básicas | FileReader + `btoa()` — sin FFmpeg, devuelve cadena Base64 o data URI |
| `/convertir-a-flac` | `ConvertirAFlacTool.tsx` | Básicas | FFmpeg.wasm — `-c:a flac`, formato sin pérdida |
| `/analizar-espectro` | `AnalizarEspectroTool.tsx` | Avanzadas | Web Audio API `decodeAudioData` + DFT manual + Canvas API — espectrograma PNG |
| `/detectar-tono` | `DetectarTonoTool.tsx` | Avanzadas | Web Audio API PCM + autocorrelación → frecuencia en Hz + nota musical + octava |
| `/medir-duracion` | `MedirDuracionTool.tsx` | Básicas | Web Audio API `decodeAudioData` — duración, sampleRate, canales, bitrate estimado |
| `/cambiar-pitch-sin-tempo` | `CambiarPitchSinTempoTool.tsx` | Avanzadas | FFmpeg.wasm — `asetrate + aresample + atempo` con precisión en cents (±1200) |
| `/compresor-audio` | `CompresorAudioTool.tsx` | Avanzadas | FFmpeg.wasm — filtro `acompressor` con threshold, ratio, attack, release, makeup |
| `/distorsion-audio` | `DistorsionAudioTool.tsx` | Creativas | FFmpeg.wasm — `overdrive` y `acrusher` (4 presets: suave/guitarra/bitcrush/heavy) |
| `/coro-audio` | `CoroAudioTool.tsx` | Creativas | FFmpeg.wasm — filtro `achorus` (3 presets: sutil/estándar/rico) |
| `/telefono-audio` | `TelefonoAudioTool.tsx` | Creativas | FFmpeg.wasm — `highpass + lowpass` + `acompressor` (4 presets de banda estrecha) |
| `/generar-ruido-blanco` | `GenerarRuidoBlancTool.tsx` | Básicas | FFmpeg.wasm lavfi `anoisesrc` — ruido blanco/rosa/marrón sin input de archivo |
| `/grabar-audio` | `GrabarAudioTool.tsx` | Básicas | MediaRecorder (`getUserMedia`) + conversión opcional a MP3 con FFmpeg.wasm |
| `/audio-a-mp3` | `AudioAMp3Tool.tsx` | Básicas | FFmpeg.wasm libmp3lame (vía `AudioToMp3Base`) |
| `/wav-a-mp3` | `WavAMp3Tool.tsx` | Básicas | FFmpeg.wasm libmp3lame (vía `AudioToMp3Base`) |
| `/m4a-a-mp3` | `M4aAMp3Tool.tsx` | Básicas | FFmpeg.wasm libmp3lame (vía `AudioToMp3Base`) |
| `/ogg-a-mp3` | `OggAMp3Tool.tsx` | Básicas | FFmpeg.wasm libmp3lame (vía `AudioToMp3Base`) |
| `/aac-a-mp3` | `AacAMp3Tool.tsx` | Básicas | FFmpeg.wasm libmp3lame (vía `AudioToMp3Base`) |
| `/flac-a-mp3` | `FlacAMp3Tool.tsx` | Básicas | FFmpeg.wasm libmp3lame (vía `AudioToMp3Base`) |
| `/audio-a-wav` | `AudioAWavTool.tsx` | Básicas | FFmpeg.wasm — `pcm_s16le` + `-ar` ajustable |
| `/loop-audio` | `LoopAudioTool.tsx` | Básicas | FFmpeg.wasm — `-stream_loop` N repeticiones |
| `/audio-8d` | `Audio8dTool.tsx` | Creativas | FFmpeg.wasm — filtro `apulsator` (paneo 8D) |
| `/bass-boost` | `BassBoostTool.tsx` | Creativas | FFmpeg.wasm — filtro `bass=g=` ganancia en dB |
