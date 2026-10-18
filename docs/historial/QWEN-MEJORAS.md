# Qwen3.5-2B: ejemplos, recuperación y verificación

17 octubre 2026. Se conserva el mismo GGUF Q4_K_M de 1,40 GB. No se han añadido modelos ni descargado otros pesos. Qwen pasa a ser la opción predeterminada de `local-play.mjs` y la primera del selector `PROBAR-LOCAL.cmd`.

## Qué se ha implementado

1. Detección de intenciones explícitas: coartadas, horarios, traslado del té y términos asociados a pruebas. La intención se cruza siempre con los temas desbloqueados para ese personaje. Una pista mencionada por el jugador no desbloquea secretos.
2. Para preguntas sin una intención explícita, Qwen recibe su personaje, hechos disponibles, ejemplos de clasificación e historial reciente del mismo interlocutor (dos intercambios). El historial se identifica como datos, no como instrucciones.
3. Qwen elige una formulación entre variantes revisadas del hecho seleccionado. Hay 18 paráfrasis alternativas más el texto canónico y pequeños encabezamientos por personaje. No son nuevos hechos.
4. Antes de mostrarse, el texto se compara literalmente con las opciones permitidas para ese personaje, tema y estado actual. Se rechazan frases añadidas, hechos bloqueados, cambios de tema y respuestas incompletas. Si falla esa etapa, se muestra el texto canónico. Si no se puede interpretar la pregunta, se usa una respuesta neutra sin adivinar el tema.

**La generación de diálogo es controlada, no prosa libre seguida de una verificación semántica.** Este límite permite verificar el texto con código. Un segundo pase del mismo modelo juzgando su propia prosa seguiría pudiendo aprobar una invención; no se ha presentado esa técnica como garantía. La diversidad estilística actual es modesta y requiere ampliar el catálogo editorial para crecer.

## Resultados y límites

- Base anterior Qwen: 19/24 preguntas correctamente clasificadas con instrucciones mejoradas.
- Primera prueba con ejemplos y contexto, sin reglas nuevas: 20/24 en las preguntas anteriores y 9/16 en otra batería. Archivos `benchmarks/results/qwen-v3.json`.
- Tras revisar esas preguntas y añadir recuperación de intenciones explícitas: 40/40 en el conjunto de desarrollo ampliado, 0,36 s por respuesta de media aproximadamente. **35 de las 40 preguntas las encamina una regla**; esa cifra no representa la exactitud del LLM por sí solo. El modelo sigue participando en la selección de las variantes de respuesta, excepto en respuestas neutras resueltas por reglas.
- Comprobación posterior sin retocar el sistema: **5/8 preguntas nuevas**, media 0,65 s. Las tres no entendidas se contestan con la respuesta neutra. Falló en «qué significaba Edmund para ti», «qué estabas haciendo al sonar el golpe» y «si estabas sola en el comedor». Archivo `benchmarks/results/qwen-v4-fresh.json`.
- Las 48 respuestas de la versión combinada pertenecen al catálogo autorizado. Esto comprueba el límite de salida, **no** que las 48 preguntas fueran comprendidas. No se ha medido la naturalidad con jugadores ni comprobado móvil, consumo o sesiones largas.

El primer grupo de 16 preguntas se llamó `holdout` en los JSON iniciales. Después de inspeccionar sus fallos se usó para ajustar las reglas: desde ese momento es desarrollo, no validación independiente. Las ocho preguntas finales sí se comprobaron una sola vez sin reajustar el sistema después. Muestras pequeñas y una ejecución por configuración; no son estimaciones de fiabilidad para producción.

## Pruebas técnicas

`npm test`: 16 pruebas, incluyendo la validación de todas las formulaciones autorizadas en estados inicial y completo para los cinco personajes, rechazo de texto inventado, secretos bloqueados, hechos de otro tema, fallo de red y caso cerrado. El modelo no puede añadir una frase aprobándose a sí mismo: el verificador exige pertenencia literal al catálogo. La coherencia del catálogo depende de su revisión editorial.

El lanzador ejecuta Qwen localmente y conecta el juego. El chat conserva la latencia y marca las respuestas del catálogo como verificadas. No requiere clave API. Las ilustraciones y demás modelos existentes no se han cambiado.

## Qué falta

Ampliar y validar comprensión con frases nuevas de jugadores, resolver más referencias conversacionales y mejorar las respuestas neutras. El siguiente experimento útil sería comparar recuperación semántica ligera con estas reglas; los ejemplos solos no han solucionado la comprensión. Para diálogo verdaderamente libre habría que medir por separado el generador y el verificador, admitiendo que una segunda opinión de un LLM no garantiza fidelidad.
