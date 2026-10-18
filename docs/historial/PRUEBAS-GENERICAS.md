# Pruebas de generación genérica — 18 de octubre de 2026

Se probaron tres generaciones libres con Qwen3.5-2B local: dos estaciones espaciales y una fortaleza fantástica. Ninguna se aceptó. Después se produjo un expediente orbital guiado, con cinco personajes, seis escenarios y quince pistas, y sus 26 imágenes con SDXS.

## Resultados

| Prueba | Resultado |
|---|---|
| Generación libre 1 | Rechazada: crimen y muerte en el mismo minuto; víctima repetida como sospechosa en la prosa |
| Generación libre 2 | Rechazada: método y móvil incoherentes, coartadas inválidas e identificadores de pistas duplicados |
| Generación libre 3 | Rechazada: coartadas inválidas y pistas duplicadas o ausentes |
| Piloto guiado | Grafo de deducción válido: una solución en 90 acusaciones simuladas; las tres categorías de prueba son necesarias |
| Revisión de presentación | Detectó identidad equivocada, introducción vacía, nombres poco naturales y prompts repetitivos; se aplicaron reparaciones registradas |
| Imágenes revisadas | 26 imágenes, 0.74 MB en total; 4.1 s de inferencia, carga del modelo aparte |

El texto guiado requirió 33.9 s en 29 llamadas pequeñas, con el modelo ya cargado. Las cuatro peticiones de reparación finales sumaron 4.6 s. Las cifras son de este equipo; no son mediciones en móviles ni incluyen descargar o cargar los modelos. Es un piloto de un caso guiado, no una tasa de éxito estadística.

## Qué creó cada parte

Qwen creó nombres, personalidades, apariencias, nombres y descripciones de escenarios. Seleccionó culpable, escena, método y móvil entre opciones compatibles. Produjo borradores de títulos, prompts e introducción.

El motor fijó los identificadores, funciones de personajes y habitaciones, horarios, parejas de coartada, estructura de pruebas, textos forenses y condiciones de solución. El método y móvil proceden de un pequeño catálogo temático; no fueron inventados libremente por Qwen en el piloto guiado. Los títulos y prompts de pistas se corrigieron con plantillas según su función, y se usó una introducción factual del motor cuando el borrador omitía la muerte. Un nombre de sala que repetía instrucciones se sustituyó por su función aprobada. No se atribuyen esas correcciones al modelo.

La revisión visual acortó los prompts, puso el objeto antes del estilo y separó documentos, tarjetas, guantes, cámara, registros y dispositivo del crimen. La primera tanda se conserva para comparar. Hay desviaciones menores de detalle y escritura artificial en algunas imágenes; el texto de la prueba conserva la autoridad.

## Ver y reproducir

La muestra está en http://127.0.0.1:4173/lab/index.html. Es una galería de evaluación con spoilers plegados; no es una partida nueva ni una integración del generador en la interfaz del juego.

Los archivos maestros están en E:\2026 blackwood manor. Los resultados y respuestas originales se conservan en benchmarks/generic-pilot; el caso revisado es reviewed/mystery.json y el registro de cambios reviewed/audit.json. Las imágenes están ligadas a su caso mediante manifiesto, semilla y SHA-256, y no se regeneran si ya existe el conjunto finalizado.

- node benchmarks/test-generic-generation.mjs: tres intentos libres; sobrescribe sus carpetas de prueba.
- node benchmarks/compare-generation-profiles.mjs: comparación pequeña de ajustes de generación.
- node benchmarks/test-guided-generation.mjs: generación guiada; sobrescribe su expediente de prueba.
- node benchmarks/refine-generic-pilot.mjs: reparaciones y revisión de prompts; registra las sustituciones del motor.
- .venv-images\Scripts\python.exe benchmarks/generate-generic-art.py benchmarks/generic-pilot/reviewed/mystery.json: imágenes del caso revisado.
- node benchmarks/build-generic-report.mjs: galería local e informe.
- npm test: 53 pruebas, sin generar contenido ni llamar al modelo; incluye mutaciones de errores y hashes de las 26 imágenes.

La simulación prueba el paquete de datos, las pruebas y su serialización. No demuestra todavía que el motor actual de Blackwood pueda cargar arbitrariamente este expediente: falta ese adaptador y probar el flujo interactivo completo.

## Decisión que respaldan las pruebas

Con este modelo pequeño conviene que el motor construya la lógica y que el LLM vista esa estructura. Pedirle todo el caso y dejar que otro pase del mismo modelo lo certifique no dio resultados utilizables en estos intentos. El modo sin pensamiento explícito ayudó a producir fichas, pero siguió dejando errores de contenido; el sondeo no permite concluir que sea siempre mejor.

Antes del selector de ambientaciones hacen falta una definición genérica de caso consumida por el juego, recetas lógicas por ambientación, validadores de datos y prosa, reparación acotada con rechazo si persisten errores, y más casos de evaluación. Blackwood y sus partidas guardadas no se han modificado con este experimento.
