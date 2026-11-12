'use strict';
/* Stand by the Emperor · both d20 results may be assigned, never rolled again.
   Initiative totals follow the existing Vantyr house-rule (+25, minus Exhaustion).
   A DM can edit allied totals on their Initiative Board. */
(()=>{
const FRIENDS=['Kokopelis','Lanfear','Kazeshini','Takis','Mertis','Erdogun'];
const $=id=>document.getElementById(id);
const KEY='vantyr-last-initiative-assignment-v1';
let last=null,keep=0,share=false;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
function emit(ally=null){
 if(!last)return;
 const other=1-keep;
 const detail={
   vantyr:last.totals[keep],vantyrRaw:last.rolls[keep],
   ally,allyInitiative:ally?last.totals[other]:null,allyRaw:ally?last.rolls[other]:null,
   rolls:[...last.rolls],bonus:last.bonus,createdAt:Date.now()
 };
 try{localStorage.setItem(KEY,JSON.stringify(detail))}catch(e){}
 document.dispatchEvent(new CustomEvent('vantyr:initiative-update',{detail}));
 $('initiativeResult').textContent=ally?
   'Vantyr '+detail.vantyr+' · '+ally+' '+detail.allyInitiative+' · saved locally; syncing when connected':
   'Vantyr '+detail.vantyr+' · higher roll retained · DM board notified';
 return detail;
}
function visual(){
 if(!last)return;
 const box=$('emperorDice');box.replaceChildren();
 last.rolls.forEach((raw,i)=>{
  const tile=document.createElement('button');tile.type='button';tile.className='emperor-die-choice'+(keep===i?' selected':'');tile.setAttribute('aria-pressed',String(keep===i));
  tile.setAttribute('aria-label','Keep die '+(i+1)+' for Vantyr, initiative '+last.totals[i]);
  const label=document.createElement('span');label.className='emperor-die-label';label.textContent='DIE '+(i+1);
  const face=document.createElement('span');face.className='emperor-die-face';face.textContent=raw;
  const bonus=document.createElement('span');bonus.className='emperor-die-bonus';bonus.textContent=(last.bonus>=0?'+':'')+last.bonus+' MODIFIER';
  const total=document.createElement('strong');total.textContent='INITIATIVE '+last.totals[i];
  const status=document.createElement('span');status.className='emperor-die-tag';
  status.textContent=keep===i?'♛ VANTYR KEEPS THIS':'↗ OTHER DIE';
  tile.append(label,face,bonus,total,status);
  tile.addEventListener('click',()=>{keep=i;visual()});
  box.append(tile);
 });
 $('emperorGiftArea').hidden=!share;
 $('emperorShareToggle').textContent=share?'✓ Gift the other initiative':'＋ Give the other initiative to an ally';
 $('emperorShareToggle').setAttribute('aria-pressed',String(share));
 $('emperorGiftExplanation').textContent=share?
   'Your chosen ally receives the other complete initiative total. Your DM can adjust it on the Initiative Board.':'Vantyr keeps your selected die. Sharing is optional.';
}
function show(detail){
 if(!Array.isArray(detail?.rolls)||detail.rolls.length!==2)return;
 const bonus=Number(detail.bonus);
 if(!Number.isFinite(bonus))return;
 const rolls=detail.rolls.map(n=>clamp(n,1,20));
 last={rolls,bonus,totals:rolls.map(x=>x+bonus)};
 keep=last.totals[1]>last.totals[0]?1:0;
 share=false;
 $('emperorAlly').value='';
 visual();
 $('emperorShareError').textContent='';
 $('emperorShareDialog').hidden=false;
 const old=$('rollModal');if(old){old.hidden=true;old.setAttribute('aria-hidden','true')}
 // Publish the higher initiative immediately on rolling, even before the player
 // optionally gives their other die to an ally.
 emit(null);
}
function finish(){
 if(!last)return;
 const ally=share?$('emperorAlly').value:null;
 if(share&&!FRIENDS.includes(ally)){
  $('emperorShareError').textContent='Choose which ally receives the other initiative die.';return;
 }
 emit(ally);
 $('emperorShareDialog').hidden=true;
 const d=$('initiativeResult');d.textContent+=ally?' · Shared with '+ally:' · No die shared';
 last=null;
}
function setup(){
 const select=$('emperorAlly');
 for(const name of FRIENDS){const op=document.createElement('option');op.value=name;op.textContent=name;select.append(op)}
 document.addEventListener('vantyr:initiative-rolled',e=>show(e.detail));
 $('emperorShareToggle').addEventListener('click',()=>{share=!share;visual();if(share)$('emperorAlly').focus()});
 $('emperorShareConfirm').addEventListener('click',finish);
 $('emperorShareDialog').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();