---
titulo: "Cómo funcionan las expresiones cron (y los errores que se pagan caro)"
descripcion: "Cinco campos, cuatro símbolos y una excepción que sorprende a casi todo el mundo. Guía práctica para leer y escribir expresiones cron sin que una tarea acabe ejecutándose 1.440 veces al día."
categoria: "tutoriales"
fecha: "2026-08-06"
keywords:
  - "expresiones cron explicadas"
  - "sintaxis crontab"
  - "cron cada 5 minutos"
  - "generador cron online"
  - "programar tareas cron"
autor: "Equipo ToolsFoto"
publicado: true
---

Una expresión cron son cinco números separados por espacios. Parece poca cosa, pero es la sintaxis con la que se programan tareas en medio mundo: `crontab` en Linux, GitHub Actions, Kubernetes, Vercel, Cloudflare Workers, Jenkins y la mayoría de paneles de hosting usan exactamente el mismo formato.

El problema no es entenderla, es verificarla. Con el [Generador de expresiones cron](/generador-cron) puedes escribir una y ver al instante su traducción al español y las cinco próximas fechas en que se dispararía.

## Los cinco campos, en orden

```
*  *  *  *  *
│  │  │  │  │
│  │  │  │  └── día de la semana (0-6, domingo = 0)
│  │  │  └───── mes (1-12)
│  │  └──────── día del mes (1-31)
│  └─────────── hora (0-23)
└────────────── minuto (0-59)
```

El orden va **de la unidad más pequeña a la más grande**, salvo el día de la semana, que se queda al final. Leer una expresión consiste en recorrer los cinco campos por ese orden:

`30 8 * * 1` → minuto 30, hora 8, cualquier día del mes, cualquier mes, los lunes. Es decir: **todos los lunes a las 08:30**.

## Los cuatro símbolos

| Símbolo | Significa | Ejemplo |
|---|---|---|
| `*` | Todos los valores del campo | `* * * * *` = cada minuto |
| `-` | Un rango cerrado | `1-5` en el día de la semana = de lunes a viernes |
| `,` | Una lista de valores sueltos | `0,15,30,45` = en esos cuatro minutos |
| `/` | Un paso | `*/10` = cada 10 unidades |

También se aceptan nombres en inglés de tres letras: `MON-FRI` para los días y `JAN,JUL` para los meses. Son equivalentes a los números y se leen mucho mejor.

El paso puede aplicarse sobre un rango: `9-17/2` en el campo de la hora significa cada dos horas entre las 9 y las 17, es decir 9, 11, 13, 15 y 17.

## El error que se paga caro

Es siempre el mismo: **dejar con asterisco un campo a la izquierda del que querías ajustar**.

Imagina que quieres una copia de seguridad cada 6 horas y escribes:

```
* */6 * * *
```

Lo que has programado no son 4 ejecuciones al día, sino **240**: el minuto está en asterisco, así que la tarea se dispara los 60 minutos de cada una de esas 4 horas. La forma correcta es fijar el minuto:

```
0 */6 * * *
```

El mismo razonamiento aplica a cualquier tarea diaria o semanal: si el campo de minuto o el de hora quedan en asterisco, multiplicas las ejecuciones en lugar de espaciarlas. En una tarea que hace copias de seguridad, envía correos o llama a una API de pago, la diferencia entre 4 y 240 ejecuciones diarias se nota en la factura el primer día.

## La excepción que sorprende a todos

Cuando rellenas **a la vez** el día del mes y el día de la semana, cron los combina con un **OR**, no con un AND.

```
0 0 1 * 1
```

Esto **no** significa "los lunes que caigan en día 1". Significa "todos los días 1 del mes **y además** todos los lunes". Es una excepción a la lógica del resto de campos, y es la causa habitual de tareas que se ejecutan mucho más de lo previsto.

Si de verdad necesitas la intersección, deja uno de los dos campos con asterisco y comprueba la otra condición dentro de tu script.

## Las expresiones que vas a usar el 90 % del tiempo

| Expresión | Cuándo se ejecuta |
|---|---|
| `*/5 * * * *` | Cada 5 minutos |
| `0 * * * *` | Cada hora, en punto |
| `0 0 * * *` | Todos los días a medianoche |
| `0 9 * * 1-5` | De lunes a viernes a las 09:00 |
| `0 3 * * 0` | Los domingos a las 03:00 |
| `0 0 1 * *` | El día 1 de cada mes |
| `0 */6 * * *` | Cada 6 horas |

## La zona horaria, el detalle que se olvida

Las tareas se ejecutan en la zona horaria **del sistema donde corre el planificador**, que en servidores y contenedores suele ser UTC. Si programas un informe a las 08:00 pensando en tu hora local y el servidor va en UTC, el informe saldrá desplazado varias horas.

Hay un segundo detalle: los cambios de hora. Una tarea programada justo en la hora que se salta al pasar a horario de verano puede no ejecutarse ese día, y una programada en la hora que se repite en otoño puede ejecutarse dos veces.

## Compruébala antes de desplegarla

Un cron mal escrito no falla con un error: falla ejecutándose. Por eso conviene leer lo que hace en lenguaje natural y mirar sus próximas fechas reales antes de subir el cambio, en lugar de esperar a que la tarea se dispare en producción para descubrirlo.

El [Generador de expresiones cron](/generador-cron) valida cada campo por separado, te dice cuál falla si algo no encaja y calcula las próximas cinco ejecuciones. Todo se procesa en tu navegador: la expresión no se envía a ningún servidor, así que puedes comprobar crons de sistemas internos sin exponer nada.
