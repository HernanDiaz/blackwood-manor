from pathlib import Path
import json,time,hashlib
import torch
from diffusers import StableDiffusionPipeline
root=Path(__file__).resolve().parents[1];base=root/'public/prototype';folder=base/'assets';folder.mkdir(exist_ok=True)
jobs=json.loads((base/'method-jobs.json').read_text(encoding='utf-8'));manifest=folder/'manifest.json'
old=json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else {'assets':[]}
if old.get('finalized'):
 print('Frozen method images already installed');raise SystemExit(0)
assets=old['assets'];model=root/'models/image-models/sdxs';source=json.loads((model/'source-manifest.json').read_text(encoding='utf-8'))
pipe=StableDiffusionPipeline.from_pretrained(str(model),torch_dtype=torch.float16,use_safetensors=True,safety_checker=None,requires_safety_checker=False,feature_extractor=None).to('cuda');pipe.set_progress_bar_config(disable=True)
for i,job in enumerate(jobs):
 if any(a['id']==job['id'] for a in assets):continue
 overrides={'rope':(7103,'a coil of rope'),'plasma':(7101,'photo of a pistol'),'robot':(6102,'an industrial mechanical claw arm mounted on a factory workbench, close-up machine, science fiction painting')}
 seed,prompt=overrides.get(job['id'],(5100+i,job['prompt']+', close-up on plain dark background, teal and amber light, cinematic concept painting'))
 torch.cuda.synchronize();start=time.perf_counter();image=pipe(prompt,num_inference_steps=1,guidance_scale=0,generator=torch.Generator('cuda').manual_seed(seed)).images[0];torch.cuda.synchronize();seconds=time.perf_counter()-start
 path=folder/('method-'+job['id']+'.webp');image.save(path,'WEBP',quality=90)
 assets.append(dict(id=job['id'],name=job['name'],file=path.name,prompt=prompt,seed=seed,seconds=seconds,bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
 manifest.write_text(json.dumps(dict(model=source['repo'],revision=source['revision'],finalized=False,assets=assets),ensure_ascii=False,indent=2),encoding='utf-8');print(job['id'],round(seconds,2),flush=True)
manifest.write_text(json.dumps(dict(model=source['repo'],revision=source['revision'],finalized=True,assets=assets),ensure_ascii=False,indent=2),encoding='utf-8')
