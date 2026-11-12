'use strict';
/* Optional owner-side DM Observer sync. This never exposes write capability to DM users.
 * The database must first be provisioned with supabase/vantyr_observer_setup.sql.
 * All ordinary game data remains local-first and usable without any connection.
 */
(()=>{
const cfg=window.VANTYR_OBSERVER_CONFIG;
if(!cfg?.url||!cfg?.publishableKey)return;
const $=id=>document.getElementById(id);
const KEY='vantyr-observer-owner-session-v1';
const DM_LINK_KEY='vantyr-observer-private-link-v1';
const api=cfg.url.replace(/\/$/,'');
const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||0));
let session=null,approved=false,busy=false,lastHash='',lastPublished=null;
let pendingTimer=0;
try{session=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
function saveSession(){try{if(session)localStorage.setItem(KEY,JSON.stringify(session));else localStorage.removeItem(KEY)}catch(e){}}
function status(text,kind=''){if($('observerStatus')){$('observerStatus').textContent=text;$('observerStatus').dataset.kind=kind;}}
async function request(path,{body,method='POST',auth=false}={}){
  let token='';
  if(auth){
    await ensureSession();
    if(!session?.access_token)throw new Error('Sign in to your VANTYR owner account first.');
    token=session.access_token;
  }
  const result=await fetch(api+path,{method,cache:'no-store',headers:{
    'apikey':cfg.publishableKey,'Content-Type':'application/json',
    ...(token?{'Authorization':'Bearer '+token}:{})
  },body:body===undefined?undefined:JSON.stringify(body)});
  let obj;try{obj=await result.json()}catch(e){obj={}};
  if(!result.ok)throw new Error(obj.message||obj.msg||obj.error_description||obj.error||'Supabase returned HTTP '+result.status);
  return obj;
}
async function ensureSession(){
  if(!session)return;
  if(Number(session.expires_at||0)>Date.now()/1000+70)return;
  if(!session.refresh_token){session=null;approved=false;saveSession();return;}
  const res=await request('/auth/v1/token?grant_type=refresh_token',{body:{refresh_token:session.refresh_token}});
  if(!res.access_token)throw new Error('Your session expired. Please sign in again.');
  session={access_token:res.access_token,refresh_token:res.refresh_token||session.refresh_token,expires_at:Math.floor(Date.now()/1000)+Number(res.expires_in||3600)};
  saveSession();
}
function acceptRedirect(){
  if(!location.hash.includes('access_token='))return;
  const hash=new URLSearchParams(location.hash.slice(1));
  if(hash.get('access_token')){
    session={access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_at:Math.floor(Date.now()/1000)+Number(hash.get('expires_in')||3600)};
    approved=false;saveSession();
    history.replaceState(null,'',location.pathname+location.search);
    status('Email sign-in received. Verifying ownership…');
  }
}
const pick=(obj,keys)=>Object.fromEntries(keys.map(k=>[k,obj?.[k]]));
function getVecna(){try{return window.VANTYR_OBSERVER_VECNA?.()||{}}catch(e){return {}}}
function snapshot(){
  // Publish intentionally selected GAME DATA, never accounts, notes, session tokens or full storage.
  if(typeof data==='undefined')return null;
  const d=data,form=d.mode==='emperor'?'emperor':'normal';
  const c=typeof curseData!=='undefined'?curseData:{},f=typeof futureData!=='undefined'?futureData:{};
  const rites=Object.fromEntries(['starshot','martyr','fangs'].map(id=>[id,pick(d.rites?.[id],['active','type','undead'])]));
  const oath=Object.fromEntries(['vigor','fury','overdrive'].map(id=>[id,pick(d.ascendant?.[id],['active','used','remaining','element'])]));
  const brain=c.brain||{};
  const brainTotal=Array.isArray(brain.instances)?brain.instances.reduce((sum,hit)=>{
    const turn=Math.max(1,Number(brain.turn)||1);
    const multiplier=brain.amplified?turn+1:Math.floor((turn-1)/2)+2;
    return sum+(Number(hit.damage)||0)*multiplier;
  },0):0;
  const effects=Array.isArray(c.effects)?c.effects.map(x=>({
    name:String(x.name||x.id||'Blood Curse').slice(0,100),
    remaining:Number(x.remaining??x.turns??0),
    active:x.active!==false
  })).slice(0,30):[];
  return {
    character:'Vantyr',characterClass:'Blood Hunter',level:15,
    combat:{active:!!d.inCombat,turn:d.inCombat?(Number(d.turn)||0)+1:0,form:d.mode==='emperor'?"Emperor's Time":"Normal"},
    vitals:{hp:clamp(d.currentHp,0,999),maxHp:clamp(d[form]?.hp,1,999),tempHp:clamp(d.tempHp,0,999),ac:Number(d[form]?.ac)||0,exhaustion:clamp(d.ascendant?.exhaustion,0,6)},
    oathForms:oath,
    weapons:{starshotCharges:clamp(d.weapon?.charges,0,3),constellations:pick(d.weapon?.effects,['balance','flames','rogue']),rites,paralyzedTurns:clamp(d.martyr?.paralyzedTurns,0,10)},
    bloodMagic:{charges:clamp(c.charges,0,4),freeCorrosion:!!c.freeCorrosion,squelchingReady:!!c.squelchingReady,silenceReady:!!c.silenceReady,effects,brain:{active:!!brain.active,amplified:!!brain.amplified,turn:Math.max(0,Number(brain.turn)||0),storedDamage:brainTotal}},
    future:{foresightDice:Math.max(0,Number(f.dice)||0),futureSetUsed:!!f.futureSetUsed,futureSetActive:!!f.futureSetActive,absoluteFailures:clamp(f.failures,0,3),absoluteSuccesses:clamp(f.successes,0,3),movementUsed:!!f.movementUsed},
    vecna:pick(getVecna(),['eye','hand','wishDaysRemaining','xray']),
    deathSaves:pick(d.deathSaves,['successes','failures'])
  };
}
async function callRpc(name,body,auth=true){return request('/rest/v1/rpc/'+name,{body,auth})}
async function publishInitiative(assignment){
  if(!approved||!assignment)return;
  const body={
    p_vantyr:Number(assignment.vantyr),p_vantyr_raw:Number(assignment.vantyrRaw),
    p_ally:assignment.ally||null,
    p_ally_initiative:assignment.ally?Number(assignment.allyInitiative):null,
    p_ally_raw:assignment.ally?Number(assignment.allyRaw):null
  };
  try{
    await callRpc('vantyr_initiative_publish',body);
    status('Character and initiative sharing active','good');
  }catch(e){
    status('Initiative sync failed: '+e.message,'bad');
  }
}
async function publishInitiativeLast(){
  try{
    const item=JSON.parse(localStorage.getItem('vantyr-last-initiative-assignment-v1')||'null');
    if(item)await publishInitiative(item);
  }catch(e){}
}
async function claim(){
  if(!session)return;
  try{
    status('Checking owner authorization…');
    await callRpc('vantyr_observer_claim',{});
    approved=true;
    $('observerSignedOut').hidden=true;$('observerSignedIn').hidden=false;
    displaySavedLink();
    status('Connected · owner authenticated','good');
    await publish();
    await publishInitiativeLast();
  }catch(err){
    approved=false;
    $('observerSignedOut').hidden=false;$('observerSignedIn').hidden=true;
    status('Setup incomplete: '+err.message,'bad');
  }
}
async function publish(){
  if(!approved||busy)return;
  const state=snapshot();if(!state)return;
  const serialized=JSON.stringify(state);
  if(serialized===lastHash)return;
  busy=true;
  try{
    const revision=await callRpc('vantyr_observer_push',{p_snapshot:state});
    lastHash=serialized;lastPublished=new Date();
    if($('observerLastSent'))$('observerLastSent').textContent='Last synced '+lastPublished.toLocaleTimeString()+' · revision '+revision;
    status('Live sharing active · private link required','good');
  }catch(err){status('Sync paused: '+err.message,'bad')}
  finally{busy=false}
}
function schedulePublish(){
  if(!approved)return;
  clearTimeout(pendingTimer);
  pendingTimer=setTimeout(()=>{publish().catch(e=>status(e.message,'bad'))},450);
}
async function login(){
  const email=$('observerEmail').value.trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){status('Enter your email address.','bad');return;}
  status('Sending sign-in email…');
  try{
    await request('/auth/v1/otp?redirect_to='+encodeURIComponent(location.origin+location.pathname),{body:{email,create_user:true}});
    status('Check your email for a VANTYR sign-in link. Open it on this device.','good');
  }catch(err){status('Sign-in failed: '+err.message,'bad')}
}
function revokeLocal(){session=null;approved=false;lastHash='';saveSession();$('observerSignedOut').hidden=false;$('observerSignedIn').hidden=true;status('Signed out. Live sharing is paused.')}
function randomToken(){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
async function hashToken(value){
  const b=new TextEncoder().encode(value);const raw=await crypto.subtle.digest('SHA-256',b);
  return Array.from(new Uint8Array(raw),n=>n.toString(16).padStart(2,'0')).join('');
}
function displaySavedLink(){
  let saved='';
  try{saved=localStorage.getItem(DM_LINK_KEY)||''}catch(e){}
  if(saved && /^https:\/\/vegesotos\.github\.io\/Vantyr-Blood-Codex\/dm\/#token=[0-9a-f]{64}$/.test(saved)){
    $('observerGeneratedLink').value=saved;
    $('observerGeneratedWrap').hidden=false;
    $('observerNewLink').textContent='↻ Replace DM Link (revokes current)';
    $('observerLinkHint').textContent='Saved invitation on this device. Copy this same URL whenever you like; it stays valid until you revoke or replace it.';
  }else{
    $('observerGeneratedLink').value='';
    $('observerGeneratedWrap').hidden=true;
    $('observerNewLink').textContent='✦ Create / Replace DM Link';
    $('observerLinkHint').textContent='Already have a full invitation URL? Keep using it. Creating a new link will revoke the existing one.';
  }
}
async function rotate(){
  if(!approved)return;
  try{
    const token=randomToken();
    await callRpc('vantyr_observer_rotate',{p_token_sha256:await hashToken(token)});
    const dmURL=new URL('dm/',location.href);
    dmURL.hash='token='+token;
    try{localStorage.setItem(DM_LINK_KEY,dmURL.toString())}catch(e){}
    displaySavedLink();
    status('DM invitation saved on this device. Copy the same link whenever needed.','good');
  }catch(e){status('Unable to create viewer link: '+e.message,'bad')}
}
async function revoke(){
  if(!approved)return;
  try{
    await callRpc('vantyr_observer_revoke',{});
    try{localStorage.removeItem(DM_LINK_KEY)}catch(e){}
    displaySavedLink();
    status('DM link revoked. No viewer can read until you create a new link.','good');
  }catch(e){status('Unable to revoke link: '+e.message,'bad')}
}
function wire(){
  acceptRedirect();
  $('observerSettingsBtn').addEventListener('click',()=>{
    $('observerSettings').hidden=false;
    if(approved)displaySavedLink();
    if(session&&!approved)claim();
  });
  $('observerClose').addEventListener('click',()=>{$('observerSettings').hidden=true});
  $('observerSettings').addEventListener('click',e=>{if(e.target===$('observerSettings'))$('observerSettings').hidden=true});
  $('observerSendEmail').addEventListener('click',login);
  $('observerSignOut').addEventListener('click',revokeLocal);
  $('observerNewLink').addEventListener('click',rotate);
  $('observerRevoke').addEventListener('click',revoke);
  $('observerCopy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('observerGeneratedLink').value);status('Private link copied. Send it only to your DM.','good')}
    catch(e){$('observerGeneratedLink').select();status('Select and copy the link above.')}
  });
  document.addEventListener('vantyr:sync-dirty',schedulePublish);
  document.addEventListener('vantyr:initiative-update',e=>{publishInitiative(e.detail).catch(x=>status(x.message,'bad'))});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')$('observerSettings').hidden=true});
  setInterval(()=>{if(approved)publish().catch(e=>status(e.message,'bad'))},Number(cfg.pollIntervalMs)||2500);
  if(session)claim();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();