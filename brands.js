'use strict';
/* Brand of Castigation / Tethering / Axiom: assistive combat tracker.
   Separate local persistence; never changes the character engine or DM's enemy HP. */
(()=>{
 const STORAGE='vantyr-brand-tracker-v1', CHARACTER='vantyr-helper-v14';
 const blank=()=>({available:true,target:'',events:[],counter:0});
 const read=()=>{try{const s=JSON.parse(localStorage.getItem(STORAGE)||'null');return s&&typeof s==='object'?{...blank(),...s,events:Array.isArray(s.events)?s.events.slice(0,25):[]}:blank()}catch{return blank()}};
 const state=read();
 const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch{}};
 const character=()=>{try{return JSON.parse(localStorage.getItem(CHARACTER)||'{}')||{}}catch{return {}}};
 const el=id=>document.getElementById(id);
 const roll4d6=()=>Array.from({length:4},()=>1+Math.floor(Math.random()*6));
 const build=()=>{
  const deck=el('phase1Dashboard'),actions=deck?.querySelector('.p1-actions');
  if(!deck||!actions||el('brandsShortcut'))return;
  const shortcut=document.createElement('button');shortcut.type='button';shortcut.id='brandsShortcut';shortcut.className='p1-action';shortcut.setAttribute('aria-expanded','false');shortcut.setAttribute('aria-controls','brandsPanel');
  shortcut.innerHTML='<span class="brand-icon" aria-hidden="true">♜</span><span class="brand-shortcut-copy"><strong>BRANDS</strong><small>CASTIGATION · TETHERING · AXIOM</small></span><span class="brand-pill" id="brandPill">READY</span>';
  actions.append(shortcut);
  const panel=document.createElement('section');panel.id='brandsPanel';panel.hidden=true;panel.setAttribute('aria-label','Blood Hunter brands');
  panel.innerHTML=`
  <div class="brands-head"><div><div class="brands-kicker">BLOOD HUNTER · MUTAGEN · LEVEL 15</div><h3>♜ The Arcane Brand</h3><p>One brand, three simultaneous effects. Use the controls to track your branded target and resolve triggers with your DM.</p></div><button type="button" id="brandsClose" class="brands-close" aria-label="Close brands">✕</button></div>
  <div class="brands-statline"><div><strong id="brandDamage">14</strong><small>PSYCHIC / TRIGGER</small></div><div><strong id="brandDC">20</strong><small>WISDOM SAVE DC</small></div><div><strong>4d6</strong><small>TELEPORT DAMAGE</small></div></div>
  <div class="brands-grid">
    <div class="brands-card"><div class="brands-kicker">THE MARK</div><div class="brands-value" id="brandTarget">No target branded</div><p class="brands-status" id="brandStatus">Brand available</p>
      <label class="brands-field" for="brandName">Enemy name<input id="brandName" type="text" maxlength="80" placeholder="e.g. The Black Knight" autocomplete="off"></label>
      <label class="brands-check"><input type="checkbox" id="brandRiteConfirmed">I hit and damaged this creature with a weapon while its Crimson Rite was active (confirm the attack first).</label>
      <div class="brands-buttons"><button type="button" id="brandApply" class="primary">♜ Brand Enemy</button><button type="button" id="brandDismiss">Dismiss Brand</button></div>
      <div class="brands-buttons"><button type="button" id="brandRest" class="gold">↻ Short / Long Rest Recharge</button></div>
      <p class="brands-muted">Applying a new brand ends the previous one. Dismissing a brand does not restore the use. A short or long rest recharges this feature.</p>
    </div>
    <div class="brands-card"><div class="brands-kicker">QUICK TRIGGERS</div>
      <p><strong>Retaliation.</strong> The branded enemy damages you or a creature you can see within 5 ft of you. No reaction required.</p>
      <div class="brands-buttons"><button type="button" id="brandRetaliate" class="primary">🩸 Apply Psychic Damage</button></div>
      <p><strong>Tethering.</strong> The branded enemy cannot Dash. Teleportation or planar travel causes 4d6 psychic damage and a Wisdom save; failure prevents the attempt.</p>
      <div class="brands-buttons"><button type="button" id="brandTeleport" class="gold">✦ Teleport Attempt · 4d6</button></div>
      <p><strong>Axiom.</strong> The brand ends illusions/invisibility at application. Forced true-form reveal and later shapechanging attempts may require a Wisdom save; failure stuns until the end of your next turn.</p>
      <div class="brands-buttons"><button type="button" id="brandAxiom">◈ Axiom · WIS Save Prompt</button></div>
      <p class="brands-muted">Damage totals and outcomes are displayed for the DM. No enemy HP is changed automatically.</p>
    </div>
  </div>
  <div id="brandFeedback" class="brands-feedback" role="status" aria-live="polite">Ready. Confirm your active Crimson Rite and weapon hit before applying the brand.</div>
  <div class="brands-subtitle">Brand abilities · Full reference</div>
  <div class="brands-rules">
    <details><summary>♜ Brand of Castigation · Level 6</summary><div class="brands-rule-body"><p>Once per short or long rest, when you damage a creature using a weapon with an active Crimson Rite, you can brand it without an action. You always know its direction while on the same plane. Each time it damages you or a creature you can see within 5 feet of you, it takes psychic damage equal to your Hemocraft modifier (minimum 1).</p><p>The brand lasts until dismissed, replaced, or dispelled. Dispel Magic treats it as a spell of level half your Blood Hunter level (maximum 9): at level 15, level 7.</p></div></details>
    <details><summary>⛓ Brand of Tethering · Level 13</summary><div class="brands-rule-body"><p>Castigation psychic damage becomes twice your Hemocraft modifier (minimum 2). The branded creature cannot take the Dash action. If it tries to teleport or leave its plane by any means, it takes 4d6 psychic damage and must make a Wisdom save; on failure, the attempt fails.</p></div></details>
    <details><summary>◈ Brand of Axiom · Mutagen · Level 11</summary><div class="brands-rule-body"><p>Branding ends invisibility and illusion effects on the creature; those effects cannot benefit it while branded. A creature branded in an alternate form must succeed on a Wisdom save or revert to its true form and be stunned until the end of your next turn. When the branded creature attempts to alter its form, it must succeed on a Wisdom save or the attempt fails and it is stunned until the end of your next turn.</p></div></details>
  </div>
  <div class="brands-subtitle">Event history</div><ul id="brandLog" class="brands-log" aria-label="Brand event history"></ul>
  `;
  deck.after(panel);
  const feedback=msg=>{el('brandFeedback').textContent=msg;panel.classList.remove('brands-event');void panel.offsetWidth;panel.classList.add('brands-event')};
  const num=(x,fallback)=>Number.isFinite(Number(x))?Number(x):fallback;
  const stats=()=>{
   const d=character(),mode=d.mode==='emperor'?'emperor':'normal';
   const int=num(d[mode]?.stats?.INT,mode==='emperor'?31:24);
   const hem=Math.floor((int-10)/2);
   const dc=num(d[mode]?.spellDC,mode==='emperor'?23:20);
   return {hem,damage:Math.max(2,2*hem),dc};
  };
  const event=(message)=>{state.counter=(state.counter||0)+1;state.events.unshift({n:state.counter,message});state.events=state.events.slice(0,25);save();render()};
  function render(){
   const {hem,damage,dc}=stats();
   el('brandDamage').textContent=String(damage);el('brandDC').textContent=String(dc);
   el('brandTarget').textContent=state.target||'No target branded';
   el('brandStatus').textContent=state.target?'BRANDED · '+(state.available?'RESTED':'USE EXPENDED'):(state.available?'BRAND READY':'BRAND EXPENDED · REST TO RECHARGE');
   el('brandPill').textContent=state.target?'ACTIVE':state.available?'READY':'SPENT';
   el('brandApply').disabled=!state.available;
   el('brandDismiss').disabled=!state.target;
   for(const id of ['brandRetaliate','brandTeleport','brandAxiom'])el(id).disabled=!state.target;
   const log=el('brandLog');log.replaceChildren();
   if(!state.events.length){const li=document.createElement('li');li.textContent='No events yet.';log.append(li)}
   state.events.forEach(x=>{const li=document.createElement('li');li.textContent='#'+x.n+' · '+x.message;log.append(li)});
   if(el('brandFeedback').dataset.first!=='done')el('brandFeedback').dataset.first='done';
  }
  const show=open=>{panel.hidden=!open;shortcut.setAttribute('aria-expanded',String(open));if(open){render();panel.scrollIntoView({behavior:'smooth',block:'start'})}};
  shortcut.addEventListener('click',()=>show(panel.hidden));
  el('brandsClose').addEventListener('click',()=>show(false));
  el('brandApply').addEventListener('click',()=>{
   const name=el('brandName').value.trim();
   if(!name){feedback('Enter the enemy name before applying the brand.');return}
   if(!state.available){feedback('Brand already used. Recharge with a short or long rest before branding a new creature.');return}
   if(!el('brandRiteConfirmed').checked){feedback('Confirm a successful damaging weapon hit with an active Crimson Rite first.');return}
   state.target=name;state.available=false;el('brandRiteConfirmed').checked=false;
   event('Branded '+name+' · Castigation + Tethering + Axiom applied. Illusions/invisibility end; check alternate form for a Wisdom save against DC '+stats().dc+'.');
   feedback(name+' branded. No action required. Dash prohibited; track direction on the same plane.');
  });
  el('brandDismiss').addEventListener('click',()=>{
   if(!state.target)return;
   const name=state.target;state.target='';event('Dismissed brand on '+name+'.');feedback('Brand dismissed. This does not refund the use.');
  });
  el('brandRest').addEventListener('click',()=>{
   state.available=true;event('Brand of Castigation recharged after a short or long rest.');
   feedback('Brand use restored. Existing target remains branded until dismissal, replacement, or dispelling.');
  });
  el('brandRetaliate').addEventListener('click',()=>{
   if(!state.target)return;
   const {damage}=stats();event('Retaliation against '+state.target+': '+damage+' psychic damage (DM applies).');
   feedback(state.target+' takes '+damage+' psychic damage. Trigger: it damaged you or a visible creature within 5 ft of you. No reaction required.');
  });
  el('brandTeleport').addEventListener('click',()=>{
   if(!state.target)return;
   const dice=roll4d6(),total=dice.reduce((a,b)=>a+b,0),dc=stats().dc;
   event('Teleport/planar attempt: '+dice.join('+')+' = '+total+' psychic damage; Wisdom DC '+dc+' to avoid cancellation.');
   feedback(state.target+' takes '+total+' psychic damage (4d6: '+dice.join(' + ')+'). Wisdom save DC '+dc+'. On failure, teleport/planar escape fails. DM resolves the save.');
  });
  el('brandAxiom').addEventListener('click',()=>{
   if(!state.target)return;
   const dc=stats().dc;
   event('Axiom triggered: '+state.target+' Wisdom save DC '+dc+' · DM resolves.');
   feedback('Wisdom save DC '+dc+'. On failure: forced true-form reveal or attempted shapechange fails, and '+state.target+' is stunned until the end of your next turn. When first branded, invisibility/illusions end automatically.');
  });
  // Follow Vantyr's authoritative form data without modifying the game state.
  const mode=el('modeLabel');if(mode)new MutationObserver(render).observe(mode,{childList:true,characterData:true,subtree:true});
  render();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
