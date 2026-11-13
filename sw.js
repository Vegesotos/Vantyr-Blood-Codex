const CACHE='vantyr-web-v4-1-phase2-weapon-shortcuts';
const ASSETS=['./','index.html','style.css','mobile.css','concoction.css','observer-ui.css','observer-config.js','observer-sync.js','settings.js','settings.css','phase1.js','phase1.css','phase2.css','initiative-share.js','initiative-share.css','mobile.js','concoction-data.js','concoction.js','app.js','ascendants.js','curses.js','layout.js','spells.js','racial.js','vecna.js','future.js','assets/vantyr-portrait.jpg','assets/hand-eye-vecna.jpg','assets/icon-192.png','assets/icon-512.png','dm/index.html','dm/dm.js','dm/dm.css','dm/initiative.js','dm/initiative.css'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(self.registration.scope.replace(self.location.origin,'')))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  }).catch(()=>caches.match(event.request)));
});
