'use strict';
// Ascendant transformation runtime. State is saved with the main character sheet.
const ASCENDANT_INFO={
 vigor:{name:'Crimson Vigor',threshold:.75,comparison:'below',rest:'short',summary:'Crossbows +2 attack & damage · Reactive Healing · Advantage on Perception.',description:'Activation: Reaction, when your current HP falls below 75% of maximum. Amplified Power: +2 to attack and damage rolls with crossbows. Reactive Healing: whenever you take damage, regain HP equal to half your Intelligence modifier (minimum 1). Enhanced Senses: advantage on Perception checks. Duration: 1 minute (10 turns). Once per short or long rest.'},
 fury:{name:'Crimson Fury',threshold:.5,comparison:'below',rest:'long',summary:'Crossbow crits on 19–20 · +1d8 lightning/radiant · Temp HP on entry.',description:'Activation: Reaction, when you take damage that reduces HP below 50% maximum. Critical Surge: crossbows critically hit on natural 19 or 20. Lethal Bolts: add 1 Hemocraft die (1d8) lightning or radiant to crossbow damage; choose on the card. Unyielding Resolve: on entering this form, gain Temporary HP equal to twice your Intelligence modifier (minimum 2). Duration: 1 minute (10 turns). Once per long rest.'},
 overdrive:{name:'Crimson Overdrive',threshold:.25,comparison:'at-or-below',rest:'long',summary:'Crossbows +2d8 fire/radiant · All saves +4 · Surge of Wrath · Exhaustion.',description:'Activation: Reaction, when your current HP is at or below 25% maximum. Devastating Strikes: each crossbow attack deals an extra two Hemocraft dice (2d8), fire or radiant (choose on the card). True Grit: +4 to all saving throws. Surge of Wrath: once per turn on a successful attack hit, pay HP equal to your Proficiency Bonus (+5) and deal extra necrotic damage equal to your Intelligence modifier. Backlash: when this form ends, gain two levels of exhaustion. Duration: 1 minute (10 turns), or until HP reaches 0. Once per long rest.'}
};
function ascendantActive(id){return !!data.ascendant?.[id]?.active;}
function ascendantAttackBonus(){return ascendantActive('vigor')?2:0;}
function ascendantDamageFlat(){return ascendantActive('vigor')?2:0;}
function ascendantCrossbowCritical(n){return n===19&&ascendantActive('fury');}
function ascendantCrossbowDice(critical=false){let total=0,text='';for(const [id,count] of [['fury',1],['overdrive',2]]){if(!ascendantActive(id))continue;const dice=rollDice(`${count}d8`,critical);total+=dice.total;text+=` + ${dice.rolled.join('+')} ${data.ascendant[id].element} (${ASCENDANT_INFO[id].name}${critical?', brutal crit':''})`;}return {total,text};}
function ascendantReactiveHealing(damage){if(!ascendantActive('vigor')||damage<=0)return 0;return Math.max(1,Math.floor(modifier(data[data.mode].stats.INT)/2));}
function ascendantThreshold(id){const max=Math.max(1,Number(data[data.mode].hp)||178),i=ASCENDANT_INFO[id];return i.comparison==='below'?Math.ceil(max*i.threshold)-1:Math.floor(max*i.threshold);}
function ascendantCanActivate(id){const current=Number(data.currentHp)||0;return current>0&&current<=ascendantThreshold(id)&&!data.ascendant[id].active&&!data.ascendant[id].used;}
function ascendantNotify(msg){record('✦ ASCENDANT FORMS · '+msg);}
function activateAscendant(id){const state=data.ascendant[id];if(!ascendantCanActivate(id))return;state.active=true;state.used=true;state.remaining=10;if(id==='overdrive')state.surgeTurn=-1;if(id==='fury'){
 const temp=Math.max(2,2*modifier(data[data.mode].stats.INT));const before=data.tempHp;data.tempHp=Math.max(data.tempHp||0,temp);
 ascendantNotify(`CRIMSON FURY activated. Temporary HP ${before} → ${data.tempHp}. Crossbows gain 19–20 criticals and +1d8 ${state.element}.`);
}else ascendantNotify(`${ASCENDANT_INFO[id].name} activated. Effects now stack with other active Ascendant Forms.`);
 save();renderSheet();renderAscendantStatus();}
function deactivateAscendant(id,reason='Manually deactivated'){const state=data.ascendant[id];if(!state.active)return;state.active=false;state.remaining=0;
 if(id==='overdrive'){data.ascendant.exhaustion=Math.min(6,Math.max(0,Number(data.ascendant.exhaustion)||0)+2);ascendantNotify(`Crimson Overdrive ended (${reason}). Backlash: +2 exhaustion levels. Total: ${data.ascendant.exhaustion}.`);}else ascendantNotify(`${ASCENDANT_INFO[id].name} ended (${reason}).`);
 save();renderSheet();renderAscendantStatus();}
function ascendantEndTurn(){let ended=[];for(const id of Object.keys(ASCENDANT_INFO)){const s=data.ascendant[id];if(!s.active)continue;s.remaining=Math.max(0,s.remaining-1);if(s.remaining===0)ended.push(id)}for(const id of ended)deactivateAscendant(id,'1-minute duration expired');save();renderAscendantStatus();}
function ascendantRest(type){const restored=[];for(const id of Object.keys(ASCENDANT_INFO)){const info=ASCENDANT_INFO[id],state=data.ascendant[id];if(type==='long'||info.rest==='short'){state.used=state.active; if(!state.active)restored.push(info.name);}}save();renderAscendantStatus();ascendantNotify(`${type==='long'?'Long':'Short'} Rest: ${restored.join(', ')||'no inactive forms'} ready. Active transformations are not deactivated.`);}
function ascendantSurge(){if(!ascendantActive('overdrive'))return;const state=data.ascendant.overdrive;const turn=Number(data.turn)||0;if(state.surgeTurn===turn){ascendantNotify('Surge of Wrath already used this combat turn.');return}const price=5,bonus=modifier(data[data.mode].stats.INT),r=applyDirectHpCost(price);state.surgeTurn=turn;ascendantNotify(`Surge of Wrath · on a confirmed hit: pay ${price} HP (${r.beforeHp} → ${r.afterHp}), Vigor reactive heal +${r.healed}; deal +${bonus} necrotic damage. Once per turn.`);if(data.currentHp===0)deactivateAscendant('overdrive','HP reached 0');}

function renderExhaustion(){
 const lvl=exhaustionLevel(),count=el('exhaustionLevel'),desc=el('exhaustionEffect');
 if(!count)return;
 count.textContent=`${lvl} / 6`;desc.textContent=lvl===6?'DEAD · 6 EXHAUSTION LEVELS':lvl?`−${lvl} to attacks, damage (once), skills, saving throws and death saves.`:'No exhaustion penalties.';
 el('exhaustionPanel').classList.toggle('exhaustion-dead',lvl===6);
 const bars=el('exhaustionPips');bars.replaceChildren();
 for(let i=1;i<=6;i++){const pip=document.createElement('span');pip.className='exhaustion-pip'+(i<=lvl?' filled':'');bars.append(pip)}
 el('exhaustionMinus').disabled=lvl===0;el('exhaustionPlus').disabled=lvl===6;
}
function updateExhaustion(amount){
 data.ascendant.exhaustion=Math.max(0,Math.min(6,exhaustionLevel()+amount));
 save();renderSheet();renderAscendantStatus();
 if(exhaustionLevel()===6)ascendantNotify('EXHAUSTION LEVEL 6 — VANTYR IS DEAD under your campaign rules.');
}

function renderAscendantStatus(){const root=el('ascendantCards');if(!root)return;const activeCount=Object.keys(ASCENDANT_INFO).filter(ascendantActive).length;el('ascendantActiveCount').textContent=`${activeCount} ACTIVE`;renderExhaustion();
 for(const id of Object.keys(ASCENDANT_INFO)){
  const s=data.ascendant[id],info=ASCENDANT_INFO[id],card=el('asc-card-'+id);if(!card)continue;card.classList.toggle('is-active',s.active);el('asc-threshold-'+id).textContent=`Available at ${ascendantThreshold(id)} HP or less · currently ${data.currentHp} HP`;
  el('asc-state-'+id).textContent=s.active?`ACTIVE · ${s.remaining} turns remaining`:s.used?'Spent · '+(info.rest==='short'?'Short / Long Rest':'Long Rest'):'Ready · waiting for HP threshold';
  const activate=el('asc-activate-'+id),deactivate=el('asc-deactivate-'+id);activate.disabled=!ascendantCanActivate(id);deactivate.disabled=!s.active;
  if(id==='overdrive')el('asc-surge').disabled=!s.active||s.surgeTurn===data.turn;
 }
}
function renderAscendantCards(){const root=el('ascendantCards');root.replaceChildren();for(const [id,info] of Object.entries(ASCENDANT_INFO)){
 const card=document.createElement('article');card.className='asc-card';card.id='asc-card-'+id;
 const head=document.createElement('div');head.className='asc-card-header';const name=document.createElement('h3');name.textContent=info.name;const indicator=document.createElement('span');indicator.className='asc-card-indicator';indicator.textContent=id==='vigor'?'I':id==='fury'?'II':'III';head.append(name,indicator);
 const threshold=document.createElement('div');threshold.className='asc-threshold';threshold.id='asc-threshold-'+id;
 const summary=document.createElement('p');summary.className='asc-summary';summary.textContent=info.summary;
 const status=document.createElement('div');status.className='asc-state';status.id='asc-state-'+id;
 const buttons=document.createElement('div');buttons.className='asc-actions';
 const start=document.createElement('button');start.className='primary-btn';start.id='asc-activate-'+id;start.textContent='Activate';start.addEventListener('click',()=>activateAscendant(id));
 const stop=document.createElement('button');stop.className='ghost-btn';stop.id='asc-deactivate-'+id;stop.textContent='Deactivate';stop.addEventListener('click',()=>deactivateAscendant(id));
 const read=document.createElement('button');read.className='ghost-btn';read.textContent='Read';const detail=document.createElement('p');detail.className='asc-read';detail.textContent=info.description;detail.hidden=true;read.addEventListener('click',()=>{detail.hidden=!detail.hidden;read.setAttribute('aria-expanded',String(!detail.hidden));});buttons.append(start,stop,read);
 card.append(head,threshold,summary,status,buttons);
 if(id==='fury'||id==='overdrive'){const select=document.createElement('label');select.className='asc-element';select.textContent='Extra damage element ';const menu=document.createElement('select');for(const element of id==='fury'?['radiant','lightning']:['radiant','fire']){const o=document.createElement('option');o.value=element;o.textContent=element[0].toUpperCase()+element.slice(1);menu.append(o)}menu.value=data.ascendant[id].element;menu.addEventListener('change',()=>{data.ascendant[id].element=menu.value;save();renderAscendantStatus()});select.append(menu);card.append(select)}
 if(id==='overdrive'){const surge=document.createElement('button');surge.id='asc-surge';surge.className='gold-btn asc-surge';surge.textContent='Surge of Wrath · on confirmed hit';surge.addEventListener('click',ascendantSurge);card.append(surge)}
 card.append(detail);root.append(card)
 }
 renderAscendantStatus();}
function setupAscendant(){renderAscendantCards();el('ascendantShortRest').addEventListener('click',()=>typeof restCurses==='function'?restCurses('short'):ascendantRest('short'));el('ascendantLongRest').addEventListener('click',()=>typeof restCurses==='function'?restCurses('long'):ascendantRest('long'));
 el('exhaustionMinus').addEventListener('click',()=>updateExhaustion(-1));el('exhaustionPlus').addEventListener('click',()=>updateExhaustion(1));document.addEventListener('vantyr:end-turn',ascendantEndTurn);
 document.addEventListener('vantyr:rest',e=>ascendantRest(e.detail.type));
 document.addEventListener('vantyr:reset-ascendants',()=>renderAscendantCards());
 document.addEventListener('vantyr:hp-updated',()=>{if(data.currentHp===0&&ascendantActive('overdrive'))deactivateAscendant('overdrive','HP reached 0');renderAscendantStatus()});
}
document.addEventListener('DOMContentLoaded',setupAscendant);
