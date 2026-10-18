# Expedientes: formato de los casos del prototipo

Cada investigación del prototipo de mundos es un **expediente**: un JSON con todo el caso. La partida guardada lo incluye en `state.case`, y el botón **Exportar caso** lo descarga sin el progreso del jugador. **Importar** acepta tanto un expediente (empieza una investigación nueva) como una partida (continúa donde estaba).

Los mundos preparados, los mundos libres y un caso escrito a mano usan el mismo formato. El código está en `src/case-file.mjs` (formato, validación y comprobación lógica) y `src/case-generator.mjs` (generador).

## Campos

| Campo | Contenido |
|---|---|
| `format`, `version` | `"mundos-expediente"`, `1` |
| `title`, `setting` | Título; ambientación `scifi`, `noir`, `medieval` o `fantasy` (decide los métodos posibles y el estilo de las imágenes) |
| `description`, `visualStyle`, `rules`, `label` | Opcionales. Con `description` el caso se trata como mundo libre |
| `victim` | `{ name, role }` |
| `people` | Cinco personajes `p1`…`p5`: `name`, `role`, y opcionalmente `personality`, `image`, `imagePrompt` |
| `rooms` | De 4 a 8 lugares `r1`…: `name`, `description`, y opcionalmente `tags`, `image`, `imagePrompt` |
| `crime` | `culprit`, `method` (id del catálogo de `method-catalog.mjs`), `scene`, minutos del día `crimeMinute < exitMinute < discoveryMinute` y `deathMinute`, y el texto `motive` |
| `alibis` | Lo que declara cada persona: `person`, `room`, `from`, `to`, `claim` |
| `clues` | De 6 a 30 pistas: `id` (`c1`…), `room`, `title`, `text`, opcionalmente `image`/`imagePrompt`, y un `fact` |
| `facts` | Lo que puede decir cada persona en el interrogatorio: `{ id, text, requires? }`. `requires` es la pista que lo desbloquea. Temas: `alibi`, `motive`, `secret`, `link`, `timeline`, `seen`, `object` |

Las imágenes solo pueden ser rutas locales `.webp` bajo `/prototype/`, `/lab/` o `/assets/`. Al importar se descartan los campos desconocidos. El `id` del caso se calcula a partir del contenido, así que cualquier cambio crea un caso distinto.

## Hechos de las pistas

El texto de una pista es para el jugador; el `fact` es lo que entiende el motor. La comprobación lógica usa solo los hechos.

| `type` | Significado |
|---|---|
| `cause` | Causa de la muerte: `method`, `room`, `minute` |
| `weapon` | Arma hallada: `method`, `room` |
| `discovery` | Quién encontró el cuerpo: `person`, `room`, `minute` |
| `motive` | `person` tenía un móvil |
| `access` | `people` podían llegar al arma del `method` |
| `presence` | `people` estaban en `room` de `from` a `to`. Con `exclusive: true`, nadie más estuvo allí (con `people: []`, el lugar estaba vacío) |
| `herring` | Pista engañosa contra `person` |
| `explains` | Explica la pista engañosa `clue` |
| `note` | Contexto sin valor lógico |

## Qué comprueba `analyzeCase`

- Cronología posible: el hallazgo es posterior al crimen, a la muerte y a la salida del culpable.
- El método existe en esa ambientación y en esa escena, y las pistas de causa, arma y acceso hablan de él.
- Cada coartada cubre la hora del crimen y no está en la escena.
- Una coartada queda **confirmada** si un hecho `presence` sitúa a la persona en el lugar que declaró durante el crimen, y **desmentida** si un `presence` exclusivo de ese lugar no la incluye o si otro la sitúa en un lugar distinto. Ningún inocente puede quedar desmentido.
- **Sospechosos** = con móvil ∩ con acceso al arma ∩ sin coartada confirmada. Debe salir exactamente el culpable, y su coartada debe estar desmentida.
- Toda pista engañosa tiene una explicación.

Para ganar, la acusación necesita persona, método y lugar correctos y una pista de cada grupo de prueba: móvil del culpable, acceso del culpable y coartada desmentida.

## Lo que produce el generador (dificultad media)

- Móvil: el culpable y dos inocentes (deuda, despido, testamento o queja).
- Acceso al arma: el culpable y dos inocentes, uno de ellos también con móvil.
- Coartadas: dos inocentes confirmados entre sí por un vigilante, uno por un registro y uno sin testigos. El culpable declara estar en un lugar que una pista demuestra vacío o ocupado solo por otros.
- Una pista engañosa (un objeto personal de un inocente junto a la escena) y la nota que la explica.
- Ninguna pista nombra al culpable ni afirma una conclusión. Cada inocente cumple como mucho dos de las tres condiciones.

## Partidas anteriores

Las partidas guardadas antes de los expedientes (versión 1) se reconstruyen al abrirlas con el generador antiguo (`src/legacy-prototype-case.mjs`) y se convierten. Conservan pistas encontradas, notas, conversación, resultado e imágenes, y se guarda una copia en `blackwood-orbital-prototype-v1-v1-backup`. Esos casos mantienen su diseño antiguo de pistas; solo las investigaciones nuevas usan el generador nuevo.

## Límites conocidos

- El nombre de la víctima y de los personajes va escrito dentro de los textos: si se renombra a alguien en un expediente, hay que cambiar también sus textos.
- Un expediente importado no genera imágenes propias; usa las del archivo o las genéricas.
- La comprobación es lógica, no editorial: no detecta frases poco naturales ni contradicciones que solo estén en el texto.
