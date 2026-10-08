import http from 'node:http';
import fs from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { build, base } from './build.mjs';

const root=path.resolve(import.meta.dirname,'..');
const dist=path.join(root,'dist');
const preview=process.argv.includes('--preview');
const port=Number(process.env.PORT||4173);
if(!preview)await build();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  try{
    let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(base){if(!url.startsWith(base+'/')&&url!==base){res.writeHead(404);res.end('Not found');return;}url=url.slice(base.length)||'/';}
    const file=path.resolve(dist,'.'+url);
    if(file!==dist&&!file.startsWith(dist+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    let target=file;
    try {if((await fs.stat(target)).isDirectory()){
      if(!url.endsWith('/')){res.writeHead(308,{Location:base+url+'/'});res.end();return;}
      target=path.join(target,'index.html');
    }}catch{}
    let body;let status=200;
    try{body=await fs.readFile(target);}catch{target=path.join(dist,'404.html');body=await fs.readFile(target);status=404;}
    res.writeHead(status,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(400);res.end('Bad request');}
});
server.listen(port,'0.0.0.0',()=>console.log(`Personal site: http://localhost:${port}${base}/`));
if(!preview){
  let timer;let busy=false;let dirty=false;
  async function rebuild(){if(busy){dirty=true;return;}busy=true;try{await build();console.log('Updated. Refresh the browser to see changes.');}catch(e){console.error(e);}finally{busy=false;if(dirty){dirty=false;rebuild();}}}
  for(const dir of ['src','content','public','posts','assets','scripts'])watch(path.join(root,dir),{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(rebuild,120);});
  watch(path.join(root,'site.config.mjs'),()=>console.log('Site config changed. Restart npm run dev to reload it.'));
}
