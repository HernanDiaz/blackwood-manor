# Formato de mundo (`mundos-mundo`)

Un **mundo** contiene todo lo que pertenece a una ambientación y no a un caso concreto: reparto, lugares, quién vigila, armas, objetos que despistan, móviles, documentos, prólogos e ilustraciones. Cada investigación es un **expediente** (ver [EXPEDIENTES.md](EXPEDIENTES.md)) generado a partir de un mundo. El generador no tiene textos propios: todas las frases salen de aquí.

Los mundos están en `public/worlds/<id>.json` y sus ilustraciones en `public/worlds/<id>/`. Para comprobar un mundo y ver cómo quedan sus textos dentro de las frases del juego:

```bash
node tools/check-world.mjs public/worlds/<id>.json
```

## Campos

| Campo               | Contenido                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format`, `version` | `"mundos-mundo"`, `1`                                                                                                                                                        |
| `id`                | Identificador en minúsculas con guiones, igual que el nombre del archivo                                                                                                     |
| `label`             | Nombre corto en el menú («Ciencia ficción»)                                                                                                                                  |
| `title`             | Título del mundo                                                                                                                                                             |
| `premise`           | Dos o tres frases que presentan el lugar y la noche del crimen, sin revelar nada del caso                                                                                    |
| `art.style`         | Estilo de las ilustraciones (en inglés), común a todo el mundo                                                                                                               |
| `victim`            | `name`, `role` (cargo, sin artículo: «director de la estación»), `gender` (`f`/`m`), `description`                                                                           |
| `people`            | Cinco personajes `p1`…`p5` (ver abajo)                                                                                                                                       |
| `rooms`             | Seis lugares `r1`…`r6` (ver abajo)                                                                                                                                           |
| `staff`             | `guardian`, `record` y `report` (ver abajo)                                                                                                                                  |
| `weapons`           | Las armas posibles en este mundo (ver abajo)                                                                                                                                 |
| `items`             | Objetos personales que pueden aparecer junto a la escena y despistar                                                                                                         |
| `motives`           | Móviles fuertes; uno de ellos es el del culpable                                                                                                                             |
| `documents`         | `weak` (móviles débiles) y `neutral` (documentos sin importancia)                                                                                                            |
| `clueArt`           | Ilustraciones de las pistas genéricas: `report`, `testimony`, `ledger`, `document`                                                                                           |
| `openings`          | `arrivals` (llegada del detective) y `tensions` (cierre del prólogo)                                                                                                         |
| `night`             | Cómo avanza la noche: de 3 a 8 frases en orden, que el juego muestra con su hora a medida que se encuentran pistas                                                           |
| `epilogues`         | Escenas de la detención tras resolver el caso, con `{culprit}`, `{victim}` y `{scene}`                                                                                       |
| `look`              | Paleta (`bg`, `panel`, `line`, `accent`, `text`, `muted`, en hexadecimal) y efecto de fondo (`rain`, `snow`, `stars`, `dust`, `storm`), que también elige el sonido ambiente |

Todos los textos van en español. No llevan horas ni cifras (las pone el motor) ni los caracteres `<` `>`.

Cualquier elemento con ilustración admite `image` (ruta `/worlds/<id>/….webp`) e `imagePrompt` (descripción en inglés para generarla).

### Personajes

`id`, `name`, `role` (oficio sin artículo, en minúscula), `gender`, `age` (opcional), `personality` (cómo es y cómo habla), `appearance` (aspecto físico y ropa, coherente con `imagePrompt`), `image`, `imagePrompt` y `voice`.

Cualquier personaje puede resultar culpable, inocente con móvil, testigo o quien encuentra el cuerpo, según el caso. Por eso la personalidad y la voz no deben dar por hecho ningún papel en el crimen.

`voice` contiene las frases propias del personaje para cada tipo de declaración (ver `src/statements.mjs`). Cada tipo admite de una a seis frases con los marcadores obligatorios; si falta un tipo, se usan las frases genéricas. Los marcadores son:

| Marcador                   | Valor                                            |
| -------------------------- | ------------------------------------------------ |
| `{victim}`                 | Nombre de la víctima                             |
| `{name}`, `{role}`         | Nombre y oficio de quien habla                   |
| `{place}`                  | Lugar de su coartada, con artículo («la botica») |
| `{scene}`                  | Lugar del crimen, con artículo                   |
| `{partner}`                | Quien estaba con él o ella                       |
| `{from}`, `{to}`, `{time}` | Horas                                            |
| `{access}`                 | Lo que daba acceso al arma, con artículo         |
| `{record}`, `{guardian}`   | Los de `staff`                                   |
| `{item}`, `{mine}`, `{it}` | Objeto perdido con artículo, «mío/mía», «lo/la»  |

Con la inicial en mayúscula (`{Guardian}`, `{Item}`, `{It}`) el valor empieza por mayúscula.

| Tipo               | Cuándo lo dice                                                  | Obligatorios             |
| ------------------ | --------------------------------------------------------------- | ------------------------ |
| `alibi.claim`      | Su coartada (que puede ser falsa)                               | place, from, to          |
| `alibi.alone`      | Coartada sin testigos                                           | place, from, to          |
| `alibi.record`     | Coartada que consta en el registro; al salir encontró el cuerpo | place, from, to, victim  |
| `alibi.pair`       | Coartada con otra persona                                       | place, partner, from, to |
| `relation`         | Su relación con la víctima                                      | victim                   |
| `secret.culprit`   | Ante el documento con su móvil fuerte: lo admite sin confesar   | victim                   |
| `secret.weak`      | Ante un documento con un móvil débil                            | victim                   |
| `secret.neutral`   | Ante un documento sin importancia                               | —                        |
| `link.access`      | Podía llegar al arma, como otras personas                       | access                   |
| `link.none`        | No podía llegar al arma                                         | access                   |
| `timeline.culprit` | Le muestran que su coartada no se sostiene: duda, no confiesa   | scene                    |
| `timeline.alone`   | Admite que nadie le vio                                         | —                        |
| `timeline.record`  | Remite al registro                                              | record                   |
| `timeline.pair`    | Remite a quien vigilaba                                         | guardian                 |
| `seen.discovery`   | Cómo encontró el cuerpo                                         | victim, scene, time      |
| `seen.pair`        | Lo que vio con su compañía                                      | place, partner           |
| `seen.nothing`     | No vio nada                                                     | —                        |
| `object.own`       | El objeto junto a la puerta es suyo y lo perdió por la mañana   | item, scene              |
| `identity`         | Se presenta                                                     | name, role               |
| `social`           | Saludo o reacción                                               | —                        |
| `unknown`          | Pregunta que no sabe o no quiere contestar                      | —                        |

### Lugares

`id`, `name` (en minúscula salvo nombres propios: «Sala de navegación»), `article` (`el`, `la`, `los`, `las`), `description` (lo que se ve al entrar, de una a tres frases), `ambience` (una a tres frases de atmósfera, sin pistas ni detalles del crimen; el juego muestra una), `tags`, `image` e `imagePrompt`.

Las etiquetas habilitan armas que necesitan un lugar especial: `elevated` (caída), `life-support` (aire), `industrial` (brazo robótico, compuerta) y `cryogenic` (cápsula criogénica).

### Personal (`staff`)

| Campo      | Ejemplo                   | Frase en la que aparece                                                                                  |
| ---------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `guardian` | `el portero`              | «Según **el portero**, solo A, B y C tenían acceso a…», «**El portero** vigiló la puerta de la armería…» |
| `record`   | `el registro de entradas` | «**El registro de entradas** de la botica anota la entrada de…»                                          |
| `report`   | `Examen del sanador`      | Título de la pista con la causa de la muerte                                                             |

`guardian` y `record` llevan artículo y van en minúscula. Quien vigila no debe coincidir con ningún oficio del reparto.

### Armas

`method` es la mecánica (ver `src/method-catalog.mjs`):

`knife`, `blunt`, `rope`, `drink`, `revolver`, `shotgun`, `medicine`, `sword`, `crossbow`, `fall`, `artifact`, `alchemy`, `air`, `medical`, `power`, `laser`, `plasma`, `robot`, `hatch`, `cryo`.

Los demás campos son el texto:

| Campo             | Ejemplo                                       | Frase                                                                                                                                                                                                             |
| ----------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `Ballesta`                                    | Menú de la acusación                                                                                                                                                                                              |
| `cause`           | `Un virote de ballesta le atravesó el pecho.` | «**…** Sitúa la muerte hacia las 21:40.»                                                                                                                                                                          |
| `weapon`          | `la ballesta`                                 | «Junto al cuerpo apareció **la ballesta**. No estaba en el lugar donde se guarda habitualmente.»                                                                                                                  |
| `access`          | `la ballesta de caza`                         | «Según el portero, solo A, B y C tenían acceso a **…**», «Anotación del portero: solo A, B y C tenían permiso para usar **…**», «Sí, podía llegar a **…**». Si nombra un lugar, debe ser uno del mundo            |
| `seen` (opcional) | `el frasco de acónito`                        | «El portero recuerda haber visto **…** en su sitio a las 21:00.» Si falta, se usa `weapon`; hace falta cuando el arma no estaba guardada tal cual (la copa de un veneno)                                          |
| `device`          | `true`                                        | Si el arma es un mecanismo del lugar. Entonces: «Alguien manipuló a mano **(weapon)** en la torre. No queda ninguna marca que diga quién.» y «El portero revisó **(weapon)** a las 21:00 y todo estaba en orden.» |
| `phrase`          | `con la ballesta`                             | Desenlace: «A mató a V en la armería a las 21:30, **con la ballesta**.»                                                                                                                                           |

### Objetos perdidos (`items`)

`noun` (sin artículo: «guante de cetrería») y `gender` (`f`/`m`, para «un/una», «el/la», «mío/mía»).

En el juego aparecen así: «Junto a la puerta de la botica apareció un guante de cetrería que pertenece a A.» Más tarde lo explica una nota: «… pregunta si alguien ha visto el guante de cetrería que perdió esta mañana en la botica.»

### Móviles (`motives`)

Son dos frases: lo que hizo el culpable, empezando por «Había…», y lo que la víctima iba a hacer, con `{victim}`. Por ejemplo: «Había vendido a un armador rival las rutas de suministro. {victim} lo había descubierto y pensaba denunciarlo ante el consejo al día siguiente.»

Aparecen así:

- «Entre los papeles de V hay notas sobre A: **había vendido…**»
- «Carta sin enviar de V: escribe que A **había vendido…**»

Por eso la primera frase debe leerse bien detrás de «A …».

### Documentos (`documents`)

Llevan `title` y `text` con `{victim}` y `{person}`:

- **`weak`**: un roce con la víctima que no basta para matar (una deuda pequeña, una amonestación, una herencia recortada).
- **`neutral`**: papeles corrientes que no apuntan a nadie.

El jugador debe poder distinguir uno fuerte de uno débil.

### Prólogos (`openings`)

- **`arrivals`**: el detective llega al lugar (segunda persona, de dos a cuatro frases).
- **`tensions`**: cierre antes de empezar a investigar.

Entre ambos el juego intercala el aviso con la víctima, la sala y la hora. Ninguno nombra personas, armas ni detalles del crimen, porque sirven para cualquier caso.

## Ilustraciones

Se generan una sola vez, en el ordenador de desarrollo, y el juego lleva solo los WebP. Para generarlas:

```bash
node tools/generate-art.mjs [<id> …] [--force] [--jobs 3]
```

El script usa la herramienta de imágenes de Codex con la cuenta de ChatGPT con la que esté abierto el CLI `codex`. El modelo se elige con `CODEX_IMAGE_MODEL` (por defecto `gpt-6-astra`). El prompt de cada imagen es su `imagePrompt` más `art.style` del mundo.

Los PNG originales quedan en `work/art/<id>/` y los WebP en `public/worlds/<id>/`:

| Tipo                    | Formato  | Ancho   |
| ----------------------- | -------- | ------- |
| Retratos                | Cuadrado | 768 px  |
| Lugares                 | 3:2      | 1280 px |
| Armas, objetos y pistas | Cuadrado | 640 px  |

Las imágenes que ya existen no se repiten. Para rehacer una, borra su WebP y su PNG, o usa `--force`.

## Epílogos

Cualquiera de los cinco puede ser culpable, así que los epílogos no usan palabras con género que se refieran a `{culprit}` («detenido», «él», «ella», «callada»…): se escriben de forma que valgan para todos («{culprit} no opone resistencia», «a {culprit} le tiemblan las manos»). Tampoco nombran el arma, el móvil ni la hora: el juego los muestra justo después.
