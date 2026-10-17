# Ilustraciones completas y conversación experimental

## Ilustraciones

El juego dispone de **29 imágenes**: cinco personajes, seis habitaciones y dieciocho pistas. Se conservan intactas las tres del piloto y se añaden otras 26. El total de WebP es **1.138.038 bytes**, aproximadamente 1,14 MB. Los pesos SDXS no están incluidos en esa cifra.

Las imágenes se generaron localmente con SDXS y se guardaron en conjuntos con rutas estables, semillas, prompts, revisión de los pesos y SHA-256. La fotografía de la pista se compuso a partir de los retratos generados de Elena y Julián, para conservar sus identidades visuales. Las pistas ilustradas solo aparecen en la interfaz tras descubrirlas. Las partidas existentes mantienen las mismas tres imágenes iniciales y disponen de las nuevas donde antes no había ilustración. La generación no se repite al abrir o recargar.

Los documentos, letras, recuentos exactos de objetos, detalles botánicos y horarios dibujados no deben interpretarse como pruebas adicionales. El texto del expediente contiene esos detalles. Se han revisado y repetido imágenes que no representaban el objeto, pero sigue siendo una dirección artística de prototipo, con estilos menos uniformes en algunas pistas. Los conjuntos instalados están congelados para evitar sobrescrituras accidentales.

## Dos modos de diálogo

En **Interrogar → Estilo de conversación**:

- **Respuesta precisa**, predeterminada: ejemplos, recuperación de tema y formulaciones revisadas, con validación determinista. Sigue siendo limitada en expresión.
- **Conversación libre · experimental**: Qwen redacta prosa, con personalidad, contexto de los últimos cuatro intercambios y los hechos relevantes desbloqueados. El texto pasa controles básicos y otra consulta a Qwen que busca afirmaciones sin respaldo. Ante rechazo o fallo se muestra una respuesta de apoyo o un hecho canónico.

La preferencia se guarda. El modo libre no usa un catálogo de frases, pero **su verificador semántico no garantiza la consistencia**. Las respuestas experimentales se identifican como «revisión automática»; no se presentan como verificadas de forma determinista.

## Qué han mostrado las pruebas reales

Se conservaron las distintas rondas en `benchmarks/results/free-dialogue*.json`, incluidas las fallidas:

- Las primeras instrucciones rechazaban todas o casi todas las respuestas, incluidas paráfrasis correctas.
- Unos ejemplos ajenos al caso contaminaron la respuesta y el revisor llegó a aceptarlos. Se eliminaron y se sustituyeron por ejemplos basados en hechos ya autorizados del propio personaje.
- Activar un presupuesto de razonamiento de 128 tokens mejoró los resultados. Se amplió el límite de generación para que el razonamiento no consumiera todo el espacio destinado al JSON final.
- En la ronda ajustada de 12 preguntas, el revisor aceptó las 12 respuestas y acertó ocho comprobaciones de ejemplo; el tiempo medio fue de unos 3,82 segundos por respuesta completa. **No significa que las respuestas sean buenas:** muchas repiten el ejemplo canónico, algunas hacen preguntas poco coherentes y estas preguntas se reutilizaron para ajustar el sistema.
- En seis preguntas nuevas aparecieron invenciones y repetición. En cuatro comprobaciones nuevas, el revisor aceptó dos afirmaciones falsas: un regalo de un reloj y una salida desde una habitación equivocada. Se añadieron controles deterministas para esos tipos de fallo y para la repetición; eso es una regresión cubierta, no una demostración de fiabilidad general.

Por ello, se mantiene **Respuesta precisa como valor predeterminado** y el modo libre queda disponible para experimentar. Todavía no he conseguido que Qwen3.5-2B proporcione diálogo abierto, natural y fiel de forma suficientemente fiable. El motor no cambia el culpable ni los hechos del expediente, pero la prosa experimental puede contradecirlos.

## Pruebas técnicas

23/23 pruebas automatizadas: motor, guardado, desbloqueos, catálogo de texto, modos de conversación, rechazo y fallback simulados, detección de ciertos errores observados y comprobación de los 29 archivos de imagen contra sus hashes. No equivalen a 22 pruebas de calidad conversacional.

El lanzador usa Qwen3.5-2B con razonamiento breve; `BLACKWOOD_THINKING=0` permite volver al modo rápido. No se descargaron modelos adicionales. No hay mediciones de estos cambios en teléfonos reales.

## Probar

Abrir `PILOTO.cmd` o `PROBAR-LOCAL.cmd`, opción Qwen. Visitar http://127.0.0.1:4173. Los retratos se ven en Interrogar; cada habitación tiene su ilustración; las imágenes de pistas aparecen al recogerlas. El selector de estilo está dentro del interrogatorio.


Se aisló también el historial experimental: sus respuestas anteriores se conservan para el jugador, pero no se reutilizan como hechos para generar nuevas respuestas. Así una invención previa no se convierte en una fuente de autoridad para los siguientes turnos. Los fallos ya mostrados en partidas de prueba no se borran automáticamente.
