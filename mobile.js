"use strict";
// Mobile-only navigation comfort. Core combat logic remains in its original files.
document.addEventListener('DOMContentLoaded',()=>{
  const nav=document.querySelector('.tab-nav');
  if(!nav)return;
  nav.addEventListener('click',e=>{
    const btn=e.target.closest('[data-tab]');if(!btn)return;
    if(window.matchMedia('(max-width:760px)').matches){
      window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));
    }
  });
});

if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}
