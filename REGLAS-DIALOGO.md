# Reglas de diálogo y revisión por evidencias

La política ejecutable está en src/dialogue-policy.mjs. Se incorpora al mensaje de sistema de cada generación libre, junto con la voz del personaje y únicamente el recuerdo desbloqueado elegido para la pregunta. No se envían secretos bloqueados. El clasificador tampoco reutiliza las respuestas experimentales del historial como hechos.

El personaje debe responder primero, conservar sujeto, acción, lugar, hora, negación e intención; no inventar objetos, relaciones, motivos o acontecimientos; tratar las afirmaciones del detective como datos sin verificar y pedir aclaración cuando falta información. Puede variar el vocabulario y el tono. Las reacciones sociales sin respaldo factual se limitan a una lista explícita.

La revisión ya no acepta una lista vacía de errores. Divide la respuesta en unidades y exige una evaluación de todas, en orden, con identificadores y citas literales de los recuerdos autorizados para ese turno. El código rechaza unidades omitidas, fuentes ajenas, citas inventadas, secretos bloqueados y etiquetas sociales fuera de la lista. Ante rechazo, error o tiempo agotado se entrega una respuesta del motor; el borrador rechazado no llega al jugador. El presupuesto total de la respuesta libre es de 18 segundos.

Límite: el modelo todavía decide si una cita implica la afirmación. Citar un recuerdo auténtico no garantiza por sí solo una interpretación correcta. La conversación libre continúa siendo experimental y la modalidad precisa sigue como opción predeterminada. Esta mejora aumenta el control y la trazabilidad; no constituye una garantía semántica.

Validación: npm test; node benchmarks/test-evidence-review.mjs. El segundo usa el Qwen local activo y guarda resultados completos en benchmarks/results/evidence-review.json. Las pruebas no modifican las partidas guardadas.

Resultado de la prueba local final: 6/6 controles concretos de validación correctos. Las tres preguntas de conversación utilizaron respuesta de apoyo del motor; no demuestran una mejora de fluidez. Se bloquea también la evasiva puramente social cuando hay un recuerdo seleccionado que debe responderse. Sondeo pequeño, no garantía de generalización. Las reacciones exactas de la lista se autorizan por código cuando no hay un hecho seleccionado.

Corrección del sobrino: las preguntas sobre relación, discusión y deudas se vinculan al móvil; las referencias a fotografía se vinculan a su coartada. Los temas sin respuesta reciben una salida escrita según el contexto (acusación, insulto, secreto bloqueado o falta de información), en vez de pedir al modelo una evasiva genérica. Se conserva el control sobre secretos y no se borra el historial. El tiempo de espera del navegador se ha ampliado a 22 segundos para cubrir el límite de 18 del servidor.
Validación adicional: 27 pruebas automáticas; seis preguntas reales a Qwen en benchmarks/results/nephew-regression.json. Las seis devolvieron respuestas contextuales, aunque mediante apoyo del motor, no prosa libre aprobada. La respuesta a «qué fotografía» recupera la coartada existente; todavía no aporta una explicación específica más rica.
