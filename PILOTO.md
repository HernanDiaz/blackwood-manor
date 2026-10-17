# Piloto integrado: imágenes SDXS y texto Qwen

El conjunto `blackwood-pilot-v1` contiene tres ilustraciones generadas localmente por SDXS-512-DreamShaper: Arthur Finch, el despacho y la taza. Se revisaron candidatos y se descartaron tazas deformadas o duplicadas. Se generaron durante la preparación del piloto, no al abrir cada partida.

## Probar

Abrir `PILOTO.cmd` (Qwen3.5-2B) o `PROBAR-LOCAL.cmd`, opción 1. Visitar http://127.0.0.1:4173 y seleccionar **Piloto**.

1. Entrar al despacho. Inspeccionar la taza si todavía no está descubierta.
2. Hablar con Arthur: «¿Quién llevó la bandeja al despacho?».
3. Fijar la taza al tablero y guardar una nota.
4. Recargar y volver a hablar con Arthur: permanecen la imagen y la conversación.

El resto del caso continúa disponible. Los otros cuatro personajes y cinco habitaciones mantienen sus presentaciones anteriores.

## Persistencia y separación de tareas

- Los tres WebP suman **78.836 bytes** (unos 77 KiB), sin contar el manifiesto.
- Los archivos están en `public/assets/blackwood-pilot-v1`. El manifiesto registra prompt, semilla, revisión del modelo y SHA-256 de cada imagen.
- La partida guarda `visualSet: blackwood-pilot-v1`. Los guardados anteriores sin ese campo se migran; una versión visual desconocida se rechaza en lugar de cambiar las ilustraciones silenciosamente.
- Las rutas son estables; las imágenes no se regeneran al recargar ni al abrir una nueva partida de este mismo caso. El instalador preserva un manifiesto existente.
- La taza solo se muestra como ilustración de pista cuando está descubierta. Retrato y habitación son ambientales. Las imágenes son ilustraciones, no una reproducción forense de residuos u horarios; los detalles de las pruebas se describen en el texto.
- SDXS se descargó de la memoria antes de arrancar Qwen. En el juego solo Qwen permanece cargado; las imágenes son archivos servidos localmente.
- El texto conserva los ejemplos, reglas de intención y verificación del catálogo descritos en `QWEN-MEJORAS.md`. La variación sigue siendo controlada, no diálogo libre ilimitado. Los fallos de comprensión documentados siguen siendo aplicables.

## Verificación

18/18 pruebas: motor y validación del texto, migración de guardados, ocultación de ilustraciones de pistas bloqueadas y hashes de las tres imágenes. Además, recorrido comprobado en navegador integrado con una respuesta real de Qwen verificada (unos 750 ms en este equipo). No es una medición de móvil.

## Reproducir la preparación

`benchmarks/generate-pilot.py` conserva candidatos existentes; los scripts de refinamiento documentan los ensayos de taza. `benchmarks/install-pilot-assets.py` empaqueta los candidatos seleccionados y no sobrescribe un conjunto instalado. Para otra dirección artística o una nueva generación hay que crear un conjunto con otro identificador, revisar las imágenes y registrar la migración.

Esto es un piloto de tres ilustraciones. No hay botón de generación arbitraria dentro de la aplicación ni se ha ilustrado todavía el conjunto de 29 imágenes del caso.

Revisión visual adicional: imágenes cargadas correctamente en el navegador, retrato y respuesta visibles a 390 px sin desbordamiento horizontal del documento. Recarga comprobada: se mantienen conversación e identificadores de imagen. También se comprobó la taza ilustrada en la escena ya descubierta. Los menús usan desplazamiento horizontal en pantallas estrechas.
