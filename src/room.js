import * as THREE from 'three';
import { createExperiences } from './room-experiences.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.querySelector('#room-canvas');
const loading = document.querySelector('#room-loading');
const fallback = document.querySelector('#room-fallback');
const panel = document.querySelector('#room-panel');
const tooltip = document.querySelector('#room-tooltip');
const data = JSON.parse(document.querySelector('#room-content').textContent);
const zones = data.zones;
const buttons = [...document.querySelectorAll('[data-zone]')];
const experience = createExperiences({panel,tooltip,buttons,data});

async function startRoom() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
  catch(error) { loading.hidden=true;fallback.hidden=false;console.warn('3D unavailable; text navigation remains available.',error);return; }

  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35,1,.1,100);
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = 8.3;
  controls.maxDistance = 19;
  controls.minPolarAngle = .65;
  controls.maxPolarAngle = 1.3;
  controls.minAzimuthAngle = -.2;
  controls.maxAzimuthAngle = 1.45;
  controls.target.set(0,1.1,0);
  controls.mouseButtons = {LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};

  const materials = {};
  function mat(color, opts={}) {
    const key = color+JSON.stringify(opts);
    return materials[key] ||= new THREE.MeshStandardMaterial({color,roughness:.85,...opts});
  }
  function box(w,h,d,color,x,y,z,parent=scene,opts={}) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,opts));
    mesh.position.set(x,y,z); mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(top,bottom,h,color,x,y,z,parent=scene,segments=24) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,h,segments),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function sphere(r,color,x,y,z,parent=scene,scale=[1,1,1]) {
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),mat(color));mesh.position.set(x,y,z);mesh.scale.set(...scale);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  const interactables=[];
  const groups={};
  function zone(id) {const group=new THREE.Group();group.userData.zone=id;scene.add(group);groups[id]=group;interactables.push(group);return group;}
  const ambient=new THREE.HemisphereLight('#fffde8','#809077',2.8);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff1c9',4.2);sun.position.set(-3,8,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;scene.add(sun);
  const fill=new THREE.DirectionalLight('#d9e7d3',1);fill.position.set(5,3,3);scene.add(fill);
  const lampLight=new THREE.PointLight('#ffd697',0,6,2);lampLight.position.set(1.6,2.3,-1.3);scene.add(lampLight);

  // A small architectural diorama. Geometry is local; no remote models or textures.
  box(6.2,.25,5,'#b6aa8b',0,-.13,0);
  for(let i=0;i<15;i++)box(.397,.026,4.9,i%3===0?'#d4c6a6':'#ccbd9e',-2.78+i*.397,.013,0);
  box(6.12,3.6,.14,'#d6ddc9',0,1.8,-2.45);
  box(.14,3.6,4.92,'#c3d0b7',-3,1.8,0);
  box(6.1,.12,.08,'#bcc7af',0,.09,-2.33);
  box(.08,.12,4.9,'#afbd9f',-2.9,.09,0);
  // Recessed window on the back wall, with a bright, quiet sky.
  const windowPane=box(1.58,1.55,.045,'#d9eace',-.15,2.36,-2.34,scene,{emissive:'#d9eace',emissiveIntensity:.3});
  box(1.78,.1,.14,'#f4f2df',-.15,3.18,-2.25);
  box(1.84,.12,.29,'#eee9d4',-.15,1.54,-2.22);
  box(.1,1.63,.14,'#f4f2df',-.99,2.36,-2.25);
  box(.1,1.63,.14,'#f4f2df',.69,2.36,-2.25);
  box(.055,1.55,.1,'#f4f2df',-.15,2.36,-2.24);
  box(1.58,.055,.1,'#f4f2df',-.15,2.35,-2.24);
  // Soft rug.
  box(3.35,.025,2.42,'#89947a',.55,.045,.75);
  for(let i=0;i<3;i++)box(3.18,.028,.025,'#b8bea2',.55,.05,-.3+i*.08);
  for(let i=0;i<3;i++)box(3.18,.028,.025,'#b8bea2',.55,.05,1.72+i*.08);

  const books=zone('books');
  const bookMeshes=[];
  box(1.4,2.65,.15,'#957553',-2.08,1.34,-1.98,books);
  for(const x of [-2.79,-1.37])box(.09,2.65,.7,'#aa8a61',x,1.34,-1.73,books);
  for(const y of [.1,.94,1.8,2.65])box(1.51,.09,.75,'#bea174',-2.08,y,-1.72,books);
  const colors=['#537160','#d1c09a','#917762','#adb98a','#6e8580','#bd916f','#d3d1b6'];
  for(let shelf=0;shelf<3;shelf++){
    let x=-2.66;
    for(let i=0;i<(shelf===2?5:7);i++){
      const h=.42+((i*7+shelf*3)%5)*.062;const w=.105+(i%3)*.017;
      const bookGroup=new THREE.Group();books.add(bookGroup);bookGroup.userData.bookIndex=bookMeshes.length%data.zones[0].links.length;bookMeshes.push(bookGroup);
      const b=box(w,h,.43,colors[(i+shelf*2)%colors.length],x+w/2,.18+shelf*.85+h/2,-1.57,bookGroup);
      if(shelf===1&&i===6)b.rotation.z=-.12;
      box(w*.72,.016,.006,'#e4dfc6',x+w/2,.28+shelf*.85,-1.351,bookGroup);
      x+=w+.035;
    }
  }
  cylinder(.14,.12,.25,'#d6cbab',-1.7,2.82,-1.7,books);
  // Work table with a monitor, keyboard and a warm task lamp.
  const desk=zone('desk');
  box(2.82,.14,1.15,'#b18a60',1.12,1.2,-1.53,desk);
  box(2.82,.035,1.15,'#d6b48a',1.12,1.285,-1.53,desk);
  for(const x of [-.14,2.37])for(const z of [-1.99,-1.06])box(.09,1.15,.09,'#816d52',x,.6,z,desk);
  box(.57,.06,.32,'#3f5149',.84,1.36,-1.68,desk);
  box(.065,.31,.065,'#3f5149',.84,1.53,-1.76,desk);
  box(1.17,.75,.075,'#3a4e44',.84,1.92,-1.78,desk);
  const screen=box(1.06,.63,.015,'#bed5bc',.84,1.93,-1.733,desk,{emissive:'#9fbca8',emissiveIntensity:.15});
  box(.57,.025,.02,'#74947b',.71,2.08,-1.716,desk);
  box(.71,.019,.02,'#8aa58b',.78,1.99,-1.716,desk);
  box(.48,.019,.02,'#8aa58b',.67,1.9,-1.716,desk);
  box(.62,.019,.02,'#8aa58b',.74,1.81,-1.716,desk);
  box(.65,.035,.23,'#d6d9c2',.83,1.335,-1.13,desk);
  for(let row=0;row<3;row++)for(let i=0;i<9;i++)box(.048,.012,.045,'#a5b29b',.55+i*.067,1.358,-1.2+row*.065,desk);
  sphere(.085,'#c8d0b6',1.43,1.34,-1.14,desk,[.75,.45,1]);
  cylinder(.15,.17,.04,'#5a705c',2.02,1.34,-1.76,desk);
  cylinder(.025,.025,.68,'#697c63',2.02,1.7,-1.76,desk);
  const lampshade=cylinder(.12,.3,.29,'#b8c294',1.98,2.13,-1.7,desk);lampshade.rotation.z=.15;
  cylinder(.24,.24,.014,'#f2ddb0',1.96,1.985,-1.7,desk);
  cylinder(.09,.075,.2,'#d6b89d',1.71,1.42,-1.15,desk);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.065,.018,8,18),mat('#d6b89d'));handle.position.set(1.815,1.42,-1.15);desk.add(handle);
  // A chair, deliberately outside the clickable desk group.
  box(.65,.13,.67,'#71846b',.92,.63,-.25);
  box(.65,.65,.095,'#849575',.92,1.02,.075);
  for(const x of [.65,1.19])for(const z of [-.49,-.02])cylinder(.025,.022,.57,'#8e785b',x,.3,z);
  // An open notebook is its own hotspot, even though it sits on the desk.
  const notebook=zone('notebook');
  const leftPage=box(.3,.025,.37,'#f3ebd4',-.02,1.336,-1.18,notebook);leftPage.rotation.z=-.04;
  const pagePivot=new THREE.Group();pagePivot.position.set(.13,1.35,-1.18);notebook.add(pagePivot);
  const rightPage=box(.3,.025,.37,'#ece4cc',.15,0,0,pagePivot);rightPage.rotation.z=.04;
  box(.018,.02,.37,'#a09270',.13,1.355,-1.18,notebook);
  for(let i=0;i<4;i++)box(.22,.005,.006,'#bbbd9b',-.02,1.355,-1.31+i*.057,notebook);
  const pen=box(.025,.02,.32,'#47614f',.48,1.33,-1.15,notebook);pen.rotation.y=-.2;
  // A framed landscape on the left wall; a small personal symbol rather than a stock portrait.
  const wall=zone('wall');
  box(.13,1.08,1.37,'#997a56',-2.86,2.17,.43,wall);
  box(.016,.92,1.2,'#ece6cd',-2.786,2.17,.43,wall);
  const sunArt=sphere(.155,'#d6b768',-2.77,2.36,.58,wall,[.08,1,1]);
  box(.018,.31,1.12,'#9aa885',-2.774,1.94,.43,wall);
  box(.018,.17,1.12,'#728666',-2.76,1.88,.43,wall);
  // Plant: a discoverable fifth corner.
  const plant=zone('plant');
  const leaves=[];
  cylinder(.29,.22,.48,'#b48d6d',-2.15,.31,1.28,plant);
  cylinder(.27,.27,.035,'#665b44',-2.15,.565,1.28,plant);
  cylinder(.035,.035,.68,'#5d724c',-2.15,.88,1.28,plant);
  for(let i=0;i<7;i++){
    const a=i*2.4;const radius=.22+(i%2)*.06;
    const leaf=sphere(.26,i%2?'#758956':'#8b9c6a',-2.15+Math.sin(a)*radius,1.04+(i%3)*.18,1.28+Math.cos(a)*radius,plant,[.5,1,.8]);
    leaf.rotation.set(Math.cos(a)*.65,0,Math.sin(a)*.65);leaves.push(leaf);
  }
  const flower=new THREE.Group();flower.position.set(-2.15,1.55,1.28);flower.visible=false;scene.add(flower);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;sphere(.085,'#eac99a',Math.cos(a)*.1,Math.sin(a)*.1,0,flower,[1,1,.5]);}
  sphere(.055,'#b59c52',0,0,.05,flower);
  const drops=Array.from({length:8},(_,i)=>{const d=sphere(.035,'#93c5cf',-2.15+(i%3-1)*.12,2+(i%4)*.1,1.28,scene,[.6,1.5,.6]);d.visible=false;return d;});
  const hiddenNote=box(.02,.4,.46,'#ead5a3',-2.76,2.17,.43);hiddenNote.visible=false;
  for(let i=0;i<3;i++){const line=box(.024,.014,.3,'#8a8266',-2.744,2.25-i*.08,.43);line.visible=false;hiddenNote.userData.lines??=[];hiddenNote.userData.lines.push(line);}
  // A stack of cushions makes the room feel inhabited.
  const cushion=box(.96,.19,.78,'#c4bc99',1.95,.18,1.35);cushion.rotation.y=-.17;
  const cushion2=box(.74,.15,.65,'#a8b58b',1.95,.33,1.33);cushion2.rotation.y=.1;
  // A dark thin plinth gives the entire room a clean silhouette.
  box(6.24,.07,5.04,'#7a8269',0,-.29,0);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.15}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.35;shadow.receiveShadow=true;scene.add(shadow);

  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
  let pointerDown=null;let selected=null;let frame=0;let disposed=false;let activeBook=null;let savedView=null;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const tweens=new Map();
  function render(now){
    frame=0;
    for(const [key,t] of tweens){const p=Math.min(1,(now-t.start)/t.duration);t.update(1-Math.pow(1-p,3));if(p===1){tweens.delete(key);t.done?.();}}
    renderer.render(scene,camera);
    if(tweens.size)invalidate();
  }
  function invalidate(){if(!disposed&&!frame&&!document.hidden)frame=requestAnimationFrame(render);}
  function animate(key,update,duration=650,done){
    if(motion.matches){tweens.delete(key);update(1);done?.();invalidate();return;}
    tweens.set(key,{start:performance.now(),duration,update,done});invalidate();
  }
  function moveView(position,target){
    const from=camera.position.clone(),look=controls.target.clone();
    animate('camera',t=>{camera.position.lerpVectors(from,position,t);controls.target.lerpVectors(look,target,t);controls.update();},850);
  }
  function selectBook(index){
    const next=bookMeshes[index%Math.min(3,bookMeshes.length)];
    if(activeBook&&activeBook!==next){const old=activeBook,start=old.position.z;animate('book-'+old.uuid,t=>{old.position.z=start*(1-t);});}
    activeBook=next;const start=next.position.z;animate('book-'+next.uuid,t=>{next.position.z=start+(.55-start)*t;});
  }
  function focusZone(id,index=0){
    if(!savedView)savedView={position:camera.position.clone(),target:controls.target.clone()};
    controls.enabled=false;controls.minDistance=3;
    const mobile=container.clientWidth<620;
    const targets={books:new THREE.Vector3(-1.9,1.5,-1.55),desk:new THREE.Vector3(.9,1.6,-1.4),notebook:new THREE.Vector3(.15,1.3,-1.15),wall:new THREE.Vector3(-2.4,2,.45),plant:new THREE.Vector3(-2,1,1.25)};
    const object=targets[id];const target=object.clone().add(new THREE.Vector3(mobile?0:.7,mobile?-.4:0,0));
    const offset=new THREE.Vector3(4.8,mobile?4.8:3.4,mobile?7.5:6.1);
    moveView(object.clone().add(offset),target);
    if(id==='books')selectBook(index);
    if(id==='desk')pulseScreen();
  }
  function pulseScreen(){const start=screen.material.emissiveIntensity;animate('screen',t=>{screen.material.emissiveIntensity=start+Math.sin(t*Math.PI)*.8;},500);}
  function returnToRoom(){
    controls.enabled=true;
    if(activeBook){const book=activeBook,start=book.position.z;animate('book-'+book.uuid,t=>{book.position.z=start*(1-t);});activeBook=null;}
    if(savedView){const view=savedView;savedView=null;moveView(view.position,view.target);}
  }
  function roomAction(event){
    const d=event.detail;
    if(d.type==='focus')focusZone(d.id,d.book);
    if(d.type==='close')returnToRoom();
    if(d.type==='book')selectBook(d.book);
    if(d.type==='screen')pulseScreen();
    if(d.type==='flip'||d.type==='rustle')animate('page',t=>{pagePivot.rotation.z=Math.sin(t*Math.PI)*2.5*(d.direction||1);},600);
    if(d.type==='reveal'){
      hiddenNote.visible=true;hiddenNote.userData.lines.forEach(l=>l.visible=true);
      const start=wall.position.z;animate('picture',t=>{wall.position.z=start+((d.revealed?-.95:0)-start)*t;},750,()=>{hiddenNote.visible=d.revealed;hiddenNote.userData.lines.forEach(l=>l.visible=d.revealed);});
    }
    if(d.type==='water'){
      drops.forEach(d=>d.visible=true);
      animate('water',t=>{drops.forEach((d,i)=>{d.position.y=2.1-((t*2+i*.13)%1)*1.4;});leaves.forEach((l,i)=>{l.rotation.z=Math.sin(t*Math.PI*4+i)*.16;});},1500,()=>{drops.forEach(d=>d.visible=false);flower.visible=true;animate('bloom',t=>flower.scale.setScalar(.1+.9*t),600);});
    }
  }
  window.addEventListener('room-action',roomAction);
  controls.addEventListener('start',()=>tweens.delete('camera'));
  controls.addEventListener('change',invalidate);
  function reset(){
    tweens.delete('camera');savedView=null;controls.enabled=true;controls.minDistance=8.3;
    const mobile=container.clientWidth<620;
    camera.position.set(mobile?10.5:8.8,mobile?9.2:7.4,mobile?13:10.4);
    controls.target.set(0,mobile?1.15:1.1,0);controls.update();invalidate();
  }
  function resize(){renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.fov=container.clientWidth<620?52:35;camera.updateProjectionMatrix();invalidate();}
  const observer=new ResizeObserver(resize);observer.observe(container);
  reset();resize();
  if(experience.active)focusZone(experience.active);
  function hit(event){
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    // Occlusion-aware: the first scene surface must belong to an interactive group.
    const intersections=raycaster.intersectObjects(scene.children,true);
    for(const h of intersections){
      if(h.object===shadow)continue;
      let object=h.object;let bookIndex;
      while(object){if(object.userData.bookIndex!==undefined)bookIndex=object.userData.bookIndex;if(object.userData.zone)return {id:object.userData.zone,bookIndex};object=object.parent;}
      return null;
    }
    return null;
  }
  renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};tooltip.hidden=true;});
  renderer.domElement.addEventListener('pointermove',e=>{
    if(e.buttons){tooltip.hidden=true;return;}
    selected=hit(e);renderer.domElement.style.cursor=selected?'pointer':'grab';
    if(selected && panel.hidden && e.pointerType!=='touch'){
      const rect=container.getBoundingClientRect();tooltip.textContent=({books:'抽一本书',desk:'打开电脑',notebook:'翻翻手记',wall:'挪动画框',plant:'照顾绿植'})[selected.id]+' ↗';
      tooltip.style.left=`${Math.min(Math.max(e.clientX-rect.left,90),rect.width-90)}px`;tooltip.style.top=`${e.clientY-rect.top-10}px`;tooltip.hidden=false;
    }else tooltip.hidden=true;
  });
  renderer.domElement.addEventListener('pointerup',e=>{
    if(pointerDown && Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)<6){const hitObject=hit(e);if(hitObject)experience.open(hitObject.id,buttons.find(b=>b.dataset.zone===hitObject.id)||buttons[0],hitObject.bookIndex);}
    pointerDown=null;
  });
  renderer.domElement.addEventListener('pointercancel',()=>{pointerDown=null;});
  renderer.domElement.addEventListener('pointerleave',()=>{tooltip.hidden=true;});
  const resetButton=document.querySelector('#room-reset');
  resetButton.disabled=false;
  function applyLighting(){
    const night=window.siteTheme.current==='dark';
    ambient.intensity=night?.8:2.8;sun.intensity=night?.3:4.2;fill.intensity=night?.3:1;lampLight.intensity=night?10:0;
    windowPane.material.color.set(night?'#597e93':'#d9eace');windowPane.material.emissive.set(night?'#35536c':'#d9eace');
    screen.material.emissiveIntensity=night?.65:.15;renderer.toneMappingExposure=night?1.1:1.35;invalidate();
  }
  window.addEventListener('site-theme-change',applyLighting);
  applyLighting();
  resetButton.addEventListener('click',reset);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)invalidate();});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();loading.hidden=true;fallback.hidden=false;resetButton.disabled=true;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{fallback.hidden=true;resetButton.disabled=false;invalidate();});
  loading.hidden=true;
  // Finite interaction tweens stop rendering when the scene settles.
  invalidate();
  window.addEventListener('pagehide',()=>{
    disposed=true;tweens.clear();window.removeEventListener('room-action',roomAction);
    window.removeEventListener('site-theme-change',applyLighting);
    if(frame)cancelAnimationFrame(frame);controls.dispose();observer.disconnect();
    scene.traverse(object=>{if(object.geometry)object.geometry.dispose();});
    Object.values(materials).forEach(m=>m.dispose());shadow.material.dispose();renderer.dispose();
  },{once:true});
  // A bfcache restore must recreate GPU resources disposed on pagehide.
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
}

startRoom().catch(error=>{loading.hidden=true;fallback.hidden=false;console.warn('Room initialization failed; text navigation is available.',error);});
