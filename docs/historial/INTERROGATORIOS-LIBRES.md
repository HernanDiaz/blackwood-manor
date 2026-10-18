# Interrogatorios con redacción libre

El prototipo usa ahora generación libre de texto: no hay enum de respuestas ni selección de una formulación del catálogo. La identidad, oficio y personalidad son públicos. Los hechos del caso siguen procediendo únicamente de prototypeFacts: coartada y relación inicial; secretos, vínculo material y acceso solo tras encontrar las pruebas del personaje correspondiente.

La pregunta se clasifica para seleccionar el recuerdo relevante. Saludos, emociones y presentación tienen rutas propias. Los seguimientos breves pueden recuperar el tema anterior únicamente si sigue autorizado. El historial aporta preguntas y temas, sin convertir respuestas previas ni afirmaciones del jugador en hechos.

Qwen redacta con el perfil del personaje y una pauta de voz diferente por personaje. El jugador puede conversar sobre emociones y trato actual; no se autorizan biografías ni relaciones inventadas. La libertad de expresión no añade información desconocida del caso.

Antes de mostrar un borrador se revisan números, nombres ajenos al recuerdo, lugares, objetos, negaciones, términos de secretos ausentes y ecos de instrucciones. Un segundo pase revisa cada frase y exige citas exactas de los recuerdos para las afirmaciones factuales. Las reacciones sociales pueden estar redactadas libremente, sin frases predeterminadas, pero no pueden disfrazar acciones pasadas o información del caso.

Cuando hay frases correctas y otras sin apoyo, se pueden retirar las segundas conservando las correctas si no quedan referencias colgantes. Para una pregunta factual debe conservarse una respuesta relacionada con el recuerdo solicitado. Si no se puede aceptar el texto, se hace un reintento; si vuelve a fallar o el modelo no está disponible, se usa una respuesta del motor. Esta respuesta de apoyo no es el modo habitual elegido por diseño, aunque puede seguir apareciendo por la calidad del modelo pequeño.

La pantalla identifica Qwen local · conversación revisada y Motor del caso · respuesta de apoyo. Las conversaciones anteriores y los guardados siguen cargando; no se reescriben los mensajes ya guardados. La revisión combina reglas y un modelo, por lo que sigue siendo experimental y no garantiza detección semántica perfecta. La latencia puede llegar a varios segundos por los pases de generación y revisión.

Validación: 92 pruebas automáticas. Nuevas comprobaciones de prosa fuera del catálogo, hechos parafraseados con fuentes, secretos por personaje, rumores, voces, rechazos deterministas, revisión incompleta, frases retiradas y respuesta pertinente. Piloto local real con cinco preguntas: aceptó generación libre en dos respuestas emocionales, una coartada reformulada y una presentación; el rumor sin pruebas terminó en apoyo del motor. El modelo aún puede producir formulaciones pobres o rechazos innecesarios.

Ejecutar con PILOTO.cmd o node local-play.mjs qwen. Sin modelo local se mantiene la respuesta de apoyo del motor. Los cambios solo afectan al prototipo de /prototype/index.html; el Blackwood original conserva su conexión previa.


La prueba en la interfaz detectó una falsa referencia a un objeto en una oficina dentro de una respuesta emocional. Se añadió un bloqueo de objetos, lugares y relaciones ausentes de las fuentes y una prueba de regresión específica. Se corrigió únicamente ese mensaje generado durante la prueba, conservando notas, hallazgos y el resto del historial. El texto nuevo proviene de Qwen y pasó los controles reforzados.
