# Blackwood Manor y Mundos

Juego de detectives en español que funciona sin conexión en el propio equipo. Tiene dos modos:

- **Blackwood Manor** (`http://127.0.0.1:4173`): cinco casos escritos a mano en una mansión inglesa, uno por cada posible culpable. Ver [docs/VARIANTES.md](docs/VARIANTES.md); la solución está en [docs/CASE-SPOILERS.md](docs/CASE-SPOILERS.md).
- **Mundos** (`http://127.0.0.1:4173/prototype/index.html`): cuatro mundos (una estación orbital, la corte de Ámbar, el castillo de Torre Umbría en el siglo XIV y Villa Bellavista en 1934) en los que cada investigación genera un caso nuevo: culpable, arma, escena, móviles, coartadas y pistas.

## Ejecutar

Requiere Node.js 22 o posterior; no necesita `npm install`.

- `PILOTO.cmd` (o `node local-play.mjs qwen`): arranca el juego con los modelos locales (Qwen para las preguntas que nadie más sabe clasificar y el clasificador Laya si está entrenado).
- `JUGAR.cmd` (o `npm start`): el juego sin modelos. Los interrogatorios usan el clasificador estadístico incluido.
- Ctrl+C cierra el servidor y los modelos que arrancó el lanzador. `PORT` cambia el puerto (4173 por defecto).

## Cómo se juega en Mundos

Explora las seis salas, recoge las pistas e interroga a los cinco sospechosos con tus propias palabras. Varias personas tienen un móvil y varias pudieron llegar al arma; solo una reúne además una coartada que no se sostiene. Para ganar hay que acusar a esa persona con el arma y la sala correctas, y adjuntar una prueba de cada cosa.

La partida se guarda en el navegador. **Exportar partida** guarda el progreso; **Exportar caso** guarda solo el caso (el «expediente»), que se puede editar e importar.

## Cómo está hecho

| Parte | Dónde | Documentación |
|---|---|---|
| Reglas comunes de investigación | `src/investigation.mjs` | — |
| Mundos: reparto, lugares, armas, móviles, voces, prólogos e ilustraciones | `public/worlds/`, `src/world-file.mjs`, `tools/check-world.mjs` | [docs/MUNDOS.md](docs/MUNDOS.md) |
| Formato de los casos («expedientes») y comprobación de que el culpable se puede deducir | `src/case-file.mjs` | [docs/EXPEDIENTES.md](docs/EXPEDIENTES.md) |
| Generador de casos | `src/case-generator.mjs`, `src/method-catalog.mjs` | [docs/EXPEDIENTES.md](docs/EXPEDIENTES.md) |
| Frases de los sospechosos y clasificación de preguntas | `src/statements.mjs`, `src/question-router.mjs` | [docs/CLASIFICADOR.md](docs/CLASIFICADOR.md) |
| Blackwood Manor | `src/engine.mjs`, `src/cases.mjs` | [docs/VARIANTES.md](docs/VARIANTES.md) |
| Servidor e interfaz | `server.mjs`, `public/` | — |

Los interrogatorios no generan texto: clasifican la pregunta en un tema y eligen una frase escrita del personaje. Las horas, lugares y nombres los pone el motor, así que ninguna respuesta puede cambiar un hecho.

## Pruebas

`npm test` ejecuta las pruebas automáticas. Los scripts de `benchmarks/` miden la clasificación de preguntas y otras comparativas; algunos necesitan los modelos locales.

## Historial

Los informes de pruebas y las versiones anteriores (incluido el antiguo modo de «mundo libre» generado con Qwen, retirado) están en [docs/historial/](docs/historial/). El juego está en desarrollo: los formatos de mundo, expediente y partida son la versión 1 y no se mantiene compatibilidad con guardados anteriores.

## Límites

- La solución del caso viaja al navegador; no está pensado para impedir trampas.
- El servidor es para uso local, sin autenticación.
- La versión móvil está por hacer: la idea es empaquetar el juego con los mundos preparados y el clasificador estadístico (unos 20 MB), sin modelos de lenguaje.
- Las ilustraciones de los mundos están por generar: cada elemento tiene ya su `imagePrompt` y su ruta en `public/worlds/<id>/`; mientras faltan, la interfaz las oculta.
