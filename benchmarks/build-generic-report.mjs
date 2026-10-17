import fs from 'node:fs/promises';
const base=new URL('./generic-pilot/',import.meta.url),m=JSON.parse(await fs.readFile(new URL('reviewed/mystery.json',base),'utf8'));
const guided=JSON.parse(await fs.readFile(new URL('guided/run-log.json',base),'utf8')),audit=JSON.parse(await fs.readFile(new URL('reviewed/audit.json',base),'utf8'));
const images=new URL('images/'+m.id+'/',base),manifest=JSON.parse(await fs.readFile(new URL('manifest.json',images),'utf8'));
const dest=new URL('../public/lab/',import.meta.url);await fs.mkdir(new URL('assets/',dest),{recursive:true});
for(const a of manifest.assets)await fs.copyFile(new URL(a.file,images),new URL('assets/'+a.file,dest));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=(kind,id,title)=>`<img src="assets/${kind}-${id}.webp" alt="${esc(title)}" loading="lazy">`;
const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Laboratorio · Misterio orbital</title><link rel="stylesheet" href="style.css"></head><body><header><a href="/">BLACKWOOD · LABORATORIO</a><span>PRUEBA LOCAL · QWEN + SDXS</span></header><main><section class="hero"><div><small>DEL CASO FIJO AL MUNDO GENERADO</small><h1>Un misterio<br>fuera de Blackwood.</h1><p>${esc(m.world.premise)}</p><p class="note">Muestra de evaluación. No reemplaza tu partida ni es todavía el selector de ambientaciones. Las declaraciones y la lógica del caso se han construido con un motor; el modelo aporta nombres, voces y descripciones.</p></div>${image('room','r1','Escenario orbital generado')}</section><section class="stats"><div><b>0 / 3</b><span>casos libres aceptables</span></div><div><b>5 + 6 + 15</b><span>personajes, escenarios y pistas del piloto guiado</span></div><div><b>26</b><span>imágenes locales persistentes</span></div><div><b>1</b><span>solución en 90 acusaciones simuladas</span></div></section><h2>Cinco voces nuevas.</h2><div class="people">${m.world.people.map(p=>`<article>${image('person',p.id,p.name)}<h3>${esc(p.name)}</h3><small>${esc(p.role)}</small><p>${esc(p.personality)}</p></article>`).join('')}</div><h2>Seis espacios reconocibles.</h2><div class="rooms">${m.world.rooms.map(r=>`<article>${image('room',r.id,r.name)}<h3>${esc(r.name)}</h3><p>${esc(r.description)}</p></article>`).join('')}</div><section class="limits"><h2>La diferencia está en el control.</h2><p>La generación autónoma falló en tres intentos: horarios inválidos, coartadas incoherentes y pistas duplicadas. El piloto guiado pasó las comprobaciones de estructura, pero la revisión encontró una ficha con el nombre equivocado, una introducción vacía y objetos visuales repetidos. Se corrigieron; las imágenes se generaron una sola vez y se guardaron con su expediente.</p><p>No se ha demostrado todavía que un modelo pequeño pueda escribir y verificar sin supervisión un misterio completo. Este laboratorio separa lo que creó el modelo de lo que fijó o corrigió el motor. El juego principal sigue intacto.</p></section><details><summary>Ver las quince pistas y la solución · contiene spoilers</summary><div class="rooms">${m.clues.map(c=>`<article>${image('clue',c.id,c.title)}<h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join('')}</div><h2>La verdad del caso</h2><p>${esc(m.plot.story)}</p></details></main><footer>Generado y probado en este equipo · imágenes orientativas · investigación experimental</footer></body></html>`;
await fs.writeFile(new URL('index.html',dest),html);
await fs.writeFile(new URL('style.css',dest),`*{box-sizing:border-box}body{margin:0;background:#101d23;color:#e5e8e0;font:16px/1.65 system-ui,sans-serif}header,main,footer{max-width:1200px;margin:auto;padding:28px}header{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #35515a;font-size:12px;letter-spacing:.12em}a{color:#d1b575;text-decoration:none}small{color:#d1b575;letter-spacing:.08em}h1,h2,h3{font-family:Georgia,serif;line-height:1.15}h1{font-size:clamp(36px,5vw,66px);margin:18px 0}h2{font-size:32px;margin:54px 0 24px}h3{font-size:23px;margin:16px 0 6px}p{color:#b7c6c8}.hero{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}.hero img{width:100%;border-radius:18px}.note{font-size:13px;padding:14px;border-left:2px solid #d1b575}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;border-block:1px solid #35515a;padding:24px 0;margin:36px 0}.stats b{display:block;color:#d1b575;font:32px Georgia,serif}.stats span{display:block;font-size:13px;color:#b7c6c8}.people{display:grid;grid-template-columns:repeat(5,1fr);gap:18px}.rooms{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}article{background:#182a32;border:1px solid #304751;padding:12px;border-radius:8px}article img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px}article p{font-size:13px}.limits{background:#17282f;padding:10px 24px 20px;margin:40px 0}summary{cursor:pointer;padding:20px;border:1px solid #d1b575;color:#d1b575}details>.rooms{margin-top:24px}footer{font-size:12px;color:#9faeb0}@media(max-width:700px){header{display:block}header span{display:block;margin-top:8px}main{padding:20px}.hero{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}.people{grid-template-columns:repeat(2,1fr)}.rooms{grid-template-columns:1fr}.people article:last-child{grid-column:span 2}.people article:last-child img{max-height:260px;object-position:top}.people article p{font-size:13px}}`);
const seconds=manifest.assets.reduce((n,a)=>n+a.seconds,0),bytes=manifest.assets.reduce((n,a)=>n+a.bytes,0);
const report=`# Pruebas de generación genérica — 18 de octubre de 2026

Se probaron tres generaciones libres con Qwen3.5-2B local: dos estaciones espaciales y una fortaleza fantástica. Ninguna se aceptó. Después se produjo un expediente orbital guiado, con cinco personajes, seis escenarios y quince pistas, y sus 26 imágenes con SDXS.

## Resultados

| Prueba | Resultado |
|---|---|
| Generación libre 1 | Rechazada: crimen y muerte en el mismo minuto; víctima repetida como sospechosa en la prosa |
| Generación libre 2 | Rechazada: método y móvil incoherentes, coartadas inválidas e identificadores de pistas duplicados |
| Generación libre 3 | Rechazada: coartadas inválidas y pistas duplicadas o ausentes |
| Piloto guiado | Grafo de deducción válido: una solución en 90 acusaciones simuladas; las tres categorías de prueba son necesarias |
| Revisión de presentación | Detectó identidad equivocada, introducción vacía, nombres poco naturales y prompts repetitivos; se aplicaron reparaciones registradas |
| Imágenes revisadas | 26 imágenes, ${(bytes/1e6).toFixed(2)} MB en total; ${seconds.toFixed(1)} s de inferencia, carga del modelo aparte |

El texto guiado requirió ${guided.seconds.toFixed(1)} s en 29 llamadas pequeñas, con el modelo ya cargado. Las cuatro peticiones de reparación finales sumaron ${audit.modelRepairs.reduce((n,r)=>n+r.seconds,0).toFixed(1)} s. Las cifras son de este equipo; no son mediciones en móviles ni incluyen descargar o cargar los modelos. Es un piloto de un caso guiado, no una tasa de éxito estadística.

## Qué creó cada parte

Qwen creó nombres, personalidades, apariencias, nombres y descripciones de escenarios. Seleccionó culpable, escena, método y móvil entre opciones compatibles. Produjo borradores de títulos, prompts e introducción.

El motor fijó los identificadores, funciones de personajes y habitaciones, horarios, parejas de coartada, estructura de pruebas, textos forenses y condiciones de solución. El método y móvil proceden de un pequeño catálogo temático; no fueron inventados libremente por Qwen en el piloto guiado. Los títulos y prompts de pistas se corrigieron con plantillas según su función, y se usó una introducción factual del motor cuando el borrador omitía la muerte. Un nombre de sala que repetía instrucciones se sustituyó por su función aprobada. No se atribuyen esas correcciones al modelo.

La revisión visual acortó los prompts, puso el objeto antes del estilo y separó documentos, tarjetas, guantes, cámara, registros y dispositivo del crimen. La primera tanda se conserva para comparar. Hay desviaciones menores de detalle y escritura artificial en algunas imágenes; el texto de la prueba conserva la autoridad.

## Ver y reproducir

La muestra está en http://127.0.0.1:4173/lab/index.html. Es una galería de evaluación con spoilers plegados; no es una partida nueva ni una integración del generador en la interfaz del juego.

Los archivos maestros están en E:\\2026 blackwood manor. Los resultados y respuestas originales se conservan en benchmarks/generic-pilot; el caso revisado es reviewed/mystery.json y el registro de cambios reviewed/audit.json. Las imágenes están ligadas a su caso mediante manifiesto, semilla y SHA-256, y no se regeneran si ya existe el conjunto finalizado.

- node benchmarks/test-generic-generation.mjs: tres intentos libres; sobrescribe sus carpetas de prueba.
- node benchmarks/compare-generation-profiles.mjs: comparación pequeña de ajustes de generación.
- node benchmarks/test-guided-generation.mjs: generación guiada; sobrescribe su expediente de prueba.
- node benchmarks/refine-generic-pilot.mjs: reparaciones y revisión de prompts; registra las sustituciones del motor.
- .venv-images\\Scripts\\python.exe benchmarks/generate-generic-art.py benchmarks/generic-pilot/reviewed/mystery.json: imágenes del caso revisado.
- node benchmarks/build-generic-report.mjs: galería local e informe.
- npm test: 42 pruebas, sin generar contenido ni llamar al modelo; incluye mutaciones de errores y hashes de las 26 imágenes.

La simulación prueba el paquete de datos, las pruebas y su serialización. No demuestra todavía que el motor actual de Blackwood pueda cargar arbitrariamente este expediente: falta ese adaptador y probar el flujo interactivo completo.

## Decisión que respaldan las pruebas

Con este modelo pequeño conviene que el motor construya la lógica y que el LLM vista esa estructura. Pedirle todo el caso y dejar que otro pase del mismo modelo lo certifique no dio resultados utilizables en estos intentos. El modo sin pensamiento explícito ayudó a producir fichas, pero siguió dejando errores de contenido; el sondeo no permite concluir que sea siempre mejor.

Antes del selector de ambientaciones hacen falta una definición genérica de caso consumida por el juego, recetas lógicas por ambientación, validadores de datos y prosa, reparación acotada con rechazo si persisten errores, y más casos de evaluación. Blackwood y sus partidas guardadas no se han modificado con este experimento.
`;
await fs.writeFile(new URL('../PRUEBAS-GENERICAS.md',import.meta.url),report);
console.log(JSON.stringify({id:m.id,images:manifest.assets.length,bytes,seconds,url:'http://127.0.0.1:4173/lab/index.html'}));
