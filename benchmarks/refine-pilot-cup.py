import json
from pathlib import Path
import torch
from diffusers import StableDiffusionPipeline
from PIL import Image,ImageDraw
root=Path('E:/2026 blackwood manor');out=root/'benchmarks'/'pilot-candidates'
pipe=StableDiffusionPipeline.from_pretrained(str(root/'models/image-models/sdxs'),torch_dtype=torch.float16,use_safetensors=True,safety_checker=None,requires_safety_checker=False,feature_extractor=None).to('cuda');pipe.set_progress_bar_config(disable=True)
prompt='A close up photograph of a plain white porcelain teacup containing black tea on a white saucer, on a dark brown wooden desk, one small cup, soft dim lamplight, no people, no text.'
records=json.loads((out/'generation.json').read_text())
for seed in [7,21]:
 im=pipe(prompt,num_inference_steps=1,guidance_scale=0,generator=torch.Generator('cuda').manual_seed(seed)).images[0];im.save(out/f'cup-{seed}.png');records.append(dict(id='cup',seed=seed,prompt=prompt,file=f'cup-{seed}.png'))
(out/'generation.json').write_text(json.dumps(records,indent=2),encoding='utf8')
canvas=Image.new('RGB',(1024,512));canvas.paste(Image.open(out/'cup-7.png'),(0,0));canvas.paste(Image.open(out/'cup-21.png'),(512,0));canvas.save(out/'cups-review.jpg')
