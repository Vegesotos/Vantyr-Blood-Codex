import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8');
const assets=['app.js','ascendants.js','curses.js','layout.js','spells.js','racial.js','vecna.js','future.js','mobile.js','concoction-data.js','concoction.js','observer-config.js','observer-sync.js','style.css','mobile.css','concoction.css','observer-ui.css','initiative-share.js','initiative-share.css'];
for(const name of assets){
 assert(fs.existsSync(name),'Missing '+name);
 assert(html.includes(name),'Script or style not loaded: '+name);
}
for(const tab of ['combat','rolls','character','curses','spells','concoction','inventory']){
 assert(html.includes('data-tab="'+tab+'"'),'Missing nav button '+tab);
 assert(html.includes('data-tab-panel="'+tab+'"'),'Missing tab panel '+tab);
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const seen=new Set();
for(const id of ids){assert(!seen.has(id),'Duplicate HTML id '+id);seen.add(id);}
const required=['ccSearch','ccCategories','ccRarities','ccRecipes','ccLab','ccCraftItem','ccCauldron','ccStart','ccArcanaRoll','ccMedicineRoll','ccFinishDialog','ccBagList','ccEditForm','ccFinishAdd'];
for(const id of required)assert(seen.has(id),'Missing crafting element '+id);
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('concoction-data.js','utf8'),sandbox);
const items=sandbox.window.VANTYR_CONCOCTIONS;
assert(Array.isArray(items)&&items.length>=160,'Crafting catalogue incomplete');
for(const r of items)assert(r.name&&r.effect&&r.kit&&r.dc>0,'Invalid recipe entry');
assert.equal(items.find(r=>r.name==='Potion of Continuous Healing').dc,18);
assert.equal(items.find(r=>r.name==='Basic Poison').kit,"Poisoner's Kit");
assert.equal(items.find(r=>r.name==='Potion of Healing').dc,8);
assert.equal(items.find(r=>r.name==='Midnight Oil').dc,12);
const sw=fs.readFileSync('sw.js','utf8');
for(const path of assets)assert(sw.includes(path),'Offline cache missing '+path);

const dm=fs.readFileSync('dm/index.html','utf8');
for(const asset of ['dm/index.html','dm/dm.css','dm/dm.js','dm/initiative.js','dm/initiative.css']){
 assert(fs.existsSync(asset),'Missing DM dashboard asset '+asset);
 assert(sw.includes(asset),'Missing DM offline asset '+asset);
}
assert(dm.includes('dmGate')&&dm.includes('dmDashboard'),'DM access gate or dashboard missing');
assert(dm.includes('dm/dm.js')===false&&dm.includes('src="dm.js"'),'DM script reference incorrect');
for(const name of ['observerSettingsBtn','observerSendEmail','observerNewLink','observerRevoke','observerGeneratedLink']){
 assert(seen.has(name),'Missing owner DM Sync control '+name);
}
const owner=fs.readFileSync('observer-sync.js','utf8'),viewer=fs.readFileSync('dm/dm.js','utf8'),sql=fs.readFileSync('supabase/vantyr_observer_setup.sql','utf8');
assert(owner.includes('crypto.getRandomValues')&&owner.includes('crypto.subtle.digest'),'Strong invitation-link generation missing');
assert(owner.includes('vantyr_observer_push')&&owner.includes('vantyr_observer_rotate'),'Owner RPC actions missing');
assert(viewer.includes('vantyr_observer_read'),'Read-only DM RPC missing');
assert(!viewer.includes('vantyr_observer_push')&&!viewer.includes('vantyr_observer_rotate'),'DM viewer must not implement writes');
const boardJS=fs.readFileSync('dm/initiative.js','utf8');
const shareJS=fs.readFileSync('initiative-share.js','utf8');
const racialJS=fs.readFileSync('racial.js','utf8');
for(const id of ['dmGoInitiative','dmGoCharacter','dmInitiativeView','initiativeAddBtn','initiativeNext','initiativeEntries']){
 assert(dm.includes('id="'+id+'"'),'Missing DM initiative interface '+id);
}
for(const id of ['emperorDice','emperorShareDialog','emperorShareConfirm','emperorAlly']){
 assert(seen.has(id),'Missing player initiative modal '+id);
}
for(const name of ['Kokopelis','Lanfear','Kazeshini','Takis','Mertis','Erdogun'])assert(shareJS.includes(name),'Missing initiative teammate '+name);
assert(boardJS.includes('vantyr_initiative_read')&&boardJS.includes('vantyr_initiative_write'),'Missing initiative board RPC logic');
assert(!boardJS.includes('vantyr_observer_push'),'DM initiative code must not edit character snapshot');
assert(racialJS.includes('vantyr:initiative-rolled'),'Racial initiative must notify assignment modal');
assert(owner.includes('vantyr_initiative_publish'),'Owner-only initiative push missing');
for(const x of ['enable row level security','revoke all on table','vantyr_observer_read','auth.uid()','viewer_token_sha256'])assert(sql.includes(x),'SQL security requirement missing: '+x);
const deploy=fs.readFileSync('.github/workflows/deploy-pages.yml','utf8');
assert(deploy.includes('dm/index.html')&&deploy.includes('dm/*.js'),'GitHub Pages is not deploying DM files');
console.log('Verified '+items.length+' crafting recipes, seven tabs, DM access gate, read-only RPC, Supabase SQL security structure, and offline assets.');
