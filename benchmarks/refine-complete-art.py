from pathlib import Path
import json,hashlib
import torch
from diffusers import StableDiffusionPipeline
from PIL import Image,ImageDraw,ImageFont,ImageOps,ImageEnhance
root=Path(__file__).resolve().parents[1];folder=root/'public/assets/blackwood-complete-v1';manifestPath=folder/'manifest.json';manifest=json.loads(manifestPath.read_text())
if manifest.get('finalized'):raise SystemExit('Installed visual set is frozen; create another version to regenerate.')
revisions={'body':'A medical report on paper, close up.','will':'A legal document and a fountain pen.','appointment':'An open leather diary, close up.','fraud':'An accounting ledger book, close up.','botany':'An open botanical book, close up.','letter':'A handwritten letter and envelope.','glasses':'Crystal wine glasses on a table, close up.','argument':'A handwritten note on paper, close up.','tray':'A silver serving tray, close up.','vial':'An empty glass medicine bottle, close up.','receipt':'An inventory notebook, close up.','plant':'A purple aconitum plant in a pot.','glove':'A leather glove, close up.','visitor':'An antique guest book and pen.'}
pipe=StableDiffusionPipeline.from_pretrained(str(root/'models/image-models/sdxs'),torch_dtype=torch.float16,use_safetensors=True,safety_checker=None,requires_safety_checker=False,feature_extractor=None).to('cuda');pipe.set_progress_bar_config(disable=True)
for i,(entity,prompt) in enumerate(revisions.items()):
 item=next(a for a in manifest['assets'] if a['kind']=='clue' and a['entity']==entity);path=root/'public'/item['path'].lstrip('/')
 image=pipe(prompt,num_inference_steps=1,guidance_scale=0,generator=torch.Generator('cuda').manual_seed(2000+i)).images[0];image.save(path,'WEBP',quality=90)
 item.update(prompt=prompt,seed=2000+i,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size)
# Reuse the established portraits so the photograph depicts the actual cast.
card=Image.new('RGB',(512,512),(69,53,36));portraits=Image.new('RGB',(440,360))
for i,entity in enumerate(['elena','julian']):
 portrait=Image.open(folder/f'person-{entity}.webp').convert('RGB');portrait=ImageOps.fit(portrait,(220,360));portrait=ImageOps.colorize(ImageOps.grayscale(portrait),'#251d15','#ddc49b');portraits.paste(portrait,(i*220,0))
card.paste(portraits,(36,42));item=next(a for a in manifest['assets'] if a['kind']=='clue' and a['entity']=='photo');path=root/'public'/item['path'].lstrip('/');card.save(path,'WEBP',quality=90);item.update(prompt='Composited sepia print using the generated canonical Elena and Julian portraits; illustrative identification, not a timestamped reconstruction.',derivedFrom=['person:elena','person:julian'],sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size)
manifestPath.write_text(json.dumps(manifest,indent=2),encoding='utf8')
allAssets=json.loads((root/'public/assets/blackwood-pilot-v1/manifest.json').read_text())['assets']+manifest['assets'];canvas=Image.new('RGB',(1120,1536),(16,27,29));draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
for i,a in enumerate(allAssets):
 x=i%5*224;y=i//5*256;canvas.paste(Image.open(root/'public'/a['path'].lstrip('/')).convert('RGB').resize((214,214)),(x+5,y+5));draw.text((x+7,y+223),a['kind']+': '+a['entity'],font=font,fill='white')
canvas.save(root/'benchmarks/complete-art-review.jpg',quality=90)
