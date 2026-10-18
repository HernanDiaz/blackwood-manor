from pathlib import Path
import sys,json,hashlib
import torch
from diffusers import StableDiffusionPipeline
root=Path(__file__).resolve().parents[1];folder=Path(sys.argv[1]).resolve()
if folder.parent != (root/'public/prototype/generated').resolve():raise ValueError('Invalid destination')
request=json.loads((folder/'request.json').read_text(encoding='utf8'))
pipe=StableDiffusionPipeline.from_pretrained(str(root/'models/image-models/sdxs'),torch_dtype=torch.float16,use_safetensors=True,safety_checker=None,requires_safety_checker=False,feature_extractor=None).to('cuda');pipe.set_progress_bar_config(disable=True)
assets=[]
for i,job in enumerate(request['jobs']):
 seed=int(hashlib.sha256((request['seed']+job['id']).encode()).hexdigest()[:8],16);file=folder/(job['id']+'.webp')
 if not file.exists():
  image=pipe(job['prompt'],num_inference_steps=1,guidance_scale=0,generator=torch.Generator('cuda').manual_seed(seed)).images[0]
  temp=file.with_suffix('.tmp');image.save(temp,'WEBP',quality=90);temp.replace(file)
 assets.append(dict(id=job['id'],file=file.name,prompt=job['prompt'],seed=seed,sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
 print(json.dumps(dict(done=i+1)),flush=True)
manifest=dict(caseId=request['caseId'],model='SDXS local',visualGuide=request.get('visualGuide'),steps=1,guidance=0,assets=assets)
temp=folder/'manifest.tmp';temp.write_text(json.dumps(manifest,indent=2),encoding='utf8');temp.replace(folder/'manifest.json')
