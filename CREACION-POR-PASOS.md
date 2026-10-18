# Creación verificada paso a paso

La opción Libre crea ahora un borrador en 13 pasos: reglas del mundo; seis habitantes (uno será víctima); seis habitaciones. Cada ficha se valida antes de continuar, con cinco intentos por defecto y un selector de 3, 5 u 8 intentos totales por ficha. Los reintentos automáticos muestran el número de intento y el motivo de corrección; solo se repite la ficha fallida. Los contadores se guardan en disco, de modo que reanudar también usa semillas nuevas. Las instrucciones internas están en inglés, los campos de juego se solicitan en español y los prompts visuales en inglés. El modelo sigue cometiendo errores de idioma y de calidad literaria: el idioma de las instrucciones no los elimina.

Los pasos aceptados se guardan en .local/world-drafts, excluido de Git. Se recuperan tras reiniciar el servidor; una validación reforzada puede invalidar solo una ficha y volver a generarla. El navegador conserva la petición y la partida candidata para reanudar también una generación de imágenes interrumpida por recarga. Reintentar la misma descripción reutiliza ese borrador; cambia la descripción para crear otro. No se sobrescribe la partida activa hasta tener listo el conjunto nuevo.

## Coherencia de las pistas

Los mundos nuevos usan custom-v2. El motor construye quince pistas a partir del culpable, objeto, móvil, escena, horario y coartadas reales del caso. Las pruebas no se inventan por separado con el modelo. Las ilustraciones de las pistas parten de su fuente concreta.

Cada mundo fija tecnología, permiso de magia y armas de fuego, y un recurso valioso. Los métodos se restringen de forma conservadora: herramientas comunes, armas medievales en mundos preindustriales y, cuando se permiten, armas de fuego o preparados medicinales en mundos industriales/futuristas. No se introducen láseres, criogenia o artefactos mágicos por inferencia libre. Las habitaciones solo se consideran interiores, sin otras capacidades.

En un castillo medieval: cartas selladas cotejadas, examen de fragmentos y testimonios de dos guardias sobre accesos. En años 30: cartas, examen médico/material y vigilantes. En ciencia ficción: expedientes digitales autenticados, laboratorio del complejo, cámaras y registros sellados. El control de accesos y la vigilancia continua son convenciones deterministas del caso; los guardias/vigilantes son testigos de apoyo fuera del grupo de sospechosos. No se simula una investigación forense real.

Las pistas del móvil se refieren al recurso del mundo. La prueba material positiva identifica el objeto concreto y a su usuario durante el crimen; una prueba negativa solo niega un vínculo, sin convertirlo en inocencia absoluta. La oportunidad coincide con escena y horario y contradice la coartada falsa. Las cuatro personas inocentes tienen coartadas recíprocas. El interrogatorio sobre los documentos usa el mismo recurso y contenido, sin cambiarlo por turnos laborales.

Antes de admitir el expediente se comprueba que exista exactamente un sospechoso con apoyo en las tres categorías, que las coartadas sean compatibles y que todas las pistas pertenezcan al mundo. Esto verifica el modelo lógico del prototipo; no demuestra coherencia semántica absoluta de cualquier ambientación pedida. Los guardados custom-v1 y las partidas preparadas anteriores mantienen su definición para seguir cargando.

## Validación

73 pruebas automáticas: fuentes según la época, objeto y horario vinculados al crimen, exclusión de armas incompatibles, resolución correcta y guardado, rechazo de una segunda solución, reparación de una sola ficha, reanudación de borradores y compatibilidad anterior.

Pruebas con Qwen real: colonia minera en Marte sin magia y castillo del siglo XIII sin magia ni armas de fuego. Ambas completaron 13 pasos. Se detectaron nombres repetidos, iniciales en vez de nombres, descripciones inglesas y oficios genéricos; se reforzó la validación y se regeneraron las fichas afectadas conservando el resto. Siguen apareciendo expresiones literarias pobres y algunas habitaciones genéricas; SDXS no garantiza fidelidad exacta a todos los objetos o interiores.

Ejecutar con PILOTO.cmd o node local-play.mjs qwen. La pantalla de creación muestra el paso actual y el número de pasos guardados; después muestra la generación de 26 imágenes. La creación requiere el servidor local y los modelos instalados. Borrar almacenamiento del navegador elimina la referencia pendiente, pero no los borradores en disco; la misma descripción permite recuperarlos.
