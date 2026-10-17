from pathlib import Path
import json,hashlib,time
import torch
from diffusers import StableDiffusionPipeline
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1]
jobs=json.loads((root/'benchmarks/complete-art-jobs.json').read_text())
folder=root/'public/assets/blackwood-complete-v1';folder.mkdir(parents=True,exist_ok=True)
manifestPath=folder/'manifest.json'
previous=json.loads(manifestPath.read_text()) if manifestPath.exists() else {'assets':[]}
assets=previous['assets']
local=root/'models/image-models/sdxs';model=json.loads((local/'source-manifest.json').read_text())
pipe=StableDiffusionPipeline.from_pretrained(str(local),torch_dtype=torch.float16,use_safetensors=True,safety_checker=None,requires_safety_checker=False,feature_extractor=None).to('cuda');pipe.set_progress_bar_config(disable=True)
style='Atmospheric cinematic oil painting, English manor mystery, 1924, muted dark teal and brass palette. '
for i,job in enumerate(jobs):
 if any(a['kind']==job['kind'] and a['entity']==job['id'] for a in assets):continue
 seed=1000+i;prompt=style+job['prompt'];name=job['kind']+'-'+job['id']+'.webp';path=folder/name
 torch.cuda.synchronize();started=time.perf_counter()
 image=pipe(prompt,num_inference_steps=1,guidance_scale=0,generator=torch.Generator('cuda').manual_seed(seed)).images[0]
 torch.cuda.synchronize();seconds=time.perf_counter()-started;image.save(path,'WEBP',quality=90)
 assets.append(dict(assetId='blackwood-complete-v1:'+job['kind']+':'+job['id'],kind=job['kind'],entity=job['id'],title=job['title'],path='/assets/blackwood-complete-v1/'+name,seed=seed,prompt=prompt,seconds=seconds,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size))
 manifestPath.write_text(json.dumps(dict(version=1,model=model['repo'],revision=model['revision'],steps=1,guidance=0,assets=assets),indent=2),encoding='utf8');print(job['id'],round(seconds,2),flush=True)
allAssets=json.loads((root/'public/assets/blackwood-pilot-v1/manifest.json').read_text())['assets']+assets
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
canvas=Image.new('RGB',(5*224,6*256),(16,27,29));draw=ImageDraw.Draw(canvas)
for i,a in enumerate(allAssets):
 image=Image.open(root/'public'/a['path'].lstrip('/')).convert('RGB').resize((214,214));x=i%5*224;y=i//5*256;canvas.paste(image,(x+5,y+5));draw.text((x+7,y+223),a['kind']+': '+a['entity'],font=font,fill=(230,220,200))
(root/'benchmarks/complete-art-review.jpg').write_bytes(b'')
canvas.save(root/'benchmarks/complete-art-review.jpg',quality=90)
print('Complete: '+str(len(allAssets)))
