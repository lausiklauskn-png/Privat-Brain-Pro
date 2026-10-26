(() => {
  'use strict';
  if(window!==window.top||location.protocol!=='https:'||location.hostname!=='tauri.localhost'||!['/','/index.html'].includes(location.pathname))return;
  const invoke=window.__TAURI_INTERNALS__?.invoke;if(typeof invoke!=='function')return;
  const TOKEN=__PB_SESSION_TOKEN__;
  const listeners=new Map();
  window.addEventListener('pb-native',event=>{
    for(const listener of listeners.get(event.detail?.name)||[])listener(event.detail.data);
  });
  const plugins={};
  for(const name of ['ProDevice','ProFiles','ProFolders','ProVault','ProMail','ProLinks','ProNetwork','ProProtect','ProSemantic','ProCaption','ProSpeech','ProShare','ProUpdates']){
    plugins[name]=new Proxy(Object.freeze({}),{get(_,method){
      if(method==='then')return undefined;
      if(method==='addListener')return async(event,listener)=>{
        const key=name+':'+event;let callbacks=listeners.get(key);if(!callbacks)listeners.set(key,callbacks=new Set());callbacks.add(listener);
        return{remove:async()=>callbacks.delete(listener)};
      };
      return async(options={})=>{
        try{
          const result=await invoke('pb_call',{plugin:name,method:String(method),options:{...options,_language:document.documentElement?.lang||'de'}},{headers:{'x-pb-session':TOKEN}});
          if(name==='ProNetwork'&&typeof result?.offline==='boolean')window.dispatchEvent(new CustomEvent('pb-host-network',{detail:{offline:result.offline}}));
          return result;
        }
        catch(error){const code=typeof error==='string'?error:error?.code||'APP_RUNTIME_UNAVAILABLE';throw Object.assign(new Error(code),{code});}
      };
    }});
  }
  Object.defineProperty(window,'Capacitor',{value:Object.freeze({Plugins:Object.freeze(plugins),isNativePlatform:()=>true,getPlatform:()=>'windows'}),writable:false,configurable:false});
})();
