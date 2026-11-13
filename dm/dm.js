'use strict';
/* No login and no write requests. This page only invokes a token-verified,
 * read-only Supabase Postgres function every ~2.5 seconds. */
(()=>{
const cfg=window.VANTYR_OBSERVER_CONFIG;
const $=id=>document.getElementById(id);
let token='',lastRevision=-1,lastUpdate=null,inFlight=false;
const DM_KEY='vantyr-dm-link';
const pollMs=Number(cfg?.pollIntervalMs)||2500;
const number=(n,fall=0)=>Number.isFinite(Number(n))?Number(n):fall;
function text(id,val){const e=$(id);if(e)e.textContent=String(val)}
function connection(type,label){const e=$('dmConnection');e.textContent=label;e.className='dm-status '+type}
function age(t){if(!t)return 'Never synchronized';const seconds=Math.max(0,Math.floor((Date.now()-new Date(t).getTime())/1000));return seconds<60?seconds+'s ago':Math.floor(seconds/60)+'m ago'}
function statusAge(){if(!token)return;
  text('dmUpdated',lastUpdate?'Last update '+age(lastUpdate):'No player updates yet');
  if(lastUpdate&&Date.now()-new Date(lastUpdate).getTime()>15000)connection('stale','● LAST KNOWN STATE');
}
function status(o){return o?'ACTIVE':'INACTIVE'}
function chip(name,active=false){const e=document.createElement('span');e.className='dm-chip'+(active?' on':'');e.textContent=name;return e}
function fillChips(id,entries){const el=$(id);el.replaceChildren(...entries.map(x=>chip(x.text,x.active)));if(!entries.length)el.append(chip('None'))}
function render(snapshot){
  const v=snapshot.vitals||{},co=snapshot.combat||{},c=snapshot.bloodMagic||{},f=snapshot.future||{},w=snapshot.weapons||{},a=snapshot.vecna||{};
  text('dmForm',String(co.form||'Normal')+(co.active?' · IN COMBAT':' · OUT OF COMBAT'));
  const hp=number(v.hp),max=Math.max(1,number(v.maxHp,178));
  text('dmHp',hp+' / '+max);
  $('dmHpFill').style.width=Math.max(0,Math.min(100,(hp/max)*100))+'%';
  text('dmTemp',number(v.tempHp));
  text('dmAc',number(v.ac,'—'));
  text('dmExhaustion',number(v.exhaustion)+' / 6');
  text('dmTurn',co.active?number(co.turn):'—');
  text('dmCurseCharges',number(c.charges)+' / 4');
  text('dmCorrosion','Free Corrosion: '+(c.freeCorrosion?'READY':'SPENT'));
  text('dmOtherCurses','Squelching '+(c.squelchingReady?'ready':'spent')+' · Silence '+(c.silenceReady?'ready':'spent'));
  text('dmForesight','d6 × '+number(f.foresightDice));
  text('dmFutureSet','Future Is Set: '+(f.futureSetActive?'ACTIVE':f.futureSetUsed?'SPENT':'READY'));
  text('dmOutcomeUses','Failure '+number(f.absoluteFailures)+'/3 · Success '+number(f.absoluteSuccesses)+'/3');
  text('dmStarshotCharges',number(w.starshotCharges)+' / 3');
  const con=w.constellations||{};
  text('dmConstellations','Balance '+number(con.balance)+' · Flames '+number(con.flames)+' · Rogue '+number(con.rogue));
  text('dmParalysis','Paralyzed target: '+number(w.paralyzedTurns)+' rounds');
  text('dmVecnaCharges','Hand '+number(a.hand,8)+'/8 · Eye '+number(a.eye,8)+'/8');
  text('dmWish','Wish: '+(number(a.wishDaysRemaining)>0?number(a.wishDaysRemaining)+' days remaining':'READY'));
  const root=$('dmOaths');root.replaceChildren();
  const forms=snapshot.oathForms||{};
  for(const [id,name] of [['vigor','Crimson Vigor'],['fury','Crimson Fury'],['overdrive','Crimson Overdrive']]){
    const x=forms[id]||{},box=document.createElement('article');box.className='dm-oath'+(x.active?' active':'');
    const title=document.createElement('h3');title.textContent=name;
    const badge=document.createElement('div');badge.className='dm-pill';badge.textContent=x.active?'✦ ACTIVE':x.used?'USED · REST REQUIRED':'READY';
    const duration=document.createElement('p');duration.textContent=x.active?'Duration: '+number(x.remaining)+' rounds remaining':x.used?'Cannot activate again before rest':'Available when HP condition is met';
    box.append(title,badge,duration);root.append(box);
  }
  fillChips('dmRites',Object.entries(w.rites||{}).map(([name,r])=>({text:name.toUpperCase()+' · '+(r?.type||'none')+' '+status(r?.active),active:!!r?.active})));
  fillChips('dmEffects',(c.effects||[]).map(e=>({text:(e.name||'Curse')+(e.remaining>0?' · '+e.remaining+' turns':''),active:e.active!==false})));
  const brain=c.brain||{};
  text('dmBrain',brain.active?'ACTIVE'+(brain.amplified?' (AMPLIFIED)':'')+' · '+number(brain.storedDamage)+' stored damage':'Inactive · '+number(brain.storedDamage)+' accumulated damage');
}
async function refresh(){
  if(!token||inFlight||!cfg?.url||!cfg?.publishableKey)return;
  inFlight=true;
  try{
    const url=cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/vantyr_observer_read';
    const response=await fetch(url,{method:'POST',cache:'no-store',headers:{'apikey':cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_token:token})});
    const json=await response.json().catch(()=>({}));
    if(!response.ok){const e=new Error(json.message||json.error||'Unable to read VANTYR status');e.status=response.status;throw e;}
    $('dmGate').hidden=true;$('dmDashboard').hidden=false;
    if(json.revision!==lastRevision){lastRevision=json.revision;render(json.snapshot||{});}
    lastUpdate=json.updated_at||null;
    statusAge();
    if(!lastUpdate)connection('stale','● AWAITING FIRST SYNC');
    else if(Date.now()-new Date(lastUpdate).getTime()<15000)connection('live','● LIVE · READ ONLY');
    else connection('stale','● LAST KNOWN STATE');
  }catch(err){
    if(/invalid or revoked viewer link/i.test(err.message)||err.status===403){
      token='';lastRevision=-1;
      try{sessionStorage.removeItem(DM_KEY);localStorage.removeItem(DM_KEY)}catch(e){}
      if(location.hash.includes('token='))history.replaceState(null,'',location.pathname+location.search);
      $('dmDashboard').hidden=true;$('dmGate').hidden=false;
      text('dmGateMessage','This invitation has expired or been revoked. Ask Vantyr’s player for a new private link.');
    }else if($('dmDashboard').hidden){text('dmGateMessage','Could not open observer: '+err.message+'. Ask Vantyr’s player to check the private link and database setup.');}
    else connection('stale','● CONNECTION INTERRUPTED');
  }finally{inFlight=false}
}
function extractInvitation(value){
  const raw=String(value||'').trim();
  if(/^[0-9a-f]{64}$/.test(raw))return raw;
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:'||url.hostname!=='vegesotos.github.io'||
        !/^\/Vantyr-Blood-Codex\/dm\/(?:index\.html)?$/.test(url.pathname))return '';
    const token=new URLSearchParams(url.hash.slice(1)).get('token')||'';
    return /^[0-9a-f]{64}$/.test(token)?token:'';
  }catch(_){return ''}
}
function connect(value){
  const invite=extractInvitation(value);
  if(!invite){
    text('dmGateMessage','Invalid private link. Paste the complete DM invitation URL from Vantyr’s player.');
    return;
  }
  token=invite;
  value=invite;
  try{
    sessionStorage.setItem(DM_KEY,value);
    localStorage.setItem(DM_KEY,value);
  }catch(e){}
  // A fragment never travels to GitHub Pages in the HTTP request.
  // Keep it visible so the same URL can be copied, bookmarked, or reopened.
  if(new URLSearchParams(location.hash.slice(1)).get('token')!==value){
    const url=new URL(location.href);url.hash='token='+value;
    history.replaceState(null,'',url);
  }
  text('dmGateMessage','Checking private invitation…');
  refresh();
}
function wire(){
  const hash=new URLSearchParams(location.hash.substring(1));
  const invitation=hash.get('token');
  if(invitation){connect(invitation)}
  else {
    let previous='';
    try{previous=localStorage.getItem(DM_KEY)||sessionStorage.getItem(DM_KEY)||''}catch(e){}
    if(previous)connect(previous);
    else text('dmGateMessage','No private invitation found. Use the full link shared by Vantyr’s player.');
  }
  $('dmConnect').addEventListener('click',()=>connect($('dmTokenField').value.trim()));
  const forget=$('dmForgetDevice');
  if(forget)forget.addEventListener('click',()=>{
    token='';lastRevision=-1;lastUpdate=null;
    try{sessionStorage.removeItem(DM_KEY);localStorage.removeItem(DM_KEY)}catch(e){}
    history.replaceState(null,'',location.pathname+location.search);
    $('dmDashboard').hidden=true;$('dmGate').hidden=false;
    $('dmTokenField').value='';
    text('dmGateMessage','Private invitation forgotten on this device. You can reopen the full invitation link at any time.');
  });
  setInterval(()=>{if(token)refresh()},pollMs);
  setInterval(statusAge,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();