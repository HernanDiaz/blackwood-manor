# Blackwood Manor: cinco variantes jugables

La mansión ahora ofrece cinco reconstrucciones escritas, una por cada posible culpable. El caso original forma parte de las cinco. La selección se realiza al crear la partida, excluye la variante inmediatamente anterior y puede volver a una variante más adelante. No es un generador ilimitado de misterios.

## Cómo probarlo

El juego sigue en http://127.0.0.1:4173. Si ya estaba abierto, recarga para actualizar la interfaz: el guardado actual conserva el caso original, sus hallazgos, notas y conversación. Para otra investigación, pulsa Reiniciar y después Confirmar nueva partida. También se ofrece Nueva partida al terminar. Cada partida conserva su variante al recargar o exportar/importar. Se mantiene el estilo de conversación elegido al comenzar otra investigación.

Para arrancar con Qwen, abre PILOTO.cmd en E:\2026 blackwood manor. npm start o JUGAR.cmd siguen ofreciendo el modo sin modelo. No se necesitan nuevas descargas, servicios ni claves.

## Qué varía

Cambian culpable, móvil, mentira inicial, secretos desbloqueables, coartadas y movimientos de los otros personajes. Hay dos vehículos del acónito: té o vino, y cuatro posibles escenas de la muerte. Los cinco casos conservan el marco horario de la noche, pero reconstruyen movimientos diferentes. Cada uno incluye dieciocho pistas, un conjunto de evidencias exigido y un desenlace propio. Una pista incriminatoria en el caso original puede ser inocua en otro.

Los mismos cinco personajes mantienen sus voces. Las seis habitaciones y las 29 imágenes se reutilizan sin regenerarlas. Los objetos/documentos ilustrados pueden cambiar de significado y habitación; el texto del expediente determina la prueba. Las ilustraciones no son reconstrucciones forenses exactas.

## Coherencia y guardado

src/cases.mjs contiene las variantes, las parejas con coartadas contrastadas, la cronología, las revelaciones autorizadas y las tres categorías de prueba: móvil, vínculo y oportunidad. El motor exige las tres al acusar. Los testimonios iniciales pueden contener una mentira deliberada, que una prueba posterior permite confrontar; se distingue de la cronología real de la variante.

La interfaz, el inventario, el tablero, los interrogatorios y el desenlace consultan el caso guardado. El LLM recibe solo recuerdos autorizados de ese caso. Las paráfrasis antiguas del caso original no se ofrecen en los cuatro nuevos. La selección no vuelve a realizarse al restaurar el guardado. El guardado incorpora caseId y caseRevision; una identidad o revisión desconocida se rechaza. Un guardado antiguo sin esos campos se vincula al caso original.

## Validación realizada

- 37 pruebas automáticas, con npm test.
- Investigación de las dieciocho pistas, guardado/restauración y resolución en los cinco casos.
- 450 combinaciones de culpable, método y habitación: una ganadora por caso, con pruebas suficientes.
- Rechazo cuando falta una de las tres categorías de evidencia.
- Comprobación de gates de secretos, fuentes del diálogo, revisiones de guardado, coartadas estructuradas, imágenes y selección sin repetición inmediata.
- Prueba real de Qwen con una pregunta de coartada en cada variante: cinco respuestas del caso correcto, todas mediante el catálogo de apoyo. Resultados en benchmarks/results/five-cases-dialogue.json. Este sondeo no demuestra fiabilidad general del texto libre.
- Recorrido completo en el navegador en una variante: seis habitaciones, dieciocho pistas y acusación correcta. Inicio posterior de una variante diferente y conservación tras recarga. Se usó un origen de prueba separado para no tocar la partida del jugador.

validateCase comprueba la estructura y que los vínculos de prueba conducen a un solo candidato. No demuestra por sí solo que cada frase sea narrativamente consistente: el contenido también requiere revisión editorial.

## Siguiente etapa

Ampliar y diversificar casos con más métodos, horarios, dificultades y patrones de investigación; mejorar el seguimiento de preguntas y la generación libre; probar los misterios con jugadores. El código separa datos de casos y motor para incorporar más variantes. El MVP mantiene los datos y soluciones en el cliente; un producto que necesite impedir trampas deberá conservar la verdad del caso y validar el progreso en el servidor. Quedan las tareas de empaquetado y pruebas de producción móvil descritas en README.md.
