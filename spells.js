'use strict';
/* Vantyr Blood Codex · Innate spells and Blood Sustenance.
   Each feature has a racial use limit, not a conventional spell slot. */
(() => {
  const SPELLS_KEY = 'vantyr-innate-powers-v23';
  const SPELLS = [
    {id:'suggestion', name:'Suggestion', level:'2nd-level Enchantment', source:'One True Vampire → Crimson Majesty', group:'majesty', timing:'1 Action', range:'30 ft', duration:'Concentration · up to 8 hours', components:'V, M (2014 rules)',
      summary:'Influence one creature that understands you with a reasonable course of action.',
      read:'Choose one creature you can see within 30 feet that can hear and understand you. Present a brief, reasonable course of action that is not obviously harmful. The creature makes a Wisdom save; on failure it follows the suggestion as best it can until it finishes or the spell expires. A creature immune to being charmed is unaffected. Concentration lasts up to 8 hours. The effect ends if you or an ally damages the target.',
      url:'https://dnd5e.wikidot.com/spell:suggestion'},
    {id:'mass', name:'Mass Suggestion', level:'6th-level Enchantment', source:'One True Vampire → Crimson Majesty (level 14+ replacement)', group:'majesty', timing:'1 Action', range:'60 ft', duration:'24 hours · no concentration', components:'V, M (2014 rules)',
      summary:'Suggest a reasonable activity to up to twelve creatures at once.',
      read:'Choose up to twelve visible creatures within 60 feet that can hear and understand you. Each makes a Wisdom saving throw against the reasonable course of action you describe. Creatures that cannot be charmed are immune. Failed targets follow the instruction as best they can for up to 24 hours, ending early if completed. Damage dealt to an affected creature by you or your allies ends the spell for that creature. It does not require concentration.',
      url:'https://dnd5e.wikidot.com/spell:mass-suggestion'},
    {id:'thoughts', name:'Detect Thoughts', level:'2nd-level Divination', source:'One True Vampire → Blood Echo Memory', group:'echo', timing:'1 Action', range:'Self → target within 30 ft', duration:'Concentration · up to 1 minute', components:'None for Vantyr (racial exception)',
      summary:'After your damaging Vampiric Bite, read surface thoughts or probe deeper.',
      read:'You can focus on a thinking creature within 30 feet and read its immediate surface thoughts. You can use an action to probe deeper; the target makes a Wisdom save. On success, the spell ends; on failure, you learn more about its reasoning and emotions. The target knows it was probed. You may shift your attention or search for minds in range. A creature with Intelligence 3 or less or no spoken language is unaffected. Your racial ability waives normal spell components.',
      url:'https://dnd5e.wikidot.com/spell:detect-thoughts'},
    {id:'person', name:'Charm Person', level:'1st-level Enchantment', source:'One True Vampire → Blood Sustenance (Enhanced) → Vampiric Charm', group:'charm', timing:'After Vampiric Bite (racial trigger)', range:'Bite target · standard spell: 30 ft', duration:'1 hour', components:'Racial bite trigger (DM confirms components)',
      summary:'Attempt to charm a humanoid you just fed upon.',
      read:'Charm Person affects a humanoid. The target makes a Wisdom saving throw, with advantage if you or your companions are fighting it. On failure it is charmed and regards you as a friendly acquaintance, until the effect ends or you or your allies harm it. It knows it was charmed when the spell ends. Vantyr’s racial feature allows this attempt after feeding by Vampiric Bite; his racial-use limit is shared with Charm Monster.',
      url:'https://dnd5e.wikidot.com/spell:charm-person'},
    {id:'monster', name:'Charm Monster', level:'4th-level Enchantment', source:'One True Vampire → Blood Sustenance (Enhanced) → Vampiric Charm', group:'charm', timing:'After Vampiric Bite (racial trigger)', range:'Bite target · standard spell: 30 ft', duration:'1 hour', components:'Racial bite trigger (DM confirms components)',
      summary:'Attempt to charm a creature you just fed upon, even if it is not humanoid.',
      read:'Charm Monster affects a creature (rather than only a humanoid). The target makes a Wisdom saving throw with advantage if you or your allies are fighting it. On failure, the target is charmed and friendly to you for up to one hour; harming it ends the effect. It knows it was charmed afterward. Vantyr’s racial version is triggered after Vampiric Bite and shares one long-rest use with Charm Person.',
      url:'https://dnd5e.wikidot.com/spell:charm-monster'}
  ];
  const byId = Object.fromEntries(SPELLS.map(x=>[x.id,x]));
  const defaults = {majesty:true, echo:true, charm:true};
  let uses = {...defaults};
  try {const saved=JSON.parse(localStorage.getItem(SPELLS_KEY)||'null'); if(saved && typeof saved==='object') for (const k of Object.keys(defaults)) if(typeof saved[k]==='boolean') uses[k]=saved[k]}catch(e){console.warn('Innate powers storage unavailable',e)}
  let biteConfirmed=false;
  const $=id=>document.getElementById(id);
  function persist(){try{localStorage.setItem(SPELLS_KEY,JSON.stringify(uses))}catch(e){console.warn('Unable to save innate powers',e)}}
  function dc(){return data.mode==='emperor'?23:20}
  function status(group){return uses[group]?'Ready · 1/1':'Used · 0/1'}
  function inform(message){if(typeof showResultPopup==='function') showResultPopup(message,[]); else window.alert(message)}
  function readSpell(id){const entry=byId[id];if(!entry)return;const dialog=$('spellReadModal');$('spellReadTitle').textContent=entry.name;$('spellReadSource').textContent=entry.source;
    $('spellReadMeta').textContent=`${entry.level} · ${entry.timing} · ${entry.range} · ${entry.duration} · ${entry.components}`;
    $('spellReadText').textContent=entry.read;const link=$('spellReadLink');link.href=entry.url;link.textContent='Open the 2014-era 5e Wikidot spell page';
    if(typeof dialog.showModal==='function') dialog.showModal();else dialog.hidden=false;
  }
  function cast(id){const spell=byId[id];if(!spell || !uses[spell.group]){inform(`${spell?.name||'Spell'} is already used. Complete a Long Rest to restore this racial use.`);return false}
    if((spell.group==='charm'||spell.group==='echo')&&!biteConfirmed){inform(`Confirm a successful damaging Vampiric Bite first to unlock ${spell.name}.`);return false}
    uses[spell.group]=false;persist();/* Keep the confirmed bite available for other separate racial follow-ups. */
    render();const message=`${spell.name} activated · ${spell.source}\nSpell save DC ${dc()} (WIS save when applicable).\n${spell.duration}.\n${spell.summary}\n${status(spell.group)} until Long Rest.`;
    inform(message);return true;
  }
  function render(){const root=$('spellCards');if(!root)return;root.replaceChildren();$('spellDCDisplay').textContent=dc();$('spellFormDisplay').textContent=data.mode==='emperor'?"Emperor's Time":'Normal Form';
    SPELLS.forEach(spell=>{const card=document.createElement('article');card.className='spell-card';const head=document.createElement('div');head.className='spell-head';const text=document.createElement('div');const h=document.createElement('h4');h.textContent=spell.name;const src=document.createElement('small');src.textContent=spell.source;text.append(h,src);const pill=document.createElement('span');pill.className='spell-use-badge'+(uses[spell.group]?'':' used');pill.textContent=status(spell.group);head.append(text,pill);
      const summary=document.createElement('p');summary.textContent=spell.summary;const meta=document.createElement('p');meta.className='spell-meta';meta.textContent=`${spell.level} · ${spell.timing} · ${spell.duration}`;
      const buttons=document.createElement('div');buttons.className='button-row';const use=document.createElement('button');use.className='primary-btn';use.type='button';use.disabled=!uses[spell.group] || ((spell.group==='charm'||spell.group==='echo')&&!biteConfirmed);use.textContent=spell.group==='charm'?'Use after Bite':spell.group==='echo'?'Cast after Bite':'Cast';use.addEventListener('click',()=>cast(spell.id));const read=document.createElement('button');read.className='ghost-btn';read.type='button';read.textContent='Read';read.addEventListener('click',()=>readSpell(spell.id));buttons.append(use,read);
      const tag=document.createElement('div');tag.className='spell-group-note';tag.textContent=spell.group==='majesty'?'Shared use with Suggestion / Mass Suggestion (choose one).':spell.group==='charm'?'Shared with Charm Person / Charm Monster. Requires a confirmed bite.':'Requires a successful damaging bite. Once per Long Rest.';
      card.append(head,summary,meta,buttons,tag);root.append(card)});
    if($('biteCharmDC'))$('biteCharmDC').textContent='DC '+dc();if($('biteCharmPerson'))$('biteCharmPerson').disabled=!uses.charm;if($('biteCharmMonster'))$('biteCharmMonster').disabled=!uses.charm;
    if($('biteCharmPromptStatus'))$('biteCharmPromptStatus').textContent=uses.charm?'Charm is ready · 1/1 per Long Rest.':'Vampiric Charm used · refreshes on Long Rest.';
  }
  function refreshLongRest(){uses={...defaults};biteConfirmed=false;persist();$('biteCharmPrompt').hidden=true;render()}
  function onBite(){biteConfirmed=true;const prompt=$('biteCharmPrompt');prompt.hidden=false;render();}
  function siphon(){if(!biteConfirmed){inform('Confirm a successful Vampiric Bite first.');return}
    const condition=$('bloodhungryCondition').value,availableRaw=$('bloodhungryAvailable').value.trim(),requestedRaw=$('bloodhungryAmount').value.trim();
    if(!condition){inform('Select the affected target condition (Stunned, Grappled, Restrained, or DM-approved Other).');return}
    if(availableRaw===''||!Number.isSafeInteger(Number(availableRaw))||Number(availableRaw)<0){inform('Enter the target’s available HP as a nonnegative whole number.');return}
    const available=Number(availableRaw),missing=Math.max(0,data[data.mode].hp-data.currentHp),maxSiphon=Math.min(available,missing);
    let amount=maxSiphon;if(requestedRaw!==''){
      if(!Number.isSafeInteger(Number(requestedRaw))||Number(requestedRaw)<0){inform('Enter a valid whole-number siphon amount.');return}
      amount=Number(requestedRaw);
      if(amount>maxSiphon){inform(`The maximum available siphon is ${maxSiphon} HP (limited by missing HP and target HP).`);return}
    }
    if(amount===0){inform(`No HP can be siphoned right now. Vantyr is at ${data.currentHp}/${data[data.mode].hp} HP or the target has no available HP.`);return}
    const before=data.currentHp;data.currentHp=Math.min(data[data.mode].hp,data.currentHp+amount);save();renderHp();biteConfirmed=false;$('biteCharmPrompt').hidden=true;render();
    inform(`BLOODHUNGRY BITE · ${condition.toUpperCase()} TARGET\nVantyr healed ${amount} HP: ${before} → ${data.currentHp}/${data[data.mode].hp}.\nTarget suffers ${amount} NECROTIC DAMAGE (flat amount; no dice).\nTarget cannot heal this siphoned HP except through Hit Dice or a Long Rest. Confirm the target's remaining HP with your DM.`);
  }
  function setup(){if(!$('spellCards'))return;
    const modal=document.createElement('dialog');modal.id='spellReadModal';modal.className='spell-read-dialog';modal.innerHTML='<div class="spell-dialog-top"><div><div class="eyebrow">VANTYR · SPELL RULES</div><h3 id="spellReadTitle"></h3><small id="spellReadSource"></small></div><button type="button" class="ghost-btn" id="spellReadClose">✕</button></div><div class="spell-read-meta" id="spellReadMeta"></div><p id="spellReadText"></p><a id="spellReadLink" target="_blank" rel="noopener noreferrer"></a><p class="hint">Concise 2014-era 5e reference; Vantyr’s racial source and usage rules take precedence.</p>';document.body.append(modal);
    $('spellReadClose').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
    document.addEventListener('vantyr:bite-confirmed',onBite);document.addEventListener('vantyr:bite-reset',()=>{biteConfirmed=false;$('biteCharmPrompt').hidden=true;render()});
    document.addEventListener('vantyr:rest',e=>{if(e.detail?.type==='long')refreshLongRest()});document.addEventListener('vantyr:reset-spells',refreshLongRest);
    $('spellLongRest').addEventListener('click',()=>{if(typeof restCurses==='function')restCurses('long');else document.dispatchEvent(new CustomEvent('vantyr:rest',{detail:{type:'long'}}));inform('Long Rest complete. Innate racial spells are ready again.')});
    $('biteCharmPerson').addEventListener('click',()=>cast('person'));$('biteCharmMonster').addEventListener('click',()=>cast('monster'));$('biteCharmSkip').addEventListener('click',()=>{$('biteCharmPrompt').hidden=true});
    $('bloodhungrySiphon').addEventListener('click',siphon);$('bloodhungryMax').addEventListener('click',()=>{const available=Number($('bloodhungryAvailable').value)||0,missing=Math.max(0,data[data.mode].hp-data.currentHp);$('bloodhungryAmount').value=Math.min(Math.max(0,available),missing)});
    render();document.addEventListener('vantyr:hp-updated',render);
    // form mode/ability changes can change the DC and max HP
    document.addEventListener('click',e=>{if(e.target.closest('#modeBtn,#combatBtn,#resetBtn'))queueMicrotask(render)});
  }
  document.addEventListener('DOMContentLoaded',setup);
})();
