'use strict';
/* VANTYR Phase 3 - visual feedback only.
   Observe authoritative DOM values; never modify app data, dice totals or storage. */
(()=>{
  const ready=()=>{
    const app=document.getElementById('app');
    if(!app || app.dataset.v3Ready==='true')return;
    app.dataset.v3Ready='true';
    const $=id=>document.getElementById(id);
    const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const replay=(el,cls)=>{
      if(!el||reduceMotion())return;
      el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
    };
    // Intentional colors: selected high-impact buttons, restrained neutral controls elsewhere.
    const ritual=/crit|emperor|fury|future|ascendant|initiative|ritual/i;
    const danger=/end combat|clear|reset|delete|remove|sign out/i;
    const primary=/attack|roll|apply damage|start combat|heal|confirm|activate|save/i;
    const paint=button=>{
      if(button.classList.contains('v3-control'))return;
      button.classList.add('v3-control');
      const id=button.id||'', label=button.textContent?.trim()||'';
      const context=id+' '+label;
      button.classList.add(ritual.test(context)?'v3-ritual':danger.test(context)?'v3-danger':primary.test(context)?'v3-primary':'v3-secondary');
    };
    app.querySelectorAll('button').forEach(paint);
    const autoStyle=new MutationObserver(mutations=>{
      for(const m of mutations)for(const node of m.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches?.('button'))paint(node);
        node.querySelectorAll?.('button').forEach(paint);
      }
    });
    autoStyle.observe(app,{childList:true,subtree:true});
    const controls=event=>{
      const b=event.target.closest?.('button');
      if(!b||!app.contains(b)||b.disabled)return;
      paint(b);
      if(event.type==='pointerdown'){
        b.classList.add('v3-depressed');
      }else if(event.type==='click'){
        replay(b,'v3-action-feedback');
      }
    };
    app.addEventListener('pointerdown',controls,{passive:true});
    app.addEventListener('click',controls);
    const release=()=>app.querySelectorAll('.v3-depressed').forEach(x=>x.classList.remove('v3-depressed'));
    document.addEventListener('pointerup',release,{passive:true});
    document.addEventListener('pointercancel',release,{passive:true});
    window.addEventListener('blur',release);
    app.addEventListener('animationend',event=>{
      if(event.animationName==='v3-touch')event.target.classList.remove('v3-action-feedback');
      if(event.animationName==='v3-damage')event.target.classList.remove('v3-hp-damage');
      if(event.animationName==='v3-heal')event.target.classList.remove('v3-hp-heal');
      if(event.animationName==='v3-turn')event.target.classList.remove('v3-turn-shift');
      if(event.animationName==='v3-tray')event.target.classList.remove('v3-roll-reveal');
    });
    const dash=$('phase1Dashboard'),hp=$('currentHpText'),temp=$('tempHpText'),turn=$('p1Turn'),combat=$('combatStatus'),mode=$('modeLabel'),modal=$('rollModal');
    let lastHp=null,lastTemp=null,lastTurn=null,lastCombat=null,lastMode=null;
    const snapshot=()=>{
      const hpNumber=Number((hp?.textContent||'').match(/^\s*(\d+)/)?.[1]);
      const tempNumber=Number((temp?.textContent||'').match(/^\s*(\d+)/)?.[1]);
      const turnNumber=turn?.textContent?.trim();
      const combatOn=!!combat?.textContent?.startsWith('IN COMBAT');
      const emperor=!!mode?.textContent?.includes('EMPEROR');
      if(Number.isFinite(hpNumber)&&lastHp!==null&&hpNumber!==lastHp){
        const cls=hpNumber<lastHp?'v3-hp-damage':'v3-hp-heal';
        replay(dash,cls);replay(document.querySelector('#tab-combat>.hp-panel'),cls);
      }
      if(Number.isFinite(tempNumber)&&lastTemp!==null&&tempNumber!==lastTemp&&hpNumber===lastHp){
        replay(dash,tempNumber<lastTemp?'v3-hp-damage':'v3-hp-heal');
      }
      if(lastTurn!==null&&turnNumber!==lastTurn&&combatOn)replay(turn?.parentElement,'v3-turn-shift');
      if(dash){
        dash.classList.toggle('v3-combat-active',combatOn);
        dash.classList.toggle('v3-emperor-awake',emperor);
      }
      lastHp=Number.isFinite(hpNumber)?hpNumber:lastHp;
      lastTemp=Number.isFinite(tempNumber)?tempNumber:lastTemp;
      lastTurn=turnNumber;lastCombat=combatOn;lastMode=emperor;
    };
    // Observe only the relevant text nodes; do not observe style/class changes we make ourselves.
    const statsObserver=new MutationObserver(snapshot);
    [hp,temp,turn,combat,mode].filter(Boolean).forEach(x=>statsObserver.observe(x,{childList:true,characterData:true,subtree:true}));
    snapshot();
    // Roll trays are updated by the existing dice engine. Animate only after content changes.
    app.querySelectorAll('.dice-tray').forEach(tray=>{
      const observer=new MutationObserver(()=>replay(tray,'v3-roll-reveal'));
      observer.observe(tray,{childList:true,characterData:true,subtree:true});
    });
    if(modal){
      const observeModal=()=>{
        if(modal.hidden)return;
        const combined=[ $('modalHeading')?.textContent, $('modalDescription')?.textContent ].join(' ');
        modal.classList.toggle('v3-critical',/critical|brutal crit|natural 20/i.test(combined));
      };
      new MutationObserver(observeModal).observe(modal,{attributes:true,attributeFilter:['hidden']});
      const heading=$('modalHeading');
      if(heading)new MutationObserver(observeModal).observe(heading,{childList:true,characterData:true,subtree:true});
      observeModal();
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();