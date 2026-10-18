# Revisión de textos jugando una partida completa

Fecha: 18 de octubre de 2026. Prototipo local, Qwen3.5 y SDXS. Prueba separada en el puerto 4180; no se modificó la partida del usuario en el puerto 4173.

Ambientación: «Una colonia de enanos de un mundo de fantasia en las profundidades de una montaña». Mundo generado: La Colina de los Enanos. Caso `orbital-e057c5b0`, semilla `a6f88634502d4080`.

Recorrido: generación nueva de las 13 fichas y 26 imágenes, lectura del prólogo, exploración de seis salas y las 15 pistas, conversaciones, tablero con las tres pruebas relevantes, notas, acusación correcta, exportación, recarga y recuperación del desenlace. Caso ganado: Balthazar, estrangulación, Fangal de la Colina, 20:00. La coherencia lógica permite resolver esta partida.

La partida se jugó por la interfaz. Además, se hizo una batería de preguntas al servicio de conversación con una copia del mismo guardado: identidad, emoción y coartada para los cinco personajes, y cinco preguntas adicionales a Balthazar. Estas respuestas adicionales están en interrogatorios.json y no se insertaron en el historial de la partida jugada. No son partidas independientes ni equivalen a una prueba de todos los mundos posibles.

## Problemas observados

Alta = afecta coherencia del mundo, identidad o fiabilidad del diálogo. Media = afecta comprensión, naturalidad o variedad. Baja = redacción secundaria o texto heredado. Las propuestas son orientativas; no son correcciones ya implementadas.

| ID | Prioridad | Dónde y ejemplo literal | Problema | Corrección propuesta |
|---|---|---|---|---|
| T01 | Alta | Prólogo: «Las sábanas de madera se doblan bajo el peso de la noche.» | Objeto físicamente absurdo que pasa la validación. | Revisar sustantivo, material y acción; rechazar la frase y reescribirla conservando cama de madera y ropa de cama separadas. |
| T02 | Alta | «Dormitorio de la Colina»: «Un espacio de comedor para el desayuno de los enanos en la montaña.» | Nombre y función se contradicen. | Validar conjuntamente nombre, descripción y función solicitada. |
| T03 | Alta | «Colonia de Enanos»: su descripción es la petición completa del jugador. | Una colonia no es una habitación; no cumple la ficha prevista de atención médica. | Exigir una estancia concreta con función reconocible; rechazar la copia de la petición. |
| T04 | Media | «Esmalte de la Colina»: «Caja de registro de datos antiguos con herramientas de escritura manual.» | El nombre no identifica un archivo y la descripción habla de una caja, no de una sala. | Una sala de archivo con estantes, registros y mesa; nombre coherente con esa función. |
| T05 | Media | «Fangal de la Colina»: «Estancias para dormir con chimenea y cama de madera.» | Fangal significa terreno fangoso, no dormitorio; termina distorsionando también el anuncio del hallazgo. | Rechazar nombres de lugares incompatibles con la función salvo explicación explícita. |
| T06 | Media | «Aurora de la Colina»: «Laboratorio de ingeniería con maquinaria de piedra y humo de carbón.» | Nombre poco informativo y maquinaria de piedra imprecisa; mezcla vaga entre laboratorio y taller. | Elegir una función y materiales de mecanismos concretos, compatibles con la era. |
| T07 | Alta | Aldo: «Estoy inquieta…»; Dorothy: «Estoy tenso.» | El género de las respuestas de apoyo contradice el oficio/perfil mostrado. | Guardar el tratamiento gramatical por personaje; no tomarlo de una voz fija asociada al puesto p1/p4. |
| T08 | Alta | Cristina aparece como «Artesano de minerales» y responde «Soy Cristina, un artesano de minerales.» Su descripción visual la identifica como mujer. | Discordancia interna de la ficha, reproducida por el diálogo. | Normalizar oficio y tratamiento desde la ficha, sin inferirlos solo por el nombre. |
| T09 | Media | Ficha interna de Cristina: «Cuidadoza y trabajadora». | Falta ortográfica, aunque el rasgo no se presenta como etiqueta visible en esta pantalla. | «Cuidadosa»; revisar antes de usar el perfil para conversar. |
| T10 | Media | Ficha interna de Dorothy: «Cautiva y trabajadora». | Cautiva describe cautiverio; probablemente no expresa el rasgo que se pretendía. | Pedir un rasgo de carácter inequívoco y validar su significado. No asumir que debía decir cauta sin confirmarlo en la generación. |
| T11 | Media | Balthazar, Cristina, Dorothy, Elena y Felipe comparten trabajador/trabajadora como rasgo; varios son mineros. | Perfiles poco diferenciados antes de empezar a hablar. | Dar a cada personaje un deseo, una preocupación y una forma de expresarse propios, sin alterar el caso. |
| T12 | Media | Cinco expedientes: «Copia del carta con sello personal cotejado por el escribano, atribuido a…» | Artículo, participio y atribución no concuerdan claramente con carta. | «Copia de una carta atribuida a X, con su sello personal cotejado por el escribano: …». |
| T13 | Media | «en el colonia de Enanos», «del aurora de la Colina». | El artículo de lugar usa una lista limitada y cae al masculino. | Guardar artículo/nombre de referencia en la ficha; tratar nombres propios por separado de nombres comunes. |
| T14 | Baja | «Aurora de la Colina» pasa a «aurora de la Colina» al insertarse en una frase. | Se baja la primera letra de cualquier nombre, incluso cuando funciona como nombre propio. | Definir si es una denominación propia o un nombre común y conservar la capitalización adecuada. |
| T15 | Media | «Informe del examen del sanador y cotejo de fragmentos por el investigador: El informe del caso…» | Construcción pesada, duplicación de informe y mayúscula tras dos puntos sin necesidad. | Separar la procedencia de la prueba de su hallazgo en dos frases claras. |
| T16 | Media | Cuatro cartas inocentes repiten «solicitó revisar el reparto de mineral»; cuatro pruebas repiten que los rastros no coinciden. | La estructura se percibe inmediatamente como plantilla; casi no hay descubrimiento narrativo. | Mantener los hechos lógicos con contenidos y soportes distintos por personaje. |
| T17 | Media | «Una prueba independiente identifica a Balthazar usando el cordón…» y «Contradice su afirmación…». | La prueba resume la conclusión y no concreta cómo se obtiene la identificación independiente. El misterio se vuelve una lectura de veredictos. | Presentar una fuente concreta con un detalle verificable y permitir que el jugador relacione las pruebas. Es un problema de diseño narrativo, no un fallo de la solución lógica actual. |
| T18 | Alta | Botón «Tu relación con la víctima» genera en el historial «¿Cómo era tu relación con la dirección?». | El texto enviado no coincide con la intención visible; queda un término de otra ambientación. | Generar la pregunta con la víctima real o usar exactamente el texto anunciado. Confirmado en el guardado jugado. |
| T19 | Media | Aldo: «Estoy aquí, con mis manos en el barro, sintiendo el peso de la verdad que he buscado.» | Mezcla emoción con posición/acción actual e historia pasada inventadas; la respuesta se acepta como revisada usando solo persona. | Revisar también acciones y recuerdos dentro de frases aparentemente sociales. |
| T20 | Alta | Cristina: «Estoy tranquila y ocupada con mis herramientas.» | Se acepta como conversación revisada sin fuente para estar usando herramientas. No altera el crimen aquí, pero demuestra un hueco del verificador. | Separar emoción libre de afirmaciones sobre acciones, objetos y observaciones. |
| T21 | Media | Elena: «Minera, estoy tranquila y preparada para lo que necesito.» | Oficio usado como vocativo extraño y cierre sin sentido claro. | Exigir respuesta idiomática directa, sin recitar el rol. |
| T22 | Media | Presentaciones de apoyo: «Me llamo X. Mi ocupación es…»; coartadas con «Lo explicaré con calma», «Escucha», «Seamos precisos». | Cuando falla el modelo, las voces vuelven a frases casi idénticas y prefijos intercambiables. | Mejorar las respuestas de apoyo por perfil y medir cuántas preguntas normales terminan en apoyo. |
| T23 | Media | Prólogo repite silencio, frío y humo tenue en ambos párrafos; añade niebla, viento y ventana. | Poca progresión narrativa y elementos no fijados en la descripción de la habitación. La ventana al viento no queda justificada en una colonia bajo una montaña. | Revisar los dos párrafos juntos y limitar los elementos espaciales a la sala definida; marcar la ventana como inferencia no demostrada, no como contradicción lógica segura. |
| T24 | Baja | Etiqueta accesible «Investigación orbital» y carga «Cargando la investigación orbital…» en un mundo de enanos. | Restos del tema anterior. | Etiquetas neutras de investigación. |
| T25 | Media | Resolución: «…el registro de acceso sostienen la acusación», cuando las pistas son declaraciones de guardias. | El cierre vuelve a una denominación genérica que no recoge la fuente específica del mundo. | «Los testimonios de los guardias…» o nombrar las pruebas adjuntas. |
| T26 | Baja | Interfaz: «Qwen», «Motor del caso», «métodos compatibles», «vínculo material». | Tono de demostración técnica muy visible para un juego narrativo. | Reservar diagnósticos para el modo de pruebas y usar términos de investigador donde ayuden al jugador. |

| T27 | Alta | Con las 15 pistas descubiertas, «Los guardias te vieron entrar en Fangal de la Colina a las 20:00. ¿Cómo lo explicas?» devuelve «No tengo información para afirmar eso…», topic unknown. «¿Viste a alguien usar el cordón?» también termina en unknown. | Preguntas naturales relacionadas con pruebas disponibles no se encaminan al tema correspondiente. Es una causa concreta de la sensación de conversación restringida. | Resolver intención por significado y entidades de las pruebas, con aclaración contextual si hace falta; incluir estos dos ejemplos en las regresiones. |

## Incidencias de uso adicionales

- Al pasar a acusar mientras llegaba una respuesta de interrogatorio, el nuevo renderizado borró selecciones del formulario. Se volvió a rellenar una vez finalizada la respuesta y la acusación funcionó. Es un fallo de estado de interfaz, separado de los textos; conviene reproducirlo de manera aislada antes de corregir.
- Tras ganar y recargar, «Continuar la actual» recupera correctamente el caso resuelto. Sin embargo, «Leer el prólogo» sigue visible y al pulsarlo permanece el desenlace: el botón promete una acción que no cumple en ese estado. Las pestañas de exploración también quedan subordinadas a la pantalla final.
- Al abrir el origen de pruebas 4180 había un guardado antiguo incompatible: el aviso permitió exportarlo y reiniciar. No se atribuye este aviso a la partida nueva ni se considera una regresión demostrada.

## Qué corregir primero

1. Coherencia semántica de las fichas: tipo real de habitación, función, oficio y tratamiento gramatical. La validación estructural actual acepta textos que no tienen sentido.
2. Concordancia determinista de cartas y lugares, y coherencia entre botones y preguntas enviadas. Son errores reproducibles que no necesitan más creatividad del modelo.
3. Revisión de frases sociales y de los dos párrafos del prólogo; no basta con prohibir nombres o pistas.
4. Variedad de pruebas y voces de apoyo, manteniendo una única solución comprobable.
5. Pulido de etiquetas y resumen final según el mundo.

## Evidencias y límites

- `recorrido-pantallas.json`: transcripción de pantallas leídas durante la partida.
- `partida-resuelta.json`: guardado exportado con 15 pistas, tablero, notas, prólogo e historial de la partida; resultado won.
- `interrogatorios.json`: preguntas adicionales y respuestas literales, con modo y motivo de sustitución cuando lo devuelve el servicio. Su texto es la respuesta del servicio antes del formateo de artículos/comillas de la interfaz.
- `caso-resuelto.png`: captura del desenlace.

Esta es una auditoría de una partida concreta. No demuestra que sean todos los errores existentes ni generaliza los porcentajes a otras ambientaciones. Los problemas de estilo se distinguen de las contradicciones de hechos y de los detalles internos no visibles. No se han corregido los textos en esta pasada: se conservan para reproducirlos.

Resultado de las 20 preguntas adicionales: 6 respuestas libres aceptadas y 14 respuestas de apoyo. Tiempo medio del servicio: 8.3 s. Son datos de esta batería y este equipo; hubo también una consulta de interfaz durante parte de la batería, por lo que no constituyen un benchmark aislado.
