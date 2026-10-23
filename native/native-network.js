/* App-only internet switch. Local assets, accounts and drafts remain available. */
(() => {
  'use strict';
  let offline=true,ready=false;
  const active=new Set();
  // Modul 03's library address is answered from the APK by MainActivity, never by the internet.
  const BUNDLED='https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
  const isRemote=value=>{try{const u=new URL(value,location.href);if(u.href===BUNDLED||u.href.startsWith(BUNDLED+'/'))return false;if(window.Capacitor?.getPlatform?.()==='windows'&&!u.port&&((['http:','https:'].includes(u.protocol)&&u.hostname==='ipc.localhost')||(u.protocol==='https:'&&u.hostname==='pbmodel.localhost'&&u.pathname.startsWith('/models/Xenova/multilingual-e5-small/'))))return false;return /^(https?|wss?):$/.test(u.protocol)&&u.origin!==location.origin;}catch{return true;}};
  const blocked=()=>new DOMException('APP_OFFLINE','NetworkError');
  function check(value){if(isRemote(value)&&(!ready||offline))throw blocked();}
  function apply(value){
    const changed=offline!==value;offline=value;ready=true;
    if(offline){for(const close of [...active]){try{close();}catch{}}active.clear();}
    document.documentElement.dataset.appOffline=String(offline);
    dispatchEvent(new CustomEvent('pb:network',{detail:{offline}}));
    if(changed)dispatchEvent(new Event(offline?'offline':'online'));
  }
  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,options){
    const url=input instanceof Request?input.url:input;check(url);
    if(!isRemote(url))return originalFetch(input,options);
    const controller=new AbortController(),signal=options?.signal||(input instanceof Request?input.signal:null);
    const abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
    active.add(abort);
    const cleanup=()=>{active.delete(abort);signal?.removeEventListener('abort',abort);};
    try{
      const response=await originalFetch(input,{...options,signal:controller.signal});
      if(!response.body){cleanup();return response;}
      const reader=response.body.getReader();
      const body=new ReadableStream({
        async pull(stream){try{const next=await reader.read();if(next.done){cleanup();stream.close();}else stream.enqueue(next.value);}catch(error){cleanup();stream.error(error);}},
        cancel(reason){cleanup();return reader.cancel(reason);}
      });
      const wrapped=new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
      for(const key of ['url','type','redirected'])Object.defineProperty(wrapped,key,{value:response[key]});
      return wrapped;
    }catch(error){cleanup();throw error;}
  };
  const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send,urls=new WeakMap();
  XMLHttpRequest.prototype.open=function(method,url,...rest){urls.set(this,url);return open.call(this,method,url,...rest);};
  XMLHttpRequest.prototype.send=function(...args){
    const url=urls.get(this);check(url);
    if(isRemote(url)){const close=()=>this.abort();active.add(close);this.addEventListener('loadend',()=>active.delete(close),{once:true});}
    return send.apply(this,args);
  };
  for(const name of ['WebSocket','EventSource','RTCPeerConnection']){
    const Original=window[name];if(!Original)continue;
    window[name]=class extends Original{
      constructor(...args){
        if(!ready||offline)throw blocked();super(...args);
        const close=()=>this.close();active.add(close);
        if(name==='RTCPeerConnection')this.addEventListener('connectionstatechange',()=>{if(this.connectionState==='closed')active.delete(close);});
        else this.addEventListener(name==='EventSource'?'error':'close',()=>{if(this.readyState===Original.CLOSED)active.delete(close);});
      }
      close(...args){return super.close(...args);}
    };
  }
  const beacon=navigator.sendBeacon?.bind(navigator);
  if(beacon)navigator.sendBeacon=(url,data)=>{if(isRemote(url)&&(!ready||offline))return false;return beacon(url,data);};
  const init=async()=>{
    const plugin=window.Capacitor?.Plugins?.ProNetwork;
    if(plugin){const state=await plugin.getState();if(typeof state?.offline!=='boolean')throw blocked();apply(state.offline);}
    else if(!window.Capacitor?.isNativePlatform?.())apply(false);
  };
  const initialized=new Promise(resolve=>{
    const start=()=>{init().catch(()=>{offline=true;ready=false;}).finally(resolve);};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  });
  let changing=false;
  window.PBNetwork={
    get offline(){return offline;},get ready(){return ready;},initialized,
    async setOffline(value){
      if(typeof value!=='boolean'||changing)throw blocked();await initialized;changing=true;
      const was=offline;
      // Stop browser work immediately; allow it again only after native confirmation.
      if(value)apply(true);
      try{
        const plugin=window.Capacitor?.Plugins?.ProNetwork;
        if(plugin){const state=await plugin.setOffline({offline:value});if(state?.offline!==value)throw blocked();}
        else if(window.Capacitor?.isNativePlatform?.())throw blocked();
        apply(value);
      }catch(error){
        try{const actual=await window.Capacitor?.Plugins?.ProNetwork?.getState();if(typeof actual?.offline==='boolean')apply(actual.offline);else if(!was&&value)apply(true);}
        catch{apply(true);}
        throw error;
      }
      finally{changing=false;}
    }
  };
})();
