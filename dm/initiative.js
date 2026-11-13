'use strict';
/* DM Initiative Board. This is the ONLY DM-editable system: token grants
 * access to a narrowly scoped initiative RPC, not Vantyr's character data. */
(()=>{
const cfg=window.VANTYR_OBSERVER_CONFIG;
const $=id=>document.getElementById(id);
const DM_KEY='vantyr-dm-link';
const TYPES=['player','npc','enemy'];
const TEAM=['Vantyr','Kokopelis','Lanfear','Kazeshini','Takis','Mertis','Erdogun'];
let current={board:{entries:[],round:1,activeId:null},revision:0,updated_at:null},working=false,queue=Promise.resolve(),lastError='';
const token=()=>{try{return sessionStorage.getItem(DM_KEY)||''}catch(e){return ''}};
function status(str,error=false){const el=$('initiativeBoardStatus');if(el){el.textContent=str;el.dataset.error=String(error)}}
const sorted=b=>[...(b?.entries||[])].sort((a,b)=>{
  const aa=a.initiative==null?-Infinity:Number(a.initiative),bb=b.initiative==null?-Infinity:Number(b.initiative);
  return bb-aa||String(a.name).localeCompare(String(b.name));
});
function indexForType(type){return type==='enemy'?'⚔':type==='npc'?'♟':'♛'}
function make(tag,classes,text){const el=document.createElement(tag);if(classes)el.className=classes;if(text!=null)el.textContent=String(text);return el}
function render(){
 const board=current.board||{entries:[],round:1,activeId:null};
 $('initiativeRound').textContent='ROUND '+(board.round||1);
 const list=$('initiativeEntries');list.replaceChildren();
 const entries=sorted(board);
 if(!entries.length){list.append(make('p','initiative-empty','No combatants yet. Add players, NPCs or enemies, or roll initiative in Vantyr’s app.'));return}
 for(const [i,entry] of entries.entries()){
  const row=make('div','initiative-entry'+(entry.id===board.activeId?' acting':''));
  const rank=make('span','initiative-rank',i+1);
  const glyph=make('span','initiative-type-icon '+entry.type,indexForType(entry.type));
  const name=make('input','initiative-name');name.type='text';name.maxLength=60;name.value=entry.name;name.setAttribute('aria-label','Combatant name');
  name.addEventListener('change',()=>{const value=name.value.trim();if(!value){name.value=entry.name;return}mutate(b=>{const item=b.entries.find(e=>e.id===entry.id);if(item)item.name=value})});
  const type=make('select','initiative-type');type.setAttribute('aria-label','Combatant category');
  for(const t of TYPES){const op=make('option','',t==='npc'?'NPC':t.charAt(0).toUpperCase()+t.slice(1));op.value=t;type.append(op)}
  type.value=entry.type;
  type.addEventListener('change',()=>mutate(b=>{const item=b.entries.find(e=>e.id===entry.id);if(item)item.type=type.value}));
  const score=make('input','initiative-score');score.type='number';score.min='-99';score.max='999';score.value=entry.initiative??'';score.placeholder='—';score.setAttribute('aria-label','Initiative score for '+entry.name);
  score.addEventListener('change',()=>{
   const value=score.value.trim();
   const parsed=value===''?null:Number(value);
   if(parsed!==null&&(!Number.isInteger(parsed)||parsed < -99||parsed>999)){score.value=entry.initiative??'';status('Initiative must be a whole number from -99 to 999.',true);return}
   mutate(b=>{const item=b.entries.find(e=>e.id===entry.id);if(item){item.initiative=parsed;delete item.source;delete item.rawDie;delete item.modifier}})
  });
  const remove=make('button','initiative-remove','×');remove.type='button';remove.setAttribute('aria-label','Remove '+entry.name);remove.title='Remove combatant';
  remove.addEventListener('click',()=>mutate(b=>{b.entries=b.entries.filter(e=>e.id!==entry.id);if(b.activeId===entry.id)b.activeId=null}));
  const details=make('span','initiative-rollnote',entry.rawDie?('Stand by the Emperor · d20 '+entry.rawDie+' +25'):'');
  const identity=make('div','initiative-identity');identity.append(name,type,details);
  row.append(rank,glyph,identity,score,remove);
  list.append(row);
 }
}
async function rpc(name,body){
 const t=token();if(!/^[0-9a-f]{64}$/.test(t))throw Error('Open your private DM invitation link first.');
 const r=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{
   method:'POST',cache:'no-store',
   headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},
   body:JSON.stringify({p_token:t,...body})
 });
 const obj=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(obj.message||obj.error||'Supabase returned '+r.status);
 return obj;
}
async function refresh(force=false){
 if(!token())return;
 // While editing, avoid refreshing inputs out from under the DM's cursor.
 if(!force && $('dmInitiativeView').contains(document.activeElement) &&
    ['INPUT','SELECT'].includes(document.activeElement.tagName))return;
 try{
   const next=await rpc('vantyr_initiative_read',{});
   if(force||next.revision!==current.revision){
    current={board:next.board||{entries:[],round:1,activeId:null},revision:next.revision||0,updated_at:next.updated_at};
    render();
   }
   status('● LIVE BOARD · '+(next.updated_at?'Saved '+new Date(next.updated_at).toLocaleTimeString():'Awaiting first initiative'));
 }catch(e){
   lastError=e.message;status('Board offline: '+e.message,true);
 }
}
function mutate(updater){
 queue=queue.then(async()=>{
   working=true;
   try{
     // Refresh first so an incoming Vantyr initiative never gets overwritten by stale DM state.
     await refresh(true);
     const board=JSON.parse(JSON.stringify(current.board));
     updater(board);
     const revision=await rpc('vantyr_initiative_write',{p_board:board,p_revision:current.revision});
     current={board,revision,updated_at:new Date().toISOString()};
     render();status('✓ Initiative board saved');
   }catch(e){
     status('Unable to save: '+e.message,true);
     await refresh(true);
   }finally{working=false}
 }).catch(e=>{working=false;status(e.message,true)});
 return queue;
}
function add(){
 const input=$('initiativeAddName'),name=input.value.trim();
 if(!name){status('Enter a player, NPC or enemy name first.',true);input.focus();return}
 if(name.length>60){status('Names must be 60 characters or fewer.',true);return}
 const type=$('initiativeAddType').value;
 const raw=$('initiativeAddScore').value.trim(),score=raw===''?null:Number(raw);
 if(score!==null&&(!Number.isInteger(score)||score < -99||score>999)){status('Initiative must be -99 to 999.',true);return}
 const id='c'+crypto.randomUUID().replaceAll('-','');
 mutate(b=>{
  if(b.entries.length>=60)throw Error('The board supports up to 60 combatants.');
  b.entries.push({id,name,type,initiative:score});
 });
 input.value='';$('initiativeAddScore').value='';
}
function changeTurn(){
 mutate(b=>{
  const order=sorted(b).filter(e=>e.initiative!==null);
  if(!order.length){b.activeId=null;return}
  const position=order.findIndex(e=>e.id===b.activeId);
  if(position<0){b.activeId=order[0].id}
  else if(position>=order.length-1){b.activeId=order[0].id;b.round=Math.min(99999,Math.max(1,Number(b.round)||1)+1)}
  else b.activeId=order[position+1].id;
 });
}
function toggle(which){
 const initiative=which==='board';
 $('dmCharacterView').hidden=initiative;
 $('dmInitiativeView').hidden=!initiative;
 $('dmGoInitiative').classList.toggle('selected',initiative);
 $('dmGoCharacter').classList.toggle('selected',!initiative);
 $('dmGoInitiative').setAttribute('aria-pressed',String(initiative));
 $('dmGoCharacter').setAttribute('aria-pressed',String(!initiative));
 if(initiative)refresh(true);
}
function setup(){
 $('dmGoInitiative').addEventListener('click',()=>toggle('board'));
 $('dmGoCharacter').addEventListener('click',()=>toggle('character'));
 $('initiativeAddForm').addEventListener('submit',e=>{e.preventDefault();add()});
 $('initiativeNext').addEventListener('click',changeTurn);
 $('initiativeResetTurn').addEventListener('click',()=>mutate(b=>{b.round=1;b.activeId=null}));
 $('initiativeClear').addEventListener('click',()=>{
  if(confirm('Clear every player, NPC, and enemy from the initiative board?')){
    mutate(b=>{b.entries=[];b.activeId=null;b.round=1})
  }
 });
 $('initiativeRefresh').addEventListener('click',()=>refresh(true));
 setInterval(()=>{if(!working&&token())refresh()},Number(cfg?.pollIntervalMs)||2500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();