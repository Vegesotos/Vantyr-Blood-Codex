'use strict';
/* VANTYR Concoctions & Inventory — independent browser storage; does not modify combat state. */
(()=>{
  const RECIPES=Array.isArray(window.VANTYR_CONCOCTIONS)?window.VANTYR_CONCOCTIONS:[];
  const KEY='vantyr-concoctions-inventory-v1';
  const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const $=id=>document.getElementById(id);
  const r20=()=>Math.floor(Math.random()*20)+1;
  const rollCheck=mode=>{const dice=[r20()];if(mode!=='normal')dice.push(r20());return {dice,mode,value:mode==='adv'?Math.max(...dice):mode==='dis'?Math.min(...dice):dice[0]}};
  const getRollMode=()=>document.querySelector('input[name="ccRollMode"]:checked')?.value||'normal';
  const kits=["Alchemist's Supplies","Herbalism Kit","Poisoner's Kit","Minor Potions"];
  const tiers=['Common','Uncommon','Rare','Very Rare'];
  let save={lab:false,mute:false,inventory:[],inspiration:0,inspirationMax:10,gold:0};
  try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object')save={...save,...v,inventory:Array.isArray(v.inventory)?v.inventory:[]};}catch(e){}
  let category='All',rarity='All',search='',active=null,step='select',rolls=null;
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){console.warn('Concoction storage unavailable',e)}};
  const getRecipe=id=>RECIPES[Number(id)]||null;
  const dcName=total=>total>=50?'Masterwork':total>=40?'Double Yield':total>=30?'Efficient Creation':'Below Enhanced Threshold';
  const tierDesc=total=>total>=50?'DC 50 · MASTERWORK. The DM determines the upgraded property.':total>=40?'DC 40 · DOUBLE YIELD. You create 2 copies of the selected item.':total>=30?'DC 30 · EFFICIENT CRAFT. 1 copy, at half the cost and half the time.':'Below DC 30. The normal crafting outcome is decided by your DM; no inventory item is added automatically.';
  const exhaustion=()=>typeof window.exhaustionLevel==='function'?window.exhaustionLevel():(typeof exhaustionLevel==='function'?exhaustionLevel():0);
  const rollMarkup=(roll,bonus,penalty)=>{
    const selected=typeof roll==='number'?roll:roll.value;
    const raw=typeof roll==='number'?String(roll):roll.dice.join(' / ')+(roll.mode==='adv'?' (Advantage → '+selected+')':roll.mode==='dis'?' (Disadvantage → '+selected+')':'');
    return '<strong>'+raw+'</strong> + '+bonus+(penalty?' − '+penalty+' exhaustion':'')+' = <b>'+(selected+bonus-penalty)+'</b>';
  };
  let ctx=null;
  function sound(){
    if(save.mute)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      if(!ctx)ctx=new AC();
      if(ctx.state==='suspended')ctx.resume();
      const start=ctx.currentTime;
      [0,.13,.27,.44].forEach((t,i)=>{
        const osc=ctx.createOscillator(),gain=ctx.createGain();
        osc.type=i%2?'triangle':'sine';
        osc.frequency.setValueAtTime(112+i*39,start+t);
        osc.frequency.exponentialRampToValueAtTime(52+i*16,start+t+.19);
        gain.gain.setValueAtTime(.0001,start+t);
        gain.gain.exponentialRampToValueAtTime(.055,start+t+.025);
        gain.gain.exponentialRampToValueAtTime(.0001,start+t+.21);
        osc.connect(gain).connect(ctx.destination);osc.start(start+t);osc.stop(start+t+.22);
      });
    }catch(e){}
  }
  function animateCauldron(){
    const c=$('ccCauldron');
    if(!c)return;c.classList.remove('cc-boiling');void c.offsetWidth;c.classList.add('cc-boiling');
    sound();
  }
  function syncLab(){
    $('ccLab').checked=!!save.lab;
    $('ccLabText').textContent=save.lab?'+10 Lab bonus ACTIVE':'Personal lab +10 (off)';
  }
  const getMatches=q=>RECIPES.map((item,i)=>({...item,i})).filter(x=>(x.name+' '+x.effect+' '+x.kit+' '+x.rarity).toLowerCase().includes(q.toLowerCase()));
  function suggestions(inputId,boxId,mode){
    const input=$(inputId),box=$(boxId),q=input.value.trim();
    if(!q){box.hidden=true;box.innerHTML='';return;}
    const found=getMatches(q).sort((a,b)=>Number(b.name.toLowerCase().startsWith(q.toLowerCase()))-Number(a.name.toLowerCase().startsWith(q.toLowerCase()))).slice(0,8);
    box.innerHTML=found.length?found.map(x=>'<button type="button" role="option" class="cc-suggestion" data-suggest="'+x.i+'"><b>'+h(x.name)+'</b><small>'+h(x.kit)+' · '+h(x.rarity)+'</small></button>').join(''):'<p>No suggestions found</p>';
    box.hidden=false;
  }
  function recipeLines(list){
    return list.map(item=>{
      const i=RECIPES.indexOf(item);
      return '<article class="cc-recipe"><div class="cc-recipe-head"><h4>'+h(item.name)+'</h4><span class="cc-dc">Craft DC '+item.dc+'</span></div><div class="cc-actions"><button type="button" class="ghost-btn cc-craft" data-recipe="'+i+'">⚗ Craft</button><button type="button" class="ghost-btn" data-read="'+i+'" aria-expanded="false">📜 Read</button></div><div class="cc-recipe-details" id="ccRead-'+i+'" hidden><p>'+h(item.effect)+'</p><div class="cc-tags"><span>'+h(item.kit)+'</span><span>'+h(item.rarity)+'</span></div></div></article>';
    }).join('');
  }
  function renderRecipes(){
    const filtered=RECIPES.filter(x=>(category==='All'||x.kit===category)&&(rarity==='All'||x.rarity===rarity)&&(!search||(x.name+' '+x.effect+' '+x.kit).toLowerCase().includes(search)));
    $('ccResultCount').textContent=filtered.length+' recipes';
    const orderedKits=category==='All'?kits:[category];
    $('ccRecipes').innerHTML=filtered.length?orderedKits.map(kit=>{
      const group=filtered.filter(x=>x.kit===kit);if(!group.length)return '';
      const rarities=kit==='Minor Potions'?['Minor']:tiers;
      return '<details class="cc-kit-directory" '+(category!=='All'||search?'open':'')+'><summary>⚗ '+h(kit)+' <span>'+group.length+' recipes</span></summary>'+
        rarities.map(t=>{
          const sub=group.filter(x=>x.rarity===t);if(!sub.length)return '';
          const dc=sub[0].dc;
          return '<details class="cc-tier-directory" '+(rarity!=='All'||search?'open':'')+'><summary>'+h(t)+' <span>DC '+dc+' · '+sub.length+' items</span></summary><div class="cc-recipe-tiles">'+recipeLines(sub)+'</div></details>';
        }).join('')+'</details>';
    }).join(''):'<p class="cc-empty">No matching recipes. Try another name or category.</p>';
    document.querySelectorAll('[data-kit]').forEach(b=>b.classList.toggle('selected',b.dataset.kit===category));
    document.querySelectorAll('[data-rarity]').forEach(b=>b.classList.toggle('selected',b.dataset.rarity===rarity));
  }
  function initFilters(){
    $('ccCategories').innerHTML=['All',...kits].map(k=>'<button type="button" class="cc-filter" data-kit="'+h(k)+'">'+h(k)+'</button>').join('');
    $('ccRarities').innerHTML=['All',...tiers,'Minor'].map(t=>'<button type="button" class="cc-filter" data-rarity="'+h(t)+'">'+h(t)+'</button>').join('');
    $('ccCategories').addEventListener('click',e=>{let b=e.target.closest('[data-kit]');if(b){category=b.dataset.kit;rarity='All';renderRecipes()}});
    $('ccRarities').addEventListener('click',e=>{let b=e.target.closest('[data-rarity]');if(b){rarity=b.dataset.rarity;renderRecipes()}});
    $('ccSearch').addEventListener('input',e=>{search=e.target.value.trim().toLowerCase();renderRecipes();suggestions('ccSearch','ccSuggestions','catalogue')});
    $('ccRecipes').addEventListener('click',e=>{
      const b=e.target.closest('[data-recipe]');if(b){openCraft(b.dataset.recipe);return;}
      const read=e.target.closest('[data-read]');if(read){
        const target=$('ccRead-'+read.dataset.read);if(target){target.hidden=!target.hidden;read.setAttribute('aria-expanded',String(!target.hidden));read.textContent=target.hidden?'📜 Read':'▴ Hide';}
      }
    });
    $('ccSuggestions').addEventListener('click',e=>{
      const b=e.target.closest('[data-suggest]');if(!b)return;const item=getRecipe(b.dataset.suggest);
      $('ccSearch').value=item.name;search=item.name.toLowerCase();$('ccSuggestions').hidden=true;
      category='All';rarity='All';renderRecipes();
    });
  }
  function renderInventory(){
    if($('ccGoldAmount'))$('ccGoldAmount').textContent=String(Math.max(0,Math.floor(Number(save.gold)||0))).replace(/\B(?=(\d{3})+(?!\d))/g,',');
    const inv=$('ccBagList'),total=save.inventory.reduce((n,x)=>n+Math.max(0,Number(x.quantity)||0),0);
    $('ccBagCount').textContent=save.inventory.length+' entries · '+total+' items';
    if(!save.inventory.length){inv.innerHTML='<p class="cc-empty">Your potion bag is empty. Craft a recipe or add an item manually.</p>';return;}
    inv.innerHTML=save.inventory.map((x,i)=>'<details class="cc-bag-item"><summary><span>'+h(x.name)+'</span><span class="cc-dc">×'+h(x.quantity)+'</span></summary><div class="cc-bag-inner"><div class="cc-tags"><span>'+h(x.kit||'Custom')+'</span><span>'+h(x.rarity||'Custom')+'</span>'+(x.masterwork?'<span>✦ Masterwork</span>':'')+'</div><p>'+h(x.effect)+'</p>'+(x.note?'<p class="cc-note">DM: '+h(x.note)+'</p>':'')+'<div class="cc-actions"><button type="button" class="ghost-btn" data-edit="'+i+'">Edit</button><button type="button" class="ghost-btn" data-minus="'+i+'">−1</button><button type="button" class="ghost-btn" data-plus="'+i+'">+1</button><button type="button" class="ghost-btn cc-danger" data-remove="'+i+'">Remove</button></div></div></details>').join('');
  }
  function bagAdd(item,quantity=1){
    if(!item)return;
    const clean={name:String(item.name||'Custom Item'),effect:String(item.effect||''),kit:String(item.kit||'Custom'),rarity:String(item.rarity||'Custom'),masterwork:!!item.masterwork,note:String(item.note||''),quantity:clamp(quantity,1,9999)};
    const idx=save.inventory.findIndex(x=>x.name===clean.name&&!x.masterwork&&!clean.masterwork&&x.effect===clean.effect&&x.kit===clean.kit);
    if(idx>=0)save.inventory[idx].quantity=clamp(Number(save.inventory[idx].quantity)+Number(clean.quantity),1,9999);
    else save.inventory.push(clean);
    persist();renderInventory();$('ccNotice').textContent='Added '+clean.quantity+' × '+clean.name+' to Inventory.';
  }
  function editBag(i){
    const x=save.inventory[i];if(!x)return;
    $('ccEditTitle').textContent='Edit inventory item';
    $('ccEditIndex').value=String(i);
    ['Name','Effect','Note','Quantity'].forEach(k=>{$('ccEdit'+k).value=k==='Quantity'?x.quantity:(x[k.toLowerCase()]||'')});
    $('ccEditMasterwork').checked=!!x.masterwork;
    $('ccEditDialog').hidden=false;$('ccEditDialog').querySelector('input:not([type=hidden])').focus();
  }
  function newBag(){
    $('ccEditTitle').textContent='Add custom item';
    $('ccEditIndex').value='';['Name','Effect','Note'].forEach(k=>{$('ccEdit'+k).value=''});
    $('ccEditQuantity').value=1;$('ccEditMasterwork').checked=false;
    $('ccEditDialog').hidden=false;$('ccEditName').focus();
  }
  function filterCraftSelect(){
    const q=($('ccCraftFind')?.value||'').trim().toLowerCase();
    const selected=active===null?'':String(active);
    const filtered=RECIPES.map((item,i)=>({item,i})).filter(({item,i})=>!q||(item.name+' '+item.kit+' '+item.effect).toLowerCase().includes(q)||String(i)===selected);
    $('ccCraftItem').innerHTML='<option value="">Choose a recipe...</option>'+filtered.map(({item,i})=>'<option value="'+i+'">'+h(item.name)+' · '+h(item.kit)+'</option>').join('');
    $('ccCraftItem').value=selected;
  }
  function craftingSummary(){
    const item=getRecipe(active);
    if(item){$('ccSelectedRecipe').textContent=item.name+' · '+item.kit+' · '+item.rarity+' (Book DC '+item.dc+')';}
    $('ccCraftQuestion').textContent=step==='select'?'Select a recipe and begin crafting.':step==='arcana'?'Ready to roll Arcana? (1d20 +10)':step==='medicine'?'Arcana recorded. Roll Medicine? (1d20 +5)':step==='result'?'Crafting completed. Check your result below.':'Choose a potion to brew.';
    $('ccArcanaRoll').disabled=step!=='arcana';
    $('ccMedicineRoll').disabled=step!=='medicine';
    $('ccArcanaRoll').hidden=step==='select'||step==='result';
    $('ccMedicineRoll').hidden=step==='select'||step==='result';
    $('ccStart').hidden=step!=='select';
    $('ccFinish').hidden=step!=='result';
    $('ccStart').disabled=active===null;
    $('ccSelectedResult').innerHTML=rolls?
      '<div class="cc-roll-line">Arcana: '+rollMarkup(rolls.a,10,rolls.exhaustion)+'</div>'+
      (rolls.m!==null?'<div class="cc-roll-line">Medicine: '+rollMarkup(rolls.m,5,rolls.exhaustion)+'</div><div class="cc-roll-line">Lab: '+(rolls.lab?'+10':'Off')+'</div><div class="cc-total">TOTAL '+rolls.total+'</div><h4>'+dcName(rolls.total)+'</h4><p>'+tierDesc(rolls.total)+'</p>':''):
      '<p class="cc-muted">Arcana +10 · Medicine +5 · '+(save.lab?'Own Lab +10':'No Lab bonus')+'</p>';
    $('ccCraftItem').value=active===null?'':String(active);
  }
  function selectRecipe(idx){
    const item=getRecipe(idx);if(!item)return;
    active=Number(idx);rolls=null;step='select';craftingSummary();
  }
  function openCraft(idx){
    $('ccCraftFind').value='';$('ccCraftSuggestions').hidden=true;filterCraftSelect();selectRecipe(idx);
    if(!document.querySelector('.tab-btn[data-tab="concoction"]')?.classList.contains('active'))document.querySelector('.tab-btn[data-tab="concoction"]')?.click();
    $('ccCauldronPanel').open=true;
    $('ccCauldronPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
    $('ccStart').focus();
  }
  function start(){
    if(active===null)return;
    step='arcana';rolls=null;craftingSummary();animateCauldron();
    $('ccArcanaRoll').focus();
  }
  function arcana(){
    if(step!=='arcana')return;
    rolls={a:rollCheck(getRollMode()),m:null,exhaustion:clamp(exhaustion(),0,6),lab:!!save.lab,total:null};
    step='medicine';craftingSummary();animateCauldron();
    $('ccMedicineRoll').focus();
  }
  function medicine(){
    if(step!=='medicine'||!rolls)return;
    rolls.m=rollCheck(getRollMode());rolls.total=rolls.a.value+10-rolls.exhaustion+rolls.m.value+5-rolls.exhaustion+(rolls.lab?10:0);
    step='result';craftingSummary();animateCauldron();finish();
  }
  function finish(){
    if(!rolls||rolls.m===null)return;
    const item=getRecipe(active);
    $('ccFinishDialogTitle').textContent=rolls.total>=50?'✦ MASTERWORK RESULT':rolls.total>=40?'✦ TWO CONCOCTIONS':rolls.total>=30?'✦ CRAFTING SUCCESS':'CRAFTING OUTCOME · DM CHECK';
    $('ccFinishSummary').textContent=item.name+' — '+tierDesc(rolls.total)+' Effect: '+item.effect+' Total '+rolls.total+' (Arcana '+(rolls.a.value+10-rolls.exhaustion)+' + Medicine '+(rolls.m.value+5-rolls.exhaustion)+' + Lab '+(rolls.lab?10:0)+').';
    $('ccFinishQty').value=rolls.total>=40&&rolls.total<50?'2':'1';
    $('ccFinishMasterwork').checked=rolls.total>=50;
    $('ccFinishDmNote').value='';
    $('ccFinishAdd').textContent=rolls.total<30?'Add manually (DM approved)':'Add to Inventory';
    $('ccFinishDialog').hidden=false;
  }
  function onSaveCraft(){
    const item=getRecipe(active);if(!item)return;
    const entry={...item,masterwork:$('ccFinishMasterwork').checked,note:$('ccFinishDmNote').value.trim()};
    bagAdd(entry,clamp($('ccFinishQty').value,1,9999));
    $('ccFinishDialog').hidden=true;selectRecipe(active);
  }
  function renderInspiration(){
    save.inspirationMax=clamp(save.inspirationMax||10,1,30);
    save.inspiration=clamp(save.inspiration,0,save.inspirationMax);
    $('ccInspMax').value=save.inspirationMax;
    $('ccInspTotal').textContent=save.inspiration+' / '+save.inspirationMax;
    $('ccInspPips').innerHTML=Array.from({length:save.inspirationMax},(_,i)=>'<button type="button" class="cc-insp-pip '+(i<save.inspiration?'active':'')+'" data-insp="'+(i+1)+'" aria-label="Set inspiration to '+(i+1)+'" aria-pressed="'+(i<save.inspiration)+'"></button>').join('');
  }
  function wireInspiration(){
    renderInspiration();
    $('ccInspMinus').addEventListener('click',()=>{save.inspiration=clamp(save.inspiration-1,0,save.inspirationMax);persist();renderInspiration()});
    $('ccInspPlus').addEventListener('click',()=>{save.inspiration=clamp(save.inspiration+1,0,save.inspirationMax);persist();renderInspiration()});
    $('ccInspMax').addEventListener('change',e=>{save.inspirationMax=clamp(e.target.value,1,30);save.inspiration=clamp(save.inspiration,0,save.inspirationMax);persist();renderInspiration()});
    $('ccInspPips').addEventListener('click',e=>{const b=e.target.closest('[data-insp]');if(b){const n=Number(b.dataset.insp);save.inspiration=save.inspiration===n?n-1:n;persist();renderInspiration()}});
  }
  function wire(){
    initFilters();renderRecipes();renderInventory();syncLab();wireInspiration();
    $('ccLab').addEventListener('change',e=>{save.lab=e.target.checked;persist();syncLab();craftingSummary()});
    $('ccMute').checked=!!save.mute;
    $('ccMute').addEventListener('change',e=>{save.mute=e.target.checked;persist()});
    filterCraftSelect();
    $('ccCraftFind').addEventListener('input',()=>{filterCraftSelect();suggestions('ccCraftFind','ccCraftSuggestions','cauldron')});
    $('ccCraftSuggestions').addEventListener('click',e=>{
      const b=e.target.closest('[data-suggest]');if(!b)return;
      const item=getRecipe(b.dataset.suggest);$('ccCraftFind').value=item.name;
      active=null;filterCraftSelect();selectRecipe(b.dataset.suggest);$('ccCraftSuggestions').hidden=true;
    });
    $('ccCraftItem').addEventListener('change',e=>{if(e.target.value===''){active=null;rolls=null;step='select';craftingSummary()}else {selectRecipe(e.target.value);$('ccCraftSuggestions').hidden=true}});
    $('ccCauldron').addEventListener('click',()=>{animateCauldron();if(active===null){$('ccCraftFind').focus();return}if(step==='select')start()});
    $('ccStart').addEventListener('click',start);
    $('ccArcanaRoll').addEventListener('click',arcana);
    $('ccMedicineRoll').addEventListener('click',medicine);
    $('ccFinish').addEventListener('click',finish);
    $('ccFinishAdd').addEventListener('click',onSaveCraft);
    $('ccFinishClose').addEventListener('click',()=>{$('ccFinishDialog').hidden=true;if(active!==null)selectRecipe(active);$('ccStart').focus()});
    $('ccFinishDialog').addEventListener('click',e=>{if(e.target===$('ccFinishDialog'))$('ccFinishDialog').hidden=true});
    $('ccBagList').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      const action=['edit','minus','plus','remove'].find(x=>b.hasAttribute('data-'+x));if(!action)return;
      const i=Number(b.getAttribute('data-'+action));if(!save.inventory[i])return;
      if(action==='edit')editBag(i);
      if(action==='plus')save.inventory[i].quantity=clamp(Number(save.inventory[i].quantity)+1,1,9999);
      if(action==='minus'){save.inventory[i].quantity--;if(save.inventory[i].quantity<=0)save.inventory.splice(i,1)}
      if(action==='remove'){if(b.dataset.confirmRemove==='yes')save.inventory.splice(i,1);else{b.dataset.confirmRemove='yes';b.textContent='Confirm remove';b.focus();return;}}
      persist();renderInventory();
    });
    $('ccAddManual').addEventListener('click',newBag);
    const toggleBag=(open)=>{
      const bag=$('ccBagContents'),trigger=$('ccBagOpen'),stage=$('ccBagStage');
      bag.hidden=!open;
      trigger.setAttribute('aria-expanded',String(open));
      trigger.setAttribute('aria-label',open?'Close Vantyr\'s Inventory':'Open Vantyr\'s Inventory');
      stage.classList.toggle('cc-bag-open',open);
      trigger.classList.remove('cc-bag-sparkle');void trigger.offsetWidth;
      if(open){trigger.classList.add('cc-bag-sparkle');sound();renderInventory();}
    };
    $('ccBagOpen').addEventListener('click',()=>toggleBag($('ccBagContents').hidden));
    $('ccBagClose').addEventListener('click',()=>toggleBag(false));
    const changeGold=sign=>{
      const amount=Math.floor(Number($('ccGoldInput').value));
      if(!Number.isFinite(amount)||amount<1)return;
      save.gold=Math.max(0,Math.floor(Number(save.gold)||0)+sign*amount);
      persist();renderInventory();
    };
    $('ccGoldAdd').addEventListener('click',()=>changeGold(1));
    $('ccGoldMinus').addEventListener('click',()=>changeGold(-1));
    $('ccEditCancel').addEventListener('click',()=>{$('ccEditDialog').hidden=true});
    $('ccEditDialog').addEventListener('click',e=>{if(e.target===$('ccEditDialog'))$('ccEditDialog').hidden=true});
    $('ccEditForm').addEventListener('submit',e=>{
      e.preventDefault();const index=$('ccEditIndex').value;
      const entry={name:$('ccEditName').value.trim(),effect:$('ccEditEffect').value.trim(),note:$('ccEditNote').value.trim(),quantity:clamp($('ccEditQuantity').value,1,9999),masterwork:$('ccEditMasterwork').checked};
      if(!entry.name)return;
      if(index!==''){const prior=save.inventory[Number(index)];if(!prior)return;save.inventory[Number(index)]={...prior,...entry};}
      else save.inventory.push({kit:'Custom',rarity:'Custom',...entry});
      persist();renderInventory();$('ccEditDialog').hidden=true;
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('ccEditDialog').hidden=true;$('ccFinishDialog').hidden=true}});
    craftingSummary();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);
  else wire();
})();
