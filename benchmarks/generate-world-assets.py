from pathlib import Path
import json,torch,hashlib
from diffusers import StableDiffusionPipeline
root=Path.cwd(); folder=root/'public/prototype/world-assets-v1';folder.mkdir(exist_ok=True)
pipe=StableDiffusionPipeline.from_pretrained(str(root/'models/image-models/sdxs'),torch_dtype=torch.float16,use_safetensors=True,safety_checker=None,requires_safety_checker=False,feature_extractor=None).to('cuda');pipe.set_progress_bar_config(disable=True)
jobs=[]
for theme in ['medieval','fantasy']:
 d=json.loads((root/f'public/prototype/worlds/{theme}.json').read_text(encoding='utf8'))
 for i,p in enumerate(d['world']['people']):jobs.append((f'{theme}-person-{p["id"]}',f'portrait of a {p["role"]}, '+(['woman with dark hair','man with curly hair','woman with silver hair','man with grey beard','woman with long dark hair'][i])+', medieval costume, fantasy oil painting, dark background'))
 for i,r in enumerate(d['world']['rooms']):jobs.append((f'{theme}-room-{r["id"]}', ['medieval castle great hall','medieval library with ancient books','medieval apothecary workshop','medieval castle armory','medieval tower interior overlooking courtyard','medieval castle bedroom'][i]+', fantasy oil painting, warm candlelight, no people'))
for id,prompt in [('shotgun','antique double barrel shotgun'),('sword','medieval sword'),('crossbow','medieval crossbow'),('artifact','glowing magical crystal amulet'),('alchemy','glass potion bottle')]:jobs.append(('method-'+id,prompt+', on a wooden table, oil painting'))
assets=[]
for i,(id,prompt) in enumerate(jobs):
 path=folder/(id+'.webp')
 if not path.exists():pipe(prompt,num_inference_steps=1,guidance_scale=0,generator=torch.Generator('cuda').manual_seed(8200+i)).images[0].save(path,'WEBP',quality=90)
 assets.append(dict(id=id,prompt=prompt,seed=8200+i,file=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest()));print(id,flush=True)
(folder/'manifest.json').write_text(json.dumps(dict(model='local SDXS',finalized=True,assets=assets),indent=2),encoding='utf8')
