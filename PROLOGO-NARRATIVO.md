# Prólogo narrativo

Al crear una investigación, tras generar las imágenes, aparece una pantalla con la ilustración de la escena y tres párrafos: llegada atmosférica, aviso del hallazgo y tensión inicial. Comenzar la investigación abre la exploración. Leer el prólogo permite volver al relato.

Qwen escribe los dos párrafos atmosféricos por separado. Solo recibe ambientación pública, nombre del mundo, habitación y descripción de esa habitación. No recibe culpable, método, móvil, coartadas ni pistas. El párrafo del hallazgo procede del motor y usa víctima, escena y hora del aviso del caso. No se presenta la causa como conocida.

La revisión local rechaza nombres del elenco, cifras, armas, lesiones y otros términos que podrían introducir hechos. Se eliminan finales incompletos y afirmaciones de que la habitación está vacía. Una segunda petición al modelo revisa contradicciones y hechos nuevos. Estas comprobaciones reducen el riesgo; no garantizan calidad literaria ni una detección semántica perfecta. Si la revisión falla o el modelo no responde se usa una introducción de apoyo redactada para la categoría del mundo.

El texto queda guardado con el estado y también en .local/openings/<caseId>.json. Recargar y exportar/importar conservan el mismo relato. No altera la firma del expediente ni desbloquea pruebas. Una partida anterior sin prólogo lo obtiene al continuar por primera vez; una partida ya iniciada continúa directamente y permite releerlo desde su botón.

Validación: 78 pruebas automáticas superadas, incluidas aislamiento de hechos privados, rechazo de nombres/horas/armas, revisión semántica negativa, modelo sin servicio, limpieza y persistencia sin modificar las pruebas. Se comprobó generación real con Qwen y la apertura de una partida existente en Marte. El modelo pequeño aún produce expresiones poco naturales; queda pendiente mejorar la revisión de estilo.
