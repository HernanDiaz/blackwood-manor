# QA — 17 octubre 2026

Resultado: 11/11 pruebas automatizadas superadas con Node 22.14.0. Sintaxis de servidor, motor e interfaz verificada.

## Comprobado en navegador integrado

- Arranque y carga del caso sin dependencias externas.
- Recogida de taza, libro de cuentas, bandeja y frasco; contadores y botones actualizados.
- Fijar la taza al tablero y abrir el tablero con la pista.
- Escribir notas, recargar, conservar pistas y continuar la investigación.
- Pregunta libre sobre las cuentas: el médico responde con el secreto desbloqueado, en modo local.
- Selección de culpable, método, habitación y tres pruebas: resultado «La verdad sale a la luz».
- Diseño móvil a 390 px de viewport: anchura de documento observada 375 px (área útil con barra), sin desbordamiento horizontal. Inspección visual de tarjetas, habitaciones y tipografía. Capturas `mobile-preview.png` y `preview.png`.

## Incidencia y límites

El diálogo nativo de confirmación de nueva partida bloqueó la automatización del navegador después de verificar la victoria. Se reemplazó por una confirmación en dos pulsaciones dentro del propio botón. La versión modificada supera la comprobación de sintaxis, pero la segunda pulsación no pudo verificarse con esa sesión de automatización bloqueada. Se dejó una vista limpia en otra dirección local para capturar la interfaz sin spoilers.

No se realizaron pruebas en dispositivos físicos, ni una llamada real a OpenAI, ni importación/exportación a través del selector de archivos del navegador. La serialización/restauración de la partida y los modos LLM/fallback sí están cubiertos por pruebas automatizadas. La comprensión local es por temas y no garantiza interpretar cualquier frase.
