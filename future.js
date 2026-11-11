'use strict';
/* The Future Devil contract is deliberately separate from the main character state.
   One d6 is gained at the beginning of each of Vantyr's turns, including turn one.
   Unspent dice accumulate until the current combat ends (Vantyr's house rule). */
const FUTURE_STORE='vantyr-future-devil-v1';
const FUTURE_DEFAULTS=()=>({dice:0,futureSetUsed:false,futureSetActive:false,movementUsed:false,acAdjustment:0,failures:3,successes:3});
let futureData=FUTURE_DEFAULTS();
try{const stored=JSON.parse(localStorage.getItem(FUTURE_STORE)||'null');if(stored&&typeof stored==='object')futureData={...futureData,...stored}}catch(e){console.warn('Future Devil state unavailable',e)}
function futurePersist(){try{localStorage.setItem(FUTURE_STORE,JSON.stringify(futureData))}catch(e){console.warn('Future Devil save unavailable',e)}}
function futureIsSetActive(){return !!(data.inCombat&&futureData.futureSetActive)}
function futureEffectiveMode(mode){
 if(!futureIsSetActive())return mode;
 return mode==='dis'?'normal':'adv'; // Advantage and Disadvantage cancel; they do not stack.
}
function futureMessage(text){if(typeof showResultPopup==='function')showResultPopup(text,[],null,null);else alert(text)}
function futureRender(){
 const b=id=>document.getElementById(id);
 if(!b('futureDiceCount'))return;
 b('futureDiceCount').textContent=`d6 × ${futureData.dice}`;
 b('futureAcTracker').textContent=futureData.acAdjustment?`Target AC adjustment: ${futureData.acAdjustment>0?'+':''}${futureData.acAdjustment} (expires next Vantyr turn)`:'Temporary target AC adjustment: none';
 b('futureTurnNumber').textContent=data.inCombat?String(data.turn+1):'—';
 b('futureContractStatus').textContent=data.inCombat?`COMBAT · TURN ${data.turn+1}`:'OUT OF COMBAT';
 b('futureMinusDie').disabled=futureData.dice<1;
 b('futurePlusDie').disabled=!data.inCombat;
 b('futureAdjustAcAdd').disabled=!data.inCombat||futureData.dice<1;
 b('futureAdjustAcMinus').disabled=!data.inCombat||futureData.dice<1;
 b('futureSetActivate').disabled=!data.inCombat||futureData.futureSetUsed||futureData.futureSetActive;
 b('futureSetEnd').disabled=!futureData.futureSetActive;
 b('futureIsSetState').textContent=futureData.futureSetActive?'ACTIVE':futureData.futureSetUsed?'USED · LONG REST':'READY';
 b('futureActiveMark').textContent=futureData.futureSetActive?' · ACTIVE':'';
 b('futureMissMove').disabled=!futureIsSetActive()||futureData.movementUsed;
 b('futureMoveStatus').textContent=futureData.futureSetActive?(futureData.movementUsed?'Once-per-round movement already used.':'Enemy miss: once this round, move up to your current speed without provoking opportunity attacks.'):'Not active';
 b('futureFailureUses').textContent=`${futureData.failures}/3 · 10 HP`;
 b('futureSuccessUses').textContent=`${futureData.successes}/3 · 10 HP`;
 b('futureFailure').disabled=futureData.failures<=0||data.currentHp<=0;
 b('futureSuccess').disabled=futureData.successes<=0||data.currentHp<=0;
 b('futureWeighted').disabled=data.currentHp<=0;
}
function futureCombatChange(active){
 futureData.dice=active?1:0;
 futureData.futureSetActive=false;
 futureData.movementUsed=false;
 futureData.acAdjustment=0;
 futurePersist();futureRender();
 if(active&&!futureData.futureSetUsed){
   futureShowSetChoice();
 } else {
   futureCloseSetChoice();
 }
}

/* Custom app dialog instead of browser-native confirm: touch-friendly and keyboard accessible. */
function futureShowSetChoice(){
 const modal=document.getElementById('futureSetDialog');
 if(!modal||!data.inCombat||futureData.futureSetUsed)return;
 modal.hidden=false;
 modal.setAttribute('aria-hidden','false');
 document.getElementById('futureSetYes')?.focus();
}
function futureCloseSetChoice(){
 const modal=document.getElementById('futureSetDialog');
 if(!modal)return;
 modal.hidden=true;
 modal.setAttribute('aria-hidden','true');
}
function futureSetupSetChoice(){
 const modal=document.getElementById('futureSetDialog');
 if(!modal)return;
 document.getElementById('futureSetYes')?.addEventListener('click',()=>{
  futureCloseSetChoice();
  if(data.inCombat&&!futureData.futureSetUsed)futureActivateSet();
 });
 document.getElementById('futureSetNo')?.addEventListener('click',futureCloseSetChoice);
 modal.addEventListener('click',e=>{if(e.target===modal)futureCloseSetChoice()});
 document.addEventListener('keydown',e=>{
  if(modal.hidden)return;
  if(e.key==='Escape'){e.preventDefault();futureCloseSetChoice()}
  if(e.key==='Tab'){
   const yes=document.getElementById('futureSetYes');
   const no=document.getElementById('futureSetNo');
   if(e.shiftKey&&document.activeElement===yes){e.preventDefault();no.focus()}
   else if(!e.shiftKey&&document.activeElement===no){e.preventDefault();yes.focus()}
  }
 });
}
function futureActivateSet(){
 if(!data.inCombat||futureData.futureSetUsed)return;
 futureData.futureSetActive=true;futureData.futureSetUsed=true;futureData.movementUsed=false;
 futurePersist();futureRender();futureMessage('◈ FUTURE IS SET — ACTIVE\nAdvantage on attack rolls, ability checks and saving throws. Attacks against Vantyr have Disadvantage. After an enemy misses, you can move your speed once each round without provoking opportunity attacks. Effect ends when combat ends or Vantyr is incapacitated.');
}
function futureAdvanceTurn(){
 if(!data.inCombat)return;
 futureData.dice=Math.max(0,Math.min(999,futureData.dice+1));
 futureData.movementUsed=false;
 futureData.acAdjustment=0;
 // DM can mark incapacitation manually using the End Effect button.
 futurePersist();futureRender();
}
function futureSpendDie(sign,target,ui){
 if(!data.inCombat||futureData.dice<1)return null;
 futureData.dice--;
 const rolled=1+Math.floor(Math.random()*6);
 const adjustment=sign*rolled;
 futurePersist();futureRender();
 if(target==='AC'){futureData.acAdjustment=(Number(futureData.acAdjustment)||0)+adjustment;futurePersist();futureRender();futureMessage(`◈ FORESIGHT DIE · ${sign>0?'INCREASE':'DECREASE'} TARGET ARMOR CLASS\nd6 rolled ${rolled} → ${adjustment>0?'+':''}${adjustment} AC until the end of this turn. ${futureData.dice} d6 remaining.`);}
 if(ui)ui(adjustment,rolled);
 return adjustment;
}
function futureRollPrompt(e){
 const {attack,check}=e.detail||{};
 const roll=attack||check;
 if(!roll||!data.inCombat||!futureData.dice)return;
 // Death saves are adjudicated immediately. Retrospective Foresight modifiers
 // would require rewinding success/failure counters, so leave those unchanged.
 if(check?.label==='Death Saving Throw')return;
 const modal=document.getElementById('rollModal');
 if(!modal||modal.hidden)return;
 const modalCard=modal.querySelector('.roll-modal-card');
 if(!modalCard)return;
 const previous=modalCard.querySelector('.future-roll-actions');if(previous)previous.remove();
 const wrap=document.createElement('div');wrap.className='future-roll-actions';
 const title=document.createElement('div');title.className='future-roll-header';title.textContent='◈ FUTURE DEVIL · FORESIGHT DIE AVAILABLE';
 const buttons=document.createElement('div');buttons.className='button-row';
 const plus=document.createElement('button');plus.className='gold-btn';plus.type='button';plus.textContent='+ d6 to this roll';
 const minus=document.createElement('button');minus.className='ghost-btn';minus.type='button';minus.textContent='− d6 to this roll';
 const current=document.createElement('div');current.className='future-roll-equation';
 const note=document.createElement('div');note.className='future-roll-note';
 const original=Number(roll.total)||0;let bonus=0;
 function redraw(){
  current.textContent=`${original} ${bonus>=0?'+':'−'} ${Math.abs(bonus)} = ${original+bonus}`;
  const final=document.querySelector('#modalEquation .modal-final b');if(final)final.textContent=String(original+bonus);
  plus.disabled=minus.disabled=futureData.dice<1;
  note.textContent=`${futureData.dice} Foresight d6 remaining · You may spend another die after your DM checks the result. Natural 1/20 rules are unchanged.`;
 }
 function spend(sign){futureSpendDie(sign,'roll',(change,die)=>{
  bonus+=change;
  const face=document.createElement('div');face.className='modal-die future-spent-die';face.innerHTML=`<strong>${die}</strong><small>${sign>0?'+':'−'}d6</small>`;
  document.getElementById('modalDice')?.append(face);
  redraw();
 });}
 plus.addEventListener('click',()=>spend(1));minus.addEventListener('click',()=>spend(-1));
 buttons.append(plus,minus);wrap.append(title,buttons,current,note);modalCard.append(wrap);redraw();
}
function futureRecordBrainTumor(cost){
 if(typeof curseData==='undefined'||!curseData.brain?.active)return false;
 const brain=curseData.brain;
 if(!Array.isArray(brain.instances))brain.instances=[];
 brain.instances.push({damage:cost,turn:brain.turn,type:'Future Devil · unavoidable psychic',hpDamage:cost,futureDevil:true});
 if(typeof persistCurses==='function')persistCurses();
 if(typeof renderBrainTumor==='function')renderBrainTumor();
 return true;
}
function futureOutcome(kind){
 const costs={failure:10,success:10,weighted:30};
 const cost=costs[kind];if(!cost||data.currentHp<=0)return;
 if(kind==='failure'&&futureData.failures<=0)return;
 if(kind==='success'&&futureData.successes<=0)return;
 const choice=kind==='failure'?'Absolute Failure':kind==='success'?'Absolute Success':'Weighted Probability';
 if(!window.confirm(`${choice}: Pay ${cost} unavoidable Psychic damage?\nThis bypasses Temp HP and mitigation and counts as raw pain for Brain Tumor.`))return;
 if(kind==='failure')futureData.failures--;
 if(kind==='success')futureData.successes--;
 const before=data.currentHp;
 const wouldDrop=before-cost<=0;
 data.currentHp=Math.max(1,before-cost);
 const afterCost=data.currentHp;
 if(wouldDrop){data.ascendant.exhaustion=Math.min(6,(Number(data.ascendant.exhaustion)||0)+1);}
 const heal=typeof ascendantReactiveHealing==='function'?ascendantReactiveHealing(cost):0;
 data.currentHp=Math.min(data[data.mode].hp,data.currentHp+heal);
 const inBrain=futureRecordBrainTumor(cost);
 futurePersist();save();renderHp();
 if(typeof renderAscendantStatus==='function')renderAscendantStatus();
 if(typeof renderSheet==='function')renderSheet();
 document.dispatchEvent(new CustomEvent('vantyr:hp-updated'));
 futureRender();
 const rule=kind==='failure'?'The triggering roll automatically FAILS.':kind==='success'?'The triggering roll automatically SUCCEEDS (not a critical success).':'Choose ADVANTAGE or DISADVANTAGE on the triggering roll.';
 futureMessage(`◈ FORESEEN OUTCOME — ${choice.toUpperCase()}\n${rule}\nPsychic cost: ${cost}, applied to regular HP only (not doubled by amplified Brain Tumor).\nHP ${before} → ${afterCost}${heal?` → ${data.currentHp} (+${heal} Crimson Vigor healing)`:''}. Temp HP unchanged.${inBrain?`\nBrain Tumor: recorded ${cost} original psychic pain as a separate instance for turn ${curseData.brain.turn}.`:''}${wouldDrop?`\nPrice of Knowing survival: remain at 1 HP before healing, +1 Exhaustion (now ${data.ascendant.exhaustion}/6).`:''}\n${kind==='weighted'?'Weighted Probability has unlimited uses.':`${kind==='failure'?futureData.failures:futureData.successes} uses remaining.`}`);
}
function futureRest(){futureData.futureSetUsed=false;futureData.failures=3;futureData.successes=3;futurePersist();futureRender()}
function futureSetup(){
 futureSetupSetChoice();
 const b=id=>document.getElementById(id);if(!b('futureDevilPanel'))return;
 b('futureMinusDie').addEventListener('click',()=>{futureData.dice=Math.max(0,futureData.dice-1);futurePersist();futureRender()});
 b('futurePlusDie').addEventListener('click',()=>{futureData.dice=Math.min(999,futureData.dice+1);futurePersist();futureRender()});
 b('futureAdjustAcAdd').addEventListener('click',()=>futureSpendDie(1,'AC'));
 b('futureAdjustAcMinus').addEventListener('click',()=>futureSpendDie(-1,'AC'));
 b('futureSetActivate').addEventListener('click',futureActivateSet);
 b('futureSetEnd').addEventListener('click',()=>{futureData.futureSetActive=false;futurePersist();futureRender();futureMessage('Future Is Set ended. The long-rest use remains spent.')});
 b('futureMissMove').addEventListener('click',()=>{if(!futureIsSetActive()||futureData.movementUsed)return;futureData.movementUsed=true;futurePersist();futureRender();futureMessage(`FUTURE IS SET · FREE MOVEMENT\nEnemy missed. Vantyr may move up to ${b('vampireSpeed')?.textContent||'current speed'} without provoking opportunity attacks. Used this round.`)});
 b('futureFailure').addEventListener('click',()=>futureOutcome('failure'));
 b('futureSuccess').addEventListener('click',()=>futureOutcome('success'));
 b('futureWeighted').addEventListener('click',()=>futureOutcome('weighted'));
 b('futureLongRest').addEventListener('click',()=>{if(typeof restCurses==='function')restCurses('long');else{document.dispatchEvent(new CustomEvent('vantyr:rest',{detail:{type:'long'}}));futureMessage('Future Devil resources restored.')}});
 document.addEventListener('vantyr:combat-changed',e=>futureCombatChange(!!e.detail?.active));
 document.addEventListener('vantyr:end-turn',futureAdvanceTurn);
 document.addEventListener('vantyr:roll-published',futureRollPrompt);
 document.addEventListener('vantyr:rest',e=>{if(e.detail?.type==='long')futureRest()});
 document.addEventListener('vantyr:reset-curses',()=>{futureData=FUTURE_DEFAULTS();futurePersist();futureRender()});
 futureRender();
}
futureSetup();
