---
titulo: "Cómo extraer el audio de un vídeo online (MP3, WAV, AAC)"
descripcion: "Convertir un vídeo en audio te permite guardar la conferencia, el podcast en vídeo o la música como archivo de audio. Te explico cómo hacerlo desde el navegador sin instalar nada."
categoria: "tutoriales"
fecha: "2026-05-29"
keywords:
  - "extraer audio de video online"
  - "convertir video a MP3 online"
  - "sacar audio de video gratis"
  - "video a audio online sin instalar"
  - "separar audio de video"
  - "extraer audio video podcast YouTube LATAM"
  - "convertir video MP3 gratis Colombia México Argentina"
  - "sacar audio entrevista vídeo sin programa"
autor: "Equipo ToolsFoto"
publicado: true
---

Tienes una conferencia grabada en MP4, un podcast que alguien subió en formato vídeo a YouTube, una entrevista en MKV, o una canción en formato vídeo. **Extraer el audio de un vídeo** y guardarlo como MP3, WAV o AAC es inmediato con la herramienta [Extraer audio](/extraer-audio-de-video) de ToolsFoto — sin instalar nada, sin enviar el archivo a ningún servidor.

## Qué significa extraer audio técnicamente

Un archivo de vídeo contiene varias pistas independientes multiplexadas en un contenedor: una (o varias) pistas de vídeo, una (o varias) pistas de audio, a veces subtítulos. Extraer el audio simplemente significa copiar la pista de audio del contenedor y guardarla como archivo independiente.

Si la operación se hace con **copia directa** (`-c copy` en FFmpeg), no hay re-encodificación: el audio resultante es bit a bit idéntico al que había en el vídeo. Si se re-encodifica (por ejemplo, de AAC a MP3), hay una conversión que puede implicar mínima pérdida de calidad, pero el resultado es compatible con más reproductores.

La herramienta permite elegir el formato de salida (MP3, WAV, AAC, OGG, FLAC) y extrae la pista de audio en ese formato.

## Cuándo usar cada formato

| Formato | Cuándo usarlo |
|---|---|
| MP3 | Compatibilidad universal. Podcasts, música, archivos para compartir. |
| AAC | Mejor calidad que MP3 al mismo bitrate. iOS/Mac nativo. |
| WAV | Sin compresión, máxima calidad. Edición de audio profesional. |
| OGG | Código abierto, buena compresión. Juegos, apps web. |
| FLAC | Sin pérdida comprimido. Archivado de alta calidad. |

Para la mayoría de los usos — compartir, escuchar, publicar — **MP3 a 192 kbps** es la opción correcta.

## Casos de uso frecuentes

**Extraer música de un vídeo de YouTube (descargado localmente)**
Si tienes el vídeo guardado en tu dispositivo, la herramienta extrae el audio como MP3 en segundos.

**Guardar una conferencia o clase como audio**
Las grabaciones de Zoom, Meet o Teams en MP4 suelen pesar 300–600 MB/hora. El audio en MP3 equivalente pesa 50–80 MB y es perfectamente escuchable en el coche, el gym o el metro.

**Preparar material para un podcast**
Si grabaste en vídeo (mejor encuadre, más fácil de editar visualmente) pero el canal de distribución es un podcast de solo audio, extraer el audio es el primer paso antes de la edición y la publicación.

**Aislar audio de un vídeo para editarlo**
Si necesitas aplicar un ecualizador, reducir ruido o añadir música de fondo al audio de un vídeo, primero extrae el audio, edítalo con tu herramienta preferida y luego combínalo de nuevo con el vídeo usando [Reemplazar audio en vídeo](/reemplazar-audio-video).

## Cómo extraer audio con ToolsFoto

1. Abre [Extraer audio de vídeo](/extraer-audio-de-video).
2. Sube tu vídeo (MP4, WebM, MOV, AVI, MKV — hasta 500 MB).
3. Selecciona el formato de salida (MP3, WAV, AAC, OGG o FLAC).
4. Haz clic en **Extraer** y descarga el archivo de audio.

La primera vez se descarga FFmpeg.wasm (~30 MB). Las siguientes, el proceso es inmediato desde caché.

## Podcasters y creadores de contenido en audio: el contexto LATAM

El formato podcast ha crecido sostenidamente en América Latina. México, Argentina, Colombia, Chile y Perú tienen comunidades activas de oyentes y creadores en plataformas como Spotify, Apple Podcasts, Google Podcasts y plataformas locales. Muchos de los creadores de podcast en la región empiezan grabando en formato vídeo — porque YouTube es la plataforma con mayor penetración en LATAM y les permite alcanzar a audiencias que no consumen podcasts — y luego extraen el audio para distribuirlo en plataformas de audio.

Este flujo de "vídeo primero, audio después" es especialmente común en podcasters de **tecnología, emprendimiento y finanzas personales** dirigidos a audiencias latinoamericanas. El vídeo va a YouTube con cara visible, el mismo contenido va como audio a Spotify. Extraer el audio del vídeo editado es el paso que conecta ambos canales, y hacerlo sin herramientas de pago ni instalaciones complejas es clave para creadores independientes.

Para **periodistas, investigadores y comunicadores** en la región que realizan entrevistas en vídeo y las publican en múltiples formatos, extraer el audio como MP3 y subirlo directamente a plataformas de distribución de podcasts o al servidor de audio de su medio ahorra el paso de una re-grabación o una edición de audio separada. La herramienta convierte el vídeo de la entrevista en el audio del episodio en menos de un minuto, sin software profesional.
