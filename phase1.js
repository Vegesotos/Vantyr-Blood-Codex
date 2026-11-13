'use strict';
/* Phase 1 mobile view: pure presentation over the existing character engine.
   Do not clone or mutate character data; the original controls remain authoritative. */
(()=>{
 function init(){
   const dash=document.getElementById('phase1Dashboard');
   const nav=document.getElementById('phase1BottomNav');
   if(!dash||!nav)return;
   const $=id=>document.getElementById(id);
   const numeric=(str,def=0)=>{const x=Number(String(str??'').replace(/[^\d.-]/g,''));return Number.isFinite(x)?x:def};
   const readInput=(name)=>{const cards=[...document.querySelectorAll('#quickStats .quick-card')];const card=cards.find(c=>c.querySelector('label')?.textContent.includes(name));return card?.querySelector('input')?.value||null};
   function refresh(){
     const hp=$('currentHpText')?.textContent||'178 / 178';
     const hpNumbers=hp.match(/\d+/g)||['178','178'];const value=Number(hpNumbers[0]),max=Math.max(1,Number(hpNumbers[1]));
     $('p1HpText').innerHTML=String(value)+' <small>/ '+String(max)+'</small>';
     $('p1HpFill').style.width=Math.max(0,Math.min(100,value/max*100))+'%';
     $('p1HpTrack').setAttribute('aria-valuemax',String(max));
     $('p1HpTrack').setAttribute('aria-valuenow',String(value));
     dash.classList.toggle('p1-low-health',value/max<=.25);
     const ac=readInput('ARMOR CLASS'),dc=readInput('SPELL SAVE DC'),initiative=readInput('INITIATIVE');
     if(ac!==null)$('p1Ac').textContent=ac;
     if(dc!==null)$('p1Dc').textContent=dc;
     if(initiative!==null)$('p1Initiative').textContent=(numeric(initiative)>=0?'+':'')+initiative;
     const mode=$('modeLabel')?.textContent||'NORMAL FORM';
     $('p1Form').textContent=mode;
     $('p1Mode').textContent=mode.includes('EMPEROR')?'EMPEROR':'NORMAL';
     dash.classList.toggle('p1-emperor',mode.includes('EMPEROR'));
     const combat=$('combatStatus')?.textContent||'Out of combat';
     const active=combat.startsWith('IN COMBAT');
     $('p1CombatState').textContent=active?'⚔ IN COMBAT':'OUT OF COMBAT';
     const n=combat.match(/Turn\s+(\d+)/i);
     $('p1Turn').textContent=active?(n?.[1]||'1'):'—';
     $('p1CombatToggle').textContent=active?'■ END COMBAT':'⚔ START COMBAT';
     $('p1NextTurn').disabled=!active;
     $('p1Temp').textContent='✦ '+($('tempHpText')?.textContent||'0 TEMP HP');
   }
   const obs=new MutationObserver(()=>refresh());
   for(const id of ['currentHpText','tempHpText','modeLabel','combatStatus','quickStats']){
      const target=$(id);if(target)obs.observe(target,{subtree:true,childList:true,characterData:true});
   }
   $('quickStats')?.addEventListener('input',refresh);
   refresh();
   const originalClick=id=>$(id)?.click();
   $('p1CombatToggle').addEventListener('click',()=>originalClick('combatBtn'));
   $('p1NextTurn').addEventListener('click',()=>originalClick('endTurnBtn'));
   // Navigate to existing weapon sections; never duplicate attack or resource controls.
   function jumpToWeapon(selector){
     const target=document.querySelector(selector);
     if(!target)return;
     // The actual weapon cards live inside a collapsed Crossbows details element.
     // Open all ancestor details before scrolling; never match a label in the dashboard.
     for(let node=target.parentElement;node;node=node.parentElement){
       if(node.tagName==='DETAILS')node.open=true;
     }
     requestAnimationFrame(()=>{
       target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
       target.classList.remove('p2-jump-highlight');
       void target.offsetWidth;
       target.classList.add('p2-jump-highlight');
     });
   }
   $('p1Starshot').addEventListener('click',()=>jumpToWeapon('#combatWeapons > .weapon-section'));
   $('p1Martyr').addEventListener('click',()=>jumpToWeapon('#combatWeapons > .martyr-section'));
   const more=$('p1More'),menu=$('p1MoreMenu');
   const closeMenu=()=>{menu.hidden=true;more.setAttribute('aria-expanded','false')};
   function reflect(){
     const selected=document.querySelector('.tab-btn.active')?.dataset.tab||'combat';
     nav.querySelectorAll('[data-go-tab]').forEach(b=>{
       const on=b.dataset.goTab===selected;b.classList.toggle('selected',on);
       if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
     });
     more.classList.toggle('selected',['curses','spells','inventory'].includes(selected));
   }
   nav.addEventListener('click',e=>{
     const b=e.target.closest('[data-go-tab]');if(!b)return;
     const original=document.querySelector('.chapter-nav .tab-btn[data-tab="'+b.dataset.goTab+'"]');
     if(original)original.click();
     closeMenu();reflect();
     window.scrollTo({top:0,behavior:'instant'});
   });
   more.addEventListener('click',()=>{
     menu.hidden=!menu.hidden;
     more.setAttribute('aria-expanded',String(!menu.hidden));
   });
   document.addEventListener('pointerdown',e=>{if(!nav.contains(e.target)&&!menu.hidden)closeMenu()});
   document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
   const chapters=document.querySelector('.chapter-nav');
   if(chapters)new MutationObserver(reflect).observe(chapters,{subtree:true,attributes:true,attributeFilter:['class']});
   reflect();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();