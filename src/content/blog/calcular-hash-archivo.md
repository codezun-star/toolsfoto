---
titulo: "Calcular el hash de un archivo: MD5, SHA-1 y SHA-256 explicados"
descripcion: "Los hashes son la forma más fiable de verificar que un archivo no ha sido modificado o corrompido. Te explico las diferencias entre MD5, SHA-1 y SHA-256 y cuándo usar cada uno."
categoria: "herramientas"
fecha: "2026-05-30"
keywords:
  - "calcular hash archivo online"
  - "MD5 SHA256 archivo online"
  - "verificar integridad archivo hash"
  - "sha256 archivo gratis"
  - "md5 checksum online"
  - "verificar integridad archivo MD5 SHA256 auditoría Colombia México"
  - "calcular hash archivo desarrollador LATAM gratis"
  - "comprobar archivo no modificado hash online"
autor: "Equipo ToolsFoto"
publicado: true
---

Descargas un archivo de internet y quieres saber si es exactamente el que se publicó originalmente, sin modificaciones ni corrupción durante la transferencia. O necesitas demostrar que un documento era el mismo en dos fechas distintas. O quieres detectar archivos duplicados en una colección. En todos estos casos, la solución es calcular el **hash criptográfico** del archivo.

La herramienta [Calcular hash](/calcular-hash) de ToolsFoto calcula los hashes MD5, SHA-1 y SHA-256 de cualquier archivo directamente en el navegador, sin que el archivo abandone tu dispositivo.

## Qué es un hash de archivo

Un hash criptográfico es una cadena de longitud fija generada a partir del contenido completo de un archivo mediante una función matemática. Las propiedades fundamentales son:

- **Determinista:** el mismo archivo siempre produce el mismo hash.
- **Sensible a cambios mínimos:** modificar un solo bit del archivo produce un hash completamente diferente.
- **Irreversible:** es computacionalmente imposible reconstruir el archivo a partir del hash.
- **Prácticamente único:** dos archivos diferentes rara vez producen el mismo hash (colisión).

Si el hash de un archivo que acabas de descargar coincide con el hash publicado por el autor, el archivo es idéntico — no ha sido modificado ni corrompido.

## MD5, SHA-1 y SHA-256: diferencias prácticas

| Algoritmo | Longitud del hash | Velocidad | Seguridad criptográfica |
|---|---|---|---|
| **MD5** | 128 bits (32 hex) | Muy rápida | Rota — no usar para firma digital |
| **SHA-1** | 160 bits (40 hex) | Rápida | Rota — deprecada en contextos de seguridad |
| **SHA-256** | 256 bits (64 hex) | Moderada | Robusta — estándar actual recomendado |

### MD5

MD5 genera un hash de 32 caracteres hexadecimales (`d41d8cd98f00b204e9800998ecf8427e` para un archivo vacío). Es el más rápido y el más extendido históricamente.

**Cuándo sigue siendo útil:** verificación de integridad de descargas donde el objetivo es detectar corrupción accidental (no ataques), detección de duplicados en grandes colecciones de archivos. En estos casos las colisiones teóricas no son un riesgo práctico.

**Cuándo no usar:** firmas digitales, autenticación, cualquier contexto de seguridad donde un atacante podría generar colisiones deliberadamente.

### SHA-1

SHA-1 genera un hash de 40 caracteres hexadecimales. Era el estándar de la industria durante años, pero en 2017 Google demostró una colisión práctica (el ataque SHAttered), lo que lo hizo inseguro para firma digital.

**Cuándo sigue siendo útil:** algunos sistemas legacy que aún publican checksums SHA-1. Verificación de integridad básica.

**Cuándo no usar:** firmas digitales, certificados, cualquier sistema de seguridad nuevo.

### SHA-256

SHA-256 genera un hash de 64 caracteres hexadecimales. Es el miembro más usado de la familia SHA-2 y el estándar actual para casi todos los contextos que requieren integridad criptográfica.

**Cuándo usar:** verificación de descargas de software oficial, integridad de documentos, auditorías, cualquier caso donde la seguridad importa.

## Casos de uso habituales

### Verificar una descarga

El sitio oficial de software publica el hash SHA-256 del instalador junto al enlace de descarga. Después de descargar el archivo, calculas su hash y lo comparas con el publicado. Si coinciden, el archivo no ha sido modificado por nadie entre el servidor del autor y tu ordenador.

### Detectar duplicados

En una colección grande de archivos (fotos, documentos, backups), dos archivos con el mismo hash son idénticos — incluso si tienen nombres diferentes. Calcular los hashes y buscar duplicados es más fiable que comparar nombres o fechas de modificación.

### Registrar el estado de un documento

Si necesitas demostrar que un documento existía en una fecha y no ha sido modificado después, calcular y publicar su hash SHA-256 en una plataforma con registro de tiempo (timestamp) crea una prueba de integridad.

## Cómo calcular el hash con ToolsFoto

1. Abre [Calcular hash](/calcular-hash).
2. Sube el archivo — no sale del navegador.
3. La herramienta calcula MD5, SHA-1 y SHA-256 simultáneamente usando la Web Crypto API.
4. Copia el hash que necesites para compararlo.

El cálculo es instantáneo para archivos pequeños y tarda algunos segundos en archivos muy grandes (1 GB+).

## Integridad de archivos en el ecosistema tecnológico de LATAM

En América Latina, la necesidad de verificar la integridad de archivos aparece en múltiples contextos profesionales. Para **desarrolladores de software** en México, Colombia, Argentina y Chile que trabajan con imágenes de ISO de sistemas operativos (Ubuntu, Debian, Windows), librerías, paquetes de Docker o dependencias de proyectos, calcular el SHA-256 de lo descargado y compararlo con el publicado en el repositorio oficial es una práctica estándar de seguridad que evita el riesgo de ejecutar software comprometido en producción.

En el ámbito de la **auditoría y compliance**, contadores y auditores en la región que trabajan con documentos fiscales digitales — CFDIs en México, facturas electrónicas en Colombia (DIAN), comprobantes en Argentina (AFIP), documentos tributarios electrónicos en Chile (SII) — utilizan los hashes para demostrar la integridad de los archivos XML y PDF en procesos de verificación. Un hash SHA-256 calculado en el momento de recibir un documento y guardado junto a él permite demostrar en un litigio que el archivo no fue modificado posteriormente — un argumento de peso ante organismos tributarios y juzgados de la región.

Para **equipos de IT y administradores de sistemas** en empresas de la región que distribuyen actualizaciones de software o instaladores internos a través de redes corporativas o repositorios internos, publicar el SHA-256 de cada archivo junto al enlace de descarga es la práctica que permite a los usuarios verificar que el archivo no fue corrompido durante la transferencia o modificado por un intermediario — especialmente relevante en entornos donde el acceso a internet pasa por proxies corporativos o redes con políticas de filtrado agresivas.
