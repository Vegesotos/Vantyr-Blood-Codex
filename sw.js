const CACHE='vantyr-mobile-v3';
const ASSETS=['./','index.html','style.css','mobile.css','mobile.js','app.js','ascendants.js','curses.js','layout.js','spells.js','racial.js','vecna.js','future.js','assets/vantyr-portrait.jpg','assets/hand-eye-vecna.jpg','assets/icon-192.png','assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(result=>result||fetch(event.request)));});
