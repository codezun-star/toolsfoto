---
titulo: "Verificar la integridad de un archivo con su hash MD5, SHA-1 o SHA-256"
descripcion: "Un hash es la huella digital de un archivo. Si cambia un solo byte, el hash cambia completamente. Te explico para qué sirve, cuál elegir y cómo calcularlo online sin instalar nada."
categoria: "herramientas"
fecha: "2026-05-29"
keywords:
  - "calcular hash archivo online"
  - "MD5 SHA-256 online gratis"
  - "verificar integridad archivo hash"
  - "checksum archivo online"
  - "calcular MD5 de un archivo"
autor: "Equipo ToolsFoto"
publicado: true
---

Descargas un archivo ISO de 4 GB y quieres asegurarte de que la descarga fue completa y el archivo no fue manipulado. O envías un documento crítico y necesitas verificar que el receptor recibió exactamente el mismo archivo. O un sistema de auditoría requiere el hash de cada archivo procesado. **Calcular el hash de un archivo** es la operación que hace posible todo esto.

La herramienta [Calcular hash](/calcular-hash) de ToolsFoto calcula MD5, SHA-1 y SHA-256 de cualquier archivo directamente en el navegador, sin que el archivo salga de tu dispositivo.

## Qué es un hash y por qué es una "huella digital"

Un hash es el resultado de pasar un archivo por una función matemática de una sola dirección. La salida es siempre una cadena de longitud fija (32 caracteres en MD5, 40 en SHA-1, 64 en SHA-256) independientemente del tamaño del archivo.

Las propiedades fundamentales:

- **Determinista:** el mismo archivo siempre produce el mismo hash.
- **Efecto avalancha:** cambiar un solo byte del archivo produce un hash completamente diferente.
- **Irreversible:** no es posible reconstruir el archivo a partir del hash.
- **Colisiones raras:** dos archivos diferentes raramente producen el mismo hash (aunque en MD5 esto ya no es tan seguro, como se explica abajo).

## MD5, SHA-1 y SHA-256: cuál elegir

| Algoritmo | Longitud del hash | Velocidad | Seguridad | Uso recomendado |
|---|---|---|---|---|
| MD5 | 32 caracteres (128 bits) | Muy rápido | Débil (colisiones conocidas) | Verificación de descarga informal |
| SHA-1 | 40 caracteres (160 bits) | Rápido | Débil (colisiones demostradas) | Legado — evitar para nuevos usos |
| SHA-256 | 64 caracteres (256 bits) | Moderado | Muy fuerte | Verificación de integridad seria, checksums oficiales |

**MD5** sigue siendo el más usado para verificación informal de descargas porque la mayoría de sitios publican el MD5 del archivo. Aunque tiene vulnerabilidades criptográficas conocidas, para detectar corrupción accidental (descarga interrumpida, error de transmisión) sigue siendo válido.

**SHA-256** es el estándar actual para cualquier uso donde la seguridad importa. Distribuciones Linux, software de código abierto y verificaciones de seguridad publican hashes SHA-256.

**SHA-1** está en desuso — se han demostrado ataques de colisión prácticos. Úsalo solo cuando el sistema con el que trabajas no soporte nada mejor.

## Casos de uso frecuentes

### Verificar una descarga

Un sitio de descarga fiable publica el hash SHA-256 del archivo junto al enlace de descarga. Descargas el archivo, calculas su hash y lo comparas con el publicado. Si coincide, el archivo es íntegro. Si difiere, la descarga fue corrupta o el archivo fue modificado.

### Auditoría documental

En procesos donde necesitas demostrar que un documento no fue modificado desde una fecha concreta, el hash en ese momento sirve como referencia. Si el hash del documento en el futuro coincide con el registrado, el documento no cambió.

### Detectar duplicados exactos

Dos archivos con el mismo hash son bit a bit idénticos, aunque tengan nombres diferentes. Útil para detectar duplicados en colecciones grandes de archivos.

### Verificar transferencias de archivos críticos

Antes de enviar un archivo importante (código fuente, datos de producción, backup), calculas el hash. El receptor lo calcula también. Si coinciden, la transferencia fue perfecta.

## Cómo calcular el hash con ToolsFoto

1. Abre [Calcular hash](/calcular-hash).
2. Sube tu archivo (cualquier tipo, cualquier tamaño — el procesamiento es local).
3. La herramienta calcula MD5, SHA-1 y SHA-256 simultáneamente.
4. Compara el resultado con el hash publicado por la fuente original.

El archivo nunca sale de tu navegador — el cálculo se hace localmente con la Web Crypto API del navegador.
