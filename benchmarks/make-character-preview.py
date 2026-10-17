from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path('E:/2026 blackwood manor');out=root/'benchmarks/characters-complete.jpg';canvas=Image.new('RGB',(1000,240),(16,27,29));draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
for i,(entity,label) in enumerate([('elena','Elena Blackwood'),('victor','Dr. Víctor Hale'),('clara','Clara Reed'),('arthur','Arthur Finch'),('julian','Julián Blackwood')]):
 path=root/('public/assets/blackwood-pilot-v1/arthur.webp' if entity=='arthur' else 'public/assets/blackwood-complete-v1/person-'+entity+'.webp');canvas.paste(Image.open(path).convert('RGB').resize((190,190)),(i*200+5,5));draw.text((i*200+9,207),label,font=font,fill=(211,182,126))
canvas.save(out,quality=92)
