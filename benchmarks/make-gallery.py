from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,html
root=Path(__file__).resolve().parents[1]
folder=root/'benchmarks'/'images'
records=json.loads((folder/'results.json').read_text())
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
canvas=Image.new('RGB',(3*350,4*395),(16,27,29));draw=ImageDraw.Draw(canvas)
for row,(model,seed) in enumerate([('sdxs',42),('sdxs',123),('sd15',42),('sd15',123)]):
 for col,kind in enumerate(['portrait','room','clue']):
  item=next((r for r in records if r.get('model')==model and r.get('seed')==seed and r.get('kind')==kind),None)
  if not item:continue
  image=Image.open(folder/item['file']).convert('RGB').resize((330,330));canvas.paste(image,(col*350+10,row*395+10))
  draw.text((col*350+10,row*395+345),f'{model.upper()} / {kind} / seed {seed}',font=font,fill=(211,182,126))
  draw.text((col*350+10,row*395+369),f"{item['seconds']:.2f} s | {item['peakAllocatedMiB']:.0f} MiB",font=font,fill=(220,225,220))
canvas.save(folder/'comparison.jpg',quality=90)
parts=['<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pruebas visuales Blackwood</title><style>body{background:#101b1d;color:#eee9df;font:16px system-ui;max-width:1200px;margin:30px auto;padding:20px}h1,h2{color:#d3b67e}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}img{width:100%;border-radius:8px}article{padding:15px;background:#1d2b2c}small{color:#b4c3bf}p{line-height:1.6}</style><h1>Blackwood · Prueba de imágenes locales</h1><p>512 × 512 píxeles. Mismos prompts y semillas 42/123. SDXS: 1 paso, guidance 0. SD1.5: 25 pasos, guidance 7.5. Tiempos con modelo cargado y una imagen de calentamiento excluida. Memoria de tensores CUDA asignada, no memoria total del proceso. Mediciones de escritorio: no predicen la velocidad en móvil.</p>']
for model in ['sdxs','sd15']:
 parts.append('<h2>'+model.upper()+'</h2><section>')
 for r in records:
  if r.get('model')!=model or 'file' not in r:continue
  parts.append(f'<article><a href="images/{r["file"]}"><img src="images/{r["file"]}" alt="{r["kind"]} generado por {model}"></a><p>{r["kind"]} · semilla {r["seed"]}<br>{r["seconds"]:.2f} s · {r["peakAllocatedMiB"]:.0f} MiB</p><small>{html.escape(r["prompt"])}</small></article>')
 parts.append('</section>')
parts.append('<p>Resultados exploratorios. Las imágenes no están incorporadas como pistas canónicas. Sin control adicional, la generación puede añadir o cambiar detalles. Los rótulos y las iniciales de las pistas deberían componerse de forma determinista.</p></html>')
(root/'benchmarks'/'gallery.html').write_text(''.join(parts),encoding='utf8')
print('Gallery and comparison saved')
