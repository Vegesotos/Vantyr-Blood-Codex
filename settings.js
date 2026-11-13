'use strict';
/* Settings dropdown retains existing control ids and listeners. */
(()=>{
 function init(){
  const menu=document.getElementById('codexSettings');if(!menu)return;
  document.addEventListener('pointerdown',e=>{
   if(menu.open&&!menu.contains(e.target))menu.open=false;
  });
  menu.addEventListener('click',e=>{
   if(e.target.closest('.codex-settings-action'))menu.open=false;
  });
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus()}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
})();
