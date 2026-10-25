/* Inlined in the built document head: choose colours before its first paint.
   Reading a preference must never rewrite storage or wait for a native bridge. */
(() => {
  'use strict';
  const root=document.documentElement;
  const colours={klarblau:'#f6f8fc',graphit:'#f7f8fa',petrol:'#f5f9f9',nachtblau:'#111827'};
  const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
  const saved=read('pb_pro_theme_v1');
  const theme=Object.hasOwn(colours,saved)?saved:read('pb_theme')==='dunkel'?'nachtblau':'klarblau';
  root.setAttribute('data-pb-theme',theme);
  if(theme==='nachtblau')root.setAttribute('data-theme','dunkel');else root.removeAttribute('data-theme');
  // The colour meta follows this script in the head; parsing it must not briefly
  // restore the old browser chrome colour before the runtime settings start.
  const apply=()=>document.querySelector('meta[name="theme-color"]')?.setAttribute('content',colours[theme]);
  apply();
  if(!document.querySelector('meta[name="theme-color"]')){
    const observer=new MutationObserver(()=>{if(document.querySelector('meta[name="theme-color"]')){apply();observer.disconnect();}});
    observer.observe(document.head,{childList:true});
  }
})();
