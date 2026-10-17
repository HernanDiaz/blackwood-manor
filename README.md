# Blackwood Manor — El último té

MVP jugable en español. Caso fijo de deducción: cinco sospechosos, seis habitaciones, dieciocho pistas, preguntas libres, secretos condicionados a pruebas, tablero, notas, inventario y acusación con evidencia. Sin dependencias de instalación ni servicios obligatorios.

## Ejecutar

Requisito: Node.js 22 o posterior.

Desde esta carpeta:

```powershell
npm start
```

Abrir http://localhost:4173. El servidor se limita al equipo local. Para detenerlo: Ctrl+C. Si el puerto está ocupado, usar `$env:PORT="4174"` antes de iniciar. También puedes abrir `JUGAR.cmd` en Windows.

```powershell
npm test
```

No hace falta `npm install`. No abras index.html directamente: los interrogatorios necesitan el servidor.

## Cómo jugar

1. Inspecciona objetos en las seis habitaciones. Las pistas se recogen una sola vez.
2. Interroga a los cinco personajes con texto libre o preguntas sugeridas. Encontrar documentos u objetos desbloquea temas privados.
3. Fija pistas en el tablero y escribe tus hipótesis. El inventario conserva todos los hallazgos.
4. Acusa indicando persona, método y lugar. Adjunta al menos tres pruebas que acrediten móvil, vínculo con el veneno y oportunidad. Puedes reabrir una acusación fallida.

Se guarda automáticamente en el navegador después de cada cambio. Exportar/Importar permite llevar una copia JSON a otro navegador. Nueva partida pide confirmación. No hay límite de turnos ni callejones sin salida.

## LLM opcional

En PowerShell, configura `OPENAI_API_KEY` en el entorno del proceso y después inicia el servidor. Opcional: `OPENAI_MODEL` (predeterminado: `gpt-4.1-mini`, requiere acceso a un modelo compatible con Structured Outputs). No guardes claves en el código, el navegador ni Git. `.env` está ignorado, pero **no se carga automáticamente**.

El servidor usa Responses API con JSON Schema estricto: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses . El modelo solo elige el identificador de un hecho ya autorizado. El motor devuelve su texto canónico: no se muestra prosa generada libremente. No se envían pistas bloqueadas ni historial, solo la pregunta y los hechos disponibles. `store: false`. En fallo, tiempo agotado o respuesta fuera de catálogo se usa el intérprete local y se indica en el chat. Sin clave todo el juego funciona con clasificación local por temas; esta clasificación tiene comprensión limitada y no mantiene contexto entre preguntas.

## Arquitectura y extensión

- `src/engine.mjs`: caso, cronología, pistas, desbloqueos, validación de guardado y veredicto. Módulo JavaScript puro sin DOM ni Node: reutilizable en una futura aplicación móvil.
- `public/app.mjs`: interfaz y adaptador de almacenamiento local. CSS responsive, sin recursos externos; ilustración ambiental hecha con CSS como provisional.
- `server.mjs`: entrega local y adaptador de clasificación LLM, con tiempo máximo y validación independiente del resultado.
- `test/engine.test.mjs`: pruebas con Node Test Runner, sin paquetes externos.

Para iOS/Android: reutilizar el motor y el esquema de partida; extraer almacenamiento a un adaptador de preferencias/SQLite y la ruta LLM a un backend HTTPS. La interfaz puede empaquetarse en WebView/Capacitor o reemplazarse por una vista nativa. **Este MVP no incluye proyectos Xcode/Gradle, APK/IPA ni funcionamiento autónomo en un teléfono**; usa un servidor local de escritorio. El diseño responsive se conserva al portar.

Para ilustraciones: asociar `assetId` estable a habitación/personaje/pista y añadir un proveedor de imágenes independiente de los hechos. Generar o curar escenas desde descripciones públicas, sin meter pistas aleatorias ni texto generado en el canon. Añadir caché, estados de carga, presupuesto y moderación antes de integrar generación.

## Verificación

11 pruebas automatizadas: cardinalidad y alcance de pistas, descubrimiento idempotente, secretos bloqueados, guardado/restauración, resolución completa, acusaciones inválidas, las 90 combinaciones de persona/método/habitación, las seis combinaciones de evidencia suficiente, validación de entrada, endpoint local y LLM simulado (éxito y fallback). Los tests LLM no realizan llamadas pagadas. No se ha validado una llamada real con credenciales.

Prueba manual en navegador: recoger pistas, fijar al tablero, escribir notas, recargar y continuar, pregunta libre, acusación correcta y nueva partida. Revisar `QA.md` para el resultado final de la inspección visual.

## Antes de producción

- Backend autoritativo para acciones/partidas, autenticación, base de datos y sincronización. Actualmente el estado y el canon son visibles/modificables en el cliente: no hay protección contra trampas ni spoilers al inspeccionar el código.
- TLS, protección de origen/CSRF, límites de peticiones/coste y observabilidad para exponer el endpoint LLM. El servidor solo escucha en loopback y no es un servidor público de producción.
- Backend móvil, empaquetado, firma y pruebas en dispositivos reales; accesibilidad con lectores de pantalla y teclado, traducciones y pruebas de usabilidad.
- Más cobertura semántica, memoria conversacional controlada y respuestas variadas sin alterar hechos. El MVP responde a un tema por pregunta y los personajes no improvisan.
- Ilustraciones reales, audio opcional, licencias y generación de imágenes. No hay generación incluida.
- Migraciones de guardado posteriores a v1, gestión de conflictos y límites del almacenamiento del navegador. No hay service worker/PWA instalable.

La solución y cronología editorial están en `CASE-SPOILERS.md`. Evita leerlo antes de jugar.

## Modelos locales probados

Consulta `PRUEBAS-LOCALES.md`. Para elegir y jugar sin API: abre `PROBAR-LOCAL.cmd`. Requiere este equipo y su motor instalado en `E:\LLMStudio\llama.cpp`. Mantén abierta la consola; Ctrl+C cierra el juego y el motor que ha arrancado. No arranques al mismo tiempo otra copia en los puertos 1235/4173.

La interpretación con modelo local está integrada; la prosa generada libremente se evalúa solo en los benchmarks porque aún contradice el canon. En el juego las respuestas siguen siendo canónicas. Los pesos y el entorno de imágenes son locales e ignorados por Git.

## Qwen por defecto y verificación de respuestas

Actualización: `QWEN-MEJORAS.md` documenta el sistema combinado de ejemplos, recuperación de intenciones y elección de variantes revisadas. Qwen3.5-2B es ahora el predeterminado. La validación es determinista y no admite prosa fuera del catálogo autorizado. Hay fallos de comprensión en preguntas nuevas; consultar los resultados completos antes de valorar calidad de producción.

## Piloto visual y conversacional

Abrir `PILOTO.cmd` y visitar http://127.0.0.1:4173. La nueva pestaña Piloto guía un recorrido con el despacho, Arthur y la taza ilustrados mediante SDXS, conservados en un conjunto visual versionado. Conversación con Qwen3.5-2B y verificación del catálogo. Ver `PILOTO.md` para alcance y pruebas. No se generan de nuevo las imágenes al abrir la partida.
