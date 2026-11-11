'use strict';
/* VANTYR Concoctions & Inventory — independent browser storage; does not modify combat state. */
(()=>{
  const RECIPES=Array.isArray(window.VANTYR_CONCOCTIONS)?window.VANTYR_CONCOCTIONS:[];
  const KEY='vantyr-concoctions-inventory-v1';
  const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const $=id=>document.getElementById(id);
  const r20=()=>Math.floor(Math.random()*20)+1;
  const kits=["Alchemist's Supplies","Herbalism Kit","Poisoner's Kit","Minor Potions"];
  const tiers=['Common','Uncommon','Rare','Very Rare'];
  let save={lab:false,mute:false,inventory:[]};
  try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object')save={...save,...v,inventory:Array.isArray(v.inventory)?v.inventory:[]};}catch(e){}
  let category=kits[0],rarity='All',search='',active=null,step='select',rolls=null;
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){console.warn('Concoction storage unavailable',e)}};
  const getRecipe=id=>RECIPES[Number(id)]||null;
  const dcName=total=>total>=50?'Masterwork':total>=40?'Double Yield':total>=30?'Efficient Creation':'Below Enhanced Threshold';
  const tierDesc=total=>total>=50?'DC 50 · MASTERWORK. The DM determines the upgraded property.':total>=40?'DC 40 · DOUBLE YIELD. You create 2 copies of the selected item.':total>=30?'DC 30 · EFFICIENT CRAFT. 1 copy, at half the cost and half the time.':'Below DC 30. The normal crafting outcome is decided by your DM; no inventory item is added automatically.';
  const exhaustion=()=>typeof window.exhaustionLevel==='function'?window.exhaustionLevel():(typeof exhaustionLevel==='function'?exhaustionLevel():0);
  const rollMarkup=(roll,bonus,penalty)=>'<strong>'+roll+'</strong> '+(bonus>=0?'+ ':'− ')+Math.abs(bonus)+(penalty?' − '+penalty+' exhaustion':'')+' = <b>'+(roll+bonus-penalty)+'</b>';
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
  function recipeLines(list){
    return list.map(item=>{
      const i=RECIPES.indexOf(item);
      return '<article class="cc-recipe"><div class="cc-recipe-head"><h4>'+h(item.name)+'</h4><span class="cc-dc">Craft DC '+item.dc+'</span></div><p>'+h(item.effect)+'</p><div class="cc-tags"><span>'+h(item.kit)+'</span><span>'+h(item.rarity)+'</span></div><div class="cc-actions"><button type="button" class="ghost-btn cc-craft" data-recipe="'+i+'">⚗ Craft</button></div></article>';
    }).join('');
  }
  function renderRecipes(){
    const filtered=RECIPES.filter(x=>(category==='All'||x.kit===category)&&(rarity==='All'||x.rarity===rarity)&&(!search||(x.name+' '+x.effect+' '+x.kit).toLowerCase().includes(search)));
    $('ccResultCount').textContent=filtered.length+' recipes';
    $('ccRecipes').innerHTML=filtered.length?recipeLines(filtered):'<p class="cc-empty">No matching recipes. Try another name or category.</p>';
    document.querySelectorAll('[data-kit]').forEach(b=>b.classList.toggle('selected',b.dataset.kit===category));
    document.querySelectorAll('[data-rarity]').forEach(b=>b.classList.toggle('selected',b.dataset.rarity===rarity));
  }
  function initFilters(){
    $('ccCategories').innerHTML=['All',...kits].map(k=>'<button type="button" class="cc-filter" data-kit="'+h(k)+'">'+h(k)+'</button>').join('');
    $('ccRarities').innerHTML=['All',...tiers,'Minor'].map(t=>'<button type="button" class="cc-filter" data-rarity="'+h(t)+'">'+h(t)+'</button>').join('');
    $('ccCategories').addEventListener('click',e=>{let b=e.target.closest('[data-kit]');if(b){category=b.dataset.kit;rarity='All';renderRecipes()}});
    $('ccRarities').addEventListener('click',e=>{let b=e.target.closest('[data-rarity]');if(b){rarity=b.dataset.rarity;renderRecipes()}});
    $('ccSearch').addEventListener('input',e=>{search=e.target.value.trim().toLowerCase();renderRecipes()});
    $('ccRecipes').addEventListener('click',e=>{const b=e.target.closest('[data-recipe]');if(b)openCraft(b.dataset.recipe)});
  }
  function renderInventory(){
    const inv=$('ccBagList'),total=save.inventory.reduce((n,x)=>n+Math.max(0,Number(x.quantity)||0),0);
    $('ccBagCount').textContent=save.inventory.length+' entries · '+total+' items';
    if(!save.inventory.length){inv.innerHTML='<p class="cc-empty">Your potion bag is empty. Craft a recipe or add an item manually.</p>';return;}
    inv.innerHTML=save.inventory.map((x,i)=>'<article class="cc-bag-item"><div class="cc-recipe-head"><h4>'+h(x.name)+'</h4><span class="cc-dc">×'+h(x.quantity)+'</span></div><div class="cc-tags"><span>'+h(x.kit||'Custom')+'</span><span>'+h(x.rarity||'Custom')+'</span>'+(x.masterwork?'<span>✦ Masterwork</span>':'')+'</div><p>'+h(x.effect)+'</p>'+(x.note?'<p class="cc-note">DM: '+h(x.note)+'</p>':'')+'<div class="cc-actions"><button type="button" class="ghost-btn" data-edit="'+i+'">Edit</button><button type="button" class="ghost-btn" data-minus="'+i+'">−1</button><button type="button" class="ghost-btn" data-plus="'+i+'">+1</button><button type="button" class="ghost-btn cc-danger" data-remove="'+i+'">Remove</button></div></article>').join('');
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
    selectRecipe(idx);
    document.querySelector('.tab-btn[data-tab="concoction"]')?.click();
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
    rolls={a:r20(),m:null,exhaustion:clamp(exhaustion(),0,6),lab:!!save.lab,total:null};
    step='medicine';craftingSummary();animateCauldron();
    $('ccMedicineRoll').focus();
  }
  function medicine(){
    if(step!=='medicine'||!rolls)return;
    rolls.m=r20();rolls.total=rolls.a+10-rolls.exhaustion+rolls.m+5-rolls.exhaustion+(rolls.lab?10:0);
    step='result';craftingSummary();animateCauldron();
    $('ccFinish').focus();
  }
  function finish(){
    if(!rolls||rolls.m===null)return;
    const item=getRecipe(active);
    $('ccFinishDialogTitle').textContent=rolls.total>=50?'✦ MASTERWORK RESULT':rolls.total>=40?'✦ TWO CONCOCTIONS':rolls.total>=30?'✦ CRAFTING SUCCESS':'CRAFTING OUTCOME · DM CHECK';
    $('ccFinishSummary').textContent=item.name+' — '+tierDesc(rolls.total);
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
    $('ccFinishDialog').hidden=true;
  }
  function wire(){
    initFilters();renderRecipes();renderInventory();syncLab();
    $('ccLab').addEventListener('change',e=>{save.lab=e.target.checked;persist();syncLab();craftingSummary()});
    $('ccMute').checked=!!save.mute;
    $('ccMute').addEventListener('change',e=>{save.mute=e.target.checked;persist()});
    $('ccCraftItem').innerHTML='<option value="">Choose a recipe...</option>'+RECIPES.map((item,i)=>'<option value="'+i+'">'+h(item.name)+' · '+h(item.kit)+'</option>').join('');
    $('ccCraftItem').addEventListener('change',e=>{if(e.target.value===''){active=null;rolls=null;step='select';craftingSummary()}else selectRecipe(e.target.value)});
    $('ccCauldron').addEventListener('click',()=>{animateCauldron();if(active===null){$('ccCraftItem').focus();return}if(step==='select')start()});
    $('ccStart').addEventListener('click',start);
    $('ccArcanaRoll').addEventListener('click',arcana);
    $('ccMedicineRoll').addEventListener('click',medicine);
    $('ccFinish').addEventListener('click',finish);
    $('ccFinishAdd').addEventListener('click',onSaveCraft);
    $('ccFinishClose').addEventListener('click',()=>{$('ccFinishDialog').hidden=true});
    $('ccFinishDialog').addEventListener('click',e=>{if(e.target===$('ccFinishDialog'))$('ccFinishDialog').hidden=true});
    $('ccBagList').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      const action=['edit','minus','plus','remove'].find(x=>b.hasAttribute('data-'+x));if(!action)return;
      const i=Number(b.getAttribute('data-'+action));if(!save.inventory[i])return;
      if(action==='edit')editBag(i);
      if(action==='plus')save.inventory[i].quantity=clamp(Number(save.inventory[i].quantity)+1,1,9999);
      if(action==='minus'){save.inventory[i].quantity--;if(save.inventory[i].quantity<=0)save.inventory.splice(i,1)}
      if(action==='remove'&&window.confirm('Remove '+save.inventory[i].name+' from inventory?'))save.inventory.splice(i,1);
      persist();renderInventory();
    });
    $('ccAddManual').addEventListener('click',newBag);
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
