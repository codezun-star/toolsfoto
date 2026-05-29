---
titulo: "Rotar un vídeo online: corregir la orientación sin perder calidad"
descripcion: "Grabaste el vídeo con el móvil en vertical y se ve de lado en el ordenador. O necesitas girar 180° una grabación de cámara IP. Te explico cómo corregirlo online sin re-encodificar."
categoria: "tutoriales"
fecha: "2026-05-29"
keywords:
  - "rotar vídeo online gratis"
  - "girar vídeo online"
  - "corregir orientación vídeo"
  - "voltear vídeo online"
  - "girar MP4 online"
autor: "Equipo ToolsFoto"
publicado: true
---

Grabaste con el móvil sin fijarte en la orientación y el vídeo se abre de lado en el ordenador. O una cámara de seguridad graba en una orientación incorrecta. O tienes un clip que necesitas invertir horizontalmente para un efecto espejo. **Rotar un vídeo online** soluciona todos estos casos sin instalar software y, en la mayoría de ellos, sin re-encodificar el vídeo.

La herramienta [Rotar vídeo](/rotar-video) de ToolsFoto aplica la rotación directamente en el navegador con FFmpeg.

## Por qué los vídeos de móvil aparecen girados

Los smartphones graban el vídeo siempre en la misma orientación de sensor, pero añaden metadatos de rotación que indican al reproductor cómo mostrarlo. Cuando ese metadato no se respeta — en algunos reproductores, plataformas de edición o conversores — el vídeo aparece girado 90° o 180°.

La solución correcta no es añadir otro metadato encima, sino aplicar la rotación físicamente a los fotogramas para que el vídeo sea correcto en cualquier sistema.

## Rotación vs. volteo

Son dos operaciones distintas:

| Operación | Resultado | Caso de uso |
|---|---|---|
| Rotar 90° derecha | Gira el encuadre 90° en sentido horario | Vídeo grabado de lado hacia la izquierda |
| Rotar 90° izquierda | Gira el encuadre 90° en sentido antihorario | Vídeo grabado de lado hacia la derecha |
| Rotar 180° | Invierte el encuadre completamente | Vídeo grabado boca abajo |
| Voltear horizontal (espejo) | Refleja el encuadre de izquierda a derecha | Corregir selfies con texto invertido |
| Voltear vertical | Refleja el encuadre de arriba a abajo | Cámaras montadas invertidas |

La herramienta [Voltear vídeo](/voltear-video) está disponible por separado para los casos de espejo.

## La rotación requiere re-encode

A diferencia del recorte temporal (que puede hacerse con stream copy), la rotación física de los fotogramas **sí requiere re-encodificación**: cada fotograma del vídeo se tiene que procesar para aplicar la transformación geométrica.

Esto implica:
- El proceso tarda más que un recorte simple.
- Hay una pequeña pérdida de calidad respecto al original (inherente al re-encode).
- La primera vez descarga el procesador FFmpeg (~30 MB) — después es instantáneo.

Para vídeos de alta resolución (4K, 1080p largos), el proceso puede tardar unos minutos.

## Cómo rotar un vídeo con ToolsFoto

1. Abre [Rotar vídeo](/rotar-video).
2. Sube tu vídeo (MP4, WebM, MOV, AVI, MKV — hasta 500 MB).
3. Selecciona la rotación: 90° derecha, 90° izquierda o 180°.
4. Haz clic en **Rotar** y espera el procesamiento.
5. Descarga el vídeo corregido.

## Si además necesitas recortar o ajustar

Si el vídeo también tiene partes que quieres eliminar además de corregir la orientación, lo más eficiente es hacer las dos operaciones por separado: primero rota, luego usa [Recortar vídeo](/recortar-video) para eliminar los fragmentos innecesarios.

Si la grabación tiene un encuadre con bordes negros después de la rotación (habitual al rotar vídeos que no son cuadrados), [Recortar área de vídeo](/recortar-area-video) permite eliminar esas franjas negras recortando el encuadre al área útil.
