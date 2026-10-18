# Interrogatorios: clasificar y elegir

En el prototipo de mundos, el personaje ya no redacta sus respuestas. El juego **clasifica** la pregunta del jugador en un tema y **elige** una de las frases escritas para ese tema en el expediente. Es el diseño pensado para móvil: en el teléfono solo haría falta un clasificador pequeño, no un modelo de lenguaje.

## Frases

- `src/statements.mjs` define cada tipo de declaración (coartada sin testigos, secreto con móvil débil, acceso al arma…) con 2–3 redacciones y sus marcadores obligatorios (`{place}`, `{from}`, `{partner}`…).
- El motor rellena horas, lugares y nombres, así que ninguna redacción puede cambiar un hecho.
- Un mundo puede traer frases propias por personaje en `voices.p1['secret.weak']`. Las que omitan un marcador, inventen otro o escriban horas a mano se descartan.
- El interrogatorio alterna las redacciones para no repetirse. Si una pregunta toca algo que el personaje aún no puede contar, responde con una evasiva de su voz.
- La generación libre anterior sigue disponible con `BLACKWOOD_FREE_DIALOGUE=1`, para comparar.

## Temas

`alibi`, `motive`, `secret`, `link`, `timeline`, `seen`, `object`, `identity`, `social` y `unknown`.

## Cómo se decide el tema

1. **Clasificador aprendido** (`scripts/question-classifier-server.py`, puerto 1237): si su confianza es ≥ 0,6, decide él.
2. **Reglas sin modelo** (`inferPrototypeTopic`): si el clasificador duda o no está disponible.
3. **Qwen**, solo si está activo y ni el clasificador ni las reglas han decidido.

`PILOTO.cmd` arranca el clasificador si está entrenado. `BLACKWOOD_CLASSIFIER=0` lo desactiva. Sin él, el juego sigue funcionando con las reglas.

## El clasificador

- **Base:** el codificador multilingüe de Laya (mmBERT-base, 307M parámetros, Apache 2.0), con una capa lineal entrenada con nuestras preguntas. La cabeza y el código originales de Laya no se usan.
- **Datos:**
  - `test/question-bank.mjs` tiene 420 preguntas escritas a mano y agrupadas por intención. Los grupos, no las preguntas sueltas, van a ajuste (156) o a prueba (264).
  - `test/question-bank-train*.mjs` añade 667 preguntas solo para ajuste.
  - Ninguna pregunta de prueba se ha usado para entrenar ni para ajustar las reglas.
- **Entrenar:**
  ```
  node benchmarks/route-split.mjs benchmarks/results/question-split-extra.json --extra
  .venv-images/Scripts/python.exe -I scripts/train-question-classifier.py "<repo>" benchmarks/results/question-split-extra.json
  ```
  Necesita `models/laya-multilingual/` (descargado de `convaiinnovations/laya`, carpeta `multilingual/`) y guarda el resultado en `models/question-classifier/` (614 MB en fp16).

## Resultados (264 preguntas de prueba)

| Clasificador | Ajuste | Aciertos | Tiempo por pregunta |
|---|---|---|---|
| Reglas | — | 140 (53 %) | instantáneo |
| Qwen 2B, prompt con temas descritos | — | 89 (34 %) | ~1,5 s, GPU |
| Reglas y después Qwen | — | 166 (63 %) | ~1,5 s, GPU |
| multilingual-e5-small, vecinos más cercanos | 823 preguntas | 203 (77 %) | ~3 ms, GPU |
| Laya ajustado | 156 preguntas | 115–127 (44–48 %) | ~150 ms, CPU |
| Laya ajustado | 671 preguntas | 212–222 (80–84 %) | ~150 ms, CPU |
| Laya ajustado | 823 preguntas | 214–223 (81–84 %) | ~150 ms, CPU |
| Laya ajustado | 823 + 627 reformulaciones de Qwen | 218–220 (83 %) | ~150 ms, CPU |
| **Laya y, si duda, reglas** (lo integrado) | 823 preguntas | **216–224 (82–85 %)** | ~150 ms, CPU |

Los rangos son tres entrenamientos con semillas distintas. El modelo guardado obtuvo 223/264.

Conclusiones:
- Lo que más pesa son los ejemplos escritos con cuidado: pasar de 156 a 671 subió Laya 36 puntos. A partir de ahí se estanca.
- Las reformulaciones de Qwen no aportan; traen ruido y hasta texto en inglés.
- Laya supera al sistema anterior (reglas y Qwen) en 20 puntos, en CPU y siendo más rápido.

Scripts: `benchmarks/route-rules-qwen.mjs`, `benchmarks/e5-knn.mjs`, `benchmarks/laya_classifier.py`, `benchmarks/augment-questions.mjs` y `benchmarks/filter-augmented.mjs`. Resultados en `benchmarks/results/routing-*.json`.

## Límites

- Las preguntas y las etiquetas las escribió una sola persona (el asistente). Las revisó el usuario a partir de la muestra de `benchmarks/REVISION-ETIQUETAS.md`, sin encontrar discrepancias. Preguntas de jugadores reales darán otra cifra.
- Las preguntas que solo se entienden con la anterior («¿Por qué?») no están en el banco; las resuelve una regla que repite el último tema.
- Para móvil faltan la cuantización (unos 310 MB en int8) y medir en un teléfono real; los 150 ms son de la CPU de este PC.
- Licencias: Laya, Apache 2.0. multilingual-e5-small (solo para la comparación), MIT en la conversión GGUF usada.
