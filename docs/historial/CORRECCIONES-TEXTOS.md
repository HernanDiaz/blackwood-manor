# Primera tanda de correcciones de la auditoría

Se abordan los puntos 1 y 3 del plan: concordancias y selección del recuerdo al que se refiere una pregunta. No se cambia la solución de los expedientes ni su identidad; las correcciones de cartas, lugares y oficios se aplican al presentar el texto para mantener la compatibilidad de los guardados.

Cambios:
- Presentación de «Copia de la carta… atribuida a…» y artículo femenino para colonia. Los nombres de sala desconocidos usan «el lugar llamado Aurora de la Colina», preservando el nombre propio en lugar de adivinar un artículo. Esto es una alternativa conservadora; no es un analizador gramatical general.
- El oficio Artesano/Artesana se presenta de acuerdo con la identificación explícita woman/female del retrato, si existe. No se adivina a partir del nombre. Una futura ficha con tratamiento gramatical explícito debe reemplazar esta compatibilidad con datos antiguos.
- Las emociones de apoyo evitan adjetivos de género fijo. Se elimina también «Voy a ser clara» de un prefijo fijo. No se garantiza aún la concordancia de toda frase libre generada por el modelo.
- El botón sobre la víctima pregunta por la víctima; el de acceso pregunta por la prueba y la coartada sin acusar automáticamente a inocentes de mentir.
- Guardias, vigilantes, testimonios, entradas/salidas y grabaciones se reconocen como acceso; cordón, fibras y el objeto concreto del caso se reconocen como vínculo material. Se conserva el bloqueo por descubrimiento y por personaje: reconocer el tema no entrega un recuerdo oculto.
- Un saludo no sustituye el tema de una pregunta factual. «Ahora» ya no coincide por error con «hora». Las preguntas de emoción e identidad funcionan también sin el modelo.
- Se retiran las etiquetas visibles y accesibles «orbital» de carga, navegación e importación del prototipo.

Validación: 103 pruebas automáticas superadas. Las nuevas regresiones cubren ambas preguntas de la auditoría, el saludo con una pregunta factual, los hechos aún bloqueados, emociones sin género fijo, oficio de Cristina, carta, colonia y nombre propio desconocido. Se importa y abre la partida original para comprobar que el caso sigue cargando y las cartas se presentan corregidas.

Límite: no es todavía comprensión semántica general. El reconocedor usa expresiones y entidades del caso; para preguntas no reconocidas sigue existiendo la clasificación con el modelo. Tampoco se ha corregido en esta tanda la incoherencia de habitaciones/prólogo, la variedad de pistas ni toda la revisión de frases sociales. En la repetición de la batería apareció incluso una instrucción de voz como respuesta de Cristina («Tratas de usted…»): queda registrada como fallo pendiente de la fase de revisión de diálogo, no como una mejora demostrada.

## Repetición con Qwen real

Se repitieron las mismas 20 preguntas, con el mismo guardado de partida y preguntas en el mismo orden. Resultado: 6 respuestas libres y 14 respuestas de apoyo, frente a 6 y 14 en la auditoría. No se demuestra una mejora global de fluidez.

Las dos regresiones principales sí cambian de tema unknown a su recuerdo correcto: la pregunta por los guardias entrega la prueba de acceso y la coartada falsa; la pregunta por el cordón entrega el vínculo de la inspección, sin inventar haber visto a otra persona. Ambas respuestas usan apoyo del motor en esta repetición. Dorothy ya responde «Esto me preocupa» y Cristina se presenta como «Artesana de minerales».

Siguen pendientes la revisión de frases sociales (incluida la copia de instrucciones), la respuesta ambigua «No puedo negarlo, pero no puedo confirmarlo», las fichas incoherentes y la calidad del prólogo. Los registros completos están en interrogatorios-despues.json; no son una garantía estadística ni un benchmark de velocidad.
