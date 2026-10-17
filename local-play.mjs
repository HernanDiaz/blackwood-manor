import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import net from 'node:net';
const root=path.dirname(fileURLToPath(import.meta.url));
const models={gemma:'gemma-4-E2B-it-Q4_K_M.gguf',qwen:'Qwen_Qwen3.5-2B-Q4_K_M.gguf',smol:'SmolLM3-Q4_K_M.gguf'};
const selected=process.argv[2]||'qwen';
if(!models[selected])throw Error('Modelo desconocido: gemma, qwen o smol');
const probe=net.createServer();await new Promise((resolve,reject)=>{probe.once('error',()=>reject(Error('El puerto 1235 está ocupado. Cierra la prueba anterior.')));probe.listen(1235,'127.0.0.1',resolve);});await new Promise(resolve=>probe.close(resolve));
const runtime=spawn('E:/LLMStudio/llama.cpp/llama-server.exe',['-m',path.join(root,'models',models[selected]),'--host','127.0.0.1','--port','1235','-c','4096','-ngl','99','--reasoning',(selected==='qwen'&&process.env.BLACKWOOD_THINKING!=='0')?'on':'off',...(process.env.BLACKWOOD_THINKING==='1'?['--reasoning-budget','128']:[]),'--parallel','1','--cors-origins','http://127.0.0.1:4173'],{windowsHide:true,stdio:['ignore','ignore','ignore']});
let app;let closing=false;
function close(){if(closing)return;closing=true;app?.kill();runtime.kill();}
process.on('SIGINT',close);process.on('SIGTERM',close);process.on('exit',close);
runtime.on('error',e=>{console.error(e.message);process.exitCode=1;close();});
try{let ready=false;for(let i=0;i<60;i++){if(runtime.exitCode!==null)throw Error('El motor no pudo cargar el modelo');try{const r=await fetch('http://127.0.0.1:1235/health');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}if(!ready)throw Error('Tiempo de carga agotado');console.log('Modelo:',selected,'· Abre http://127.0.0.1:4173 · Ctrl+C para cerrar');app=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,BLACKWOOD_LOCAL_LLM:'1'},stdio:'inherit',windowsHide:true});app.on('exit',close);}catch(e){console.error(e.message);process.exitCode=1;close();}

