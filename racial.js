
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
    // The racial initiative is always rolled with advantage; +25 is Vantyr's fixed modifier.
    activeDiceTray='utility';recentDice=[];
    const rolls=[rollDie(20),rollDie(20)];
    const chosen=Math.max(...rolls);
    const exhaustion=typeof exhaustionLevel==='function'?exhaustionLevel():0;
    const bonus=25-exhaustion, total=chosen+bonus;
    const individualTotals=rolls.map(d=>d+bonus);
    const note=`STAND BY THE EMPEROR · ADVANTAGE\nDie #1: ${rolls[0]} +25${exhaustion?` −${exhaustion} Exhaustion`:''} = ${individualTotals[0]}\nDie #2: ${rolls[1]} +25${exhaustion?` −${exhaustion} Exhaustion`:''} = ${individualTotals[1]}\nVantyr's chosen initiative: ${total}. Either complete total can be assigned to an ally under your table's rule.`;
    $('initiativeResult').textContent=`D20 #1: ${rolls[0]} ${bonus>=0?'+':'−'} ${Math.abs(bonus)} = ${individualTotals[0]}  |  D20 #2: ${rolls[1]} ${bonus>=0?'+':'−'} ${Math.abs(bonus)} = ${individualTotals[1]}`;
    setCheckResult('STAND BY THE EMPEROR',chosen,bonus,total,`Roll #1 = ${individualTotals[0]}, Roll #2 = ${individualTotals[1]} (both include +25${exhaustion?` −${exhaustion} Exhaustion`:''}). Share a completed initiative total with an ally.`,'adv',rolls);
    record(note);
    const modal=$('rollModal');
    if(modal){const card=modal.querySelector('.roll-modal-card');if(card){card.classList.remove('hourglass-initiative');void card.offsetWidth;card.classList.add('hourglass-initiative');}
      const heading=$('modalHeading');if(heading){const graphic=document.createElement('span');graphic.className='initiative-hourglass';graphic.setAttribute('aria-hidden','true');graphic.textContent='⌛';heading.prepend(graphic)}
      const eq=$('modalEquation');if(eq){const row=document.createElement('div');row.className='initiative-dual-total';individualTotals.forEach((v,i)=>{const tile=document.createElement('div');tile.className='initiative-total-tile';const caption=document.createElement('small');caption.textContent=`ROLL ${i+1} · ${rolls[i]} +25${exhaustion?` −${exhaustion}`:''}`;const num=document.createElement('strong');num.textContent=v;tile.append(caption,num);row.append(tile)});eq.replaceChildren(row)}
    }
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
