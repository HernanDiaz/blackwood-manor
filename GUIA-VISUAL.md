# Guía visual compartida

Los mundos libres preparan ahora cuatro frases visuales en inglés con Qwen: población, arquitectura, materiales e iluminación. Se valida su estructura y algunas restricciones explícitas (tecnología, magia, enanos, entorno subterráneo y Marte), con tres intentos como máximo. Una guía inválida detiene la creación con opción de reanudar; no se acepta silenciosamente. No existe una validación semántica general para cualquier petición.

La guía se guarda en `.local/visual-guides` por descripción, reglas y estilo. No modifica el mundo ni el identificador del expediente, preservando la compatibilidad de guardados. Los retratos reciben la población y luz; las habitaciones, la arquitectura, materiales y luz. Las pistas conservan su objeto y reciben luz y composición de objeto aislado, sin añadir un castillo o escenario que distraiga. La petición y el manifiesto de imágenes nuevas registran la guía. Los conjuntos de imágenes existentes se siguen recuperando; no se regeneran automáticamente.

Piloto con SDXS local, un paso, misma semilla y sujetos antes/después: mejoran el aspecto de enano y el interior subterráneo. El taller todavía se aproxima a un corredor, y una ballesta no se reproduce con precisión: antes apareció una mesa con velas; con descripción breve aparece un artefacto deformado. Mejorar el contexto no resuelve la fidelidad de objetos del modelo. No se ha implementado revisión visual automática y las ilustraciones no constituyen la prueba lógica del caso.

Prueba adicional con Qwen en Marte: guía con trajes claros, ventanas selladas, polvo rojo, acero/aluminio e iluminación artificial. Se rechazaron respuestas que copiaban las definiciones genéricas de los campos y se ajustaron las instrucciones para pedir detalles concretos. La comprobación de palabras clave es parcial, no una garantía de calidad artística.

Siguiente comparación recomendada: otro generador de imágenes contra SDXS con los mismos sujetos y semillas; medir tiempo, memoria y fidelidad, especialmente en herramientas/armas. No se han descargado modelos nuevos en este cambio.
