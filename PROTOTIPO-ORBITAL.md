# Mundos jugables — selector inicial

Abre http://127.0.0.1:4173/prototype/index.html. Inicia con PILOTO.cmd para Qwen local o npm start para respuestas del motor.

La primera pantalla permite elegir Ciencia ficción (15 métodos), Fantasía (9), Medieval (7), Años 30 (8) o Aleatorio. La selección actualiza personajes, seis escenarios, ilustraciones y métodos compatibles. Aleatorio decide una vez al crear; la elección concreta se guarda. Son paquetes preparados, no generación libre de mundos en cada partida.

Cada investigación cambia culpable, método, escenario, móvil, horario y coartadas. Reúne quince pistas, interroga, fija documentos y acusa con pruebas de móvil, vínculo y oportunidad. La conversación del prototipo sigue siendo de catálogo asistida por Qwen; no es prosa libre.

El guardado, exportación e importación conservan el mundo y la reconstrucción exacta. Los guardados orbitales anteriores siguen cargándose. Se conserva la clave local independiente de Blackwood. Al entrar se presenta el selector y, si hay guardado, Continuar la actual. Previsualizar otro mundo no cambia la partida hasta Crear investigación.

Veintisiete imágenes adicionales se generaron una vez con SDXS local para medieval, fantasía y métodos nuevos. Años 30 reutiliza ilustraciones de Blackwood. Los recursos son persistentes; manifest.json conserva prompts, semillas y hashes. Las imágenes son orientativas y los hechos probatorios están en el texto.

Validación: 58 pruebas automáticas pasan. Incluyen resolución y restauración de cada método en los cuatro mundos, disponibilidad de recursos, exclusión de tecnología en medieval, compatibilidad con guardados anteriores y rechazo de rutas de mundo desconocidas. Se comprobó en navegador selección, creación de fantasía, interrogatorio y retorno al selector tras recarga.

Pendiente para producción: mejorar voces y hechos específicos de cada ambientación (parte de los documentos y del diálogo aún comparte lenguaje laboral), revisión artística completa, generación libre de mundos con validación semántica fiable, guardado sincronizado, protección del expediente en servidor y empaquetado móvil. La verdad sigue disponible en el cliente.

Actualización: las nuevas partidas generan sus propias 26 imágenes al pulsar Crear investigación. Los conjuntos preparados solo sirven como vistas previas y para guardados anteriores. Consulta IMAGENES-POR-PARTIDA.md.
