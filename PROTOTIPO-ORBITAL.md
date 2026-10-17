# Prototipo orbital jugable

Acceso: http://127.0.0.1:4173/prototype/index.html. También hay un botón en el laboratorio y un enlace en Blackwood. Se sirve con el mismo servidor y se puede iniciar con PILOTO.cmd para Qwen local, o npm start sin modelo.

Este prototipo incorpora quince métodos compatibles con el mundo orbital. Los otros cinco del catálogo pertenecen a ambientaciones todavía no jugables en este piloto. El mundo, los cinco personajes y las seis habitaciones ya están generados; el motor crea la reconstrucción al empezar. No se llama de nuevo al generador de mundos ni se generan imágenes al abrir cada partida.

## Jugar

Elige Sorpresa o fija un método para probarlo, y pulsa Crear investigación. En Sorpresa, la siguiente partida evita la familia de método y el culpable anteriores, cuando hay alternativas. Los métodos solo se asignan a escenas compatibles.

Explora las seis habitaciones y reúne quince pistas. Interroga a los personajes, fija pruebas en el tablero y escribe notas. Presenta una acusación indicando culpable, método, lugar y pruebas de móvil, vínculo material y oportunidad. Si fallas puedes reabrir. Otra investigación permite crear un caso nuevo o volver al actual antes de sustituirlo.

El interrogatorio acepta preguntas escritas libremente. Qwen clasifica la pregunta cuando hace falta y elige entre formulaciones del expediente; el motor verifica el texto y conserva los secretos bloqueados. Es conversación de catálogo asistida por modelo, no generación de prosa libre. Cuando el modelo no está disponible se usa una respuesta del motor.

## Guardado y recursos

Usa una clave de guardado distinta de Blackwood: blackwood-orbital-prototype-v1. Recargar, exportar e importar conserva semilla, selección de método, identidad del caso, notas, pruebas y chat. La firma de definición detecta un cambio de expediente; no es un mecanismo de protección frente a trampas. La verdad y la lógica siguen disponibles en el cliente.

Los quince métodos tienen ilustraciones locales. Los retratos y habitaciones reutilizan el conjunto orbital preparado. Los ficheros se conservan y se verifican con hashes. Se corrigieron dos imágenes de armas y una cuerda durante revisión previa a publicar; ninguna generación se realiza durante la partida. Algunas ilustraciones siguen siendo aproximadas; los hechos probatorios pertenecen al texto.

## Arquitectura

src/prototype-engine.mjs construye y restaura los casos a partir del mundo orbital, el catálogo y la semilla. El método determina los requisitos de escena, el informe y la cronología. Cada caso incluye coartadas recíprocas de cuatro inocentes y la mentira inicial del culpable, con una prueba de confrontación.

src/prototype-llm.mjs limita los recuerdos por persona y evidencia. El endpoint /api/prototype/interrogate reconstruye el caso desde el mundo de confianza del servidor y valida el guardado. La interfaz está en public/prototype. La configuración visual está en assets/manifest.json y el mundo base en world.json.

## Validación

53 pruebas automáticas con npm test. Se prueban las quince armas compatibles, secretos bloqueados, guardado/importación, rechazo de mezclas entre casos, variantes sucesivas, rechazo de textos del modelo fuera de catálogo y hashes de imágenes.

Para cada método se enumeran cinco personas, quince métodos y seis habitaciones: 6.750 acusaciones en total, con una combinación ganadora por caso y pruebas suficientes. Se comprueba que ninguna acusación gana al omitir una categoría de evidencia.

En un origen de prueba separado se completó una investigación con revólver: quince pistas, interrogatorio real con Qwen y respuesta verificada, tres pistas fijadas, notas persistentes al recargar y acusación correcta. Después se creó un caso con cápsula criogénica y se verificó que su escena fuera compatible. La vista móvil no mostró desbordamiento horizontal.

Quedan mejorar dificultad y diversidad de las historias, permitir otros mundos y conectar generación de ambientaciones al flujo interactivo. Este piloto utiliza un solo mundo orbital y pruebas bastante directas; no sustituye las cinco variantes originales ni altera sus guardados.
