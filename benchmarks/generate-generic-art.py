from pathlib import Path
import json,time,hashlib,sys
import torch
from diffusers import StableDiffusionPipeline
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1]
case=json.loads((root/(sys.argv[1] if len(sys.argv)>1 else 'benchmarks/generic-pilot/guided/mystery.json')).read_text(encoding='utf-8-sig'))
folder=root/'benchmarks/generic-pilot/images'/case['id'];folder.mkdir(parents=True,exist_ok=True)
manifest=folder/'manifest.json'
if manifest.exists():
 print('Using immutable image set:',folder,flush=True)
 raise SystemExit(0)
model=root/'models/image-models/sdxs'
pipeline=StableDiffusionPipeline.from_pretrained(str(model),torch_dtype=torch.float16,use_safetensors=True,safety_checker=None,requires_safety_checker=False,feature_extractor=None).to('cuda')
pipeline.set_progress_bar_config(disable=True)
style='Cinematic retro science fiction concept painting, teal and amber lighting. '
assets=[]
jobs=[('person',p) for p in case['world']['people']]+[('room',r) for r in case['world']['rooms']]+[('clue',c) for c in case['clues']]
for i,(kind,entry) in enumerate(jobs):
 prompt=entry['imagePrompt']+', teal and amber light, cinematic painting'
 if kind=='person':prompt+=' Head and shoulders portrait of a single person.'
 if kind=='room':prompt+=' Empty interior, no people.'
 if kind=='clue':prompt+=' A single isolated object, no people, no readable text.'
 seed=2800+i;torch.cuda.synchronize();started=time.perf_counter()
 image=pipeline(prompt,num_inference_steps=1,guidance_scale=0,generator=torch.Generator('cuda').manual_seed(seed)).images[0]
 torch.cuda.synchronize();seconds=time.perf_counter()-started
 path=folder/(kind+'-'+entry['id']+'.webp');image.save(path,'WEBP',quality=90)
 assets.append(dict(kind=kind,id=entry['id'],title=entry.get('name',entry.get('title','')),file=path.name,prompt=prompt,seed=seed,seconds=seconds,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size))
 print(kind,entry['id'],round(seconds,2),flush=True)
source=json.loads((model/'source-manifest.json').read_text())
manifest.write_text(json.dumps(dict(caseId=case['id'],model=source['repo'],revision=source['revision'],steps=1,guidance=0,finalized=True,assets=assets),ensure_ascii=False,indent=2),encoding='utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
canvas=Image.new('RGB',(5*224,6*255),(16,27,29));draw=ImageDraw.Draw(canvas)
for i,a in enumerate(assets):
 x=i%5*224;y=i//5*255;im=Image.open(folder/a['file']).convert('RGB').resize((214,214));canvas.paste(im,(x+5,y+5));draw.text((x+6,y+222),a['kind']+' '+a['id']+' '+a['title'][:20],font=font,fill=(230,220,200))
canvas.save(folder/'contact-sheet.jpg',quality=90)
print(json.dumps(dict(caseId=case['id'],images=len(assets),seconds=sum(a['seconds'] for a in assets),bytes=sum(a['bytes'] for a in assets),folder=str(folder))),flush=True)
