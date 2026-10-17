# Catálogo de armas y métodos para el generador

Se amplía el piloto de tres a veinte métodos. Se organiza en cuatro ambientaciones (años 30, medieval, fantasía y ciencia ficción) y familias para que la variedad no consista solo en sustituir un objeto por otro casi idéntico.

El catálogo src/method-catalog.mjs especifica objeto, familia, ambientaciones, capacidades requeridas, características de escena, hallazgo del informe, rastro y regla temporal del caso. Son convenciones narrativas ficticias del motor, no afirmaciones forenses ni médicas reales. Las reglas actuales suponen intervención presencial durante el intervalo del crimen; no permiten trampas preparadas antes ni ataques remotos que invaliden las coartadas.

Incluye daga, objeto contundente, cordón, bebida contaminada, revólver, escopeta, preparado medicinal ficticio, espada, ballesta, caída provocada, artefacto encantado, preparado alquímico ficticio, regulador ambiental, cápsula médica ficticia, panel energético, emisor láser, arma de plasma, brazo robótico, compuerta industrial y cápsula criogénica.

La elección del método y la habitación se hace como una combinación válida, no como dos elecciones independientes. Se descartan anacronismos y métodos sin los requisitos necesarios: por ejemplo, ballesta en medieval; artefacto solo con magia; regulador donde existe soporte ambiental; compuerta o robot en escena industrial. Al cambiar de caso se puede excluir la familia anterior, si hay otra compatible.

El script de generación guiada consume el catálogo ampliado, usa tiempos coherentes con el método y genera un vínculo material acorde con la causa, sin reducir todas las pruebas a un registro de sabotaje. La revisión de imágenes toma el objeto real del método para su pista incriminatoria.

Pruebas: 46 pruebas automáticas en total. Se comprobaron compatibilidad, bloqueo de requisitos ausentes, combinación de escena/método, variedad de familias, horarios y fuentes de prueba. En ocho peticiones reales a Qwen (dos por ambientación), las ocho eligieron una combinación permitida y las cuatro segundas elecciones cambiaron de familia, porque el motor había excluido la anterior. No demuestra la calidad narrativa de un caso completo para cada método.

El catálogo es del laboratorio/generador. Las cinco variantes actuales de Blackwood y las partidas guardadas no se han reescrito. La galería muestra el catálogo en http://127.0.0.1:4173/lab/index.html#methods. El selector genérico y la carga de casos generados en el juego siguen pendientes.
