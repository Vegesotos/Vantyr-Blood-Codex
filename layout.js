'use strict';
/* Blood Codex layout editor v2.4 — pointer-driven, touch-friendly, grid-constrained. */
(() => {
  const STORE='vantyr-blood-codex-card-layout-v2';
  const OLD='vantyr-blood-codex-card-layout-v1';
  const toggle=document.getElementById('developerModeBtn');
  const hint=document.getElementById('layoutEditHint');
  if(!toggle)return;
  let enabled=false,drag=null, saved={};
  try{saved=JSON.parse(localStorage.getItem(STORE)||localStorage.getItem(OLD)||'{}')||{}}catch(_){saved={}}
  const zones=[...document.querySelectorAll('[data-layout-zone]')].filter(z=>z.dataset.layoutZone!=='initiative-controls');
  const observers=new Map();
  const updated=new WeakSet();
  const clean=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
  const children=z=>[...z.children].filter(c=>c.nodeType===1&&!c.matches('.curse-library-heading,.brain-damage-form,.curse-toast,.dev-drag-ghost,.dev-drag-placeholder,.layout-edit-hint'));
  function cardKey(card,i){
    if(card.dataset.layoutKey)return card.dataset.layoutKey;
    const stable=card.id||card.getAttribute('data-curse')||card.getAttribute('data-form')||card.getAttribute('data-id');
    const caption=card.querySelector('h3,h4,summary strong,.sheet-copy strong,.constellation-top strong,.ability label,.quick-card label')?.textContent;
    card.dataset.layoutKey=clean(stable||caption||`${card.tagName}-${i}`)||`entry-${i}`;
    return card.dataset.layoutKey;
  }
  function persist(zone){
    saved[zone.dataset.layoutZone]=children(zone).map(cardKey);
    try{localStorage.setItem(STORE,JSON.stringify(saved))}catch(_){}
  }
  function watchPause(zone,fn){const obs=observers.get(zone);if(obs)obs.disconnect();try{fn()}finally{if(obs)obs.observe(zone,{childList:true})}}
  function decorate(zone){
    watchPause(zone,()=>{
      const cards=children(zone);
      cards.forEach((card,i)=>{
        cardKey(card,i);
        card.classList.add('dev-draggable');
        let handle=[...card.children].find(el=>el.classList?.contains('dev-drag-handle'));
        if(!handle){
          handle=document.createElement('button');handle.type='button';handle.className='dev-drag-handle';handle.textContent='⠿';
          handle.title='Hold and drag to move this card';handle.setAttribute('aria-label','Move card');
          card.append(handle);
        }
      });
      const order=saved[zone.dataset.layoutZone];
      if(!updated.has(zone)&&Array.isArray(order)&&order.length){
        const map=new Map(order.map((key,i)=>[key,i]));
        cards.sort((a,b)=>(map.get(a.dataset.layoutKey)??10000)-(map.get(b.dataset.layoutKey)??10000));
        // AppendChild moves only direct cards, no internal event listeners are recreated.
        cards.forEach(c=>zone.append(c));
      }
      updated.add(zone);
    });
  }
  zones.forEach(zone=>{decorate(zone);const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('dev-drag-handle')))){
      updated.delete(zone);decorate(zone);
    }
  });observers.set(zone,observer);observer.observe(zone,{childList:true})});
  function setMode(on){enabled=on;document.documentElement.classList.toggle('developer-mode',on);
    toggle.textContent=on?'🔒 Lock Layout':'⚙ Dev Mode';toggle.setAttribute('aria-pressed',String(on));
    toggle.title=on?'Lock all card positions':'Enable card rearranging';if(hint)hint.hidden=!on;
    if(!on&&drag)finish(false);
  }
  toggle.addEventListener('click',()=>setMode(!enabled));
  function zoneFor(node){return node?.closest?.('[data-layout-zone]')}
  function tabFor(node){return node?.closest?.('[data-tab-panel]')?.dataset.tabPanel||'global'}
  function compatible(targetZone){
    if(!targetZone||!drag)return false;
    if(targetZone===drag.origin)return true;
    // Major sections can move between major containers in the same tab; avoid
    // dropping weapon controls into ability score slots or other incompatible grids.
    const major=new Set(['combat-sections','character-sections','rolls-sections','curses-sections']);
    return major.has(targetZone.dataset.layoutZone)&&major.has(drag.origin.dataset.layoutZone)&&tabFor(targetZone)===tabFor(drag.origin);
  }
  function findDrop(clientX,clientY){
    const under=document.elementFromPoint(clientX,clientY);
    if(!under)return null;
    // Always seek the deepest relevant layout container.
    let z=zoneFor(under);
    while(z&&!compatible(z))z=zoneFor(z.parentElement);
    if(!z)return null;
    const cards=children(z).filter(c=>c!==drag.card);
    let target=cards.find(c=>c===under||c.contains(under));
    if(!target&&cards.length){target=cards.reduce((best,c)=>{
      const r=c.getBoundingClientRect();const d=Math.hypot(clientX-r.left-r.width/2,clientY-r.top-r.height/2);
      return !best||d<best.d?{c,d}:best
    },null).c}
    if(!target)return {zone:z,target:null,before:false};
    const r=target.getBoundingClientRect();
    const isGrid=getComputedStyle(z).display==='grid';
    const before=isGrid?clientX<r.left+r.width/2:clientY<r.top+r.height/2;
    return {zone:z,target,before};
  }
  function clearTargets(){document.querySelectorAll('.dev-drop-target').forEach(c=>c.classList.remove('dev-drop-target'))}
  function finish(commit){
    if(!drag)return;
    const d=drag;const landing=commit?findDrop(d.lastX,d.lastY):null;
    if(landing){
      const {zone,target,before}=landing;
      watchPause(zone,()=>zone.insertBefore(d.card,target?(before?target:target.nextSibling):null));
      persist(zone);if(zone!==d.origin)persist(d.origin);
    }
    d.ghost.remove();d.card.classList.remove('dev-is-dragging');
    document.body.classList.remove('dev-pointer-dragging');clearTargets();drag=null;
  }
  document.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('.dev-drag-handle');
    if(!enabled||!handle||event.button!==0)return;
    const card=handle.parentElement,zone=card.parentElement;
    if(!zone?.dataset.layoutZone)return;
    event.preventDefault();
    const rect=card.getBoundingClientRect();
    const ghost=card.cloneNode(true);ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    ghost.classList.add('dev-drag-ghost');ghost.style.width=`${rect.width}px`;ghost.style.height=`${rect.height}px`;
    ghost.style.left=`${rect.left}px`;ghost.style.top=`${rect.top}px`;
    document.body.append(ghost);
    drag={card,origin:zone,ghost,lastX:event.clientX,lastY:event.clientY,dx:event.clientX-rect.left,dy:event.clientY-rect.top};
    card.classList.add('dev-is-dragging');document.body.classList.add('dev-pointer-dragging');
    handle.setPointerCapture?.(event.pointerId);
  });
  document.addEventListener('pointermove',event=>{
    if(!drag)return;event.preventDefault();
    drag.lastX=event.clientX;drag.lastY=event.clientY;
    drag.ghost.style.left=`${event.clientX-drag.dx}px`;
    drag.ghost.style.top=`${event.clientY-drag.dy}px`;
    clearTargets();const spot=findDrop(event.clientX,event.clientY);
    if(spot?.target)spot.target.classList.add('dev-drop-target');
  },{passive:false});
  document.addEventListener('pointerup',()=>{if(drag)finish(true)});
  document.addEventListener('pointercancel',()=>{if(drag)finish(false)});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&drag){finish(false);return}
    const h=document.activeElement;
    if(!enabled||!h?.classList.contains('dev-drag-handle')||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();const card=h.parentElement,z=card.parentElement,all=children(z),at=all.indexOf(card);
    const delta=['ArrowUp','ArrowLeft'].includes(event.key)?-1:1,next=at+delta;
    if(next<0||next>=all.length)return;
    watchPause(z,()=>z.insertBefore(card,delta<0?all[next]:all[next].nextSibling));persist(z);h.focus();
  });
  setMode(false);
})();
