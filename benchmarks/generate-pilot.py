import json,time
from pathlib import Path
import torch
from diffusers import StableDiffusionPipeline
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1]
out=root/'benchmarks'/'pilot-candidates';out.mkdir(parents=True,exist_ok=True)
style='1924 English manor detective story, atmospheric cinematic oil painting, dark teal shadows and muted brass light, realistic proportions, no writing, no letters. '
prompts={
 'arthur':style+'Head and shoulders portrait of an elderly English butler, dignified stern expression, grey hair, clean shaven, black formal tailcoat and white shirt, single man, dark mansion background.',
 'study':style+'Interior of an English manor study at night, a mahogany writing desk and tall bookshelves, dark windows with rain, warm single desk lamp, empty room, no people, no weapons.',
 'cup':style+'Close up still life of one single plain white porcelain teacup filled with dark black tea on one saucer, polished mahogany tabletop, centered cup, no other objects, no patterns.'
}
local=root/'models'/'image-models'/'sdxs'
pipe=StableDiffusionPipeline.from_pretrained(str(local),torch_dtype=torch.float16,use_safetensors=True,safety_checker=None,requires_safety_checker=False,feature_extractor=None).to('cuda')
pipe.set_progress_bar_config(disable=True)
records=[]
for item,prompt in prompts.items():
 for seed in [42,123]:
  target=out/f'{item}-{seed}.png'
  if target.exists():continue
  torch.cuda.synchronize();start=time.perf_counter()
  im=pipe(prompt,num_inference_steps=1,guidance_scale=0,height=512,width=512,generator=torch.Generator('cuda').manual_seed(seed)).images[0]
  torch.cuda.synchronize();im.save(target)
  records.append(dict(id=item,seed=seed,prompt=prompt,seconds=time.perf_counter()-start,file=target.name))
if records:(out/'generation.json').write_text(json.dumps(records,indent=2),encoding='utf8')
canvas=Image.new('RGB',(1024,1590),(16,27,29));draw=ImageDraw.Draw(canvas)
for row,item in enumerate(prompts):
 for col,seed in enumerate([42,123]):
  canvas.paste(Image.open(out/f'{item}-{seed}.png'),(col*512,row*530));draw.text((col*512+10,row*530+512),f'{item} / {seed}',fill='white')
canvas.save(out/'review.jpg')
print('Pilot candidates saved')
