// The reading / exploring layer also works when WebGL is unavailable.
export function createExperiences({panel, tooltip, buttons, data}) {
  const {zones,journal,bookNotes,secretNote}=data;
  const closeButton=panel.querySelector('.panel-close');
  const title=panel.querySelector('#room-panel-title');
  const copy=panel.querySelector('#room-panel-copy');
  const content=panel.querySelector('#room-panel-links');
  const stage=document.querySelector('.room-stage');
  const visited=new Set();
  let active=null,book=0,page=0,project=0,projectTab='overview',journalPage=0,watered=false,revealed=false,flowStep=0,returnFocus=null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const action=(type,extra={})=>window.dispatchEvent(new CustomEvent('room-action',{detail:{type,...extra}}));
  const button=(label,act,extra='')=>`<button type="button" data-action="${act}" ${extra}>${label}</button>`;
  const link=(item,label)=>`<a class="experience-link" href="${esc(item.url)}">${label} <span aria-hidden="true">↗</span></a>`;
  const pager=(index,total,prev,next)=>`<div class="experience-pager">${button('← 上一页',prev,index===0?'disabled':'')}<span aria-live="polite">${index+1} / ${total}</span>${button('下一页 →',next,index===total-1?'disabled':'')}</div>`;
  function mark(id){visited.add(id);document.querySelector('#room-discovery-count').textContent=visited.size;buttons.forEach(b=>b.classList.toggle('discovered',visited.has(b.dataset.zone)));}
  function render(focusAction){
    const zone=zones.find(z=>z.id===active);if(!zone)return;
    panel.dataset.experience=active;
    title.textContent={books:'从书架抽一本',desk:'桌面上的进行时',notebook:'一本还在改的手记',wall:'画框后面有什么？',plant:'给它一点水'}[active];
    copy.textContent={books:'翻几页，再决定要不要读下去。',desk:'打开一个文件夹，看看想法怎样落到纸上。',notebook:'从最近的文章里，翻到一段思考。',wall:'有时候，换个角度会有意外收获。',plant:'在这里待一会儿，也可以什么都不做。'}[active];
    if ((active==='books' || active==='desk') && !zone.links.length) { content.innerHTML='<p>这里暂时还没有公开内容。</p>'; return; }
    if(active==='books'){
      const books=zone.links,b=books[book],pages=b.pages.length?b.pages:[b.title];page=Math.min(page,pages.length-1);
      content.innerHTML=`<div class="book-picker" aria-label="选择一本书">${books.map((b,i)=>button(`<span>${String(i+1).padStart(2,'0')}</span>${esc(b.meta)}`,'book',`data-index="${i}" aria-pressed="${i===book}" style="--book-color:${['#566f58','#9b7558','#6b7f86'][i%3]}"`)).join('')}</div><div class="reading-book"><span class="experience-kicker">${esc(b.meta)} / 摘读</span><h3>${esc(b.title)}</h3><div class="book-page" aria-live="polite"><p>${esc(pages[page])}</p></div><p class="margin-note">↳ ${esc(bookNotes[book%bookNotes.length])}</p>${pager(page,pages.length,'book-prev','book-next')}</div>${link(b,'在主站读完整文章')}`;
    }else if(active==='desk'){
      const projects=zone.links,p=projects[project];
      const tabs=[['overview','项目说明'],['sketch','推演草图'],['next','复盘']];
      let body=projectTab==='overview'?`<img src="${esc(p.cover)}" alt="${esc(p.title)}的构想示意"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="project-state">${esc(p.kind)} · ${esc(p.status)}</span>`:projectTab==='next'?`<span class="experience-kicker">PROJECT NOTES</span><h3>结果与复盘</h3><p>${esc(p.pages.at(-1)||p.description)}</p><p class="desktop-note">完整案例中保留了业务问题、方案设计与取舍。</p>`:`<span class="experience-kicker">点击，推进一次小尝试</span><div class="flow-sketch">${p.steps.map((t,i)=>`<div class="${i<=flowStep?'reached':''}"><span>${String(i+1).padStart(2,'0')}</span>${esc(t.title)}${i===flowStep?'<b>← 此刻</b>':''}</div>`).join('')}</div><p class="flow-feedback" role="status">${esc(p.steps[flowStep].text)}</p>${button(flowStep===3?'再走一遍 ↺':'继续下一步 →','flow')}`;
      content.innerHTML=`<div class="computer-shell"><div class="computer-bar"><span>● ● ●</span><span>MY LITTLE DESKTOP</span></div><div class="project-folders">${projects.map((p,i)=>button(`<span aria-hidden="true">▱</span> 项目 0${i+1}`,'project',`data-index="${i}" aria-pressed="${project===i}"`)).join('')}</div><div class="desktop-tabs" aria-label="项目视图">${tabs.map(([id,label])=>button(label,'project-tab',`data-tab="${id}" aria-pressed="${projectTab===id}"`)).join('')}</div><div class="desktop-document">${body}</div></div>${link(p,'打开完整案例')}`;
    }else if(active==='notebook'){
      if (!journal.length) { content.innerHTML='<p>新的手记还在路上。</p>'; return; }
      const entry=journal[journalPage];
      content.innerHTML=`<div class="journal-sheet"><span class="experience-kicker">${esc(entry.date)}</span><h3>${esc(entry.title)}</h3>${entry.crossed?`<p class="crossed-thought"><s>${esc(entry.crossed)}</s></p>`:''}<p>${esc(entry.text)}</p><p class="margin-note">${esc(entry.note)}</p><span class="journal-number">— ${String(journalPage+1).padStart(2,'0')} —</span></div>${pager(journalPage,journal.length,'journal-prev','journal-next')}${entry.url?link(entry,'读完整文章'):''}`;
    }else if(active==='wall'){
      content.innerHTML=`<div class="secret-frame ${revealed?'revealed':''}"><div class="paper-secret">${esc(secretNote).replaceAll('\n','<br>')}</div><div class="mini-landscape" aria-hidden="true"><span>山在这里，路在脚下。</span></div></div>${button(revealed?'把画挂好':'轻轻挪开画框 →','reveal')}${revealed?'<p class="experience-feedback" role="status">你发现了一张藏起来的便签。</p>':''}${link(zone.links[0],'认识这里的主人')}`;
    }else{
      content.innerHTML=`<div class="plant-moment ${watered?'watered':''}"><span class="plant-illustration" aria-hidden="true">♧</span><h3>${watered?'今天的水，已经够了。':'它在等一场小雨。'}</h3><p>${watered?'有些变化很慢，但正在发生。谢谢你照顾这个小角落。':'给它一点水，看看会发生什么。'}</p>${watered?'<span class="plant-flower" aria-hidden="true">✿</span>':''}</div>${button(watered?'让它慢慢长大':'浇一点水 ↓','water',watered?'disabled':'')}<p class="experience-feedback" role="status">${watered?'你发现了一朵小花。':'不赶时间，也不需要完成什么。'}</p>`;
    }
    // Keep keyboard focus on the corresponding control after a page re-render.
    if(focusAction){const el=[...content.querySelectorAll('[data-action]')].find(e=>e.dataset.action===focusAction.name&&e.dataset.index===focusAction.index&&e.dataset.tab===focusAction.tab&&!e.disabled);(el||content.querySelector('.experience-pager button:not(:disabled)')||closeButton).focus({preventScroll:true});}
  }
  function open(id,source,index){
    if(!zones.some(z=>z.id===id))return;
    returnFocus=source||document.activeElement;active=id;if(id==='books'&&Number.isInteger(index)){book=index%zones[0].links.length;page=0;}
    panel.hidden=false;tooltip.hidden=true;stage.classList.add('is-exploring');
    buttons.forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.zone===id)));
    mark(id);render();action('focus',{id,book});closeButton.focus({preventScroll:true});
  }
  function close(){
    if(panel.hidden)return;panel.hidden=true;active=null;stage.classList.remove('is-exploring');buttons.forEach(b=>b.setAttribute('aria-expanded','false'));action('close');
    if(returnFocus instanceof HTMLElement&&returnFocus!==document.body)returnFocus.focus({preventScroll:true});
  }
  buttons.forEach(b=>{b.setAttribute('aria-controls','room-panel');b.setAttribute('aria-expanded','false');b.addEventListener('click',()=>open(b.dataset.zone,b));});
  closeButton.addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  content.addEventListener('click',event=>{
    const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
    const name=el.dataset.action;
    if(name==='book'){book=Number(el.dataset.index);page=0;action('book',{book});}
    if(name==='book-prev'||name==='book-next'){page+=name==='book-next'?1:-1;action('rustle');}
    if(name==='project'){project=Number(el.dataset.index);flowStep=0;action('screen');}
    if(name==='project-tab'){projectTab=el.dataset.tab;action('screen');}
    if(name==='flow'){flowStep=(flowStep+1)%4;action('screen');}
    if(name==='journal-prev'||name==='journal-next'){journalPage+=name==='journal-next'?1:-1;action('flip',{direction:name==='journal-next'?1:-1});}
    if(name==='water'){watered=true;action('water');}
    if(name==='reveal'){revealed=!revealed;action('reveal',{revealed});}
    render({name,index:el.dataset.index,tab:el.dataset.tab});
    const animated=content.querySelector('.book-page,.journal-sheet,.desktop-document');
    if(animated&&!matchMedia('(prefers-reduced-motion: reduce)').matches)animated.animate?.([{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
  });
  document.querySelector('#room-reset').addEventListener('click',close);
  return {open,close,get active(){return active;}};
}
