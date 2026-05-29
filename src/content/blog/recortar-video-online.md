---
titulo: "Recortar un vídeo online: cómo cortar un fragmento sin re-encodificar"
descripcion: "Cortar los primeros diez segundos de un vídeo debería llevar diez segundos, no diez minutos. Te explico cómo hacerlo online y por qué el stream copy preserva la calidad exacta del original."
categoria: "tutoriales"
fecha: "2026-05-28"
keywords:
  - "recortar video online gratis"
  - "cortar video online sin instalar"
  - "cortar fragmento MP4 online"
  - "eliminar parte de un video"
  - "recortar MP4 sin perder calidad"
autor: "Equipo ToolsFoto"
publicado: true
---

Tienes un vídeo de diez minutos y solo necesitas los dos minutos del medio. O quieres quitar la intro que quedó cortada mal. O eliminar el tramo final donde todavía se ve la mano cerrando la grabación. **Recortar un vídeo online** sin instalar software ni esperar a que cargue un editor pesado es más sencillo de lo que parece.

La herramienta [Recortar vídeo](/recortar-video) de ToolsFoto hace el corte directamente en el navegador usando FFmpeg — y lo hace sin re-encodificar, lo que significa que la calidad del resultado es exactamente igual al original.

## La diferencia entre recortar y re-encodificar

Cuando un editor de vídeo recorta un clip, tiene dos opciones:

- **Re-encodificar:** procesar todos los fotogramas del nuevo fragmento y generar un archivo nuevo. Resultado: el vídeo pierde algo de calidad (aunque sea mínima) y el proceso tarda minutos, a veces mucho más.
- **Stream copy:** copiar los datos de vídeo y audio del rango elegido sin tocarlos. Resultado: calidad idéntica al original, proceso casi instantáneo.

La herramienta usa stream copy cuando es posible, lo que explica por qué un vídeo de 500 MB se recorta en segundos y el resultado es bit a bit fiel al segmento original.

> **Nota técnica:** el stream copy tiene una limitación. Los vídeos solo pueden cortarse exactamente en los keyframes (fotogramas clave). Si pides un corte en un punto entre dos keyframes, FFmpeg lo ajusta al keyframe anterior. En la práctica esto supone una diferencia de décimas de segundo, no perceptible en la mayoría de los casos.

## Casos de uso frecuentes

### Eliminar el comienzo o el final de una grabación

Es el uso más habitual. Grabar desde el botón de inicio hasta cuando realmente empieza la acción deja unos segundos de nada al principio; detener la grabación tarde deja ruido al final. El recorte los elimina en segundos.

### Extraer un fragmento específico de una clase o conferencia

Si grabaste una ponencia de dos horas y necesitas solo el segmento donde se explicó un concepto concreto, defines el punto de inicio y fin y descargas solo ese fragmento.

### Preparar un clip para redes sociales

Las plataformas tienen límites de duración: 60 segundos en algunos formatos de Instagram, 2:20 en X (Twitter), 15–60 segundos en TikTok. Recortar el fragmento más relevante es el primer paso antes de publicar.

### Separar escenas de una grabación larga

Si grabaste varias tomas seguidas o un evento largo, puedes hacer múltiples recortes para extraer cada escena por separado.

## Cómo recortar un vídeo con ToolsFoto

1. Abre [Recortar vídeo](/recortar-video).
2. Sube tu vídeo (MP4, WebM, MOV, AVI, MKV — hasta 500 MB).
3. Define el tiempo de inicio y fin del fragmento que quieres conservar.
4. Haz clic en **Recortar** y espera (la primera vez descarga el procesador FFmpeg, ~30 MB — después es instantáneo).
5. Descarga el resultado.

## Operaciones relacionadas

Si después de recortar necesitas eliminar también el audio del vídeo (por ejemplo, para añadir una locución diferente), usa [Silenciar vídeo](/silenciar-video) — elimina la pista de audio sin tocar ni un píxel del vídeo.

Si lo que quieres es extraer solo el audio del fragmento recortado, combina el recorte con [Extraer audio](/extraer-audio) para quedarte con la pista de sonido en MP3, WAV o AAC.
