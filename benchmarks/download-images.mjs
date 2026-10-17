import fs from 'node:fs';import {mkdir,writeFile} from 'node:fs/promises';import {pipeline} from 'node:stream/promises';import {Readable} from 'node:stream';
const root='E:/2026 blackwood manor/models/image-models';
for(const [label,repo,fp16] of [['sdxs','IDKiro/sdxs-512-dreamshaper',false],['sd15','stable-diffusion-v1-5/stable-diffusion-v1-5',true]]){
 const meta=await(await fetch('https://huggingface.co/api/models/'+repo+'?blobs=true')).json();
 const dirs=['scheduler/','tokenizer/','text_encoder/','unet/','vae/'];
 const files=meta.siblings.filter(f=>f.rfilename==='model_index.json'||f.rfilename==='README.md'||f.rfilename==='LICENSE'||dirs.some(d=>f.rfilename.startsWith(d))&&(/\.(json|txt)$/.test(f.rfilename)||f.rfilename.endsWith(fp16?'.fp16.safetensors':'.safetensors')));
 for(let i=0;i<files.length;i+=4)await Promise.all(files.slice(i,i+4).map(async f=>{const dest=`${root}/${label}/${f.rfilename}`;await mkdir(dest.slice(0,dest.lastIndexOf('/')),{recursive:true});if(fs.existsSync(dest)&&fs.statSync(dest).size===f.size)return;const response=await fetch(`https://huggingface.co/${repo}/resolve/${meta.sha}/${f.rfilename}`);if(!response.ok)throw Error(`${response.status} ${f.rfilename}`);await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(dest));console.log(label,f.rfilename);}));
 await writeFile(`${root}/${label}/source-manifest.json`,JSON.stringify({repo,revision:meta.sha,files},null,2));
}
