# Pruebas locales de Blackwood Manor

17 octubre 2026. Equipo: RTX 5060 Ti 16 GB y 32 GB de RAM.

## Resultado de chat

**Gemma 4 E2B es el mejor candidato de esta prueba piloto. Ninguno está aprobado para generar libremente los hechos del caso.**

| Modelo Q4_K_M | Comprensión ronda 1 | Comprensión ronda 2 | Media clasificación R2 | Media diálogo R2 |
|---|---:|---:|---:|---:|
| Qwen3.5-2B | 17/24 | 19/24 | 0.35 s | 0.66 s |
| Gemma 4 E2B | 20/24 | 21/24 | 0.31 s | 0.33 s |
| SmolLM3-3B | 17/24 | 19/24 | 0.21 s | 0.35 s |

## Metodología y límites

216 peticiones reales: 3 modelos × 2 rondas × (24 preguntas clasificadas y 12 pruebas de diálogo). Misma batería por ronda, temperatura 0, semilla 42, contexto 4096, razonamiento desactivado, 40 tokens máximos en clasificación y 180 en diálogo. Runtime existente de llama.cpp build 10581, offload GPU. No se ejecutaron modelos de chat e imágenes simultáneamente para medirlos. No se aislaron las demás aplicaciones del equipo.

Ronda 1: hechos permitidos e instrucciones básicas. Ronda 2: nombres y roles explícitos, vínculo de las relaciones con Edmund, definición de temas y obligación de reconocer los hechos ya autorizados. Se conservan ambas rondas, sin seleccionar solo respuestas favorables. No hay búsqueda de parámetros ni ajuste fino.

Las cifras son tiempo de petición completa con el modelo cargado; **no son tiempo hasta el primer token**, ni incluyen descargar/cargar el modelo. Las peticiones se hacen en secuencia con reutilización de prefijos por el motor, por lo que el caché influye en el resultado. Son respuestas cortas, no ensayos largos. Las etiquetas esperadas son las del tema de conversación, no una evaluación automática de veracidad de toda la respuesta.

Muestra pequeña, una ejecución por configuración: estos porcentajes no estiman fiabilidad en producción. Las pruebas no sustituyen una evaluación en dispositivos Android/iPhone, sesiones largas, consumo o temperatura. No se midió memoria máxima de chat.

## Revisión humana del diálogo libre — contiene detalles del caso

- Qwen R2: inventó personas presentes en el despacho; situó la carta escondida en la cocina; afirmó que una joya ya había sido vendida, cuando el canon solo contiene la intención de venderla.
- SmolLM R2: negó facturas falsas y la relación amorosa pese a estar autorizadas; inventó una esposa y un tratamiento; dio un código de caja fuerte inexistente.
- Gemma R2: siguió mejor los hechos centrales, pero todavía fue evasivo ante hechos autorizados, salió del personaje y afirmó que Clara no poseía ninguna arma, algo que su catálogo no establece. No se adjudica una tasa automática de veracidad a estas observaciones.

La primera versión del prompt también era ambigua: varias relaciones no nombraban al interlocutor. La segunda ronda lo corrigió, pero no eliminó las invenciones.

## Modo jugable

`PROBAR-LOCAL.cmd` permite elegir los tres modelos. Arranca el motor local instalado y el juego. No requiere API ni Internet después de descargar los pesos. El modelo solo selecciona un identificador autorizado; el motor devuelve el texto canónico. La generación libre evaluada **no está activada en el juego**. Se muestra el tiempo de respuesta del modelo en el chat. Si falla el modelo se usa el intérprete por reglas. Los fallos semánticos pueden provocar una respuesta poco pertinente, aunque no permiten devolver un identificador bloqueado.

Integración comprobada con Gemma: pregunta sobre el té y pregunta sobre un secreto bloqueado. Resultado guardado en `benchmarks/results/integration.json`. 12/12 pruebas del motor y adaptadores pasan.

Los tres GGUF están en `models/` y sus SHA-256 coinciden con Hugging Face. Revisiones, tamaños, hashes y licencias: `benchmarks/models-manifest.json`. Registrados por enlace físico en LM Studio: no duplican el espacio de sus pesos. No se alteraron ni descargaron de nuevo tus modelos previos.

## Reproducir chat

Arrancar el modelo desde `PROBAR-LOCAL.cmd`; en otra consola ejecutar `node benchmarks/run-chat.mjs nombre-de-resultado 1235`. Puede contener spoilers: se habilitan todas las pistas para algunos ejemplos de evaluación. Para el prompt inicial usar `run-chat-v1.mjs`. Los JSON conservan preguntas, salidas, errores, tokens y tiempos originales.

## Fuentes de modelos

- https://huggingface.co/bartowski/Qwen_Qwen3.5-2B-GGUF
- https://huggingface.co/lmstudio-community/gemma-4-E2B-it-GGUF
- https://huggingface.co/ggml-org/SmolLM3-3B-GGUF

## Imágenes: resultados reales

Se descargaron y ejecutaron SDXS-512-DreamShaper y Stable Diffusion 1.5. Tres prompts idénticos por modelo (retrato, despacho, frasco), semillas 42 y 123: 12 imágenes de 512 × 512. Los prompts se escribieron en inglés para esta prueba; no se evaluó comprensión de prompts en español. SDXS usa un paso y guidance 0, según su ficha; SD1.5 usa 25 pasos y guidance 7.5. No son arquitecturas ni presupuestos de cálculo equivalentes: se comparan sus configuraciones prácticas de partida, no eficiencia a igual calidad.

La galería está en `benchmarks/gallery.html`; la hoja comparativa en `benchmarks/images/comparison.jpg`; resultados y prompts completos en `benchmarks/images/results.json`. Revisiones y archivos de los pesos en `models/image-models/*/source-manifest.json`. El entorno está fijado en `benchmarks/requirements-images-lock.txt`.

Observaciones visuales de esta muestra:

- SDXS produce una estética más homogénea y apropiada para explorar la dirección artística de Blackwood. En la muestra es mucho más rápido que SD1.5.
- No cumple todos los detalles: añade dos frascos en una imagen, líquido pese a solicitar un frasco vacío y escritura pese a pedir etiqueta en blanco. El despacho no representa de forma fiable la taza solicitada. No puede usarse la ilustración como fuente de hechos.
- SD1.5 varía más de estilo entre semillas, desde dibujo plano hasta aspecto de grabado. No se ha ajustado su prompt, sampler ni usado un modelo afinado a la estética del juego.
- Ambos pueden variar la cara entre semillas. No se han probado referencias de identidad, ControlNet, adaptadores ni generación de las 29 imágenes de un caso completo.

Los tiempos excluyen carga, descarga y una imagen de calentamiento por modelo. Se sincroniza CUDA antes y después de cada generación. La memoria es el máximo de tensores CUDA asignados por PyTorch: **no** es toda la RAM/VRAM del proceso ni un requisito de memoria móvil. No se midió consumo eléctrico ni batería.

Para repetir: `node benchmarks/download-images.mjs` y después `.venv-images\Scripts\python.exe benchmarks\run-images.py`. El script carga los pesos locales y guarda imágenes persistentes; la descarga inicial necesita Internet. La inferencia no usa servicios externos.

La preparación encontró una mezcla incompatible de versiones de PyTorch. Se creó un entorno limpio con CUDA y se verificó la RTX 5060 Ti. El entorno anterior quedó apartado como `.venv-images-repair-backup`: su eliminación fue bloqueada por la revisión automática. No se usa en las pruebas ni está incluido en Git.

Fuentes: https://huggingface.co/IDKiro/sdxs-512-dreamshaper y https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5 .

Mediciones de imágenes en este equipo: SDXS (6 imágenes) media 0,115 s, rango 0,094–0,166 s, máximo asignado 1025 MiB; SD1.5 (6 imágenes) media 3,391 s, rango 3,294–3,667 s, máximo asignado 2676 MiB. Solo inferencia con modelo cargado; no extrapolar a un teléfono.
