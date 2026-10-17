from pathlib import Path
from PIL import Image
import json,hashlib,datetime
root=Path(__file__).resolve().parents[1]
folder=root/'public/assets/blackwood-pilot-v1'
if (folder/'manifest.json').exists():raise SystemExit('Visual set already installed; preserved unchanged.')
folder.mkdir(parents=True,exist_ok=True)
source=root/'benchmarks/pilot-candidates'
records=json.loads((source/'generation.json').read_text())
model=json.loads((root/'models/image-models/sdxs/source-manifest.json').read_text())
assets=[]
for item,seed,kind,entity in [('arthur',123,'person','arthur'),('study',123,'room','study'),('cup',1,'clue','cup')]:
 target=folder/f'{item}.webp'
 Image.open(source/f'{item}-{seed}.png').save(target,'WEBP',quality=88)
 record=next(r for r in records if r['id']==item and r['seed']==seed)
 assets.append(dict(assetId=f'blackwood-pilot-v1:{kind}:{entity}',kind=kind,entity=entity,path=f'/assets/blackwood-pilot-v1/{item}.webp',seed=seed,prompt=record['prompt'],sha256=hashlib.sha256(target.read_bytes()).hexdigest(),bytes=target.stat().st_size))
manifest=dict(version=1,visualSet='blackwood-pilot-v1',model=model['repo'],revision=model['revision'],steps=1,guidance=0,resolution=[512,512],createdAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),assets=assets)
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
print('Installed',len(assets),'persistent assets,',sum(a['bytes'] for a in assets),'bytes')
