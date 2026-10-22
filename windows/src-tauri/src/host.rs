use crate::{engine::Engine,win};
use base64::{Engine as _,engine::general_purpose::STANDARD as B64};
use serde_json::{Value,json};
use std::{path::PathBuf,sync::{Arc,Mutex,mpsc,atomic::{AtomicBool,Ordering}},time::Duration};
use tauri::{Manager,WebviewUrl,WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;

pub struct Host {
    pub app:tauri::AppHandle,pub data:PathBuf,pub engine:Mutex<Option<Arc<Engine>>>,
    pub dialog:Mutex<Option<mpsc::Sender<Value>>>,pub dialog_config:Mutex<Value>,
    pub language:Mutex<String>,
    pub offline:AtomicBool,
}
impl Host {
    pub fn new(app:tauri::AppHandle)->Result<Arc<Self>,String>{
        let data=app.path().app_local_data_dir().map_err(|_|"STORAGE_UNAVAILABLE")?;
        win::no_links(&data)?;std::fs::create_dir_all(&data).map_err(|_|"STORAGE_UNAVAILABLE")?;
        Ok(Arc::new(Self{app,data,engine:Mutex::new(None),dialog:Mutex::new(None),dialog_config:Mutex::new(Value::Null),language:Mutex::new("de".into()),offline:AtomicBool::new(true)}))
    }
    pub fn start(self:&Arc<Self>)->Result<(),String>{
        let runtime=self.app.path().resource_dir().map_err(|_|"APP_RUNTIME_UNAVAILABLE")?.join("runtime");
        let engine=Engine::start(&runtime,&self.data,self)?;*self.engine.lock().unwrap()=Some(engine);Ok(())
    }
    pub fn call(&self,plugin:&str,method:&str,mut options:Value)->Result<Value,String>{
        if let Some(lang)=options.get("_language").and_then(Value::as_str){if ["de","en","ru","pl"].contains(&lang){*self.language.lock().unwrap()=lang.into();}}
        if let Some(map)=options.as_object_mut(){map.remove("_language");}
        if serde_json::to_vec(&options).map_err(|_|"INVALID_INPUT")?.len()>2*1024*1024{return Err("INVALID_INPUT".into());}
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
            "folder"=>{
                let selected=self.app.dialog().file().blocking_pick_folder();
                match selected {None=>Ok(json!({"cancelled":true})),Some(file)=>{let path=file.into_path().map_err(|_|"VAULT_FOLDER_UNAVAILABLE")?;win::no_links(&path)?;Ok(json!({"path":path.to_str().ok_or("VAULT_FOLDER_UNAVAILABLE")?}))}}
            }
            "password"|"account"|"key"=>self.show_dialog(method,o),
            "metered"=>Ok(json!({"metered":win::metered()})),
            "volumes"=>Ok(json!({"items":[],"targeted":false})),
            "openVerified"=>{
                let path=PathBuf::from(text("path"));if !path.starts_with(&self.data){return Err("NOT_ALLOWED".into());}win::no_links(&path)?;
                if !path.is_file(){return Err("FILE_UNAVAILABLE".into());}
                win::open(path.to_str().ok_or("FILE_UNAVAILABLE")?)?;Ok(json!({"ok":true}))
            }
            _=>Err("NOT_ALLOWED".into()),
        }
    }
    fn show_dialog(&self,kind:&str,mut config:Value)->Result<Value,String>{
        let (send,receive)=mpsc::channel();
        {let mut current=self.dialog.lock().unwrap();if current.is_some(){return Err("VAULT_BUSY".into());}*current=Some(send.clone());}
        config["kind"]=json!(kind);config["language"]=json!(*self.language.lock().unwrap());*self.dialog_config.lock().unwrap()=config;
        let app=self.app.clone();
        self.app.run_on_main_thread(move||{
            let result=WebviewWindowBuilder::new(&app,"native-dialog",WebviewUrl::App("windows/dialog/index.html".into()))
                .title("Private Brain Pro").inner_size(480.,620.).min_inner_size(360.,420.)
                .use_https_scheme(true).devtools(cfg!(feature="messprobe"))
                .on_navigation(|url|url.scheme()=="https"&&url.host_str()==Some("tauri.localhost")&&url.path()=="/windows/dialog/index.html")
                .on_new_window(|_,_|tauri::webview::NewWindowResponse::Deny).build();
            if result.is_err(){let _=send.send(json!({"cancelled":true}));}
        }).map_err(|_|"VAULT_UNAVAILABLE")?;
        let result=receive.recv_timeout(Duration::from_secs(600)).map_err(|_|"VAULT_CANCELLED".to_owned());
        if let Some(window)=self.app.get_webview_window("native-dialog"){let _=window.close();}
        *self.dialog.lock().unwrap()=None;*self.dialog_config.lock().unwrap()=Value::Null;result
    }
    pub fn event(&self,name:&str,data:Value){
        if let Some(window)=self.app.get_webview_window("main"){
            let detail=json!({"name":name,"data":data});let _=window.eval(format!("window.dispatchEvent(new CustomEvent('pb-native',{{detail:{}}}));",detail));
        }
    }
    pub fn shutdown(&self){if let Some(engine)=self.engine.lock().unwrap().as_ref(){engine.stop();}}
}
