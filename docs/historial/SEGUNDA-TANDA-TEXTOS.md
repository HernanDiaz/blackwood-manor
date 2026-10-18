# Segunda tanda: diálogo, habitaciones y prólogo

## Cambios aplicados

- El diálogo rechaza las instrucciones de voz detectadas en la auditoría y las frases sociales que añaden herramientas, acciones o recuerdos sin fuente. Se mantienen emociones, saludos y aclaraciones libres. La revisión sigue siendo experimental y no demuestra comprensión semántica general.
- Si una respuesta mezcla una frase independiente válida con otra rechazada, se intenta conservar y revisar la válida. No se puede conservar una respuesta que deja sin contestar el hecho solicitado; las fuentes siguen limitadas por personaje y pistas descubiertas.
- Una inspección material no autoriza a inventar haber visto o escuchado el crimen. Las preguntas de confesión sin un recuerdo autorizado reciben una petición de pruebas, evitando respuestas afirmativas ambiguas.
- Las voces se describen con términos de tono, sin asignar un género fijo al personaje.
- Se elimina la obligación de iniciales consecutivas en los nombres de habitaciones. Se rechazan los casos detectados: colonia completa en lugar de sala, petición copiada, dormitorio descrito como comedor y nombres de objetos como Esmalte/Fangal usados como sala. Se añade un control específico de vistas exteriores y luz solar en mundos descritos como subterráneos.
- El prólogo rechaza combinaciones detectadas de objeto/material incompatibles y elementos espaciales ausentes de la descripción. La revisión con Qwen también recibe instrucciones de comprobar materiales, contradicciones y repetición. Cuando no se obtiene texto válido, se usa la introducción escrita de apoyo.
- Un prólogo guardado con esos fallos se invalida al volver a abrirlo; no se cambian la solución ni la identidad del caso. Ya se puede releer el prólogo después de ganar y regresar al desenlace.

## Verificación

109 pruebas automáticas superadas. Incluyen los ejemplos de instrucciones copiadas, herramientas inventadas, frases válidas conservadas, confesión implícita, falso testimonio ocular, amnesia, habitaciones contradictorias y sábanas de madera aunque el revisor del modelo las hubiera aprobado.

Se repitieron las 20 preguntas de la auditoría en un piloto intermedio: 12 respuestas libres y 8 de apoyo, frente a 6 y 14 antes de esta tanda. Ese resultado NO demuestra mayor calidad: el piloto encontró dos nuevos errores (testimonio ocular inventado y respuesta afirmativa ambigua), lo que motivó los últimos controles. No se repitió toda la batería tras esos controles finales; se volvieron a comprobar esas dos preguntas concretas con Qwen real y pruebas automáticas.

Comprobación final real:

- «¿Viste a alguien usar el cordón?» → «La inspección me vincula con el objeto cordón trenzado. No puedo negar ese vínculo material», con respuesta de apoyo; no se fabrica un testigo ocular.
- «¿Admites que mataste a Felipe?» → petición de pruebas y de una pregunta concreta; no se pide al modelo inventar una confesión.

Piloto de habitaciones sobre una copia del borrador auditado: se conservaron los personajes y las dos primeras habitaciones; se regeneraron las cuatro rechazadas. Se obtuvieron El Quiosco de la Salud, Habitación de la Mesa, Biblioteca del Silencio y Cámaras de la Colina. Una primera sala de comidas volvió a inventar vistas al exterior; tras reforzar ese control se regeneró sin ellas. Persisten nombres y descripciones poco naturales, como «Sueños de descanso…»: no se presenta este piloto como una solución completa de la calidad literaria.

Se comprobó en la interfaz una copia del guardado resuelto: el prólogo absurdo fue sustituido por la introducción de apoyo, el botón Volver al desenlace recupera el caso ganado y se mantienen las 15 pistas. La partida principal del usuario no se modificó.

## Evidencias y pendientes

En outputs/segunda-tanda quedan mundo-revisado.json, prologo-revisado.json, interrogatorios-piloto.json, comprobacion-final.json y prologo.png.

Siguen pendientes una ficha semántica más rica y validación general de funciones/materiales, corrección de perfiles como Cuidadoza/Cautiva, mayor naturalidad del diálogo y diversidad narrativa de las pruebas. Los controles de esta tanda son acotados a categorías y ejemplos concretos, no una garantía de ausencia de alucinaciones.
