# Blackwood · Casos de detectives

Juego de detectives en español y en inglés que funciona sin conexión. Se abre en `http://127.0.0.1:4173`.

Hay cinco mundos: Blackwood Manor en 1924, una estación orbital, la corte de Ámbar, el castillo de Torre Umbría en el siglo XIV y Villa Bellavista en 1934. En cada investigación se genera un caso nuevo: culpable, arma, escena, móviles, coartadas y pistas.

El juego elige el idioma del teléfono o del navegador, y se cambia en el menú, incluso a mitad de una partida: ver [docs/IDIOMAS.md](docs/IDIOMAS.md).

También están los cinco casos clásicos de Blackwood, escritos a mano. Su diseño está en [docs/VARIANTES.md](docs/VARIANTES.md) y la solución del primero en [docs/CASE-SPOILERS.md](docs/CASE-SPOILERS.md).

## Ejecutar

Requiere Node.js 22 o posterior; no necesita `npm install`.

- `PILOTO.cmd` (o `node local-play.mjs qwen`): arranca el juego con los modelos locales (Qwen para las preguntas que nadie más sabe clasificar y el clasificador Laya si está entrenado).
- `JUGAR.cmd` (o `npm start`): el juego sin modelos. Los interrogatorios usan el clasificador estadístico incluido.
- Ctrl+C cierra el servidor y los modelos que arrancó el lanzador. `PORT` cambia el puerto (4173 por defecto).

## Versión sin servidor (móvil)

`npm run build` genera `dist/`: el juego como archivos estáticos que funcionan sin servidor. El interrogatorio se resuelve en el navegador con el clasificador estadístico y las reglas. Un *service worker* guarda todos los archivos, así que tras la primera carga funciona también sin conexión, y el manifiesto permite instalarlo como app. `dist/` es también lo que empaquetan las apps de Android e iPhone con Capacitor: ver [docs/MOVIL.md](docs/MOVIL.md). `npm run preview` lo sirve en http://127.0.0.1:4174 para probarlo.

Con el servidor local (`PILOTO.cmd`), el juego solo le consulta las preguntas que no sabe clasificar, y solo si tiene un modelo local.

## Cómo se juega

Explora las seis salas, recoge las pistas e interroga a los cinco sospechosos con tus propias palabras. Varias personas tienen un móvil y varias pudieron llegar al arma; solo una reúne además una coartada que no se sostiene. Para ganar hay que acusar a esa persona con el arma correcta y adjuntar tres pruebas: una de su móvil, una de su acceso al arma y una que desmienta su coartada.

Cada investigación se crea en uno de los cinco mundos y con una dificultad (fácil, media o difícil). También se pueden jugar los cinco casos clásicos de Blackwood, escritos a mano (`public/cases/`). Durante la partida ayudan:

- **El cuaderno de deducción**, en el Tablero.
- **Las pistas escalonadas**, cada vez más concretas.
- **Enseñar pruebas a los sospechosos.**
- **La lectura en voz alta** y **el sonido ambiente** (lluvia, viento, mar, máquinas…), hechos en el navegador sin archivos.

Cada mundo tiene su paleta y un efecto de fondo (lluvia, nieve, estrellas, polvo dorado o temporal), una frase de atmósfera en cada sala, el paso de la noche y un epílogo al resolver el caso. Las pruebas llevan su número de orden y las ilustraciones aparecen como fotografías sujetas con un clip.

La pantalla de inicio guarda el historial de casos resueltos. El **editor de casos** (`/editor.html`) abre el caso de la partida, un caso clásico, un archivo o uno nuevo. Permite cambiar nombres y textos, comprueba que el caso tiene una sola solución y lo descarga o lo juega.

La partida se guarda en el navegador. En el menú, **Guardar una copia** descarga la partida para seguirla en otro dispositivo y **Abrir una copia** la carga (también acepta un caso). Para sacar un caso y editarlo está el editor de casos.

## Cómo está hecho

| Parte | Dónde | Documentación |
|---|---|---|
| Reglas comunes de investigación | `src/investigation.mjs` | — |
| Mundos: reparto, lugares, armas, móviles, voces, prólogos e ilustraciones | `public/worlds/`, `src/world-file.mjs`, `tools/check-world.mjs` | [docs/MUNDOS.md](docs/MUNDOS.md) |
| Formato de los casos («expedientes») y comprobación de que el culpable se puede deducir | `src/case-file.mjs` | [docs/EXPEDIENTES.md](docs/EXPEDIENTES.md) |
| Generador de casos | `src/case-generator.mjs`, `src/method-catalog.mjs` | [docs/EXPEDIENTES.md](docs/EXPEDIENTES.md) |
| Frases de los sospechosos y clasificación de preguntas | `src/statements.mjs`, `src/interrogation.mjs`, `src/question-router.mjs` | [docs/CLASIFICADOR.md](docs/CLASIFICADOR.md) |
| Casos clásicos de Blackwood | `public/cases/` | [docs/VARIANTES.md](docs/VARIANTES.md) |
| Ayudas: cuaderno de deducción y pistas escalonadas | `src/guidance.mjs` | — |
| Interfaz y editor de casos | `public/app.mjs`, `public/editor.mjs` | — |
| Servidor local (opcional) y modelos | `server.mjs`, `src/prototype-llm.mjs`, `local-play.mjs` | — |

Los interrogatorios no generan texto: clasifican la pregunta en un tema y eligen una frase escrita del personaje. Las horas, lugares y nombres los pone el motor, así que ninguna respuesta puede cambiar un hecho.

## Pruebas

`npm test` ejecuta las pruebas automáticas. Los scripts de `benchmarks/` miden la clasificación de preguntas y otras comparativas; algunos necesitan los modelos locales.

## Historial

Los informes de pruebas y las versiones anteriores (incluidos el antiguo modo de «mundo libre» generado con Qwen y el motor original de Blackwood, retirados) están en [docs/historial/](docs/historial/). El juego está en desarrollo: los formatos de mundo, expediente y partida son la versión 1 y no se mantiene compatibilidad con guardados anteriores.

## Límites

- La solución del caso viaja al navegador; no está pensado para impedir trampas.
- El servidor es para uso local, sin autenticación.
- Las apps de Android e iPhone están hechas con Capacitor (`android/`, `ios/`, [docs/MOVIL.md](docs/MOVIL.md)). El APK de Android ya se ha generado y probado; la de iPhone está preparada y falta compilarla y firmarla en un Mac con Xcode.
- Las ilustraciones de los mundos se generan una vez, fuera del juego, con `node tools/generate-art.mjs` (ver [docs/MUNDOS.md](docs/MUNDOS.md)); el juego solo lleva los WebP.
