# Ambientación libre — piloto local

En http://127.0.0.1:4173/prototype/index.html elige Libre · describe tu mundo. Escribe, por ejemplo: Una colonia minera en el planeta Marte, aislada por una tormenta de polvo. Ciencia ficción realista, sin magia. Pulsa Crear investigación.

Qwen trabaja en tres etapas: título y categoría técnica; seis habitantes con oficio, personalidad y descripción visual; seis lugares interiores con sus descripciones y prompts. Se revisan nombres, dimensiones, campos, idioma básico de los prompts y límites de texto. Cada etapa tiene hasta tres intentos. Uno de los seis habitantes se separa como víctima y quedan cinco sospechosos: así se evita que el modelo la duplique entre ellos.

El motor construye después culpable, método compatible, cronología, coartadas, tres clases de pruebas y móvil. Los móviles son plantillas controladas de fraude, desvío de recursos y venta de información. El modelo no decide la verdad ni escribe las pruebas. La categoría scifi/noir/medieval/fantasy limita el catálogo técnico; no restringe el texto de ambientación a esos cuatro mundos preparados. Por prudencia, los lugares libres se consideran interiores sin capacidades especiales: no se habilitan métodos que requieran una torre, criogenia o soporte vital solo porque el modelo los mencione.

Tras validar el expediente, SDXS genera las 26 imágenes. En mundos libres los retratos y escenarios usan los prompts del mundo recién creado, no los de los paquetes preparados. El conjunto se almacena por identidad de partida.

El guardado contiene una copia completa del mundo (customWorld), la semilla y la referencia a las imágenes. Recargar, exportar/importar o interrogar usa esa definición, sin volver a pedir un mundo al modelo. El servidor valida también los mundos importados. Si la creación falla se conserva el guardado anterior y aparece un mensaje; no se sustituye silenciosamente por Blackwood ni por el mundo orbital.

Requisitos: el arranque local completo (PILOTO.cmd o node local-play.mjs qwen), Qwen en 127.0.0.1:1235 y SDXS instalado. npm start permite jugar mundos preparados sin Qwen, pero la creación libre requiere el modelo.

Limitaciones: generación experimental con un modelo pequeño; los controles estructurales no garantizan calidad literaria, fidelidad perfecta a cualquier petición ni ausencia total de rarezas. Se mantienen cinco sospechosos, seis interiores y quince pistas; no se generan nuevas mecánicas, especies, sistemas mágicos o armas fuera del catálogo. Algunos diálogos y documentos siguen usando lenguaje compartido. Las imágenes pueden representar detalles inexactos. El JSON exportado no incluye los archivos de imagen: para otro equipo hay que copiar también la carpeta del conjunto.

Validación: 68 pruebas automáticas de lógica y guardado, incluidas nuevas pruebas de mundos libres, prompts específicos, modificación de snapshots y fallo del modelo. La prueba local en Marte requirió simplificar las tareas después de observar etiquetas de víctima, duplicados y mezcla de idiomas en versiones iniciales.


Prueba completa realizada: mundo La Soledad del Desierto a partir de la petición de Marte, cinco sospechosos, seis habitaciones, 26 archivos con hashes verificados, conversación verificada con Qwen, recarga sin regeneración y resolución correcta del caso. SDXS representó un laboratorio como un paisaje rocoso en esta prueba; se reforzó el encuadre interior para las generaciones siguientes. La fidelidad visual sigue siendo una limitación del modelo.

Actualización: el flujo de tres lotes se ha sustituido por 13 fichas verificadas y reanudables, con reglas de tecnología y pistas específicas por época. Consulta CREACION-POR-PASOS.md.
