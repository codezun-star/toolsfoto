---
titulo: "Añadir subtítulos a un vídeo online: formatos, tiempos y buenas prácticas"
descripcion: "Los subtítulos mejoran la accesibilidad, el SEO de vídeos y el consumo sin sonido. Te explico cómo funcionan los formatos SRT y VTT y cómo incrustarlos en tu vídeo online."
categoria: "tutoriales"
fecha: "2026-05-29"
keywords:
  - "añadir subtítulos a vídeo online"
  - "incrustar subtítulos MP4 online"
  - "cómo poner subtítulos a un vídeo"
  - "subtítulos SRT vídeo online"
  - "agregar subtítulos gratis"
  - "subtítulos vídeo YouTube español LATAM"
  - "agregar subtítulos TikTok Reels español"
  - "poner subtítulos video sin programa Colombia México"
autor: "Equipo ToolsFoto"
publicado: true
---

El 85% del contenido de vídeo en redes sociales se consume sin sonido. Los subtítulos no son un extra de accesibilidad — son la diferencia entre que alguien vea tu vídeo o lo ignore en el feed. **Añadir subtítulos a un vídeo online** sin software de edición profesional es posible con las herramientas correctas.

La herramienta [Añadir subtítulos](/anadir-subtitulos) de ToolsFoto incrusta un archivo de subtítulos en tu vídeo directamente en el navegador.

## Subtítulos abiertos vs. cerrados

Hay dos formas de incluir subtítulos en un vídeo:

**Subtítulos cerrados (soft subs):** el archivo de subtítulos va separado del vídeo. El reproductor los muestra si el usuario los activa. El usuario puede desactivarlos o elegir entre varios idiomas. YouTube, Netflix y la mayoría de plataformas usan este sistema.

**Subtítulos abiertos o incrustados (hard subs / burned-in):** el texto se dibuja directamente sobre los fotogramas del vídeo. Siempre están visibles, en cualquier reproductor, aunque no soporte subtítulos externos. Ideal para compartir en redes sociales donde no hay control de subtítulos por pista.

La herramienta incrusta los subtítulos en el vídeo (hard subs), lo que garantiza que se verán en cualquier plataforma.

## El formato SRT: cómo funciona

El formato `.srt` (SubRip) es el más universal. Es un archivo de texto plano con una estructura simple:

```
1
00:00:02,500 --> 00:00:05,000
Bienvenido al tutorial.

2
00:00:05,500 --> 00:00:08,200
Hoy aprenderemos a editar vídeo.
```

Cada bloque tiene: un número de secuencia, los tiempos de entrada y salida en formato `HH:MM:SS,mmm`, y el texto del subtítulo. Los bloques se separan con una línea en blanco.

El formato `.vtt` (WebVTT) es muy similar pero usa punto en lugar de coma para los milisegundos y añade la cabecera `WEBVTT` al inicio. Es el estándar para web y HTML5 video.

## Cómo crear el archivo de subtítulos

Si no tienes el archivo SRT, hay varias formas de crearlo:

- **A mano:** abre un editor de texto, escribe los bloques siguiendo el formato SRT y guarda el archivo con extensión `.srt`. Es lento pero da control total sobre cada línea y tiempo.
- **Con un editor de subtítulos:** herramientas como Subtitle Edit (Windows) o Aegisub permiten crear y ajustar tiempos visualmente.
- **Transcripción automática:** si tienes el audio del vídeo, la herramienta [Transcribir audio](/transcribir-audio) genera el texto. Luego lo adaptas a formato SRT añadiendo los tiempos manualmente.

## Buenas prácticas para subtítulos legibles

- **Máximo 2 líneas por bloque** — más líneas tapan demasiado la imagen.
- **Máximo 42 caracteres por línea** — estándar de televisión, cómodo de leer.
- **Duración mínima: 1 segundo** — menos tiempo y el ojo no lo procesa.
- **Duración máxima: 7 segundos** — para bloques muy largos, divide en dos.
- **Posición: parte inferior** — evita tapar caras o elementos importantes en la zona central.
- **Contraste suficiente:** texto blanco con contorno negro o sombra funciona en casi cualquier fondo.

## Cómo añadir subtítulos con ToolsFoto

1. Prepara tu archivo `.srt` o `.vtt` con los textos y tiempos.
2. Abre [Añadir subtítulos](/anadir-subtitulos).
3. Sube tu vídeo y el archivo de subtítulos.
4. Haz clic en **Procesar** y descarga el vídeo con los subtítulos incrustados.

La primera vez descarga el procesador FFmpeg (~30 MB) — después el proceso es rápido según la duración y resolución del vídeo.

## Subtítulos en vídeos para audiencias hispanohablantes de LATAM

El español de América Latina tiene características que importan en los subtítulos: vocabulario regional (vos en Argentina y Uruguay, términos propios de México, Colombia o Chile), velocidad de habla más rápida que el español peninsular y acento variable. Si tu contenido se distribuye en múltiples países de la región, usar un español neutro en los subtítulos maximiza la comprensión en todos los mercados.

Los **creadores de contenido en YouTube, TikTok e Instagram** de México, Colombia, Argentina y Chile que añaden subtítulos a sus vídeos tienen retención notablemente mayor: los usuarios en el metro, en la oficina o en espacios con ruido consumen el vídeo con sonido desactivado y los subtítulos como guía. Esta práctica también mejora el posicionamiento en YouTube, ya que los subtítulos se indexan como texto y añaden keywords al vídeo.

Para **contenido educativo y corporativo** — clases en línea, webinars, capacitaciones empresariales — los subtítulos son especialmente importantes en contextos donde hay usuarios con deficiencia auditiva o en entornos donde la conexión a internet no permite escuchar el audio con fluidez. Plataformas de e-learning como Platzi, Crehana y Domestika, muy populares en la región, incluyen subtítulos como estándar en todo su catálogo. Si produces cursos para vender en Hotmart o en tu propio sitio, incluir subtítulos incrustados directamente en el vídeo garantiza que funcionan incluso en reproductores básicos que no soportan pistas externas.
