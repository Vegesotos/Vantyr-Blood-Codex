import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
async function selectMobileTab(tab){
  const target=page.locator('#phase1BottomNav [data-go-tab="'+tab+'"]');
  if(['curses','spells','inventory'].includes(tab)){
    await page.locator('#p1More').click();
  }
  await target.click();
  await page.locator('#tab-'+tab).waitFor({state:'visible'});
}

// Settings must be accessible on mobile without scattering risky controls.
assert.equal(await page.locator('#phase1Dashboard').isVisible(),true,'Phase 1 combat dashboard should show on mobile');
assert.equal(await page.locator('#phase1BottomNav').isVisible(),true,'Phase 1 bottom navigation should show');
assert.match(await page.locator('#p1HpText').innerText(),/178/,'Vitality should mirror the existing character sheet');
assert.equal(await page.locator('#p1NextTurn').isDisabled(),true,'End turn should be disabled outside combat');
await page.locator('#p1CombatToggle').click();
if(await page.locator('#futureSetDialog').isVisible())await page.locator('#futureSetNo').click();
if(await page.locator('#rollModal').isVisible())await page.locator('#modalClose').click();
assert.equal(await page.locator('#p1NextTurn').isEnabled(),true,'Dashboard start combat must trigger original combat engine');
await page.locator('#p1NextTurn').click();
assert.match(await page.locator('#p1Turn').innerText(),/2/,'Dashboard end turn should advance the original turn counter');
if(await page.locator('#rollModal').isVisible())await page.locator('#modalClose').click();
await page.locator('#p1CombatToggle').click();
assert.equal(await page.locator('#p1NextTurn').isDisabled(),true);
assert.equal(await page.locator('#codexSettings').evaluate(x=>x.open),false);
await page.locator('#codexSettings > summary').click();
assert.equal(await page.locator('#resetBtn').isVisible(),true,'Reset Values must be accessible on mobile');
assert.equal(await page.locator('#observerSettingsBtn').isVisible(),true,'DM Sync must be in Settings');
assert.equal(await page.locator('#developerModeBtn').isVisible(),true,'Dev Mode must be in Settings');
await page.locator('#developerModeBtn').click();
assert.equal(await page.locator('#codexSettings').evaluate(x=>x.open),false,'Settings should close after choosing a control');
assert.equal(await page.locator('#developerModeBtn').getAttribute('aria-pressed'),'true');
await page.locator('#codexSettings > summary').click();
await page.locator('#developerModeBtn').click();
assert.equal(await page.locator('#developerModeBtn').getAttribute('aria-pressed'),'false');
await page.locator('#codexSettings > summary').click();
await page.locator('.brand').click();
assert.equal(await page.locator('#codexSettings').evaluate(x=>x.open),false,'Outside tap should close Settings');
assert.equal(await page.locator('#ascendantTracker').evaluate(x=>x.open),false,'Oath Forms should start collapsed');
await page.locator('#ascendantTracker > summary').click();
assert.equal(await page.locator('#ascendantTracker').evaluate(x=>x.open),true);
await page.locator('#ascendantTracker > summary').click();
assert.equal(await page.locator('.hero #ccInspTotal').count(),1,'Inspiration must be in the character portrait header');
assert.equal(await page.locator('#exhaustionPanel').count(),1);
assert.equal(await page.locator('#tab-combat #paralysisDistance').count(),1,'Paralysis distance belongs to Combat tracker');
assert.equal(await page.locator('#tab-combat #targetIsParalyzed').count(),1,'Paralysis target must not be duplicated');
await page.locator('.cc-weapons-fold').first().locator(':scope > summary').click();
assert.equal(await page.locator('#combatWeapons').isVisible(),true);
await selectMobileTab('rolls');
assert.equal(await page.locator('#ccSavingFold').evaluate(x=>x.open),false);
await page.locator('#ccSavingFold > summary').click();
assert.equal(await page.locator('#saves').isVisible(),true);
await page.locator('#skillsSection > summary').click();
assert.equal(await page.locator('#skills').isVisible(),true);
await selectMobileTab('concoction');
await page.locator('#ccResultCount').waitFor();
const count=await page.locator('#ccResultCount').innerText();
assert.equal(count,'169 recipes');
await page.locator('#ccSearch').fill('Potion of Hea');
await page.locator('#ccSuggestions [data-suggest]').first().waitFor({state:'visible'});
await page.locator('#ccResultCount').click();
assert.equal(await page.locator('#ccSuggestions').isVisible(),false,'Concoction suggestions should dismiss on outside tap');
assert.equal(await page.locator('#ccSearch').inputValue(),'Potion of Hea','Dismissing suggestions must preserve typed search');
await page.locator('#ccSearch').click();
await page.locator('#ccSuggestions [data-suggest]').first().waitFor({state:'visible'});

await page.locator('#ccSuggestions [data-suggest]').filter({hasText:'Potion of Healing'}).first().click();
assert.equal(await page.locator('#ccSearch').inputValue(),'Potion of Healing');
await page.locator('.cc-catalogue-fold > summary').click();
const item=page.locator('#ccRecipes .cc-recipe').filter({hasText:'Potion of Healing'}).first();
await item.getByRole('button',{name:/Craft/}).click();
assert.equal(await page.locator('#ccCauldronPanel').getAttribute('open'),'');
assert.match(await page.locator('#ccSelectedRecipe').innerText(),/Potion of Healing/);
await page.locator('#ccLab').check();
await page.locator('input[name="ccRollMode"][value="adv"]').check();
await page.locator('#ccStart').click();
await page.locator('#ccArcanaRoll').click();
assert.match(await page.locator('#ccSelectedResult').innerText(),/Advantage/);
await page.locator('input[name="ccRollMode"][value="dis"]').check();
await page.locator('#ccMedicineRoll').click();
await page.locator('#ccFinishDialog').waitFor({state:'visible'});
assert.match(await page.locator('#ccFinishSummary').innerText(),/Potion of Healing/);
assert.match(await page.locator('#ccFinishSummary').innerText(),/Arcana/);
await page.locator('#ccFinishClose').click();
assert.equal(await page.locator('#ccStart').isVisible(),true);
await page.locator('#ccStart').click();
await page.locator('#ccArcanaRoll').click();
await page.locator('#ccMedicineRoll').click();
await page.locator('#ccFinishDialog').waitFor({state:'visible'});
await page.locator('#ccFinishAdd').click();
await selectMobileTab('inventory');
assert.match(await page.locator('#ccBagCount').innerText(),/items/);
await page.locator('#ccBagOpen').click();
assert.equal(await page.locator('#ccBagContents').isVisible(),true);
await page.locator('#ccGoldInput').fill('175');
await page.locator('#ccGoldAdd').click();
assert.match(await page.locator('#ccGoldAmount').innerText(),/175/);
await page.locator('#ccGoldInput').fill('30');
await page.locator('#ccGoldMinus').click();
assert.equal(await page.locator('#ccGoldAmount').innerText(),'145');
await page.locator('#ccBagClose').click();
assert.equal(await page.locator('#ccBagContents').isVisible(),false);
await page.locator('#ccBagOpen').click();
const bagItem=page.locator('.cc-bag-item').filter({hasText:'Potion of Healing'}).first();
await bagItem.locator(':scope > summary').click();
if(!await bagItem.evaluate(x=>x.open))await bagItem.locator(':scope > summary').click();
await bagItem.getByRole('button',{name:'Edit'}).click();
await page.locator('#ccEditQuantity').fill('3');
await page.locator('#ccEditNote').fill('DM says it glows red');
await page.locator('#ccEditForm button[type="submit"]').click();
await page.reload({waitUntil:'networkidle'});
await selectMobileTab('inventory');
await page.locator('#ccBagOpen').click();
assert.equal(await page.locator('#ccGoldAmount').innerText(),'145');
assert.match(await page.locator('#ccBagList').innerText(),/×3/);
const persistedItem=page.locator('.cc-bag-item').filter({hasText:'Potion of Healing'}).first();
await persistedItem.locator('summary').click();
assert.match(await persistedItem.innerText(),/DM says it glows red/);
await selectMobileTab('combat');
await page.locator('#ccInspPlus').click();
await page.locator('#ccInspPlus').click();
assert.match(await page.locator('#ccInspTotal').innerText(),/2 \/ 10/);
await page.reload({waitUntil:'networkidle'});
assert.match(await page.locator('#ccInspTotal').innerText(),/2 \/ 10/);
const tabs=await page.locator('.tab-nav .tab-btn').count();
assert.equal(tabs,7);
assert.equal(errors.length,0,'Page JS errors: '+errors.join('; '));
// DM Observer: no token means no data and no unprotected read.
const dmPage=await browser.newPage({viewport:{width:390,height:844}});
const dmErrors=[];
dmPage.on('pageerror',e=>dmErrors.push(e.message));
await dmPage.goto('http://127.0.0.1:8765/dm/',{waitUntil:'networkidle'});
assert.equal(await dmPage.locator('#dmGate').isVisible(),true,'DM gate should block users without a link');
assert.equal(await dmPage.locator('link[rel="manifest"]').getAttribute('href'),'manifest.webmanifest','iPhone DM PWA manifest must be installed');
assert.equal(await dmPage.locator('#dmDashboard').isVisible(),false,'Private status must remain hidden');
await dmPage.locator('.dm-manual-entry > summary').click();
await dmPage.locator('#dmTokenField').fill('not-a-real-token');
await dmPage.locator('#dmConnect').click();
assert.match(await dmPage.locator('#dmGateMessage').innerText(),/Invalid private link/);
assert.equal(await dmPage.locator('#dmDashboard').isVisible(),false);

const exampleSnapshot={
  combat:{active:true,turn:4,form:'Normal'},
  vitals:{hp:124,maxHp:178,tempHp:12,ac:22,exhaustion:1},
  bloodMagic:{charges:2,freeCorrosion:false,squelchingReady:true,silenceReady:true,effects:[],brain:{active:false,storedDamage:0}},
  future:{foresightDice:4,absoluteFailures:2,absoluteSuccesses:3,futureSetActive:false,futureSetUsed:false},
  weapons:{starshotCharges:1,constellations:{balance:0,flames:1,rogue:0},rites:{starshot:{type:'dawn',active:true}},paralyzedTurns:0},
  oathForms:{vigor:{active:true,remaining:5},fury:{active:false,used:false},overdrive:{active:false,used:false}},
  vecna:{eye:7,hand:5,wishDaysRemaining:0}
};
const endpoint='**/rest/v1/rpc/vantyr_observer_read';
await dmPage.route(endpoint,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({snapshot:exampleSnapshot,revision:1,updated_at:new Date().toISOString()})}));
await dmPage.locator('#dmTokenField').fill('https://vegesotos.github.io/Vantyr-Blood-Codex/dm/#token='+('a'.repeat(64)));
await dmPage.locator('#dmConnect').click();
await dmPage.locator('#dmDashboard').waitFor({state:'visible'});
assert.equal(await dmPage.locator('#dmHp').innerText(),'124 / 178');
assert.equal(await dmPage.locator('#dmForesight').innerText(),'d6 × 4');
assert.match(await dmPage.locator('#dmConnection').innerText(),/LIVE/);
const inviteUrl=dmPage.url();
assert.match(inviteUrl,/#token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa$/,'Full private link must remain in URL for bookmarking');
await dmPage.reload({waitUntil:'networkidle'});
await dmPage.locator('#dmDashboard').waitFor({state:'visible'});
assert.equal(dmPage.url(),inviteUrl,'Bookmarked URL must survive reload');
await dmPage.goto('http://127.0.0.1:8765/dm/',{waitUntil:'networkidle'});
await dmPage.locator('#dmDashboard').waitFor({state:'visible'});
assert.equal(dmPage.url(),inviteUrl,'DM device should remember private link even when visiting the plain address');

// DM Initiative workspace: independent view, persistent server state, editable ordering.
let initiative={board:{entries:[],round:1,activeId:null},revision:0,updated_at:null};
await dmPage.route('**/rest/v1/rpc/vantyr_initiative_*',async route=>{
 const name=route.request().url();
 const body=route.request().postDataJSON();
 if(name.endsWith('vantyr_initiative_read')){
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(initiative)});
 }
 if(name.endsWith('vantyr_initiative_write')){
  if(Number(body.p_revision)!==initiative.revision)return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({message:'Board changed'})});
  initiative={board:body.p_board,revision:initiative.revision+1,updated_at:new Date().toISOString()};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(initiative.revision)});
 }
 return route.abort();
});
await dmPage.locator('#dmGoInitiative').click();
assert.equal(await dmPage.locator('#dmCharacterView').isVisible(),false,'Initiative must show a clean separate workspace');
assert.equal(await dmPage.locator('#dmInitiativeView').isVisible(),true);
await dmPage.locator('#initiativeAddName').fill('Goblin Scout');
await dmPage.locator('#initiativeAddType').selectOption('enemy');
await dmPage.locator('#initiativeAddScore').fill('18');
await dmPage.locator('#initiativeAddName').press('Enter');
await dmPage.locator('.initiative-entry').first().waitFor({state:'visible'});
assert.equal(await dmPage.locator('.initiative-entry').first().locator('.initiative-name').inputValue(),'Goblin Scout');
assert.equal(initiative.board.entries.length,1,'DM added enemy must persist');
await dmPage.locator('.initiative-entry').first().locator('.initiative-score').fill('28');
await dmPage.locator('.initiative-entry').first().locator('.initiative-score').press('Tab');
for(let i=0;i<50 && initiative.board.entries[0].initiative!==28;i++)await dmPage.waitForTimeout(100);
assert.equal(initiative.board.entries[0].initiative,28,'DM must be able to edit initiative score');
await dmPage.locator('#initiativeAddName').fill('Lanfear');
await dmPage.locator('#initiativeAddScore').fill('35');
await dmPage.locator('#initiativeAddScore').press('Enter');
await dmPage.locator('.initiative-entry').nth(1).waitFor({state:'visible'});
assert.equal(await dmPage.locator('.initiative-entry').first().locator('.initiative-name').inputValue(),'Lanfear','Higher initiatives must be first');
await dmPage.locator('#initiativeNext').click();
await dmPage.locator('.initiative-entry.acting').waitFor({state:'visible'});
assert.equal(initiative.board.activeId,initiative.board.entries.find(e=>e.name==='Lanfear').id);
await dmPage.locator('#dmGoCharacter').click();
assert.equal(await dmPage.locator('#dmCharacterView').isVisible(),true,'DM must be able to return to Vantyr status');
await dmPage.unroute('**/rest/v1/rpc/vantyr_initiative_*');
await dmPage.unroute(endpoint);
await dmPage.route(endpoint,route=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Invalid or revoked viewer link'})}));
await dmPage.reload({waitUntil:'networkidle'});
await dmPage.locator('#dmGate').waitFor({state:'visible'});
assert.equal(await dmPage.locator('#dmDashboard').isVisible(),false,'Revoked DM link must hide old private status');
assert.match(await dmPage.locator('#dmGateMessage').innerText(),/expired or been revoked/);
assert.equal(await dmPage.evaluate(()=>localStorage.getItem('vantyr-dm-link')),null,'Revoked invitation should be erased from this device');
assert.equal(new URL(dmPage.url()).hash,'','Revoked invitation must be removed from the URL');

assert.equal(dmErrors.length,0,'DM page JS errors: '+dmErrors.join('; '));
await dmPage.close();
assert.equal(await page.locator('#observerSettingsBtn').count(),1,'Owner DM Sync launcher missing');
await page.locator('#codexSettings > summary').click();
await page.locator('#observerSettingsBtn').click();
assert.equal(await page.locator('#observerSettings').isVisible(),true,'Owner sync dialog should open');
assert.equal(await page.locator('#observerSignedOut').isVisible(),true,'Owner sync should be opt-in');
assert.equal(await page.locator('#observerLinkHint').count(),1,'Owner should have permanent-link guidance');
await page.locator('#observerClose').click();
// Stand by the Emperor: always two advantage dice; can assign the other to a named ally.
await selectMobileTab('combat');
await page.locator('#standByEmperorBtn').click();
assert.equal(await page.locator('#emperorShareDialog').isVisible(),true,'Initiative assignment prompt must open');
assert.equal(await page.locator('.emperor-die-choice').count(),2,'Two rolled d20 faces required');
await page.locator('.emperor-die-choice').first().click();
await page.locator('#emperorShareToggle').click();
await page.locator('#emperorAlly').selectOption('Kokopelis');
await page.locator('#emperorShareConfirm').click();
assert.equal(await page.locator('#emperorShareDialog').isVisible(),false);
const assigned=await page.evaluate(()=>JSON.parse(localStorage.getItem('vantyr-last-initiative-assignment-v1')||'null'));
assert.equal(assigned.ally,'Kokopelis');
assert.equal(assigned.vantyr,assigned.vantyrRaw+assigned.bonus);
assert.equal(assigned.allyInitiative,assigned.allyRaw+assigned.bonus);
assert.equal(errors.length,0,'Page JS errors: '+errors.join('; '));
await page.screenshot({path:'concoction-mobile-smoke.png',fullPage:false});
await browser.close();
console.log('PASS: mobile nav, 169 recipes, search, Craft accordion, two rolls, result dialog, inventory edit + persisted data, no JS errors');
