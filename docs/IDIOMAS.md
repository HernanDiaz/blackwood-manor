# Idiomas

El juego está en español (`es`) y en inglés (`en`). La interfaz elige el idioma del teléfono o
del navegador, y se puede cambiar en el menú.

## Qué lleva cada idioma

- **Pantallas**: `src/ui-text.mjs`, con todos los textos de `public/app.mjs` en cada idioma.
- **Motor**: cada módulo tiene sus frases por idioma (`prototype-engine.mjs`,
  `interrogation.mjs`, `guidance.mjs`, las frases por defecto de los sospechosos en
  `statements.mjs`). El idioma lo decide el caso (`lang` del expediente; sin él, español).
- **Frases con que el generador une los datos de un mundo**: `src/case-phrases.mjs`.
- **Mundos**: `public/worlds/<id>.json` (español) y `public/worlds/<id>.en.json` (inglés).
- **Casos clásicos**: `public/cases/<file>.json` y `public/cases/<file>.en.json`, con su índice
  `index.json` / `index.en.json`.
- **Interrogatorio**: las reglas de cada idioma, las palabras que el clasificador cambia por
  ARMA/OBJETO/SALA/HORA (`src/question-router.mjs`), y un modelo entrenado con preguntas de ese
  idioma: `node scripts/train-question-router.mjs` escribe `src/question-router-model.json` y
  `node scripts/train-question-router.mjs en`, `src/question-router-model.en.json`. Las preguntas
  de entrenamiento y de prueba están en `test/question-bank*.mjs` (`.en.mjs` en inglés).

El editor de casos sigue el idioma del juego: sus textos, los casos clásicos que abre y los que
genera. Los mensajes de validación de mundos y expedientes se escriben en español en el motor y
`src/validation-text.mjs` los pasa al inglés al mostrarlos. El modelo local
del servidor (`PILOTO.cmd`) solo habla español: en inglés el juego responde siempre con las reglas
y el clasificador del navegador.

Un mundo y su traducción generan, con la misma semilla, el mismo caso: mismo culpable, mismas
pistas en las mismas salas. Por eso una partida puede cambiar de idioma a mitad (menú, botón
«English» / «Español»): el caso generado se vuelve a crear desde su semilla y un caso clásico se
busca entre los clásicos del otro idioma, y se conserva todo lo encontrado. Un caso importado que
no tiene versión en el otro idioma sigue en el suyo.

## Reglas para traducir un mundo o un caso (inglés)

El archivo traducido es una copia del original con los textos en inglés. Se añade
`"lang": "en"` justo después de `"version"`.

**No se toca**: `format`, `version`, `id` y todos los identificadores (`p1`…, `r1`…, `c1`…),
`method`, `gender`, `age`, `device`, `tags`, `image`, `imagePrompt`, `art`, `look`, los objetos
`fact`, los minutos, `origin`, y el orden de todas las listas.

**Mismo número de elementos** en cada lista (voces, variantes, prólogos, documentos, móviles…):
el generador sortea entre ellas y, con la misma semilla, tiene que sacar lo mismo en los dos
idiomas.

**Marcadores**: se conservan todos los de cada texto (`{victim}`, `{person}`, `{p1}`, `{r3}`,
`{place}`, `{scene}`, `{partner}`, `{from}`, `{to}`, `{time}`, `{access}`, `{record}`,
`{guardian}`, `{item}`, `{mine}`, `{it}`, `{name}`, `{role}`, `{culprit}`). Con mayúscula
(`{Item}`, `{Guardian}`) el valor empieza en mayúscula: se usa al principio de una frase. En
inglés `{mine}` vale «mine» e `{it}` vale «it».

**Lugares**: `article` es `"the"`. `name` va con la primera letra en mayúscula y el resto como
en una frase (`"Study"`, `"Navigation bridge"`); dentro de una frase el juego escribe «the study».
Si el nombre lleva un nombre propio que no debe ir en minúscula, se añade `"phrase"` con la forma
completa dentro de una frase: `"phrase": "the Throne Room of Amber"`.

**Armas**: `label` es un nombre corto para el desplegable (`"Letter opener"`); `weapon`,
`access` y `seen` llevan artículo (`"the ivory letter opener"`); `phrase` dice cómo se usó
(`"with the ivory letter opener"`); `cause` son frases completas del informe médico.

**Objetos perdidos**: `noun` sin artículo y en minúscula (`"silver cigarette case"`).

**Personal**: `guardian` y `record` con artículo y en minúscula (`"the housekeeper"`,
`"the key book"`); `report` es el título del informe (`"County coroner's report"`).

**Móviles**: empiezan por un verbo en pasado perfecto con mayúscula y se leen detrás del nombre
del culpable: «…writes that Elena Blackwood **had forged** a signature…». Ejemplo:
`"Had forged a signature on several cheques… {victim} had found out…"`.

**Oficios** (`role`): sin artículo y en minúscula (`"heiress"`, `"owner of Blackwood Manor"`).
Las frases genéricas dicen «I'm the {role}».

**Voces**: cada personaje conserva su carácter. Los sospechosos hablan al detective de «you»;
Blackwood Manor y Villa Bellavista en inglés británico de época, el resto en inglés británico
neutro.

**Longitud**: cada texto, como mucho un 20 % más largo que el original.
