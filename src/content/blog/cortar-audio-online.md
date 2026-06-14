---
titulo: "Cómo cortar audio online: recorta, divide y une fragmentos sin instalar nada"
descripcion: "Cortar un archivo de audio al segundo exacto es posible desde el navegador. Te enseño a recortar, dividir y unir pistas de audio online sin instalar programas."
categoria: "tutoriales"
fecha: "2026-05-30"
keywords:
  - "cortar audio online gratis"
  - "recortar MP3 online sin instalar"
  - "dividir audio online"
  - "cortar canción online"
  - "editor audio online"
  - "cortar audio podcast Colombia México Argentina"
  - "editar MP3 online sin programa gratis"
  - "recortar audio WhatsApp nota de voz"
autor: "Equipo ToolsFoto"
publicado: true
---

Tienes una canción y quieres extraer el coro. Una grabación de una hora de la que solo necesitas cinco minutos. Un fragmento de podcast que quieres convertir en un clip. **Cortar audio online** sin instalar nada es posible y más preciso de lo que parece con las herramientas correctas.

La herramienta [Cortar audio](/cortar-audio) de ToolsFoto recorta cualquier archivo de audio al fragmento exacto que necesitas, procesando todo en el navegador sin enviar el archivo a ningún servidor.

## La diferencia entre recortar y dividir

**Recortar** significa quedarte con un fragmento: defines dónde empieza y dónde termina, y el resultado es ese único fragmento.

**Dividir** significa separar un archivo en partes: defines el punto de corte y obtienes dos archivos independientes, cada uno con su parte del original.

Ambas operaciones son variantes del mismo proceso técnico — en realidad, FFmpeg opera con los mismos parámetros `-ss` (inicio) y `-to` (fin), solo cambia lo que se le pide al usuario que defina.

La herramienta [Cortar audio](/cortar-audio) cubre el caso de recorte. Para dividir un audio en múltiples partes, puedes hacer varias pasadas seleccionando fragmentos distintos.

## Recortar con o sin re-encode

Hay dos modos de cortar audio:

**Con copia directa (`-c copy`):** no re-encodifica el audio, simplemente copia los frames que corresponden al fragmento. El resultado es idéntico al original en calidad y es inmediato. La limitación es que el punto de corte puede no ser exacto al milisegundo — se ajusta al keyframe más cercano, lo que en audio suele ser irrelevante.

**Con re-encode:** reproces el audio con el codec y bitrate que especifiques. Más lento, pero el corte es exacto al segundo. Útil si necesitas precisión absoluta en el punto de entrada.

La herramienta de ToolsFoto usa copia directa para preservar la calidad original — en práctica para la mayoría de los cortes de audio, la diferencia de posición es de milisegundos, imperceptible.

## Formatos soportados

La herramienta acepta MP3, WAV, OGG, AAC, FLAC y M4A. El archivo resultante mantiene el mismo formato del original — no hay conversión de formato en el proceso de corte. Si además necesitas cambiar el formato, usa [Convertir audio](/convertir-audio) después.

## Paso a paso: cómo cortar audio en ToolsFoto

1. Abre [Cortar audio](/cortar-audio).
2. Sube tu archivo de audio.
3. Define el tiempo de inicio y fin del fragmento que quieres conservar.
4. Haz clic en **Cortar** y descarga el resultado.

La primera vez que uses la herramienta se descarga FFmpeg.wasm (~30 MB). Las siguientes es inmediato.

## Otros editores de audio disponibles

Si lo que necesitas va más allá del corte:

- [Unir audios](/unir-audios) — fusiona varios archivos de audio en uno solo, en el orden que elijas.
- [Cambiar volumen audio](/cambiar-volumen-audio) — sube o baja el nivel de volumen del archivo.
- [Convertir audio](/convertir-audio) — cambia el formato entre MP3, WAV, OGG, AAC, FLAC y M4A.
- [Extraer audio de vídeo](/extraer-audio-de-video) — extrae la pista de audio de un vídeo como archivo independiente.

## Edición de audio para podcasters y productores en LATAM

El podcasting ha crecido enormemente en América Latina en los últimos años. México, Colombia, Argentina y Brasil tienen comunidades activas de podcasters que producen contenido en español sobre tecnología, negocios, cultura pop, deportes y política. Muchos de estos creadores trabajan de forma independiente, con equipos básicos de grabación y sin presupuesto para software de edición profesional como Adobe Audition o Logic Pro.

Para este perfil de creador, poder **cortar y editar audio directamente desde el navegador** sin instalar Audacity ni aprender una interfaz compleja es un cambio significativo en el flujo de trabajo. Un episodio de podcast grabado de una hora tiene inevitablemente silencios, tartamudeos, tangentes y fragmentos que hay que eliminar antes de publicar. Hacer esos cortes básicos online, sin instalar nada, desde el mismo ordenador que usan para grabar, es exactamente el caso de uso que cubre esta herramienta.

Para **músicos independientes y productores musicales** de la región que trabajan en plataformas digitales como SoundCloud, Spotify for Artists o Bandcamp — y que suelen crear sus demos y beats en DAWs como FL Studio o GarageBand — tener una herramienta de corte rápido online permite editar un fragmento concreto de una exportación sin volver a abrir el proyecto completo. También es útil para preparar clips de preview de canciones para Instagram o TikTok, donde el fragmento más viral suele ser el coro de 15–30 segundos.
