/* File handoff from the isolated tool origin. No account, vault or filesystem API. */
(() => {
  'use strict';
  if(location.hostname!=='pbtool.localhost'||parent===window)return;
  const nonce=new URLSearchParams(location.hash.slice(1)).get('pb-tool');
  async function take(anchor){
    if(!anchor.hasAttribute('download')||!/^(blob:|data:)/.test(anchor.href))return false;
    if(!await window.PBToolAuthorized)return true;
    const blob=await(await fetch(anchor.href)).blob();if(blob.size>80*1024*1024)return true;
    const bytes=await blob.arrayBuffer();
    parent.postMessage({kind:'pb-tool-file',nonce,name:anchor.getAttribute('download')||'file',type:blob.type,bytes},'https://tauri.localhost',[bytes]);return true;
  }
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[download]');
    if(anchor&&/^(blob:|data:)/.test(anchor.href)){event.preventDefault();void take(anchor).catch(()=>{});}
  },true);
  const click=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
    if(this.hasAttribute('download')&&/^(blob:|data:)/.test(this.href)){void take(this).catch(()=>{});return;}
    return click.call(this);
  };
})();
