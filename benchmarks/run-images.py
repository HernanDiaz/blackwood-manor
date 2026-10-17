import os,json,time,gc
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
os.environ['HF_HOME']=str(ROOT/'models'/'hf-cache')
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING']='1'
import torch
from diffusers import StableDiffusionPipeline
from huggingface_hub import model_info
out=ROOT/'benchmarks'/'images';out.mkdir(parents=True,exist_ok=True)
assert torch.cuda.is_available(), 'CUDA required for this benchmark'
print(torch.__version__,torch.cuda.get_device_name(),flush=True)
style='Victorian detective mystery, 1924 England, muted dark teal and warm brass palette, atmospheric cinematic illustration, no text, no letters, no watermark. '
prompts={
 'portrait':style+'Head and shoulders portrait of a stern middle-aged male doctor in a dark three-piece suit, white shirt, neatly combed brown hair, inside an English manor, single person.',
 'room':style+'An empty English manor study at night, mahogany desk, single porcelain teacup on desk, bookshelves, rain on tall windows, no people.',
 'clue':style+'Evidence photograph, a single empty small amber glass medicine vial on a dark wooden table, centered isolated object, blank paper label, no writing.'
}
models=[('sdxs','IDKiro/sdxs-512-dreamshaper',1,0,None),('sd15','stable-diffusion-v1-5/stable-diffusion-v1-5',25,7.5,'fp16')]
results=[]
for label,repo,steps,cfg,variant in models:
 try:
  local=ROOT/'models'/'image-models'/label
  revision=json.loads((local/'source-manifest.json').read_text())['revision']
  start=time.perf_counter()
  opts=dict(torch_dtype=torch.float16,use_safetensors=True,safety_checker=None,requires_safety_checker=False,feature_extractor=None)
  if variant:opts['variant']=variant
  pipe=StableDiffusionPipeline.from_pretrained(str(local),**opts).to('cuda')
  load=time.perf_counter()-start
  pipe.set_progress_bar_config(disable=True)
  # Warm-up is reported separately; never used as measured generation.
  pipe('an empty wooden table',height=512,width=512,num_inference_steps=steps,guidance_scale=cfg,generator=torch.Generator('cuda').manual_seed(1))
  for kind,prompt in prompts.items():
   for seed in [42,123]:
    torch.cuda.reset_peak_memory_stats();torch.cuda.synchronize();start=time.perf_counter()
    image=pipe(prompt,height=512,width=512,num_inference_steps=steps,guidance_scale=cfg,generator=torch.Generator('cuda').manual_seed(seed)).images[0]
    torch.cuda.synchronize();elapsed=time.perf_counter()-start
    filename=f'{label}-{kind}-{seed}.png';image.save(out/filename)
    record=dict(model=label,repo=repo,revision=revision,kind=kind,seed=seed,prompt=prompt,steps=steps,cfg=cfg,seconds=elapsed,peakAllocatedMiB=torch.cuda.max_memory_allocated()/1024**2,peakReservedMiB=torch.cuda.max_memory_reserved()/1024**2,file=filename,loadSeconds=load)
    results.append(record);(out/'results.json').write_text(json.dumps(results,indent=2),encoding='utf8');print(json.dumps({k:record[k] for k in ['model','kind','seed','seconds','peakAllocatedMiB']}),flush=True)
  del pipe;gc.collect();torch.cuda.empty_cache()
 except Exception as e:
  results.append(dict(model=label,error=str(e)));(out/'results.json').write_text(json.dumps(results,indent=2),encoding='utf8');print(label,'ERROR',e,flush=True)

