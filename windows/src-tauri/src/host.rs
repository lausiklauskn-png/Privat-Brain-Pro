use crate::{engine::Engine,win};
use base64::{Engine as _,engine::general_purpose::STANDARD as B64};
use serde_json::{Value,json};
use std::{path::PathBuf,sync::{Arc,Mutex,mpsc,atomic::{AtomicBool,Ordering}},time::Duration};
use tauri::{Manager,WebviewUrl,WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;

#[cfg(feature="messprobe")]
pub const BROWSER_ARGS:&str="--disable-features=msWebOOUI,msPdfOOUI --remote-debugging-port=9223 --remote-debugging-address=127.0.0.1";
#[cfg(not(feature="messprobe"))]
pub const BROWSER_ARGS:&str="--disable-features=msWebOOUI,msPdfOOUI";

pub struct Host {
    pub app:tauri::AppHandle,pub data:PathBuf,pub engine:Mutex<Option<Arc<Engine>>>,
    pub dialog:Mutex<Option<mpsc::Sender<Value>>>,pub dialog_config:Mutex<Value>,
    pub language:Mutex<String>,
    pub offline:AtomicBool,
    pub session:String,
}
impl Host {
    pub fn new(app:tauri::AppHandle)->Result<Arc<Self>,String>{
        let data=app.path().app_local_data_dir().map_err(|_|"STORAGE_UNAVAILABLE")?;
        win::no_links(&data)?;std::fs::create_dir_all(&data).map_err(|_|"STORAGE_UNAVAILABLE")?;
        let mut token=[0u8;32];getrandom::fill(&mut token).map_err(|_|"APP_RUNTIME_UNAVAILABLE")?;
        Ok(Arc::new(Self{app,data,engine:Mutex::new(None),dialog:Mutex::new(None),dialog_config:Mutex::new(Value::Null),language:Mutex::new("de".into()),offline:AtomicBool::new(true),session:B64.encode(token)}))
    }
    pub fn start(self:&Arc<Self>)->Result<(),String>{
        let runtime=self.app.path().resource_dir().map_err(|_|"APP_RUNTIME_UNAVAILABLE")?.join("runtime");
        let engine=Engine::start(&runtime,&self.data,self)?;*self.engine.lock().unwrap()=Some(engine.clone());
        if let Err(error)=engine.call("ProDevice","getInfo",json!({})){engine.stop();return Err(error);}Ok(())
    }
    pub fn authorized(&self,request:&tauri::ipc::Request<'_>)->bool {
        let value=request.headers().get("x-pb-session").and_then(|v|v.to_str().ok()).unwrap_or("");
        if value.len()!=self.session.len(){return false;}
        let difference=value.bytes().zip(self.session.bytes()).fold(0u8,|difference,(a,b)|difference|(a^b));
        difference==0&&request.headers().get("origin").is_none_or(|origin|origin.as_bytes()==b"https://tauri.localhost")
    }
    pub fn call(&self,plugin:&str,method:&str,mut options:Value)->Result<Value,String>{
        if let Some(lang)=options.get("_language").and_then(Value::as_str){if ["de","en","ru","pl"].contains(&lang){*self.language.lock().unwrap()=lang.into();}}
        if let Some(map)=options.as_object_mut(){map.remove("_language");}
        if plugin=="ProSpeech"&&method=="inputs"{
            let items=crate::speech::inputs()?;
            return Ok(json!({"items":items.iter().map(|i|json!({"id":i.id,"name":i.name,"default":i.default})).collect::<Vec<_>>()}));
        }
        if plugin=="ProSpeech"&&method=="listen"{
            let language=options.get("language").and_then(Value::as_str).unwrap_or("de-DE").to_owned();
            if !["de-DE","en-US","ru-RU","pl-PL"].contains(&language.as_str()){return Err("INVALID_INPUT".into());}
            // Optional chosen microphone (Klaus 2026-10-27); empty = Windows default as before.
            let input_id=options.get("input").and_then(Value::as_str).unwrap_or("").to_owned();
            let input_name=options.get("inputName").and_then(Value::as_str).unwrap_or("").to_owned();
            if input_id.len()>1024||input_name.len()>512{return Err("INVALID_INPUT".into());}
            let shown=input_name.clone();
            let cancelled=Arc::new(AtomicBool::new(false));let stop=cancelled.clone();
            let worker=Box::new(move|sender:mpsc::Sender<Value>|{
                let result=match crate::speech::recognize(&language,&input_id,&input_name,stop){Ok(Some(text))=>json!({"text":text}),Ok(None)=>json!({"cancelled":true}),Err(code)=>json!({"speechError":code})};
                let _=sender.send(result);
            });
            let result=self.show_dialog_work("speech",json!({"microphone":shown}),Some(worker));cancelled.store(true,Ordering::SeqCst);
            let value=result?;if let Some(code)=value.get("speechError").and_then(Value::as_str){return Err(code.into());}return Ok(value);
        }
        let limit=if (plugin=="ProMail"&&["send","saveDraft"].contains(&method))||(plugin=="ProFiles"&&["open","share","openPdf"].contains(&method)){26*1024*1024}else{2*1024*1024};
        if serde_json::to_vec(&options).map_err(|_|"INVALID_INPUT")?.len()>limit{return Err("INVALID_INPUT".into());}
        if plugin=="ProNetwork"&&method=="setOffline"&&options.get("offline").and_then(Value::as_bool)==Some(true){self.offline.store(true,Ordering::SeqCst);}
        let engine=self.engine.lock().unwrap().clone().ok_or("APP_RUNTIME_UNAVAILABLE".to_owned())?;
        let result=engine.call(plugin,method,options);
        if plugin=="ProNetwork" {if let Ok(value)=&result{if let Some(offline)=value.get("offline").and_then(Value::as_bool){self.offline.store(offline,Ordering::SeqCst);}}}
        result
    }
    pub fn private_call(&self,method:&str,o:Value)->Result<Value,String>{
        let text=|key:&str|o.get(key).and_then(Value::as_str).unwrap_or("");
        match method {
            "protect"|"unprotect"=>{
                let mut bytes=zeroize::Zeroizing::new(B64.decode(text("data")).map_err(|_|"INVALID_INPUT")?);
                if bytes.len()>36*1024*1024||text("binding").len()>512{return Err("INVALID_INPUT".into());}
                let result=win::protect(&bytes,text("binding"),method=="unprotect")?;
                bytes.clear();let result=zeroize::Zeroizing::new(result);Ok(json!({"data":B64.encode(&*result)}))
            }
            "browser"=>{
                let url=tauri::Url::parse(text("url")).map_err(|_|"INVALID_INPUT")?;
                if url.scheme()!="https"||url.host_str()!=Some("accounts.google.com")||url.path()!="/o/oauth2/v2/auth"||!url.username().is_empty()||url.password().is_some(){return Err("NOT_ALLOWED".into());}
                win::open(url.as_str())?;Ok(json!({"ok":true}))
            }
            "external"=>{
                let url=tauri::Url::parse(text("url")).map_err(|_|"LINK_UNAVAILABLE")?;
                if !["https","http"].contains(&url.scheme())||url.host_str().is_none()||!url.username().is_empty()||url.password().is_some(){return Err("LINK_UNAVAILABLE".into());}
                win::open(url.as_str())?;Ok(json!({"ok":true}))
            }
            "folder"=>{
                #[cfg(feature="messprobe")]
                if let Ok(folder)=std::env::var("PB_WINDOWS_TEST_FOLDER"){
                    let path=PathBuf::from(folder);win::no_links(&path)?;
                    if !path.is_dir(){return Err("VAULT_FOLDER_UNAVAILABLE".into());}
                    return Ok(json!({"path":path.to_str().ok_or("VAULT_FOLDER_UNAVAILABLE")?}));
                }
                let selected=self.app.dialog().file().blocking_pick_folder();
                match selected {None=>Ok(json!({"cancelled":true})),Some(file)=>{let path=file.into_path().map_err(|_|"VAULT_FOLDER_UNAVAILABLE")?;win::no_links(&path)?;Ok(json!({"path":path.to_str().ok_or("VAULT_FOLDER_UNAVAILABLE")?}))}}
            }
            "saveLocation"=>{
                let name=text("name");if name.is_empty()||name.len()>512||name.contains(['/', '\\', ':']){return Err("INVALID_INPUT".into());}
                #[cfg(feature="messprobe")]
                if let Ok(folder)=std::env::var("PB_WINDOWS_TEST_SAVE_FOLDER"){
                    let path=PathBuf::from(folder).join(name);win::no_links(&path)?;
                    return Ok(json!({"path":path.to_str().ok_or("FILE_UNAVAILABLE")?}));
                }
                let selected=self.app.dialog().file().set_file_name(name).blocking_save_file();
                match selected {None=>Ok(json!({"cancelled":true})),Some(file)=>{let path=file.into_path().map_err(|_|"FILE_UNAVAILABLE")?;win::no_links(&path)?;Ok(json!({"path":path.to_str().ok_or("FILE_UNAVAILABLE")?}))}}
            }
            "password"|"account"|"key"=>self.show_dialog(method,o),
            "metered"=>Ok(json!({"metered":win::metered()})),
            "volumes"=>Ok(json!({"items":[],"targeted":false})),
            "openVerified"=>{
                let path=PathBuf::from(text("path"));if !path.starts_with(self.data.join("cache/exports")){return Err("NOT_ALLOWED".into());}win::no_links(&path)?;
                if !path.is_file(){return Err("FILE_UNAVAILABLE".into());}
                win::open_document(&path)?;Ok(json!({"ok":true}))
            }
            "scanVerified"=>{
                let path=PathBuf::from(text("path"));if !path.starts_with(self.data.join("cache/exports")){return Err("NOT_ALLOWED".into());}
                win::no_links(&path)?;if !path.is_file(){return Err("FILE_UNAVAILABLE".into());}
                match crate::defender::scan(&path){Ok(value)=>Ok(value),Err(code)if code.starts_with("SCANNER_")=>Ok(json!({"provider":"Microsoft Defender","status":"unavailable","reason":code})),Err(code)=>Err(code)}
            }
            _=>Err("NOT_ALLOWED".into()),
        }
    }
    fn show_dialog(&self,kind:&str,config:Value)->Result<Value,String>{
        self.show_dialog_work(kind,config,None)
    }
    fn show_dialog_work(&self,kind:&str,mut config:Value,work:Option<Box<dyn FnOnce(mpsc::Sender<Value>)+Send>>)->Result<Value,String>{
        let (send,receive)=mpsc::channel();
        {let mut current=self.dialog.lock().unwrap();if current.is_some(){return Err("VAULT_BUSY".into());}*current=Some(send.clone());}
        config["kind"]=json!(kind);config["language"]=json!(*self.language.lock().unwrap());*self.dialog_config.lock().unwrap()=config;
        let worker_send=send.clone();
        let app=self.app.clone();
        let initialization=format!("Object.defineProperty(window,'__PB_DIALOG_SESSION',{{value:{},configurable:true}});",serde_json::to_string(&self.session).unwrap());
        self.app.run_on_main_thread(move||{
            let result=WebviewWindowBuilder::new(&app,"native-dialog",WebviewUrl::App("windows/dialog/index.html".into()))
                .title("Private Brain Pro").inner_size(480.,620.).min_inner_size(360.,420.)
                .use_https_scheme(true).devtools(cfg!(feature="messprobe"))
                .additional_browser_args(BROWSER_ARGS)
                .initialization_script(initialization)
                .on_navigation(|url|url.scheme()=="https"&&url.host_str()==Some("tauri.localhost")&&url.path()=="/windows/dialog/index.html")
                .on_new_window(|_,_|tauri::webview::NewWindowResponse::Deny).build();
            if result.is_err(){let _=send.send(json!({"cancelled":true}));}
            else if let Some(work)=work{std::thread::spawn(move||work(worker_send));}
        }).map_err(|_|"VAULT_UNAVAILABLE")?;
        let result=receive.recv_timeout(Duration::from_secs(600)).map_err(|_|"VAULT_CANCELLED".to_owned());
        if let Some(window)=self.app.get_webview_window("native-dialog"){let _=window.close();}
        *self.dialog.lock().unwrap()=None;*self.dialog_config.lock().unwrap()=Value::Null;result
    }
    pub fn event(&self,name:&str,data:Value){
        #[cfg(feature="messprobe")]
        if name=="Desktop:startupFailure"{
            let _=std::fs::write(self.data.join("engine-probe.txt"),data.to_string());
        }
        let app=self.app.clone();let detail=json!({"name":name,"data":data});
        // Never hold up the protocol reader waiting for the WebView thread.
        let _=self.app.run_on_main_thread(move||{if let Some(window)=app.get_webview_window("main"){
            let _=window.eval(format!("window.dispatchEvent(new CustomEvent('pb-native',{{detail:{}}}));",detail));
        }});
    }
    pub fn shutdown(&self){if let Some(engine)=self.engine.lock().unwrap().as_ref(){engine.stop();}}
    pub fn receive(&self,arguments:Vec<String>,cwd:Option<String>){
        let paths:Vec<Value>=arguments.into_iter().skip(1).filter(|arg|!arg.starts_with('-')).filter_map(|arg|{
            let path=PathBuf::from(arg);let path=if path.is_absolute(){path}else{PathBuf::from(cwd.as_deref().unwrap_or(".")).join(path)};
            if path.is_file()&&win::no_links(&path).is_ok(){path.to_str().map(|s|json!(s))}else{None}
        }).collect();
        if paths.is_empty(){return;}
        let engine=self.engine.lock().unwrap().clone();if let Some(engine)=engine{let _=engine.call("DesktopInternal","receive",json!({"paths":paths}));}
    }
}
