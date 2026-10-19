# Formato de expediente (`mundos-expediente`)

Cada investigación de Mundos es un **expediente**: un JSON con todo el caso. Se genera a partir de un mundo (ver [MUNDOS.md](MUNDOS.md)), pero no lo necesita para jugarse. Lleva el reparto, los lugares, las armas que ofrece la acusación, el crimen, el prólogo, las pistas y lo que puede decir cada persona. Por eso un expediente se puede exportar, editar a mano o con un editor, compartir e importar.

- **Exportar caso** descarga el expediente sin el progreso del jugador.
- **Exportar partida** descarga una partida (`mundos-partida`): el expediente más el progreso.
- **Importar** acepta las dos. Un expediente empieza una investigación nueva y una partida continúa donde estaba.

El código está en:

- `src/case-file.mjs`: formato, validación y comprobación lógica.
- `src/case-generator.mjs`: generador.
- `src/prototype-engine.mjs`: partidas.

## Campos

| Campo | Contenido |
|---|---|
| `format`, `version` | `"mundos-expediente"`, `1` |
| `world` | Mundo del que procede (`villa-bellavista`…). Es informativo: el caso se juega sin él |
| `title` | Título |
| `victim` | `{ name, role, gender }` |
| `people` | Cinco personajes `p1`…`p5`: `name`, `role`, `gender` (`f`/`m`) y, opcionalmente, `personality` e `image` |
| `rooms` | De 4 a 8 lugares `r1`…: `name`, `article`, `description`, `tags` e `image` (opcional) |
| `weapons` | Armas que ofrece la acusación: `{ method, label }`. Debe incluir la del crimen |
| `crime` | `culprit`, `method` (mecánica de `method-catalog.mjs`), `weapon` («el atizador de bronce»), `phrase` («con el atizador de bronce»), `scene`, los minutos del día `crimeMinute`, `exitMinute`, `deathMinute` y `discoveryMinute`, y el texto `motive` |
| `opening` | Prólogo: `arrival` y `tension` |
| `alibis` | Lo que declara cada persona: `person`, `room`, `from`, `to`, `claim` |
| `clues` | De 6 a 30 pistas: `id` (`c1`…), `room`, `title`, `text`, `image` (opcional) y un `fact` |
| `facts` | Lo que puede decir cada persona: `{ id, kind?, text, variants?, requires? }` |
| `origin` | Opcional: `generator` y `seed` |

En `facts`:

- `id` es el tema: `alibi`, `motive`, `secret`, `link`, `timeline`, `seen`, `object`, `identity`, `social` o `unknown`.
- `variants` son formas alternativas de decir lo mismo, que el interrogatorio va rotando.
- `requires` es la pista que desbloquea la declaración.

En los textos (`motive`, `claim`, títulos y textos de pistas, declaraciones) se pueden usar marcadores:

- `{victim}`: la víctima.
- `{p1}`…`{p5}`: los personajes.
- `{r1}`…: los lugares, con su artículo (`{r2}` → «la biblioteca»).

Así, renombrar a alguien en `people` cambia todos sus textos. El generador usa siempre marcadores.

Las imágenes solo pueden ser rutas locales `.webp` bajo `/worlds/`. Los textos no admiten `<` ni `>`. Al importar se descartan los campos desconocidos. El `id` del caso se calcula a partir del contenido, así que cualquier cambio da un caso distinto; una partida cuyo caso se ha modificado se rechaza.

## Hechos de las pistas

El texto de una pista es para el jugador; el `fact` es lo que entiende el motor. La comprobación lógica usa solo los hechos.

| `type` | Significado |
|---|---|
| `cause` | Causa de la muerte: `method`, `room`, `minute` |
| `weapon` | Arma hallada: `method`, `room` |
| `discovery` | Quién encontró el cuerpo: `person`, `room`, `minute` |
| `motive` | `person` tenía un móvil |
| `access` | `people` podían llegar al arma del `method` |
| `presence` | `people` estaban en `room` de `from` a `to`. Con `exclusive: true`, nadie más estuvo allí; con `people: []`, el lugar estaba vacío |
| `herring` | Pista engañosa contra `person` |
| `explains` | Explica la pista engañosa `clue` |
| `note` | Contexto sin valor lógico |

## Qué comprueba `analyzeCase`

- La cronología es posible: el hallazgo es posterior al crimen, a la muerte y a la salida del culpable.
- La escena tiene lo que el método necesita (una caída necesita altura), y el arma está entre las de la acusación.
- Las pistas de causa, arma y acceso hablan del método del crimen.
- Cada coartada cubre la hora del crimen y no está en la escena.
- Una coartada queda **confirmada** si un hecho `presence` sitúa a la persona en el lugar que declaró durante el crimen. Queda **desmentida** si un `presence` exclusivo de ese lugar no la incluye, o si otro la sitúa en un lugar distinto. Ningún inocente puede quedar desmentido.
- **Sospechosos** = con móvil ∩ con acceso al arma ∩ sin coartada confirmada. Debe salir exactamente el culpable, y su coartada debe estar desmentida.
- Toda pista engañosa tiene una explicación.

Para ganar, la acusación necesita persona, arma y lugar correctos, y una pista de cada grupo de prueba: móvil del culpable, acceso del culpable y coartada desmentida.

## Lo que produce el generador

Cada persona tiene un papel fijo en la lógica; quién hace cada papel se decide al azar:

| Papel | Lo que lo define |
|---|---|
| Culpable | Motivo fuerte, acceso al arma y una coartada que una pista desmiente |
| Sin testigos | Un motivo débil y nadie que confirme su coartada, pero nunca acceso al arma |
| Registro | Su coartada consta en el registro de un lugar; es quien encuentra el cuerpo |
| Pareja | Dos personas que se confirman entre sí ante quien vigila la puerta |

La dificultad (`origin.difficulty`) decide cuántos inocentes comparten motivo y acceso:

| Dificultad | Con motivo | Con acceso al arma | Pistas engañosas |
|---|---|---|---|
| Fácil | 2 | 2 | 1 |
| Media | 3 | 3 | 1 |
| Difícil | 4 | 4 | 2 |

La coartada del culpable cae de una de estas formas:

- Quien vigila guardó la puerta del lugar que declara, y dentro estaban otros.
- El lugar estuvo cerrado con llave.
- El registro de ese lugar solo anota a otra persona.
- En la dificultad fácil, quien vigila lo vio entrar en la escena.

Cada tipo de pista tiene varias redacciones. Toda pista engañosa (un objeto personal junto a la escena) tiene una nota que la explica. Ninguna pista nombra al culpable ni afirma una conclusión.

## Límites conocidos

- La comprobación es lógica, no editorial: no detecta frases poco naturales ni contradicciones que solo estén en el texto. Para eso, `node tools/check-world.mjs` muestra cómo quedan los textos de un mundo.
- La solución viaja en el expediente; no está pensado para impedir trampas.
