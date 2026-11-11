import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8');
const assets=['app.js','ascendants.js','curses.js','layout.js','spells.js','racial.js','vecna.js','future.js','mobile.js','concoction-data.js','concoction.js','style.css','mobile.css','concoction.css'];
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
console.log('Verified '+items.length+' crafting recipes, seven tabs, required UI elements, and offline assets.');
