'use strict';
const KEY='vantyr-helper-v14', V13_KEY='vantyr-helper-v13', V12_KEY='vantyr-helper-v12', V11_KEY='vantyr-helper-v10', V09_KEY='vantyr-helper-v09', V08_KEY='vantyr-helper-v05', V04_KEY='vantyr-helper-v04', V03_KEY='vantyr-helper-v03', OLD_KEY='vantyr-helper-v02', LEGACY_KEY='vantyr-helper-v01';
const ATTRS=['STR','DEX','CON','WIS','INT','CHA'];
const defaultData={mode:'normal',inCombat:false,turn:0,initiative:25,normal:{stats:{STR:10,DEX:22,CON:20,WIS:14,INT:24,CHA:16},ac:22,hp:178,spellDC:20,saves:{STR:7,DEX:19,CON:14,WIS:2,INT:12,CHA:3}},emperor:{stats:{STR:16,DEX:30,CON:30,WIS:20,INT:31,CHA:22},ac:24,hp:178,spellDC:23,saves:{STR:13,DEX:25,CON:20,WIS:5,INT:15,CHA:7}},skillProf:{Acrobatics:true,History:true,Investigation:true,Stealth:true,Survival:true},skillExtra:{},weapon:{type:'custom',dice:'1d8',atkNormal:18,atkEmperor:18,dmgNormal:11,dmgEmperor:11,charges:3,effects:{balance:0,flames:0,rogue:0}},currentHp:178,tempHp:0,paralysisTarget:{selected:false,distance:'far'},martyr:{atk:18,flat:11,furyDC:null,furyDice:'6d8',paralyzedTurns:0},bite:{pendingPiercing:null,empowerBonus:0,eligible:true},rites:{starshot:{type:'dawn',locked:false,active:false,undead:false},martyr:{type:'psychic',locked:false,active:false,undead:false},fangs:{type:'lightning',locked:false,active:false,undead:false}},deathSaves:{successes:0,failures:0},ascendant:{vigor:{active:false,used:false,remaining:0},fury:{active:false,used:false,remaining:0,element:'radiant'},overdrive:{active:false,used:false,remaining:0,element:'radiant',surgeTurn:-1},exhaustion:0},hpDamageHistory:[],log:[]};
const SKILLS=[['Acrobatics','DEX'],['Animal Handling','WIS'],['Arcana','INT'],['Athletics','STR'],['Deception','CHA'],['History','INT'],['Insight','WIS'],['Intimidation','CHA'],['Investigation','INT'],['Medicine','WIS'],['Nature','INT'],['Perception','WIS'],['Performance','CHA'],['Persuasion','CHA'],['Religion','INT'],['Sleight of Hand','DEX'],['Stealth','DEX'],['Survival','WIS']];
const copy=x=>JSON.parse(JSON.stringify(x)),el=id=>document.getElementById(id),modifier=n=>Math.floor((Number(n)-10)/2),fmt=n=>(n>=0?'+':'')+n;
function exhaustionLevel(){return Math.max(0,Math.min(6,Math.floor(Number(data.ascendant?.exhaustion)||0)));}
function exhaustionBonus(){return -exhaustionLevel();}
function damageWithExhaustion(base){return Math.max(0,base-exhaustionLevel());}
function exhaustionSuffix(){return exhaustionLevel()?` (Exhaustion −${exhaustionLevel()} once)` :'';}

let data=copy(defaultData);
try{const stored=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(V13_KEY)||localStorage.getItem(V12_KEY)||localStorage.getItem(V11_KEY)||localStorage.getItem(V09_KEY)||localStorage.getItem(V08_KEY)||localStorage.getItem(V04_KEY)||localStorage.getItem(V03_KEY)||localStorage.getItem(OLD_KEY)||localStorage.getItem(LEGACY_KEY));if(stored){data={...data,...stored,normal:{...data.normal,...stored.normal,stats:{...data.normal.stats,...stored.normal?.stats},saves:{...data.normal.saves,...stored.normal?.saves}},emperor:{...data.emperor,...stored.emperor,stats:{...data.emperor.stats,...stored.emperor?.stats},saves:{...data.emperor.saves,...stored.emperor?.saves}},skillProf:{...data.skillProf,...stored.skillProf},skillExtra:{...data.skillExtra,...stored.skillExtra},weapon:{...data.weapon,...stored.weapon,effects:{...data.weapon.effects,...stored.weapon?.effects}},martyr:{...data.martyr,...stored.martyr},bite:{...data.bite,...stored.bite},paralysisTarget:{...data.paralysisTarget,...stored.paralysisTarget},deathSaves:{...data.deathSaves,...stored.deathSaves},ascendant:{...data.ascendant,...stored.ascendant,vigor:{...data.ascendant.vigor,...stored.ascendant?.vigor},fury:{...data.ascendant.fury,...stored.ascendant?.fury},overdrive:{...data.ascendant.overdrive,...stored.ascendant?.overdrive}},hpDamageHistory:Array.isArray(stored.hpDamageHistory)?stored.hpDamageHistory.slice(0,10):[],rites:Object.fromEntries(Object.entries(data.rites).map(([k,v])=>[k,{...v,...stored.rites?.[k]}])),log:Array.isArray(stored.log)?stored.log.slice(0,35):[]};  if(!localStorage.getItem(KEY)){
    // v0.2 shipped placeholder values. Only replace those placeholders during migration.
    const w=data.weapon;
    if(w.dice==='1d6')w.dice='1d8';
    if(w.type==='hand')w.type='custom';
    if(w.atkNormal===11)w.atkNormal=18;
    if(w.atkEmperor===15)w.atkEmperor=18;
    if(w.dmgNormal===6)w.dmgNormal=11;
    if(w.dmgEmperor===10)w.dmgEmperor=11;
  }
}}catch(e){console.warn('Stored data unavailable',e)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));el('saveStatus').textContent='Saved locally';document.dispatchEvent(new Event('vantyr:sync-dirty'))}catch(e){el('saveStatus').textContent='Storage unavailable'}}
function field(value,onChange,cls=''){const i=document.createElement('input');i.type='number';i.className=cls;i.value=value;i.setAttribute('aria-label','Editable value');i.addEventListener('change',()=>{if(i.value.trim()===''||!Number.isFinite(Number(i.value))){i.value=value;return}onChange(Number(i.value));save()});return i}
function renderSheet(){const emperor=data.mode==='emperor',d=data[data.mode];document.documentElement.classList.toggle('emperor',emperor);el('modeLabel').textContent=emperor?"EMPEROR'S TIME":'NORMAL FORM';el('formTitle').textContent=emperor?'The Emperor Awakens':'The Vampire Lord';el('modeBtn').textContent=emperor?"✕ Deactivate Emperor's Time":"♛ Activate Emperor's Time";el('modeBtn').setAttribute('aria-pressed',String(emperor));el('combatBtn').textContent=data.inCombat?'■ End Combat':'⚔ Start Combat';el('combatStatus').textContent=data.inCombat?`IN COMBAT · Turn ${data.turn+1} · Emperor's Time active`:'Out of combat · Roleplay mode';el('endTurnBtn').disabled=!data.inCombat;if(el('portraitState'))el('portraitState').textContent=emperor?"Emperor's Time":'Normal Form';
 const quick=el('quickStats');quick.replaceChildren();[['ARMOR CLASS','ac'],['MAX HP','hp'],['SPELL SAVE DC','spellDC']].forEach(([label,key])=>{const card=document.createElement('div');card.className='quick-card';let l=document.createElement('label');l.textContent=label;card.append(l,field(d[key],n=>{d[key]=n;}));quick.append(card)});const card=document.createElement('div');card.className='quick-card';const l=document.createElement('label');l.textContent='INITIATIVE · BOTH FORMS';card.append(l,field(data.initiative,n=>{data.initiative=n;}));quick.append(card);
 const abilities=el('abilities');abilities.replaceChildren();ATTRS.forEach(a=>{const c=document.createElement('div');c.className='ability';const l=document.createElement('label');l.textContent=a;const input=field(d.stats[a],n=>{d.stats[a]=n;renderSheet()});const m=document.createElement('div');m.className='modifier';m.textContent=fmt(modifier(d.stats[a]));c.append(l,input,m);abilities.append(c)});
 const saves=el('saves');saves.replaceChildren();ATTRS.forEach(a=>{const bonus=d.saves[a]+(ascendantActive('overdrive')?4:0)+exhaustionBonus();const wrap=document.createElement('div');wrap.className='sheet-card';const top=document.createElement('div');top.className='sheet-card-top';const copy=document.createElement('div');copy.className='sheet-copy';copy.innerHTML=`<strong>${a}</strong><small>${a} Saving Throw</small>`;const pill=document.createElement('div');pill.className='bonus-pill';pill.textContent=fmt(bonus);top.append(copy,pill);const controls=document.createElement('div');controls.className='sheet-controls';const input=field(d.saves[a],n=>{d.saves[a]=n;renderSheet()},'sheet-edit');const mode=makeUtilityModePicker('save:'+a);const roll=document.createElement('button');roll.className='primary-btn sheet-roll';roll.textContent='⚄ Roll';roll.addEventListener('click',()=>rollUtilityCheck(`${a} Saving Throw`,d.saves[a]+(ascendantActive('overdrive')?4:0)+exhaustionBonus(),mode.value));controls.append(input,mode,roll);wrap.append(top,controls);saves.append(wrap)});
 const skills=el('skills');skills.replaceChildren();SKILLS.forEach(([name,attr])=>{const total=modifier(d.stats[attr])+(data.skillProf[name]?5:0)+(data.skillExtra[data.mode+'|'+name]||0)+exhaustionBonus();const wrap=document.createElement('div');wrap.className='sheet-card';const top=document.createElement('div');top.className='sheet-card-top';const copy=document.createElement('div');copy.className='sheet-copy';copy.innerHTML=`<strong>${name}</strong><small>${attr} · ${data.skillProf[name]?'Proficient':'No proficiency'}</small>`;const pill=document.createElement('div');pill.className='bonus-pill';pill.textContent=fmt(total);top.append(copy,pill);const prof=document.createElement('label');prof.className='sheet-prof';const ck=document.createElement('input');ck.type='checkbox';ck.checked=!!data.skillProf[name];ck.addEventListener('change',()=>{data.skillProf[name]=ck.checked;save();renderSheet()});prof.append(ck,document.createTextNode('Proficient'));const controls=document.createElement('div');controls.className='sheet-controls';const input=field(total-exhaustionBonus(),n=>{data.skillExtra[data.mode+'|'+name]=n-modifier(d.stats[attr])-(data.skillProf[name]?5:0);renderSheet()},'sheet-edit');const mode=makeUtilityModePicker('skill:'+name);if(name==='Perception'&&ascendantActive('vigor'))mode.title='Crimson Vigor grants Advantage on Perception checks. Disadvantage cancels it.';const roll=document.createElement('button');roll.className='primary-btn sheet-roll';roll.textContent='⚄ Roll';roll.addEventListener('click',()=>rollUtilityCheck(`${name} (${attr})`,modifier(d.stats[attr])+(data.skillProf[name]?5:0)+(data.skillExtra[data.mode+'|'+name]||0)+exhaustionBonus(),name==='Perception'&&ascendantActive('vigor')?(mode.value==='dis'?'normal':'adv'):mode.value));controls.append(input,mode,roll);wrap.append(top,prof,controls);skills.append(wrap)});
 renderDeathSaves();renderWeapon();renderHp();renderMartyr();renderParalysis();renderRites();renderBite();}
let activeDiceTray='starshot';
let recentDice=[];
let pendingAttackResult=null;
let pendingCheckResult=null;
const utilityRollModes={};
function makeUtilityModePicker(id){
 const select=document.createElement('select');select.className='utility-roll-mode';select.setAttribute('aria-label','Roll mode: Normal, Advantage, or Disadvantage');
 for(const [value,label] of [['normal','Normal'],['adv','Advantage'],['dis','Disadvantage']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option)}
 select.value=utilityRollModes[id]||'normal';select.addEventListener('change',()=>{utilityRollModes[id]=select.value});return select;
}
function rollD20WithMode(mode){
 const first=rollDie(20),second=mode==='normal'?null:rollDie(20);
 const chosen=second===null?first:mode==='adv'?Math.max(first,second):Math.min(first,second);
 return {chosen,rolls:second===null?[first]:[first,second],mode};
}

function rollDie(sides){const v=1+Math.floor(Math.random()*sides);recentDice.push({sides,value:v});return v}
function renderDiceTray(){
 const target=el('dice-tray-'+activeDiceTray);if(!target||!recentDice.length)return;
 target.replaceChildren();const head=document.createElement('div');head.className='dice-tray-title';head.textContent='DICE ROLL · '+recentDice.length+' dice';target.append(head);
 const faces=document.createElement('div');faces.className='dice-faces';
 recentDice.slice(-24).forEach((d,i)=>{const die=document.createElement('div');die.className='die-face';die.style.setProperty('--delay',Math.min(i*55,500)+'ms');const value=document.createElement('strong');value.textContent=d.value;const label=document.createElement('span');label.textContent='d'+d.sides;die.append(value,label);faces.append(die)});
 target.append(faces);
 if(pendingAttackResult && pendingAttackResult.tray===activeDiceTray){
  const info=pendingAttackResult;const result=document.createElement('div');result.className='attack-result'+((info.natural===20||info.criticalReason==='paralysis'||info.criticalReason==='fury')?' is-critical':info.natural===1?' is-fumble':'');
  const heading=document.createElement('div');heading.className='attack-result-heading';heading.textContent=info.natural===1?'NATURAL 1 · AUTOMATIC MISS':info.criticalReason==='paralysis'?'✦ PARALYZED · BRUTAL CRITICAL ON HIT':info.criticalReason==='fury'?'✦ CRIMSON FURY · CRITICAL ON 19':info.natural===20?'✦ NATURAL 20 · CRITICAL HIT':'ATTACK TOTAL';
  const equation=document.createElement('div');equation.className='attack-equation';
  for(const [value,label] of [[info.natural,'D20'],[fmt(info.bonus),'ATTACK BONUS'],[info.total,'TOTAL']]){if(equation.childElementCount){const sign=document.createElement('span');sign.className='attack-operator';sign.textContent=equation.childElementCount===1?'+':'=';equation.append(sign)}const part=document.createElement('div');part.className='attack-number'+(label==='TOTAL'?' attack-total':'');const number=document.createElement('strong');number.textContent=value;const caption=document.createElement('small');caption.textContent=label;part.append(number,caption);equation.append(part)}
  result.append(heading,equation);if(info.criticalReason==='paralysis'){const msg=document.createElement('div');msg.className='attack-result-detail';msg.textContent='Within 5 ft · if this attack hits, roll Brutal Critical damage (natural 1 always misses).';result.append(msg)}
  if(info.d20Rolls.length===2){const detail=document.createElement('div');detail.className='attack-result-detail';detail.textContent=`${info.mode}: ${info.d20Rolls.join(' / ')} → ${info.natural} selected`;result.append(detail)}
  target.append(result);
 }
 if(pendingCheckResult && pendingCheckResult.tray===activeDiceTray){
  const info=pendingCheckResult;const box=document.createElement('div');box.className='check-result';const h=document.createElement('h5');h.textContent=info.label.toUpperCase();box.append(h);const eq=document.createElement('div');eq.className='attack-equation';const parts=[[info.natural,'D20'],[fmt(info.bonus),'BONUS'],[info.total,'TOTAL']];parts.forEach(([value,label],idx)=>{if(idx){const sign=document.createElement('span');sign.className='attack-operator';sign.textContent=idx===1?'+':'=';eq.append(sign)}const part=document.createElement('div');part.className='attack-number'+(label==='TOTAL'?' attack-total':'');const number=document.createElement('strong');number.textContent=value;const caption=document.createElement('small');caption.textContent=label;part.append(number,caption);eq.append(part)});box.append(eq);if(info.rolls?.length===2){const chosen=document.createElement('div');chosen.className='attack-result-detail';chosen.textContent=`${info.mode==='adv'?'ADVANTAGE':'DISADVANTAGE'}: ${info.rolls.join(' / ')} → ${info.natural} used`;box.append(chosen)}if(info.detail){const d=document.createElement('div');d.className='attack-result-detail';d.textContent=info.detail;box.append(d)}target.append(box);
 }
 pendingAttackResult=null;pendingCheckResult=null;recentDice=[];
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-dice-tray]');if(b){activeDiceTray=b.dataset.diceTray;recentDice=[]}},true);
function setAttackResult(tray,natural,bonus,mode,rolls,criticalReason=null){pendingAttackResult={tray,natural,bonus,total:natural+bonus,mode,d20Rolls:rolls.filter(x=>x!==null),criticalReason};}
function setCheckResult(label,natural,bonus,total,detail='',mode='normal',rolls=[natural]){pendingCheckResult={tray:'utility',label,natural,bonus,total,detail,mode,rolls};}
function rollUtilityCheck(label,bonus=0,mode='normal'){
 activeDiceTray='utility';recentDice=[];mode=futureEffectiveMode(mode);const b=Number(bonus)||0;const {chosen,rolls}=rollD20WithMode(mode);
 const modeLabel=mode==='adv'?'Advantage':mode==='dis'?'Disadvantage':'Normal';
 const detail=rolls.length===2?`${modeLabel}: ${rolls[0]} / ${rolls[1]} → ${chosen} selected`:modeLabel;
 setCheckResult(label,chosen,b,chosen+b,detail,mode,rolls);record(`${label} · ${detail}: d20 ${chosen} ${fmt(b)} = ${chosen+b}.`);
}
function renderDeathSaves(){if(!el('deathSuccessTrack'))return;const sWrap=el('deathSuccessTrack'),fWrap=el('deathFailureTrack');sWrap.replaceChildren();fWrap.replaceChildren();for(let i=1;i<=3;i++){const dot=document.createElement('i');if(i<=data.deathSaves.successes)dot.className='on';sWrap.append(dot)}for(let i=1;i<=3;i++){const dot=document.createElement('i');if(i<=data.deathSaves.failures)dot.className='on';fWrap.append(dot)}let text='No death saves rolled yet.';if(data.deathSaves.successes>=3)text='Stable · 3 successes.';else if(data.deathSaves.failures>=3)text='Dead · 3 failures.';else if(data.deathSaves.successes||data.deathSaves.failures)text=`${data.deathSaves.successes} success(es) · ${data.deathSaves.failures} failure(s).`;el('deathSaveText').textContent=text;}
function clampDeath(){data.deathSaves.successes=Math.max(0,Math.min(3,Number(data.deathSaves.successes)||0));data.deathSaves.failures=Math.max(0,Math.min(3,Number(data.deathSaves.failures)||0));}
function rollDeathSave(){
 activeDiceTray='utility';recentDice=[];const mode=futureEffectiveMode(el('deathRollMode')?.value||'normal');const {chosen:d20,rolls}=rollD20WithMode(mode);const deathTotal=d20+exhaustionBonus();
 let detail='';if(d20===1){data.deathSaves.failures+=2;detail='Natural 1 · counts as two failures.';}
 else if(d20===20){data.deathSaves.successes=0;data.deathSaves.failures=0;data.currentHp=Math.max(1,data.currentHp);detail='Natural 20 · regain 1 HP and wake up.';}
 else if(deathTotal>=10){data.deathSaves.successes+=1;detail='Adjusted total 10 or higher · one success.';}
 else{data.deathSaves.failures+=1;detail='Adjusted total below 10 · one failure.';}
 clampDeath();renderHp();renderDeathSaves();const modeLabel=mode==='adv'?'Advantage':mode==='dis'?'Disadvantage':'Normal';
 const selection=rolls.length===2?`${modeLabel} (${rolls.join(' / ')}) → ${d20}`:modeLabel;
 setCheckResult('Death Saving Throw',d20,exhaustionBonus(),deathTotal,detail+' '+selection,mode,rolls);
 record(`Death Saving Throw · ${selection}: d20 ${d20} ${fmt(exhaustionBonus())} = ${deathTotal}. ${detail}`);
}
function setupUtility(){if(!el('deathRollBtn'))return;el('deathRollBtn').addEventListener('click',rollDeathSave);el('deathResetBtn').addEventListener('click',()=>{data.deathSaves={successes:0,failures:0};save();renderDeathSaves();el('rollOutput').textContent='Death saves reset.'});el('deathSuccessBtn').addEventListener('click',()=>{data.deathSaves.successes++;clampDeath();save();renderDeathSaves()});el('deathFailureBtn').addEventListener('click',()=>{data.deathSaves.failures++;clampDeath();save();renderDeathSaves()});}


function parseDice(str){const m=/^\s*(\d{1,2})d(\d{1,3})\s*$/i.exec(str);if(!m)return null;const count=Number(m[1]),sides=Number(m[2]);return count>0&&count<=20&&sides>=2&&sides<=100?{count,sides}:null}
function rollDice(str,crit=false){const spec=parseDice(str);if(!spec)return null;
 const fresh=Array.from({length:spec.count},()=>rollDie(spec.sides));
 const maxBonus=crit?spec.count*spec.sides:0;
 const rolled=crit?[maxBonus,...fresh]:fresh;
 return {rolled,fresh,maxBonus,total:maxBonus+fresh.reduce((a,b)=>a+b,0)};
}
// Results are rendered where the player clicked, never only in the global history.
let currentActionButton=null;
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  currentActionButton=button&&el('app').contains(button)?button:null;
},true);
function showNearbyRoll(message, dice, attack, check){
 if(!currentActionButton||!currentActionButton.isConnected)return;
 const button=currentActionButton;
 const surface=button.closest('.sheet-card, .death-card, .constellation, .rite-card') || button.closest('.weapon-col, .fangs-section, .hp-panel, .paralysis-panel, .mode-box');
 if(!surface)return;
 let after=button.closest('.button-row') || button.closest('.sheet-controls') || button.closest('.constellation-top') || button;
 if(!surface.contains(after))after=button;
 const previous=surface.querySelectorAll('.inline-roll-result');previous.forEach(node=>node.remove());
 const panel=document.createElement('div');panel.className='inline-roll-result';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
 const top=document.createElement('div');top.className='inline-roll-top';
 const title=document.createElement('span');title.textContent=button.textContent.trim().replace(/^[^\p{L}\p{N}]+/u,'')||'ROLL';
 const icon=document.createElement('span');icon.className='inline-roll-symbol';icon.textContent=dice.length?'⚄':'✦';
 top.append(title,icon);panel.append(top);
 const values=document.createElement('div');values.className='inline-roll-values';
 if(attack && attack.tray===activeDiceTray){
  const a=document.createElement('strong');a.className='inline-total';a.textContent=String(attack.total);
  const math=document.createElement('span');math.textContent=`d20 ${attack.natural}  ${fmt(attack.bonus)}  = ${attack.total}`;
  values.append(a,math);
  if(attack.natural===20||attack.criticalReason==='paralysis')panel.classList.add('critical');
  if(attack.natural===1)panel.classList.add('fumble');
 }else if(check && check.tray===activeDiceTray){
  const a=document.createElement('strong');a.className='inline-total';a.textContent=String(check.total);
  const math=document.createElement('span');math.textContent=`d20 ${check.natural} ${fmt(check.bonus)} = ${check.total}`;
  values.append(a,math);
 }else if(dice.length){
  const totals=[...message.matchAll(/=\s*(-?\d+)/g)];
  const amount=totals.length?totals[totals.length-1][1]:null;
  if(amount!==null){const big=document.createElement('strong');big.className='inline-total';big.textContent=amount;values.append(big)}
  const math=document.createElement('span');math.textContent=dice.slice(0,16).map(d=>`d${d.sides}: ${d.value}`).join(' · ');values.append(math);
 }
 if(values.childElementCount)panel.append(values);
 const detail=document.createElement('p');detail.textContent=message;panel.append(detail);
 after.insertAdjacentElement('afterend',panel);
}
function record(message){
 const dice=recentDice.slice();const attack=pendingAttackResult?{...pendingAttackResult}:null;const check=pendingCheckResult?{...pendingCheckResult}:null;
 showResultPopup(message,dice,attack,check);
 if(attack||check)document.dispatchEvent(new CustomEvent('vantyr:roll-published',{detail:{attack,check}}));
 renderDiceTray();el('rollOutput').textContent=message;data.log.unshift(message);data.log=data.log.slice(0,35);save();renderLog();
}
function renderLog(){el('rollLog').replaceChildren();data.log.forEach((entry,i)=>{const row=document.createElement('div');row.textContent=entry;row.className=i>0?'muted':'';el('rollLog').append(row)})}
function renderWeapon(){const w=data.weapon;el('crossbowType').value=w.type;el('weaponDice').value=w.dice;el('atkNormal').value=w.atkNormal;el('atkEmperor').value=w.atkEmperor;el('dmgNormal').value=w.dmgNormal;el('dmgEmperor').value=w.dmgEmperor;el('chargesText').textContent=`${w.charges} / 3`;el('chargePips').replaceChildren();for(let i=0;i<3;i++){const pip=document.createElement('span');pip.className=i<w.charges?'filled':'';el('chargePips').append(pip)}for(const key of ['balance','flames','rogue']){const label=el(key+'State'),remaining=w.effects[key];label.textContent=remaining?`Active · ${remaining} turn-end${remaining!==1?'s':''} left`:'Inactive';label.classList.toggle('active',!!remaining);document.querySelector(`[data-activate="${key}"]`).disabled=w.charges<1;const off=el('deactivate-'+key);if(off){off.disabled=!remaining;off.setAttribute('aria-pressed',String(!!remaining))}}}

const RITE_TYPES={none:{name:'No Rite',type:''},dawn:{name:'Rite of the Dawn',type:'radiant'},psychic:{name:'Psychic Rite',type:'psychic'},lightning:{name:'Lightning Rite',type:'lightning'},cold:{name:'Cold Rite',type:'cold'}};
function riteState(weapon){return data.rites[weapon]}
function riteDiceFor(weapon,crit=false){const r=riteState(weapon);if(!r.active||r.type==='none')return null;const base=rollDice('1d8',crit);const extra=r.type==='dawn'&&r.undead?rollDice('1d8',crit):null;return {type:RITE_TYPES[r.type].type,parts:base.rolled.concat(extra?.rolled||[]),total:base.total+(extra?.total||0),undead:!!extra}}
function riteDescription(weapon,crit=false){const result=riteDiceFor(weapon,crit);return result?{amount:result.total,txt:` + ${result.parts.join('+')} ${result.type} rite${result.undead?' (Undead +1 hemocraft die)':''}`}:{amount:0,txt:''}}
function renderRites(){for(const key of ['starshot','martyr','fangs']){const r=riteState(key);const select=el('rite-'+key);select.value=r.type;select.disabled=r.locked;el('rite-active-'+key).checked=r.active;el('rite-active-'+key).disabled=r.type==='none';el('rite-lock-'+key).textContent=r.locked?'🔒 Locked — Unlock':'🔓 Lock selected Rite';const special=el('rite-undead-wrap-'+key);special.hidden=r.type!=='dawn';el('rite-undead-'+key).checked=r.undead;el('rite-undead-'+key).disabled=!r.active;const status=el('rite-status-'+key);status.textContent=r.active?`${RITE_TYPES[r.type].name} · +1d8 ${RITE_TYPES[r.type].type}${r.type==='dawn'&&r.undead?' · +1d8 vs Undead':''}`:'No active rite';status.classList.toggle('active',r.active);el('rite-dawn-benefits-'+key).hidden=!(r.active&&r.type==='dawn')}}
function setupRites(){for(const key of ['starshot','martyr','fangs']){const r=riteState(key);el('rite-'+key).addEventListener('change',e=>{if(r.locked)return;r.type=e.target.value;r.active=false;r.undead=false;save();renderRites()});el('rite-active-'+key).addEventListener('change',e=>{r.active=e.target.checked&&r.type!=='none';if(!r.active)r.undead=false;record(`${key.toUpperCase()}: ${r.active?'Rite activated: '+RITE_TYPES[r.type].name:'Rite deactivated'}. Apply any Hemocraft activation cost manually until confirmed.`);renderRites()});el('rite-lock-'+key).addEventListener('click',()=>{r.locked=!r.locked;record(`${key.toUpperCase()}: Rite selection ${r.locked?'locked':'unlocked'}.`);renderRites()});el('rite-undead-'+key).addEventListener('change',e=>{r.undead=e.target.checked;save();renderRites()})}}

function paralysisSelected(){return data.martyr.paralyzedTurns>0 && data.paralysisTarget.selected}
function paralysisAutoCrit(){return paralysisSelected() && data.paralysisTarget.distance==='close'}
function paralyzedAttackMode(mode, innateAdvantage=false){const adv=paralysisSelected()||innateAdvantage;return adv?(mode==='dis'?'normal':'adv'):mode}
function renderParalysis(){const active=data.martyr.paralyzedTurns>0;const check=el('targetIsParalyzed'),distance=el('paralysisDistance');check.disabled=!active;check.checked=active&&data.paralysisTarget.selected;distance.value=data.paralysisTarget.distance;const selected=paralysisSelected();const close=paralysisAutoCrit();el('paralysisBanner').textContent=active?`${data.martyr.paralyzedTurns} round(s) remaining`:'No paralyzed target';el('paralysisBanner').classList.toggle('active',active);const hint=el('paralysisHint');hint.textContent=!active?'Mark Failed Save in Madris’ Fury first to enable automatic critical hits.':!selected?'Select the checkbox when attacking the affected target. Other targets are not affected.':close?'Within 5 ft: ADVANTAGE; every successful attack is a BRUTAL CRITICAL. Natural 1 still misses.':'Beyond 5 ft: ADVANTAGE on attack rolls, but NO automatic critical (except natural 20).';hint.classList.toggle('critical-ready',close)}
el('targetIsParalyzed').addEventListener('change',e=>{data.paralysisTarget.selected=e.target.checked;save();renderParalysis()});
el('paralysisDistance').addEventListener('change',e=>{data.paralysisTarget.distance=e.target.value;save();renderParalysis()});
function endTurn(){if(!data.inCombat)return;data.turn++;const expired=[];for(const [key,val] of Object.entries(data.weapon.effects)){if(val>0){data.weapon.effects[key]=val-1;if(val===1)expired.push(key)}}if(data.martyr.paralyzedTurns>0){data.martyr.paralyzedTurns--;if(!data.martyr.paralyzedTurns)expired.push('Madris Fury paralysis (max 1 minute)')}if(data.martyr.paralyzedTurns===0)data.paralysisTarget.selected=false;record(`End Turn → Turn ${data.turn+1}${expired.length?' · Expired: '+expired.join(', '):''}`);renderSheet();document.dispatchEvent(new CustomEvent('vantyr:end-turn'))}
function damage(crit=false){crit=crit||paralysisAutoCrit();const w=data.weapon,die=rollDice(w.dice,crit);if(!die){record('Invalid damage dice. Use NdM format such as 1d6, 1d8 or 2d6.');return}const flat=(data.mode==='emperor'?w.dmgEmperor:w.dmgNormal)+ascendantDamageFlat();const asc=ascendantCrossbowDice(crit);const flame=w.effects.flames>0?rollDice('2d8',crit):null;const vecnaCold=rollDice('2d8',crit);const rite=riteDescription('starshot',crit);const total=damageWithExhaustion(die.total+flat+(flame?.total||0)+rite.amount+asc.total+vecnaCold.total);let message=`${crit?'✦ CRITICAL DAMAGE':'Damage'}: ${die.rolled.join('+')} [${w.dice}${crit?' · MAX + roll':''}] ${fmt(flat)}${flame?' + fire '+flame.rolled.join('+'):''}${rite.txt}${asc.text} + Vecna Hand Cold ${vecnaCold.rolled.join('+')} (${vecnaCold.total})${exhaustionSuffix()} = ${total} total${flame?' (includes '+flame.total+' fire)':''}`;if(w.effects.balance>0){const hp=rollDie(8)+5;message+=`\n⚖ Balance triggered on hit: ${hp} temporary HP (1d8 + PB 5) to you or a chosen creature within 30 ft.`;w.effects.balance=0}record(message);renderWeapon()}
function attack(){const w=data.weapon;const blood=spendBlood('Starshot');const empower=consumeBiteBonus();const mode=futureEffectiveMode(paralyzedAttackMode(document.querySelector('input[name="rollMode"]:checked').value));const r1=rollDie(20),r2=mode==='normal'?null:rollDie(20),chosen=r2===null?r1:mode==='adv'?Math.max(r1,r2):Math.min(r1,r2),bonus=(data.mode==='emperor'?w.atkEmperor:w.atkNormal)+empower+ascendantAttackBonus()+exhaustionBonus(),autoCrit=paralysisAutoCrit(),ascCrit=ascendantCrossbowCritical(chosen),crit=chosen!==1&&(chosen===20||ascCrit||autoCrit);let text=`${blood}${empower?' · Vampiric Empowerment +'+empower:''}\n${mode==='normal'?'Attack':mode==='adv'?'Advantage':'Disadvantage'}: d20 ${r1}${r2===null?'':' / '+r2} → ${chosen} ${fmt(bonus)} = ${chosen+bonus}${chosen===20?' · NATURAL 20! CRITICAL HIT':chosen===1?' · NATURAL 1!':ascCrit?' · CRIMSON FURY 19 CRITICAL!':autoCrit?' · BRUTAL CRITICAL IF HIT!':''}.`;
 // Hit confirmation matters for Flames and Balance; a rolled attack alone does not prove a hit.
 if(chosen===20||ascCrit){const die=rollDice(w.dice,true),flame=w.effects.flames>0?rollDice('2d8',true):null,rite=riteDescription('starshot',true),asc=ascendantCrossbowDice(true),vecnaCold=rollDice('2d8',true);if(die){const flat=(data.mode==='emperor'?w.dmgEmperor:w.dmgNormal)+ascendantDamageFlat();text+=` Critical damage: ${die.rolled.join('+')} ${fmt(flat)}${flame?' + fire '+flame.rolled.join('+'):''}${rite.txt}${asc.text} + Vecna Hand Cold ${vecnaCold.rolled.join('+')} (${vecnaCold.total}) ${exhaustionSuffix()} = ${damageWithExhaustion(die.total+flat+(flame?.total||0)+rite.amount+asc.total+vecnaCold.total)}.`;if(w.effects.balance>0){const hp=rollDie(8)+5;text+=` Balance triggered: ${hp} temporary HP for you or ally within 30 ft.`;w.effects.balance=0}}}
 setAttackResult('starshot',chosen,bonus,mode,[r1,r2],ascCrit?'fury':crit&&chosen!==20?'paralysis':null);record(text);renderWeapon()}
function deactivateConstellation(which){if(!data.weapon.effects[which])return;data.weapon.effects[which]=0;record(`${which.toUpperCase()} manually deactivated. No additional charge spent.`);renderWeapon()}
function activate(which){const w=data.weapon;if(w.charges<=0)return;w.charges--;w.effects[which]=2;record(`${which.toUpperCase()} invoked · −1 Starshot charge (now ${w.charges}/3). Active through the end of your next turn.`);renderWeapon()}
function setupWeapon(){const w=data.weapon;el('crossbowType').addEventListener('change',e=>{w.type=e.target.value;const types={hand:'1d6',light:'1d8',heavy:'1d10'};if(types[w.type])w.dice=types[w.type];save();renderWeapon()});el('weaponDice').addEventListener('change',e=>{const v=e.target.value.trim();if(!parseDice(v)){alert('Enter a valid dice expression such as 1d6, 1d8, 1d10 or 2d6.');renderWeapon();return}w.dice=v;w.type='custom';save();renderWeapon()});for(const [id,key] of [['atkNormal','atkNormal'],['atkEmperor','atkEmperor'],['dmgNormal','dmgNormal'],['dmgEmperor','dmgEmperor']])el(id).addEventListener('change',e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&e.target.value.trim()!==''){w[key]=v;save()}else renderWeapon()});el('attackBtn').addEventListener('click',attack);el('damageBtn').addEventListener('click',()=>damage(false));el('critBtn').addEventListener('click',()=>damage(true));document.querySelectorAll('[data-activate]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.activate)));document.querySelectorAll('[data-deactivate]').forEach(b=>b.addEventListener('click',()=>deactivateConstellation(b.dataset.deactivate)));el('dawnBtn').addEventListener('click',()=>{const gain=rollDie(3),prev=w.charges;w.charges=Math.min(3,w.charges+gain);record(`Dawn: rolled 1d3 = ${gain}. Charges ${prev} → ${w.charges} / 3.`);renderWeapon()});el('chargeResetBtn').addEventListener('click',()=>{w.charges=3;record('Starshot charges manually refilled to 3.');renderWeapon()});el('clearLogBtn').addEventListener('click',()=>{data.log=[];el('rollOutput').textContent='Roll history cleared.';save();renderLog()})}
el('modeBtn').addEventListener('click',()=>{if(data.inCombat){record('Combat is active; Emperor’s Time remains on until combat ends.');return}data.mode=data.mode==='normal'?'emperor':'normal';save();renderSheet()});
el('combatBtn').addEventListener('click',()=>{if(data.inCombat){data.inCombat=false;data.mode='normal';data.turn=0;data.weapon.effects={balance:0,flames:0,rogue:0};data.martyr.paralyzedTurns=0;data.paralysisTarget.selected=false;record('Combat ended · Normal form restored. Active constellation effects cleared.')}else{data.inCombat=true;data.mode='emperor';data.turn=0;record('Combat started · Emperor’s Time activated automatically.')}save();renderSheet();document.dispatchEvent(new CustomEvent('vantyr:combat-changed',{detail:{active:data.inCombat}}))});
el('endTurnBtn').addEventListener('click',endTurn);
el('resetBtn').addEventListener('click',()=>{if(window.confirm('Reset all saved Vantyr values, charges, and combat history?')){data=copy(defaultData);try{localStorage.removeItem('vantyr-curse-v14');document.dispatchEvent(new CustomEvent('vantyr:reset-curses'));document.dispatchEvent(new CustomEvent('vantyr:reset-ascendants'));document.dispatchEvent(new CustomEvent('vantyr:reset-spells'))}catch(e){}save();renderSheet();renderLog();el('rollOutput').textContent='All values reset.'}});
function renderHp(){const max=Math.max(0,Number(data[data.mode].hp)||0);data.currentHp=Math.min(Math.max(0,Number(data.currentHp)||0),max);data.tempHp=Math.max(0,Math.floor(Number(data.tempHp)||0));el('currentHp').value=data.currentHp;el('currentHp').max=max;el('currentHpText').textContent=`${data.currentHp} / ${max}`;el('hpFill').style.width=(max?100*data.currentHp/max:0)+'%';el('hpFill').classList.toggle('low',max>0&&data.currentHp/max<.25);const temp=el('tempHpInput');if(temp&&document.activeElement!==temp)temp.value=data.tempHp;el('tempHpText').textContent=`${data.tempHp} TEMP HP`;const track=el('tempHpTrack');track.setAttribute('aria-valuenow',String(data.tempHp));track.setAttribute('aria-valuemax',String(Math.max(1,data.tempHp,max)));el('tempHpFill').style.width=(data.tempHp?Math.max(8,100*data.tempHp/Math.max(data.tempHp,max)):0)+'%';if(el('fangsBloodied'))renderBite();if(el('hpDamageHistory'))renderHpDamageHistory();if(typeof renderAscendantStatus==='function')renderAscendantStatus()}
function applyDamageToHp(amount){const beforeTemp=data.tempHp||0,beforeHp=data.currentHp;const absorbed=Math.min(beforeTemp,amount);data.tempHp=beforeTemp-absorbed;data.currentHp=Math.max(0,beforeHp-(amount-absorbed));const actualLoss=beforeHp-data.currentHp;const recovery=amount>0?ascendantReactiveHealing(amount):0;const hpAfterDamage=data.currentHp;data.currentHp=Math.min(data[data.mode].hp,data.currentHp+recovery);document.dispatchEvent(new CustomEvent('vantyr:hp-updated'));return {beforeTemp,beforeHp,absorbed,fromHp:actualLoss,healed:data.currentHp-hpAfterDamage,afterHp:data.currentHp};}
function setupTempHp(){el('tempHpSet').addEventListener('click',()=>{const raw=el('tempHpInput').value.trim();if(!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw))){el('tempHpInput').value=data.tempHp;return;}data.tempHp=Number(raw);const msg=`Temporary HP set to ${data.tempHp} (manual replacement, not stacked).`;save();renderHp();if(typeof record==='function')record(msg)});el('tempHpClear').addEventListener('click',()=>{data.tempHp=0;save();renderHp();if(typeof record==='function')record('Temporary HP cleared.')});}


// v1.2 · Incoming damage calculator: manual rule selection avoids silently applying wrong types.
function renderHpDamageHistory(){const target=el('hpDamageHistory');if(!target)return;target.replaceChildren();const entries=data.hpDamageHistory||[];if(!entries.length){target.textContent='No incoming damage yet.';return}entries.forEach(item=>{const row=document.createElement('div');row.className='hp-event';row.textContent=item;target.append(row)})}
function applyIncomingDamage(rule){const input=el('incomingDamage');const raw=input.value.trim();if(raw===''||!/^\d+$/.test(raw)){el('hpDamageResult').textContent='Enter a non-negative whole number first.';input.focus();return}const amount=Number(raw);if(!Number.isSafeInteger(amount)){el('hpDamageResult').textContent='Damage amount is too large.';return}
 const typ=el('damageType').value, nonmagical=el('nonmagicalDamage').checked;const hints=[];
 if(rule==='resisted'&&typ&&!((['Bludgeoning','Piercing','Slashing'].includes(typ)&&nonmagical))&&!['Cold','Necrotic','Poison'].includes(typ))hints.push('Check resistance: selected type is not listed as a resistance (some types are immune).');
 if(rule==='vulnerable'&&typ&&typ!=='Radiant')hints.push('Check vulnerability: only Radiant is listed.');
 if(rule==='immune'&&typ&&!['Cold','Necrotic','Poison'].includes(typ))hints.push('Check immunity: selected damage type is not listed as immune.');
 if(rule==='normal'&&typ==='Radiant')hints.push('Radiant is vulnerable; use Vulnerable unless overridden by your DM.');
 if(rule==='normal'&&['Cold','Necrotic','Poison'].includes(typ))hints.push('This type is immune; use Immune unless overridden by your DM.');
 const combine=el('combineSaveResistance').checked&&(rule==='resisted'||rule==='saved');let actual=amount;
 if(rule==='resisted'||rule==='saved')actual=Math.floor(actual/2);
 if(rule==='vulnerable')actual=actual*2;
 if(rule==='immune')actual=0;
 if(combine){actual=Math.floor(Math.floor(amount/2)/2)}
 if(!Number.isSafeInteger(actual)){el('hpDamageResult').textContent='Calculated damage is too large.';return}
 const {beforeHp:previous,beforeTemp,absorbed,fromHp:taken}=applyDamageToHp(actual);
 const ruleName=combine?'Resisted + Saved (¼)':({normal:'Normal',resisted:'Resisted (½)',vulnerable:'Vulnerable (×2)',saved:'Successful Save (½)',immune:'Immune (0)'})[rule];const message=`${ruleName}${typ?' · '+typ:''}: ${amount} → ${actual} damage. Temp HP ${beforeTemp} → ${data.tempHp} (absorbed ${absorbed}); HP ${previous} → ${data.currentHp} (lost ${taken})${absorbed+taken!==actual?' (remaining damage past 0 HP)':''}.`;
 data.hpDamageHistory.unshift(message);data.hpDamageHistory=data.hpDamageHistory.slice(0,10);save();renderHp();el('hpDamageResult').textContent=message+(hints.length?' ⚠ '+hints.join(' '):'');
 if(typeof record==='function')record(message);
}
function setupIncomingDamage(){[['applyNormalDamage','normal'],['applyResistedDamage','resisted'],['applyVulnerableDamage','vulnerable'],['applySaveHalfDamage','saved'],['applyImmuneDamage','immune']].forEach(([id,rule])=>el(id).addEventListener('click',()=>applyIncomingDamage(rule)));renderHpDamageHistory()}

function applyDirectHpCost(amount){
 const beforeHp=data.currentHp;const cost=Math.max(0,Math.floor(Number(amount)||0));
 data.currentHp=Math.max(0,beforeHp-cost);
 const paid=beforeHp-data.currentHp;const recovery=cost>0?ascendantReactiveHealing(cost):0;
 const afterCost=data.currentHp;
 data.currentHp=Math.min(data[data.mode].hp,data.currentHp+recovery);
 save();renderHp();document.dispatchEvent(new CustomEvent('vantyr:hp-updated'));
 return {beforeHp,cost,paid,healed:data.currentHp-afterCost,afterHp:data.currentHp};
}
function spendBlood(weapon){const r=applyDirectHpCost(2);return `🩸 ${weapon} blood arrow: cost 2 HP (no resistance / immunity); HP ${r.beforeHp} → ${r.afterHp}${r.healed?` · Crimson Vigor healed +${r.healed}`:''}. Temporary HP unchanged.`;}

function renderMartyr(){const m=data.martyr;el('martyrAtk').value=m.atk;el('martyrFlat').value=m.flat;el('furyDC').value=m.furyDC??'';el('furyDice').value=m.furyDice;const active=m.paralyzedTurns>0;el('furyState').textContent=active?`Paralyzed · ${m.paralyzedTurns} round(s) remaining · repeat CON save each target turn`:'Inactive';el('furyState').classList.toggle('active',active);renderParalysis()}
function rollMartyrAttack(){const empower=consumeBiteBonus();const m=data.martyr,mode=futureEffectiveMode(paralyzedAttackMode(document.querySelector('input[name="martyrMode"]:checked').value));const first=rollDie(20),second=mode==='normal'?null:rollDie(20);const chosen=second===null?first:mode==='adv'?Math.max(first,second):Math.min(first,second);const autoCrit=paralysisAutoCrit(),ascCrit=ascendantCrossbowCritical(chosen),crit=chosen!==1&&(chosen===20||ascCrit||autoCrit),attackBonus=m.atk+empower+ascendantAttackBonus()+exhaustionBonus();let msg=`${spendBlood('Martyr')}\nMartyr ${mode}: d20 ${first}${second===null?'':' / '+second} → ${chosen} ${fmt(attackBonus)} = ${chosen+attackBonus}${empower?' · Vampiric Empowerment +'+empower:''}${chosen===20?' · NATURAL 20!':chosen===1?' · NATURAL 1!':ascCrit?' · CRIMSON FURY 19 CRITICAL!':autoCrit?' · BRUTAL CRITICAL IF HIT!':''}`;if(chosen===20||ascCrit){const d=rollDice('1d8',true),rite=riteDescription('martyr',true),asc=ascendantCrossbowDice(true),flat=m.flat+ascendantDamageFlat();msg+=`\nCritical damage: ${d.rolled.join('+')} ${fmt(flat)}${rite.txt}${asc.text} ${exhaustionSuffix()} = ${damageWithExhaustion(d.total+flat+rite.amount+asc.total)}`} setAttackResult('martyr',chosen,attackBonus,mode,[first,second],ascCrit?'fury':crit&&chosen!==20?'paralysis':null);record(msg);renderMartyr()}
function rollMartyrDamage(crit){crit=crit||paralysisAutoCrit();const die=rollDice('1d8',crit),rite=riteDescription('martyr',crit),asc=ascendantCrossbowDice(crit),flat=data.martyr.flat+ascendantDamageFlat();record(`Martyr ${crit?'CRITICAL ':''}damage: ${die.rolled.join('+')} ${fmt(flat)}${rite.txt}${asc.text} ${exhaustionSuffix()} = ${damageWithExhaustion(die.total+flat+rite.amount+asc.total)}${crit?' (MAX dice + fresh roll)':''}`)}
function useFury(crit=false){const m=data.martyr,die=rollDice(m.furyDice,crit);if(!die){record('Invalid Madris Fury dice; enter NdM, e.g. 6d8.');return}record(`MADRIS' FURY · target within 60 ft · CON save DC ${m.furyDC??'not set'}\n${crit?'Brutal critical variant (DM approval required) · ':''}${m.furyDice} necrotic: ${die.rolled.join('+')} ${exhaustionSuffix()} = ${damageWithExhaustion(die.total)}. On failed save: Paralyzed for 1 minute (10 rounds); repeat CON save at end of each target turn. No effect on successful save specified.`)}
function setupMartyr(){for(const [id,k] of [['martyrAtk','atk'],['martyrFlat','flat'],['furyDC','furyDC']])el(id).addEventListener('change',e=>{const v=e.target.value.trim();if(v===''&&k==='furyDC')data.martyr[k]=null;else if(Number.isFinite(Number(v))&&v!=='')data.martyr[k]=Number(v);save();renderMartyr()});el('furyDice').addEventListener('change',e=>{if(parseDice(e.target.value))data.martyr.furyDice=e.target.value;save();renderMartyr()});el('martyrAttack').addEventListener('click',rollMartyrAttack);el('martyrDamage').addEventListener('click',()=>rollMartyrDamage(false));el('martyrCrit').addEventListener('click',()=>rollMartyrDamage(true));el('furyUse').addEventListener('click',()=>useFury(false));el('furyCrit').addEventListener('click',()=>useFury(true));el('furyFailedSave').addEventListener('click',()=>{data.martyr.paralyzedTurns=10;data.paralysisTarget.selected=true;record('Madris Fury: target FAILED CON save; Paralyzed up to 10 rounds. Repeat save at end of EACH TARGET turn.');renderMartyr()});el('furySaved').addEventListener('click',()=>{data.martyr.paralyzedTurns=0;data.paralysisTarget.selected=false;record('Madris Fury: target succeeded CON save; paralysis ended.');renderMartyr()});el('currentHp').addEventListener('change',e=>{data.currentHp=Number(e.target.value);save();renderHp();document.dispatchEvent(new CustomEvent('vantyr:hp-updated'))});el('healFullBtn').addEventListener('click',()=>{data.currentHp=data[data.mode].hp;save();renderHp()})}

function biteModifier(){return modifier(data[data.mode].stats.CON)}
function biteAdvantage(){return data.currentHp<=data[data.mode].hp/2}
function consumeBiteBonus(){const amount=Math.max(0,Number(data.bite.empowerBonus)||0);if(amount){data.bite.empowerBonus=0;save();renderBite()}return amount}
function renderBite(){if(!el('fangsAtkBonus'))return;const con=biteModifier(),bloodied=biteAdvantage(),b=data.bite;
 el('fangsAtkBonus').textContent=fmt(con+5+exhaustionBonus());el('fangsDamage').textContent='1d4 '+fmt(con);el('fangsCon').textContent=fmt(con);el('fangsBloodied').textContent=bloodied?'Bloodied Advantage: ON':'Bloodied Advantage: OFF';el('fangsBloodied').classList.toggle('active',bloodied);
 el('biteEligible').checked=b.eligible;const pending=b.pendingPiercing!==null&&Number.isFinite(b.pendingPiercing);
 el('bitePiercing').textContent=pending?`${b.pendingPiercing} piercing · eligible ${b.eligible?'yes':'no'}`:'No hit recorded';el('bitePiercing').classList.toggle('active',pending&&b.eligible);
 el('biteHeal').disabled=!pending||!b.eligible;el('biteEmpower').disabled=!pending||!b.eligible;
 el('biteBuffStatus').textContent=b.empowerBonus>0?`${fmt(b.empowerBonus)} on next check / attack`:'None';el('biteBuffStatus').classList.toggle('active',b.empowerBonus>0);
 el('biteConsumeCheck').disabled=!(b.empowerBonus>0);el('biteClearBuff').disabled=!(b.empowerBonus>0)
}
function calculateBiteDamage(crit=false){const piercingDice=rollDice('1d4',crit),piercingBase=piercingDice.total+biteModifier(),rite=riteDescription('fangs',crit),piercing=Math.max(0,piercingBase-exhaustionLevel());data.bite.pendingPiercing=Math.max(0,piercing);return {piercing,rite,text:`${piercingDice.rolled.join('+')} ${fmt(biteModifier())}${exhaustionSuffix()} = ${piercing} piercing${rite.txt}; TOTAL ${piercing+rite.amount} damage${crit?' (MAX dice + fresh roll)':''}`}}
function rollBiteDamage(crit=false){crit=crit||paralysisAutoCrit();const d=calculateBiteDamage(crit);document.dispatchEvent(new CustomEvent('vantyr:bite-confirmed',{detail:{piercing:d.piercing}}));record(`🦇 VAMPIRIC BITE ${crit?'CRITICAL ':''}HIT: ${d.text}\nChoose heal or empower if target is neither Construct nor Undead.`);renderBite()}
function rollBiteAttack(){const con=biteModifier(),buff=consumeBiteBonus(),mode=document.querySelector('input[name="biteMode"]:checked').value,bloodied=biteAdvantage();let advantage=mode==='adv'?1:mode==='dis'?-1:0;if(bloodied)advantage=Math.max(0,advantage);if(paralysisSelected())advantage=mode==='dis'?0:1;if(futureIsSetActive())advantage=advantage<0?0:1;const r1=rollDie(20),r2=advantage!==0?rollDie(20):null,chosen=r2===null?r1:advantage>0?Math.max(r1,r2):Math.min(r1,r2),autoCrit=paralysisAutoCrit(),crit=chosen!==1&&(chosen===20||autoCrit);
 data.bite.pendingPiercing=null;document.dispatchEvent(new CustomEvent('vantyr:bite-reset'));let out=`🦇 BITE ${advantage>0?'ADVANTAGE':advantage<0?'DISADVANTAGE':'NORMAL'}${bloodied?' · Bloodied feature active':''}: d20 ${r1}${r2===null?'':' / '+r2} → ${chosen} ${fmt(con+5+buff+exhaustionBonus())} = ${chosen+con+5+buff+exhaustionBonus()}${buff?' (Empowerment +'+buff+' consumed)':''}${chosen===20?' · NATURAL 20!':chosen===1?' · NATURAL 1!':autoCrit?' · BRUTAL CRITICAL IF HIT!':''}.`;
 if(chosen===20){const d=calculateBiteDamage(true);document.dispatchEvent(new CustomEvent('vantyr:bite-confirmed',{detail:{piercing:d.piercing}}));out+=`\nCritical damage: ${d.text}. Choose empower/heal if eligible.`}
 else if(chosen!==1)out+=autoCrit?'\nIf the attack hits, press Damage on Hit: Brutal Critical applies automatically.':'\nIf this hits, press Piercing + Rite Damage to confirm the bite and roll damage.';
 setAttackResult('fangs',chosen,con+5+buff+exhaustionBonus(),advantage>0?'Advantage':advantage<0?'Disadvantage':'Normal',[r1,r2],crit&&chosen!==20?'paralysis':null);record(out);renderBite()}
function setupBite(){el('biteEligible').addEventListener('change',e=>{data.bite.eligible=e.target.checked;save();renderBite()});el('biteAttack').addEventListener('click',rollBiteAttack);el('biteDamage').addEventListener('click',()=>rollBiteDamage(false));el('biteCrit').addEventListener('click',()=>rollBiteDamage(true));
 el('biteHeal').addEventListener('click',()=>{const b=data.bite;if(b.pendingPiercing===null||!b.eligible)return;const max=data[data.mode].hp,old=data.currentHp;data.currentHp=Math.min(max,old+b.pendingPiercing);const amount=data.currentHp-old;b.pendingPiercing=null;record(`🦇 Vampiric Bite healing: ${amount} HP restored (piercing damage only). HP ${old} → ${data.currentHp}/${max}.`);renderHp();renderBite()});
 el('biteEmpower').addEventListener('click',()=>{const b=data.bite;if(b.pendingPiercing===null||!b.eligible)return;const bonus=b.pendingPiercing;b.empowerBonus=bonus;b.pendingPiercing=null;record(`🦇 Bite Empowerment: ${fmt(bonus)} bonus stored for your NEXT ability check or attack roll. Does not include Crimson Rite damage.`);renderBite()});
 el('biteConsumeCheck').addEventListener('click',()=>{const bonus=consumeBiteBonus();record(`🦇 Vampiric Empowerment ${fmt(bonus)} applied to your next ability check (roll ability check manually).`);renderBite()});
 el('biteClearBuff').addEventListener('click',()=>{data.bite.empowerBonus=0;record('Vampiric Bite stored bonus cleared.');renderBite()})}

setupWeapon();setupMartyr();setupRites();setupBite();setupUtility();setupIncomingDamage();setupTempHp();renderSheet();renderLog();if(!parseDice(data.weapon.dice)){data.weapon.dice='1d8';save();renderWeapon()}

// v1.1: quick tabs, persistent click-outside roll result and no-scroll presentation.
function showResultPopup(message,dice,attack,check){
 const overlay=el('rollModal'),heading=el('modalHeading'),eq=el('modalEquation'),dieBox=el('modalDice'),description=el('modalDescription');
 if(!overlay)return;
 const source=(currentActionButton?.textContent||'Roll').trim();heading.textContent=check?.label || source || 'Result';
 eq.replaceChildren();dieBox.replaceChildren();overlay.querySelectorAll('.future-roll-actions').forEach(node=>node.remove());
 const result=attack||check;
 if(result){
   const rows=[[result.natural,'D20'],[fmt(result.bonus),'BONUS'],[result.total,'TOTAL']];
   rows.forEach(([num,label],i)=>{if(i){const op=document.createElement('span');op.className='modal-op';op.textContent=i===1?'+':'=';eq.append(op)}const tile=document.createElement('div');tile.className='modal-number'+(i===2?' modal-final':'');const n=document.createElement('b');n.textContent=num;const l=document.createElement('small');l.textContent=label;tile.append(n,l);eq.append(tile)});
 }else if(dice.length){
   let match=[...String(message).matchAll(/=\s*(-?\d+)/g)];
   let val=match.length?match[match.length-1][1]:null;
   if(val===null){val=dice.reduce((n,die)=>n+die.value,0)}
   const tile=document.createElement('div');tile.className='modal-number modal-final';const n=document.createElement('b');n.textContent=val;const l=document.createElement('small');l.textContent='RESULT';tile.append(n,l);eq.append(tile);
 }
 dice.slice(0,20).forEach((die,index)=>{const face=document.createElement('div');face.className='modal-die';if(check?.rolls?.length===2 && index<2){face.classList.add(check.rolls.indexOf(check.natural)===index?'roll-die-selected':'roll-die-discarded')} face.style.setProperty('--delay',`${Math.min(index*40,360)}ms`);const n=document.createElement('strong');n.textContent=die.value;const l=document.createElement('small');l.textContent='d'+die.sides;face.append(n,l);dieBox.append(face)});
 description.textContent=check?.rolls?.length===2?`${check.mode==='adv'?'ADVANTAGE':'DISADVANTAGE'} · rolled ${check.rolls.join(' and ')} · used ${check.natural}\n${message}`:message;
 overlay.hidden=false;overlay.setAttribute('aria-hidden','false');overlay.querySelector('.roll-modal-card').focus();
}
function setupTabsAndModal(){
 const buttons=[...document.querySelectorAll('.tab-btn')];
 function activateTab(id){buttons.forEach(btn=>{const on=btn.dataset.tab===id;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',String(on))});document.querySelectorAll('[data-tab-panel]').forEach(p=>p.classList.toggle('tab-hidden',p.dataset.tabPanel!==id));try{sessionStorage.setItem('vantyr-active-tab',id)}catch(e){}}
 buttons.forEach(btn=>btn.addEventListener('click',()=>activateTab(btn.dataset.tab)));
 let previous='combat';try{previous=sessionStorage.getItem('vantyr-active-tab')||'combat'}catch(e){}
 activateTab(['combat','rolls','character','curses','spells','concoction','inventory'].includes(previous)?previous:'combat');
 const overlay=el('rollModal');const close=()=>{overlay.hidden=true;overlay.setAttribute('aria-hidden','true')};
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 el('modalClose').addEventListener('click',close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close()});
}
setupTabsAndModal();
