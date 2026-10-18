# Dos partidas de prueba: coherencia, calidad del texto y variedad de pistas

Fecha: 18 de octubre de 2026. Prototipo de mundos con Qwen3.5-2B y SDXS locales. Servidor de prueba en el puerto 4180, con almacenamiento de navegador propio; la partida del usuario en el puerto 4173 no se tocó. Qwen era el mismo proceso que usa la partida del usuario (puerto 1235).

| | Partida 1 | Partida 2 |
|---|---|---|
| Mundo | Años 30, preparado («La última noche en Villa Bellavista») | Libre: «Un monasterio benedictino aislado por la nieve en los Pirineos, en el siglo XII» |
| Semilla / caso | `796e1d0d17f68007` / `orbital-6139e099` | `e01e415aa5c4294a` / `orbital-a156c4fe` |
| Solución | Carmen Ríos, escopeta, biblioteca, 21:30 | Bartolomé, espada, «Spanish name», 20:00 |
| Recorrido | Prólogo, 6 salas, 15/15 pistas, 16 preguntas, acusación ganada | Mundo generado en ~1,5 min (13 fichas + 26 imágenes), prólogo, 15/15 pistas, 9 preguntas, acusación ganada |

Las dos partidas se jugaron por la interfaz. Como el panel del navegador estaba oculto, los botones se pulsaron con JavaScript de la página, que ejecuta los mismos manejadores que un clic. Las hojas de contacto de las imágenes están en `work/partidas-prueba/`.

## Veredicto

Ambas partidas se ganan, y la lógica del caso es sólida: una sola solución y pruebas suficientes. Pero **como misterio no funciona todavía**:

1. **La solución se lee, no se deduce.** De las 15 pistas, tres nombran al culpable («Una prueba independiente identifica a Carmen Ríos usando la escopeta…», «identifica a Bartolomé entrando…») y las otras doce son la misma frase con otro nombre. Basta con buscar las tres pistas distintas.
2. **El mundo generado puede salir roto y la validación lo acepta.** La partida 2 tiene una sala llamada «Spanish name» con la descripción «English description (max 20 words)», y el crimen ocurre ahí.
3. **El diálogo libre se equivoca en más de la mitad de sus respuestas.** Llega a mostrar al jugador una instrucción interna del sistema.

## Fallo bloqueante encontrado y corregido

Desde el commit `077c5d2`, en un navegador sin partida guardada, el prototipo mostraba solo «No se pudo abrir el prototipo». La pantalla inicial leía `c.context` antes de que existiera un caso, y el error quedaba oculto por un `catch` genérico. Quien ya tenía una partida guardada no lo veía. Corregido en `public/prototype/app.mjs` (`c?.context`).

## Hallazgos

Prioridad: **Alta** = rompe la coherencia, el misterio o la confianza del jugador; **Media** = se nota y molesta; **Baja** = pulido.

### Coherencia del mundo

| ID | Prioridad | Ejemplo literal | Problema |
|---|---|---|---|
| P01 | Alta | Sala 6: nombre «Spanish name», descripción «English description (max 20 words)». Anuncio: «han encontrado sin vida a Francisco en el lugar llamado Spanish name». | Qwen copia los marcadores del esquema del prompt. La validación de salas solo rechaza nombres en inglés de una lista fija (`dining hall`, `kitchen`…), así que el marcador pasa. |
| P02 | Alta | Oficios: Ana «Monasterio», Bartolomé «Monasterio de la Nieve», Carlos «Pajot». | El oficio solo se rechaza si coincide con `minerales/persona/adulto/adulta`. Cualquier otra cosa se acepta. |
| P03 | Alta | Monasterio del siglo XII con recurso «mineral»: «Había desviado mineral y falsificado las cuentas», «solicitó revisar el reparto de mineral». | «mineral» es el primer ejemplo del prompt de reglas («Example resource: mineral, grano, combustible»); el modelo copia el ejemplo. |
| P04 | Media | Sala 2 «El Monasterio de la Nieve: Un espacio interior de almacenamiento». | El edificio completo como sala (como T03 de la auditoría). El control específico de T03 no lo detecta porque busca otras palabras. |
| P05 | Media | «El Archivo de la Nieve: …estanterías de papel y un fuego encendido en el centro». «Cámaras de la Herida: …tina para curar heridas». | Fuego en medio de un archivo; nombres poco naturales. |
| P06 | Media | Mundo preparado de Años 30: «Comedor: mesas de preparación y recipientes», «Cocina: herramientas, cofres y equipo de trabajo», «Invernadero: una galería elevada con vistas al patio», «Vestíbulo: un refugio tranquilo con equipaje y efectos personales». | Las descripciones de `noir.json` no corresponden a los nombres: parecen las de otras salas (cocina, taller, dormitorio). No es texto del modelo, está en el mundo preparado. |
| P07 | Media | La anfitriona, el periodista, la cantante y el chófer: «Solicitud firmada por X para revisar sus turnos de trabajo». Víctima: «autoridad del lugar». | Las pistas de los inocentes en mundos preparados tratan a todos como empleados con turnos, incluida la anfitriona. |

### Cronología del crimen

| ID | Prioridad | Ejemplo literal | Problema |
|---|---|---|---|
| P08 | Alta | Partida 1: «A las 21:31 llega el aviso: han encontrado sin vida a Alonso Valdés en la biblioteca» y «identifica a Carmen Ríos entrando en la biblioteca a las 21:30 y saliendo a las 21:32». Partida 2: muerte a las 20:01, salida del culpable a las 20:02. | El cadáver se encuentra mientras el asesino sigue en la sala. En `methodTiming` la muerte es `crimen + 1` y en la pista la salida es `crimen + 2`. Se repite en todos los métodos instantáneos. |
| P09 | Media | Disparo de escopeta en la biblioteca a las 21:30, con cuatro personas en salas cercanas. «¿Oíste el disparo?» → «No tengo información para afirmar eso». | Ningún personaje oyó nada y no se puede preguntar por ello. |

### Pistas y variedad (las mismas en las dos partidas)

| ID | Prioridad | Problema |
|---|---|---|
| P10 | Alta | 12 de 15 pistas salen de tres plantillas con el nombre cambiado. Inocentes en Años 30: «La inspección no encontró un vínculo material entre X y el objeto del crimen. Las pruebas independientes descartan su intervención…» (×4). En el monasterio: «…solicitó revisar el reparto de mineral. No contiene una amenaza ni lo vincula con el crimen» (×4) y «los rastros atribuidos a X no coinciden con la espada» (×4). |
| P11 | Alta | Las pistas del culpable afirman la conclusión: «identifica a Carmen Ríos usando la escopeta de caza en la escena a las 21:30; no se trata únicamente de que sea su propietario», «Contradice su afirmación de haber permanecido en la cocina». No hay que relacionar nada: es T17 de la auditoría y sigue igual. |
| P12 | Media | Cada pista se coloca en la sala `(g*5+i) % 6`, sin relación con su contenido: el registro de acceso a la biblioteca está en el despacho y el documento de la anfitriona en el despacho, junto a la inspección de otro. |
| P13 | Media | Frases pesadas que persisten: «Informe del examen del sanador y cotejo de fragmentos por el investigador: El informe del caso describe…» (T15), «La prueba material registra resto del disparo y arma recuperada», «Copia de la carta con sello personal cotejado por el escribano, atribuida a Ana». |
| P14 | Media | No hay pistas falsas, contradicciones entre testigos ni coartadas que se rompan al cruzarlas: los inocentes se exculpan entre sí por parejas con un «registro continuo», y el culpable es el único sin pareja. Contar quién está solo ya resuelve el caso. |

### Diálogo

De 25 preguntas, 9 las respondió Qwen con texto libre y 16 el motor con frases fijas. De esas 9 respuestas libres, 5 tienen errores; entre las 16 del motor hay 6 evasivas («No tengo información…», «No voy a inventar…») ante preguntas razonables y 3 que responden a otro tema.

| ID | Prioridad | Pregunta → respuesta | Problema |
|---|---|---|---|
| P15 | Alta | Lucía: «¿Cómo te sientes después de lo ocurrido?» → «Puedes expresar una emoción actual o pedir aclaraciones; nunca crees recuerdos, pruebas, relaciones o una solución.» | El modelo devuelve una instrucción del sistema y el verificador la acepta como frase «social». |
| P16 | Alta | Isabel Valdés (anfitriona, mismo apellido que la víctima): «¿Qué relación tenías con Alonso?» → «No tengo relación con Alonso.» | Negación inventada que contradice la ficha y pasa como respuesta verificada. |
| P17 | Alta | Tomás (periodista): «¿Estabas escribiendo algo sobre Alonso?» → «No tengo nada que recordar sobre ese nombre.» | Trata a la víctima como un desconocido. |
| P18 | Media | Ana: «¿Quién eres?» → «Soy Ana, monasterio. Me siento tranquila, pero no solemne.» | Repite el oficio roto (P02) y añade una frase sin sentido. |
| P19 | Media | Carmen, culpable, ante el registro → «El registro sitúa mi entrada en «Biblioteca» a las 21:30. Mi primera coartada era falsa.» Ante el documento → recita su móvil completo. | El culpable confiesa a la primera, sin resistencia. Las comillas «» y las mayúsculas en mitad de frase siguen en las respuestas del motor (en las pistas ya se corrigieron). |
| P20 | Media | Bruno: «¿Qué opinas de Carmen Ríos?» → su coartada. Isabel: «¿Alonso era tu marido?» → su coartada. | Preguntas sobre otros personajes o relaciones acaban en la coartada. |
| P21 | Media | «¿Por qué tenías la escopeta en las manos?», «¿Viste a alguien entrar en la biblioteca?», «¿Oíste algo extraño?» → evasiva. | Preguntas naturales sobre el crimen no tienen respuesta. «escopeta» no se reconoce aunque el arma del caso es la «escopeta de caza». |
| P22 | Baja | Carlos: «Quieres aclarar algo sobre lo que ocurrió?» | Falta el signo de apertura «¿». |
| P23 | Baja | Respuestas del motor con prefijos intercambiables: «Lo explicaré con calma.», «Hay un detalle importante.», «Vamos por partes.», «Te lo digo sin rodeos.», «Sin rodeos.». | T22 de la auditoría, sin cambios. |

### Prólogo, imágenes e interfaz

| ID | Prioridad | Hallazgo |
|---|---|---|
| P24 | Media | Los dos prólogos usaron el texto de reserva, y la frase final es idéntica en ambas partidas. Reproducido fuera del juego: Qwen genera con semilla y temperatura fijas, así que reintentar produce el mismo texto; el revisor lo rechaza con razón («Todavía no sabes que investigar», «Las estanterías se inclinan hacia ti») y siempre gana la reserva. El fallo queda oculto porque `createOpening` tiene un `catch` que no registra nada. |
| P25 | Media | Imágenes del monasterio: interiores modernos (una consulta blanca con armarios de cocina, una sala tipo loft con objetos de colores) y nieve en el suelo de las salas. Ana aparece con aspecto infantil siendo sospechosa. El estilo es otro respecto a los mundos preparados. |
| P26 | Baja | En Años 30 las imágenes son coherentes entre sí y con los nombres de las salas, aunque el despacho muestra la fachada de una casa. |
| P27 | Baja | El botón «Tu relación con la dirección» sigue apareciendo en el mundo preparado de Años 30 (T18 solo se corrigió en los mundos libres). El desenlace del monasterio dice «el registro de acceso sostienen la acusación» cuando las pruebas eran declaraciones de guardias (T25). «6 métodos compatibles», «Qwen» y «Motor» siguen visibles para el jugador (T26). |

## Comparación con la auditoría anterior

- **Mejorado:** las concordancias de cartas y lugares (T12, T13) se resuelven con «Copia de la carta… atribuida a» y «el lugar llamado X»: correcto, aunque artificial. La pregunta sobre los guardias de T27 ya se dirige al tema correcto. El botón de relación usa «la víctima» en mundos libres. No aparecieron errores de género gramatical (T07, T08) en estas dos partidas.
- **Sin cambios:** pistas en plantilla (T16), pistas que dictan la conclusión (T17), frase pesada del informe (T15), prefijos de las respuestas de apoyo (T22), resumen final genérico (T25), términos técnicos (T26).
- **Nuevo:** marcadores del prompt copiados como contenido (P01–P03), cronología imposible (P08), instrucción interna mostrada al jugador (P15), relaciones negadas (P16, P17), prólogo de reserva permanente (P24) y el fallo de arranque.

## Causas de fondo

1. **Las correcciones bloquean ejemplos concretos y no clases de error.** Cada auditoría añade palabras a una lista (`Fangal`, `Esmalte`, `minerales`, `dining hall`…), y el modelo produce otra variante: ahora «Spanish name», «Pajot», «mineral». Mientras el modelo escriba texto libre en campos estructurales, seguirán apareciendo.
2. **Un modelo de 2B copia el esquema y los ejemplos del prompt.** Los marcadores («Spanish name»), los ejemplos («mineral») y hasta las instrucciones del sistema (P15) acaban en la salida.
3. **El generador de casos fabrica la solución en lugar de un misterio.** Hay tres categorías de pista, cada una con una plantilla para el culpable y otra para los inocentes. Por buena que sea la prosa, la estructura deja el caso resuelto al leerlo.
4. **Los fallos silenciosos esconden problemas.** El arranque, el prólogo y otras rutas usan `catch {}` sin registro, así que solo se descubren jugando.

## Qué haría a continuación

1. **Fichas del mundo con campos cerrados.** Que el modelo elija de listas cerradas lo que tiene respuesta conocida (función de la sala, oficio dentro de un catálogo por época, recurso por época) y escriba libremente solo nombre y descripción. Rechazar cualquier campo que repita texto del prompt (comparación directa con los marcadores y ejemplos enviados), en lugar de listas de palabras prohibidas.
2. **Rediseñar las pistas de los inocentes para que no sean idénticas** y para que el jugador tenga que cruzar información: coartadas parciales que solo se confirman combinando dos pistas, una pista engañosa por caso y pistas colocadas en salas con sentido. Es el cambio que más mejoraría la experiencia.
3. **Cronología coherente**: hallazgo del cuerpo posterior a la salida del culpable, y hechos para los inocentes sobre lo que oyeron o vieron.
4. **Bloquear el texto de instrucciones en el diálogo**: rechazar cualquier respuesta que coincida con frases del prompt del sistema.
5. **Registrar cada vez que se usa un texto de reserva** (prólogo, diálogo, fichas) y medir su porcentaje en cada partida.

## Límites

Son dos partidas y 25 preguntas: sirven para encontrar problemas, no para medir frecuencias. Las semillas fijas permiten reproducir los casos y los prólogos; el diálogo libre puede variar. No se probó la persistencia al recargar ni el modo Blackwood.

## Estado tras las correcciones (18 de octubre, tarde)

Verificado con tests automáticos (125) y con pilotos reales de Qwen: dos regeneraciones del monasterio, una estación ballenera de 1932 y un faro de 1890, cada uno con mundo nuevo, 27 imágenes y prólogo. Una partida completa del monasterio y otra de Años 30 se ganaron por la interfaz.

| Hallazgo | Estado | Cómo |
|---|---|---|
| P01 «Spanish name» | Corregido | El nombre de sala empieza por un tipo elegido de una lista cerrada por época; los campos que repiten frases de las instrucciones se rechazan. |
| P02 Oficios inventados | Corregido | El oficio se elige de una lista por época, en el género del personaje (el esquema lo impone) y sin repetirse. |
| P03 «mineral» copiado del ejemplo | Corregido | Recurso elegido de una lista según la tecnología; el prompt ya no da ejemplos. Si la petición incluye un año, fija la tecnología. |
| P04, P05, P06 Salas incoherentes | Corregido | En mundos libres, la descripción sale de una plantilla del tipo de sala y la época; Qwen solo pone el nombre propio y la imagen. En los mundos preparados (fantasía, medieval, Años 30), los casos nuevos usan descripciones escritas para cada sala; los JSON no se tocan para no invalidar partidas antiguas. |
| P07 «turnos de trabajo» para todos | Corregido | Rediseño de pistas: deudas, despidos, testamentos o quejas, y documentos neutros. |
| P08, P09 Cronología | Corregido | El hallazgo es posterior a la salida del culpable; el comprobador lo exige. |
| P10–P14 Pistas en plantilla y conclusiones | Corregido | Ver EXPEDIENTES.md: móvil, acceso y coartada repartidos entre varios sospechosos, una pista engañosa explicada. |
| P15 Instrucción recitada | Corregido | Se rechaza cualquier respuesta que copie cuatro palabras seguidas de las instrucciones. |
| P16, P17 Negar relaciones o recuerdos | Corregido | Las negaciones que no estén en los hechos autorizados se rechazan, salvo fórmulas como «no puedo decir» o «no sé». |
| P18 Presentación con oficio roto | Corregido por P02 | |
| P19 Comillas y mayúsculas | Corregido | Textos sin «», nombres de sala en minúscula tras artículo. El culpable sigue cediendo pronto, pero ya no confiesa: «Quizá me confundí de hora». |
| P20, P21 Preguntas sin tema | Mejorado | Temas nuevos («lo que viste», «el objeto») y más expresiones reconocidas. |
| P22 «¿» ausente | Corregido | |
| P24 Prólogo siempre de reserva | Corregido | Semillas distintas por caso e intento, hasta tres intentos, errores 500 de Qwen reintentados y el motivo registrado. Las reservas tienen variantes. |
| P25 Imágenes anacrónicas | Sin cambios | Los prompts de sala siguen siendo de Qwen. |
| P27 Etiquetas técnicas | Parcial | «Tu relación con la víctima» en todos los mundos. |

### Lo que sigue fallando

- El texto libre de Qwen sigue siendo flojo cuando se acepta: prólogos recargados («El aire hunde las uñas») y respuestas que el revisor aprueba con detalles dudosos. Los controles quitan los errores graves detectados, no garantizan buena prosa.
- Rasgos y oficios ya son coherentes, pero la variedad depende de listas finitas; con más mundos se notará la repetición.
- Un sospechoso con oficio «guardia» convive con «el guardia de turno» de las pistas, que no es sospechoso.
