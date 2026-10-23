/* Installed before page scripts in every frame. Browser activities close when
   the native app gate turns off; local assets and IPC stay available. */
(() => {
  'use strict';
  let offline=true;const active=new Set(),children=new Map();
  const framesList=()=>Array.from({length:frames.length},(_,i)=>frames[i]);
  const local=value=>{try{const url=new URL(value,location.href);return !/^(https?|wss?):$/.test(url.protocol)||url.origin===location.origin||['tauri.localhost','pbtool.localhost','ipc.localhost'].includes(url.hostname)||(url.protocol==='https:'&&url.hostname==='pbmodel.localhost'&&!url.port&&url.pathname.startsWith('/models/Xenova/multilingual-e5-small/'))||(url.hostname==='cdn.jsdelivr.net'&&url.pathname.startsWith('/npm/@xenova/transformers@2.17.2'));}catch{return false;}};
  const blocked=()=>new DOMException('APP_OFFLINE','NetworkError');
  const check=value=>{if(offline&&!local(value))throw blocked();};
  const send=Function.prototype.call.bind(MessagePort.prototype.postMessage);
  const listen=Function.prototype.call.bind(EventTarget.prototype.addEventListener);
  const stop=Function.prototype.call.bind(Event.prototype.stopImmediatePropagation);
  const originalFetch=fetch.bind(window);
  window.fetch=async(input,options)=>{
    const value=input instanceof Request?input.url:input;check(value);
    if(local(value))return originalFetch(input,options);
    const controller=new AbortController(),signal=options?.signal||(input instanceof Request?input.signal:null),abort=()=>controller.abort();
    active.add(abort);if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
    const done=()=>{active.delete(abort);signal?.removeEventListener('abort',abort);};
    try{
      const response=await originalFetch(input,{...options,signal:controller.signal});if(!response.body){done();return response;}
      const reader=response.body.getReader(),stream=new ReadableStream({async pull(out){try{const next=await reader.read();if(next.done){done();out.close();}else out.enqueue(next.value);}catch(error){done();out.error(error);}},cancel(reason){done();return reader.cancel(reason);}});
      const wrapped=new Response(stream,{status:response.status,statusText:response.statusText,headers:response.headers});for(const key of ['url','type','redirected'])Object.defineProperty(wrapped,key,{value:response[key]});return wrapped;
    }catch(error){done();throw error;}
  };
  const urls=new WeakMap(),open=XMLHttpRequest.prototype.open,xhrSend=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(method,url,...rest){urls.set(this,url);return open.call(this,method,url,...rest);};
  XMLHttpRequest.prototype.send=function(...args){const url=urls.get(this);check(url);if(!local(url)){const abort=()=>this.abort();active.add(abort);this.addEventListener('loadend',()=>active.delete(abort),{once:true});}return xhrSend.apply(this,args);};
  for(const name of ['WebSocket','EventSource','RTCPeerConnection']){
    const Original=window[name];if(!Original)continue;
    const Wrapped=function(...args){
      if(!new.target)throw new TypeError('Use new '+name);
      if(name==='RTCPeerConnection'){if(offline)throw blocked();}else check(args[0]);
      const instance=Reflect.construct(Original,args,new.target),close=()=>instance.close();active.add(close);
      instance.addEventListener(name==='RTCPeerConnection'?'connectionstatechange':'close',()=>{if(name!=='RTCPeerConnection'||instance.connectionState==='closed')active.delete(close);});
      return instance;
    };
    Wrapped.prototype=Original.prototype;Object.defineProperty(Original.prototype,'constructor',{value:Wrapped,configurable:true,writable:true});
    for(const key of ['CONNECTING','OPEN','CLOSING','CLOSED'])if(key in Original)Object.defineProperty(Wrapped,key,{value:Original[key]});
    window[name]=Wrapped;
  }
  // Native assets are updated by the installer. No background page workers or
  // fire-and-forget beacons may outlive an internet-off request.
  if(navigator.sendBeacon)navigator.sendBeacon=()=>false;
  try{if(window.ServiceWorkerContainer)ServiceWorkerContainer.prototype.register=()=>Promise.reject(blocked());}catch{}
  function apply(value){
    offline=Boolean(value);if(offline){for(const close of active){try{close();}catch{}}active.clear();}
    for(const [frame,port]of children){if(framesList().includes(frame))send(port,{offline});else children.delete(frame);}
  }
  listen(window,'message',event=>{
    if(event.data?.kind!=='pb-network-frame'||!event.ports[0]||!framesList().includes(event.source))return;
    for(const frame of children.keys())if(!framesList().includes(frame))children.delete(frame);
    stop(event);if(children.has(event.source))return;
    const port=event.ports[0];children.set(event.source,port);send(port,{offline});
  },true);
  if(window===top){listen(window,'pb-host-network',event=>apply(event.detail.offline));}
  else{
    const channel=new MessageChannel();listen(channel.port1,'message',event=>apply(event.data.offline));channel.port1.start();
    parent.postMessage({kind:'pb-network-frame'},'*',[channel.port2]);
  }
})();
