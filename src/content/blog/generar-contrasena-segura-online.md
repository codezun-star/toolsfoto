---
titulo: "Cómo generar una contraseña segura online que de verdad lo sea"
descripcion: "Muchos generadores de contraseñas usan Math.random(), que no es criptográficamente seguro. Te explico qué hace una contraseña realmente fuerte y cómo crear una en segundos con aleatoriedad real."
categoria: "tips"
fecha: "2026-05-28"
keywords:
  - "generar contraseña segura online"
  - "generador contraseñas aleatorias criptográfico"
  - "crear password seguro gratis"
  - "contraseña aleatoria sin instalar"
autor: "Equipo ToolsFoto"
publicado: true
---

La mayoría de servicios piden una contraseña de al menos 8 caracteres con mayúsculas, minúsculas y números. Eso está muy por debajo de lo que se considera seguro hoy. **Generar una contraseña segura online** de verdad implica longitud suficiente, aleatoriedad criptográfica y no reutilizarla nunca.

El [Generador de contraseñas](/generador-contrasenas) de ToolsFoto usa `crypto.getRandomValues()` del navegador — el mismo generador de aleatoriedad que usa el sistema operativo para claves criptográficas. Ninguna contraseña generada sale de tu dispositivo.

## Qué hace que una contraseña sea realmente fuerte

### La longitud es el factor más importante

Una contraseña de 12 caracteres con el alfabeto completo tiene 95¹² ≈ 540 billones de combinaciones. A 16 caracteres son 95¹⁶ ≈ 4 × 10³¹ combinaciones — prácticamente inviable por fuerza bruta con la tecnología actual, incluso a largo plazo.

El mínimo recomendado hoy para cuentas importantes (email, banco, gestor de contraseñas) es **16 caracteres**.

### La aleatoriedad real importa más de lo que parece

`Math.random()` — la función de aleatoriedad estándar de JavaScript — no es criptográficamente segura: es predecible si conoces el estado interno del generador. `crypto.getRandomValues()` usa entropía del hardware del dispositivo, lo que la hace genuinamente impredecible.

La diferencia práctica: una contraseña generada con `Math.random()` podría reconstruirse con suficiente información sobre el sistema. Una generada con `crypto.getRandomValues()` no puede.

### Variedad de caracteres

Más tipos de caracteres en el pool = más combinaciones posibles por posición:

- Solo minúsculas: 26 opciones por carácter
- Minúsculas + mayúsculas: 52
- Letras + números: 62
- Letras + números + símbolos: ~95

Añadir símbolos incrementa el espacio de búsqueda considerablemente. Sin embargo, si el servicio no admite símbolos en la contraseña, compensa con mayor longitud.

## Cómo generar una contraseña segura paso a paso

1. Abre [Generador de contraseñas](/generador-contrasenas).
2. Elige la longitud — **mínimo 16 caracteres** para cuentas importantes.
3. Activa los tipos de caracteres que el servicio permita (mayúsculas, minúsculas, números, símbolos).
4. Haz clic en **Generar** o pulsa el botón varias veces si algún resultado es difícil de escribir a mano.
5. Copia la contraseña directamente en tu gestor de contraseñas.

## Por qué necesitas un gestor de contraseñas

Una contraseña fuerte es inútil si la reutilizas. El 81% de las brechas de datos ocurren porque una contraseña filtrada de un servicio se usa en otros. La solución es una contraseña diferente por servicio — imposible de memorizar sin ayuda.

Un gestor de contraseñas (Bitwarden, 1Password, KeePass) almacena todas tus contraseñas cifradas. Solo necesitas recordar una contraseña maestra fuerte para acceder a todas las demás.

## Cuándo cambiar una contraseña

- Cuando el servicio anuncia una brecha de datos (compruébalo en [haveibeenpwned.com](https://haveibeenpwned.com)).
- Cuando sospechas que alguien tiene acceso no autorizado a tu cuenta.
- Cuando la contraseña tiene menos de 12 caracteres o es predecible.

No es necesario cambiar contraseñas periódicamente si son fuertes y únicas — ese consejo está desactualizado y solo genera fatiga que lleva a contraseñas peores. Lo que importa es que sean aleatorias y no se repitan.

Genera la tuya en [Generador de contraseñas](/generador-contrasenas) — sin registro, sin que la contraseña salga de tu navegador.
