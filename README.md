# Blackwood Manor y Mundos

Juego de detectives en español que funciona sin conexión en el propio equipo. Tiene dos modos:

- **Blackwood Manor** (`http://127.0.0.1:4173`): cinco casos escritos a mano en una mansión inglesa, uno por cada posible culpable. Ver [docs/VARIANTES.md](docs/VARIANTES.md); la solución está en [docs/CASE-SPOILERS.md](docs/CASE-SPOILERS.md).
- **Mundos** (`http://127.0.0.1:4173/prototype/index.html`): cinco mundos (Blackwood Manor en 1924, una estación orbital, la corte de Ámbar, el castillo de Torre Umbría en el siglo XIV y Villa Bellavista en 1934) en los que cada investigación genera un caso nuevo: culpable, arma, escena, móviles, coartadas y pistas.

## Ejecutar

Requiere Node.js 22 o posterior; no necesita `npm install`.

- `PILOTO.cmd` (o `node local-play.mjs qwen`): arranca el juego con los modelos locales (Qwen para las preguntas que nadie más sabe clasificar y el clasificador Laya si está entrenado).
- `JUGAR.cmd` (o `npm start`): el juego sin modelos. Los interrogatorios usan el clasificador estadístico incluido.
- Ctrl+C cierra el servidor y los modelos que arrancó el lanzador. `PORT` cambia el puerto (4173 por defecto).

## Versión sin servidor (móvil)

`npm run build` genera `dist/`: Mundos como archivos estáticos que funcionan sin servidor. El interrogatorio se resuelve en el navegador con el clasificador estadístico y las reglas. Un *service worker* guarda todos los archivos, así que tras la primera carga funciona también sin conexión, y el manifiesto permite instalarlo como app. `dist/` es lo que empaquetaría una app móvil (por ejemplo con Capacitor) o cualquier alojamiento estático. `npm run preview` lo sirve en http://127.0.0.1:4174 para probarlo.

Con el servidor local (`PILOTO.cmd`), el juego solo le consulta las preguntas que no sabe clasificar, y solo si tiene un modelo local.

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
- La app móvil está por empaquetar: `dist/` ya funciona sin servidor ni conexión.
- Las ilustraciones de los mundos se generan una vez, fuera del juego, con `node tools/generate-art.mjs` (ver [docs/MUNDOS.md](docs/MUNDOS.md)); el juego solo lleva los WebP.
