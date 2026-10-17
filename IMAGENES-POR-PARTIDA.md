# Generación local de imágenes por partida

Al pulsar Crear investigación el servidor valida el expediente y solicita 26 imágenes a SDXS local: cinco retratos, seis habitaciones y quince pistas. La pantalla muestra el progreso; solo entra en la investigación cuando el conjunto está completo. Un error conserva la partida anterior y permite volver a intentarlo.

Las imágenes se guardan en public/prototype/generated/<caseId>/ dentro del proyecto E:\2026 blackwood manor. El guardado incluye imageSet, vinculado a la identidad del caso. Continuar, recargar o importar el mismo guardado en esta instalación usa los mismos archivos. Las miniaturas de selección de mundo siguen siendo vistas previas preparadas.

Cada imagen tiene un prompt adecuado a la ambientación y una semilla derivada de la semilla de partida y su identificador. La pista que vincula al culpable representa el objeto del crimen; los documentos y registros se ilustran sin convertir el dibujo en prueba. El texto sigue siendo la fuente de verdad. SDXS puede producir detalles inexactos.

Los trabajos se ejecutan de uno en uno para compartir la GPU con Qwen. El proceso Python carga SDXS al crear una partida y libera memoria al terminar. El manifiesto se publica al completar todas las imágenes, con prompts, semillas y hashes. Las solicitudes repetidas del mismo caso reutilizan el conjunto ya generado. Los recursos generados están excluidos de Git, pero se conservan en disco.

Requisitos: .venv-images/Scripts/python.exe, PyTorch con CUDA y Diffusers, GPU compatible y modelo models/image-models/sdxs, ya instalados en este equipo. Ejecuta PILOTO.cmd o node local-play.mjs qwen. No se usan servicios de imágenes en la nube.

Exportar JSON exporta el estado, no los archivos binarios. Para trasladar la partida a otro equipo también hay que copiar su carpeta generated/<caseId>. Los guardados antiguos conservan las imágenes preparadas; la generación al inicio se aplica a las nuevas partidas. Falta empaquetar los recursos en la exportación, limpiar conjuntos huérfanos desde la interfaz y recuperar automáticamente una creación interrumpida por recarga.

Validación: 63 pruebas automáticas; planes de imágenes en cuatro mundos, bloqueo de rutas desconocidas, vinculación al guardado y lógica del juego. Además se prueba una generación real desde el navegador y la reutilización de sus archivos.
