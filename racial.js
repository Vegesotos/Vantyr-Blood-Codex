
'use strict';
/* Racial quick controls — no normal Initiative modifier recalculation. */
(() => {
  const KEY='vantyr-racial-controls-v23';
  let light='neutral';
  try {const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(['neutral','bright','dark'].includes(saved?.light))light=saved.light;}catch(e){}
  const $=id=>document.getElementById(id);
  function saveLight(){try{localStorage.setItem(KEY,JSON.stringify({light}))}catch(e){}}
  function updateSpeed(){const speed=light==='bright'?45:light==='dark'?65:55;
    $('vampireSpeed').textContent=`${speed} ft`;
    $('vampireSpeedLabel').textContent=light==='bright'?'Bright light · −10 ft':light==='dark'?'Dim light / darkness · +10 ft':'Base speed · no lighting modifier';
    $('vampireLightBtn').setAttribute('aria-pressed',String(light==='bright'));
    $('vampireDarkBtn').setAttribute('aria-pressed',String(light==='dark'));
    const visual=document.querySelector('.light-switch');if(visual){visual.classList.toggle('is-dark',light==='dark');visual.classList.toggle('is-neutral',light==='neutral');visual.classList.remove('light-switch-light-flash');void visual.offsetWidth;visual.classList.add('light-switch-light-flash');}
    const card=document.querySelector('.movement-compact');if(card)card.dataset.ambient=light;
  }
  function rollInitiative(){
    // Stand by the Emperor: always 2d20 with fixed +25, minus exhaustion.
    activeDiceTray='utility';recentDice=[];
    const rolls=[rollDie(20),rollDie(20)];
    const exhaustion=typeof exhaustionLevel==='function'?exhaustionLevel():0;
    const bonus=25-exhaustion,totals=rolls.map(n=>n+bonus);
    const chosen=Math.max(...rolls),total=chosen+bonus;
    const note='STAND BY THE EMPEROR · ADVANTAGE\n'
      +'Die #1: '+rolls[0]+' +25'+(exhaustion?' −'+exhaustion+' Exhaustion':'')+' = '+totals[0]+'\n'
      +'Die #2: '+rolls[1]+' +25'+(exhaustion?' −'+exhaustion+' Exhaustion':'')+' = '+totals[1]+'\n'
      +'Vantyr initial initiative: '+total+'. Choose which die to keep and optionally share the other.';
    $('initiativeResult').textContent='Roll 1: '+totals[0]+' · Roll 2: '+totals[1]+' · Choose your initiative…';
    setCheckResult('STAND BY THE EMPEROR',chosen,bonus,total,'Dual initiative assignment · 2d20 advantage','adv',rolls);
    record(note);
    document.dispatchEvent(new CustomEvent('vantyr:initiative-rolled',{detail:{rolls,bonus,totals}}));
  }
  function setup(){if(!$('standByEmperorBtn'))return;
    $('standByEmperorBtn').addEventListener('click',rollInitiative);
    $('vampireLightBtn').addEventListener('click',()=>{light='bright';saveLight();updateSpeed()});
    $('vampireDarkBtn').addEventListener('click',()=>{light='dark';saveLight();updateSpeed()});
    $('vampireNeutralBtn').addEventListener('click',()=>{light='neutral';saveLight();updateSpeed()});
    updateSpeed();
  }
  document.addEventListener('DOMContentLoaded',setup);
})();
