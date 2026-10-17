# Blackwood Manor — La última noche

MVP jugable en español con cinco variantes escritas de un misterio: cinco sospechosos, seis habitaciones, dieciocho pistas por caso, interrogatorios, secretos condicionados a pruebas, tablero, notas, inventario, acusación y guardado. Cada posible culpable protagoniza una variante. Véase VARIANTES.md para el alcance sin spoilers.

## Ejecutar

Requiere Node.js 22 o posterior. El proyecto está en E:\2026 blackwood manor. No necesita npm install.

- PILOTO.cmd: inicia Qwen3.5-2B local y el juego usando los modelos y el motor ya descargados. También: node local-play.mjs qwen.
- JUGAR.cmd o npm start: juego con respuestas del motor, sin cargar un modelo.
- Abrir http://127.0.0.1:4173. Ctrl+C cierra el servidor; el lanzador local también cierra el modelo que inició.
- Para un puerto de aplicación diferente: establecer PORT antes de arrancar. El modelo local usa 1235; la aplicación se limita al equipo local.

No abrir index.html directamente: los interrogatorios requieren el servidor. No se usan claves ni servicios externos para el piloto local. La rama opcional de API del servidor no está configurada en este piloto.

## Cómo jugar

Inspecciona habitaciones, recoge pruebas, interroga y contrasta las versiones de los sospechosos. Fija pistas en el tablero, escribe notas y acusa indicando persona, método, lugar y al menos tres pruebas pertinentes. Si fallas puedes reabrir la investigación sin perder hallazgos.

Una nueva partida elige una de las cinco variantes, excluyendo la inmediatamente anterior. Conserva el estilo de conversación seleccionado. Recargar, exportar o importar mantiene la variante y su revisión. Los guardados anteriores a las variantes conservan el caso original, no cambian de solución. Si ya estaba abierta una versión anterior de la interfaz, recargar antes de empezar una nueva investigación.

El guardado es localStorage del navegador; no hay cuenta ni sincronización. Exportar permite guardar un JSON y recuperarlo con Importar. Para reemplazar una partida mediante Reiniciar o Nueva partida se requiere pulsar la confirmación del propio juego.

## Diálogo e imágenes

El modo preciso selecciona formulaciones revisadas del caso. La conversación libre es experimental: Qwen redacta usando solo recuerdos autorizados y la revisión exige respaldo por frase; si se rechaza, el motor responde con el mismo personaje y sus hechos. No se garantiza la corrección semántica general de la prosa libre. Las respuestas antiguas experimentales no se reutilizan como autoridad factual.

Elena es orgullosa; Víctor reservado y analítico; Clara directa y prudente; Arthur formal; Julián impaciente y coloquial. Las voces también se mantienen en las respuestas de apoyo. Los secretos requieren la prueba correspondiente. Un testimonio inicial puede contener una mentira deliberada del caso, que otra prueba permite confrontar: no equivale a una invención autorizada del modelo.

Las 29 imágenes locales cubren cinco personajes, seis escenarios y dieciocho pistas. Se conservan como conjuntos versionados con hashes; no se generan al arrancar o preguntar. Se reutilizan en las variantes y su significado probatorio depende del texto del caso. Son ilustraciones orientativas, no reconstrucciones forenses.

## Arquitectura

- src/engine.mjs: estado, investigación, guardado y acusación sobre la variante activa.
- src/cases.mjs y src/legacy-case.mjs: casos, cronologías, declaraciones, secretos, pruebas y desenlaces. validateCase audita la estructura y el grafo de deducción.
- src/local-llm.mjs: clasificación limitada a temas autorizados y catálogo de formulaciones.
- src/conversation.mjs, src/dialogue-policy.mjs y src/personalities.mjs: generación experimental, revisión y voces.
- src/visuals.mjs y public/assets/: manifiestos y recursos visuales persistentes.
- server.mjs: servidor local y endpoint de interrogatorio. public/: interfaz adaptable a móvil, sin dependencias de frontend.

Datos y motor están separados para añadir más casos y reutilizar la lógica en futuras aplicaciones móviles.

## Validación

npm test ejecuta 37 pruebas con Node Test Runner, sin paquetes externos ni llamadas pagadas. Incluyen guardado, secretos, diálogos simulados, imágenes, personalidades y flujos completos de los cinco casos. Se comprueban 450 combinaciones de persona/método/habitación, con una solución ganadora por caso y pruebas suficientes. También se rechazan acusaciones que omiten una categoría de evidencia.

node benchmarks/test-five-cases.mjs prueba los cinco casos con el Qwen local activo y guarda benchmarks/results/five-cases-dialogue.json. En el sondeo registrado las cinco respuestas correspondieron a su variante mediante el catálogo de apoyo. No demuestra la fiabilidad general del texto libre. Los benchmarks históricos fijan explícitamente el caso original para conservar sus comparaciones.

En el navegador se completó una variante: seis habitaciones, dieciocho pistas, acusación y desenlace. Después se comprobó una nueva variante diferente y su persistencia al recargar, usando un origen separado sin tocar la partida del jugador.

## Antes de producción

Quedan ampliar casos y métodos, probar dificultad con jugadores, mejorar seguimiento conversacional y calidad de la prosa libre, empaquetar y firmar para iOS/Android y probar dispositivos reales, accesibilidad y sincronización. La web actual no es una aplicación móvil instalada ni una PWA sin conexión.

La verdad del caso y el estado son visibles y modificables en el cliente; un juego que necesite impedir trampas debe conservarlos y validar acciones en un backend autoritativo. El servidor local no está preparado para exposición pública: requeriría autenticación, persistencia, límites, seguridad de despliegue y observabilidad.

La comprobación estructural no sustituye la revisión editorial de todas las frases. Hay cinco casos finitos, no generación ilimitada. Las variantes nuevas comparten un marco horario y el acónito como veneno; se diferencian por culpable, contexto, coartadas, escena, pruebas y vehículo de administración.

Documentación histórica y técnica adicional: PRUEBAS-LOCALES.md, QWEN-MEJORAS.md, PILOTO.md, ILUSTRACIONES-Y-DIALOGO.md y REGLAS-DIALOGO.md. VARIANTES.md describe la última ampliación.
