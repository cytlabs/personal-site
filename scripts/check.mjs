import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../dist');
const base=('/'+(process.env.BASE_PATH||'').replace(/^\/+|\/+$/g,'')).replace(/\/$/,'');
async function walk(dir){return(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
const files=await walk(root);let checked=0;
for(const file of files.filter(f=>f.endsWith('.html'))){
  const html=await fs.readFile(file,'utf8');
  assert.match(html,/<html lang="zh-CN">/);assert.match(html,/<title>[^<]+<\/title>/);assert.match(html,/<main id="main"/);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${file}: exactly one h1`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,`${file}: duplicate IDs`);
  for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|mailto:|data:)/.test(raw))continue;
    const [pathname,hash]=raw.split('#');
    if(!pathname){assert(ids.includes(hash),`${file}: missing #${hash}`);continue;}
    let p=pathname.replace(/\?.*$/,'');
    assert(p.startsWith(base+'/'),`${file}: expected base path in ${raw}`);
    p=p.slice(base.length);
    let target=path.join(root,p);
    if(p.endsWith('/'))target=path.join(target,'index.html');
    await fs.access(target).catch(()=>{throw new Error(`${file}: broken internal link ${raw}`);});
    if(hash){const linked=await fs.readFile(target,'utf8');assert(linked.includes(`id="${hash}"`),`${file}: missing target ${raw}`);}
    checked++;
  }
  if(!file.includes('/explore/'))assert(!html.includes('/assets/room.js'),`${file}: room bundle must be isolated`);
}
assert(files.some(f=>f.endsWith('/assets/room.js')));
assert(files.some(f=>f.endsWith('/404.html')));
console.log(`Checked ${files.filter(f=>f.endsWith('.html')).length} HTML pages and ${checked} internal links/assets; 3D code is isolated to /explore/.`);
