'use strict';
/* VANTYR signatures: UI-only enhancement driven by existing controls.
   Does not create rolls, modify state, write storage or trigger game actions. */
(()=>{
 const init=()=>{
  const root=document.getElementById('app');
  if(!root||root.dataset.v4Ready==='true')return;
  root.dataset.v4Ready='true';
  const $=id=>document.getElementById(id);
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const groups={
   starshot:{panel:document.querySelector('#combatWeapons > .weapon-section'),tray:$('dice-tray-starshot'),ids:['attackBtn','damageBtn','critBtn'],text:'THE CONSTELLATIONS ANSWER'},
   martyr:{panel:document.querySelector('#combatWeapons > .martyr-section'),tray:$('dice-tray-martyr'),ids:['martyrAttack','martyrDamage','martyrCrit'],text:'THE MARTYR AWAKENS'},
   fangs:{panel:document.querySelector('.fangs-section'),tray:$('dice-tray-fangs'),ids:['biteAttack','biteDamage','biteCrit'],text:'THE BLOOD HUNGER STIRS'}
  };
  let pending=null;
  // This is decoration, deliberately separate from authoritative combat controls.
  for(const [key,group] of Object.entries(groups)){
    if(!group.panel||!group.tray)continue;
    const sigil=document.createElement('div');
    sigil.className='v4-weapon-sigil';
    sigil.setAttribute('aria-hidden','true');
    sigil.textContent=group.text;
    group.tray.before(sigil);
    group.sigil=sigil;
    group.panel.dataset.v4Weapon=key;
  }
  const clearPending=()=>{pending=null};
  const setActive=(key,critical=false)=>{
    for(const [name,g] of Object.entries(groups)){
      g.panel?.classList.toggle('v4-active-weapon',name===key);
      if(g.sigil){
        g.sigil.textContent=name===key?(critical?'CRITICAL · '+g.text:g.text):g.text;
        g.sigil.dataset.v4Action=name===key&&critical?'critical':'normal';
      }
    }
  };
  // Capture which real action was pressed, before existing app listeners run.
  document.addEventListener('click',event=>{
    const b=event.target.closest?.('button');
    if(!b||b.disabled)return;
    for(const [key,g] of Object.entries(groups)){
      if(!g.ids.includes(b.id))continue;
      pending={key,critical:/crit/i.test(b.id)};
      return;
    }
    // Other dice actions must not inherit a weapon theme.
    if(b.hasAttribute('data-dice-tray'))clearPending();
  },true);
  const modal=$('rollModal');
  if(modal){
    const applyModal=()=>{
      if(modal.hidden)return;
      const heading=$('modalHeading')?.textContent||'';
      const description=$('modalDescription')?.textContent||'';
      const combined=heading+' '+description;
      // Source is the clicked weapon button. Critical flag uses the actual result text too.
      const key=pending?.key||null;
      ['starshot','martyr','fangs'].forEach(name=>modal.classList.toggle('v4-'+name,name===key));
      modal.classList.toggle('v4-crit',!!key&&(!!pending?.critical||/critical|brutal crit|natural 20/i.test(combined)));
    };
    new MutationObserver(applyModal).observe(modal,{attributes:true,attributeFilter:['hidden']});
    applyModal();
  }
  for(const [key,g] of Object.entries(groups)){
    if(!g.tray)continue;
    new MutationObserver(()=>{
      if(pending?.key!==key)return;
      setActive(key,pending.critical);
    }).observe(g.tray,{childList:true,characterData:true,subtree:true});
  }
  // Emperor's Time is based on the rendered mode label, not a guessed toggle.
  const mode=$('modeLabel'),dashboard=$('phase1Dashboard'),button=$('modeBtn');
  if(button)button.classList.add('v4-emperor-button');
  let previousMode=null;
  const reflectMode=()=>{
    const emperor=(mode?.textContent||'').toUpperCase().includes('EMPEROR');
    dashboard?.classList.toggle('v4-emperor-state',emperor);
    if(previousMode!==null&&previousMode!==emperor&&dashboard&&!reduced()){
      dashboard.classList.remove('v4-emperor-entry','v4-emperor-exit');
      void dashboard.offsetWidth;
      dashboard.classList.add(emperor?'v4-emperor-entry':'v4-emperor-exit');
    }
    previousMode=emperor;
  };
  if(mode)new MutationObserver(reflectMode).observe(mode,{childList:true,characterData:true,subtree:true});
  reflectMode();
  // Instant, brief feedback when using the weapon jump shortcuts.
  for(const [id,key] of [['p1Starshot','starshot'],['p1Martyr','martyr']]){
    const b=$(id);
    if(!b)continue;
    b.addEventListener('click',()=>{
      b.classList.remove('v4-quick-glow');void b.offsetWidth;
      b.classList.add('v4-quick-glow');
    });
    b.addEventListener('transitionend',()=>b.classList.remove('v4-quick-glow'));
  }
  root.addEventListener('animationend',e=>{
    if(e.animationName==='v4-coronation')e.target.classList.remove('v4-emperor-entry','v4-emperor-exit');
  });
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();