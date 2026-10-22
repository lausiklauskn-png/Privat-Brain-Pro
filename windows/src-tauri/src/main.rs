#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod engine;
mod host;
mod win;
use host::Host;
use serde_json::{Value,json};
use std::sync::Arc;
use tauri::{Manager,WebviewWindow,WebviewUrl,WebviewWindowBuilder};

#[tauri::command]
async fn pb_call(window:WebviewWindow,host:tauri::State<'_,Arc<Host>>,plugin:String,method:String,options:Value)->Result<Value,String>{
    let url=window.url().map_err(|_|"NOT_ALLOWED")?;
    if window.label()!="main"||url.scheme()!="https"||url.host_str()!=Some("tauri.localhost")||!["/","/index.html"].contains(&url.path()){return Err("NOT_ALLOWED".into());}
    let allowed:Value=serde_json::from_str(include_str!("../../bridge/contracts.json")).map_err(|_|"APP_CONFIGURATION_INVALID")?;
    if !allowed.get(&plugin).and_then(Value::as_array).is_some_and(|methods|methods.iter().any(|m|m.as_str()==Some(&method))){return Err("NOT_ALLOWED".into());}
    let host=host.inner().clone();tauri::async_runtime::spawn_blocking(move||host.call(&plugin,&method,options)).await.map_err(|_|"APP_RUNTIME_UNAVAILABLE".to_string())?
}
#[tauri::command]
fn pb_dialog(window:WebviewWindow,host:tauri::State<'_,Arc<Host>>,action:String,fields:Option<Value>)->Result<Value,String>{
    let url=window.url().map_err(|_|"NOT_ALLOWED")?;
    if window.label()!="native-dialog"||url.scheme()!="https"||url.host_str()!=Some("tauri.localhost")||url.path()!="/windows/dialog/index.html"{return Err("NOT_ALLOWED".into());}
    if action=="config"{return Ok(host.dialog_config.lock().unwrap().clone());}
    let value=match action.as_str(){"cancel"=>json!({"cancelled":true}),"submit"=>fields.unwrap_or(Value::Null),_=>return Err("NOT_ALLOWED".into())};
    if serde_json::to_vec(&value).map_err(|_|"INVALID_INPUT")?.len()>32768{return Err("INVALID_INPUT".into());}
    host.dialog.lock().unwrap().as_ref().ok_or("VAULT_CANCELLED")?.send(value).map_err(|_|"VAULT_CANCELLED")?;Ok(json!({"ok":true}))
}
fn main(){
    tauri::Builder::default().plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app,_,_|{if let Some(window)=app.get_webview_window("main"){let _=window.set_focus();}}))
        .invoke_handler(tauri::generate_handler![pb_call,pb_dialog])
        .setup(|app|{
            let host=Host::new(app.handle().clone()).map_err(std::io::Error::other)?;host.start().map_err(std::io::Error::other)?;app.manage(host);
            let mut window=WebviewWindowBuilder::new(app,"main",WebviewUrl::App("index.html".into()))
                .title("Private Brain Pro").inner_size(1280.,900.).min_inner_size(360.,480.).use_https_scheme(true)
                .devtools(cfg!(feature="messprobe")).disable_drag_drop_handler()
                .initialization_script(include_str!("../../bridge/capacitor-tauri.js"))
                .on_navigation(|url|url.scheme()=="https"&&url.host_str()==Some("tauri.localhost")&&["/","/index.html"].contains(&url.path()))
                .on_new_window(|_,_|tauri::webview::NewWindowResponse::Deny);
            #[cfg(feature="messprobe")] {window=window.additional_browser_args("--remote-debugging-port=9223");}
            window.build()?;Ok(())
        })
        .on_window_event(|window,event|{
            if let tauri::WindowEvent::Destroyed=event {
                if let Some(host)=window.app_handle().try_state::<Arc<Host>>(){
                    if window.label()=="native-dialog"{if let Some(sender)=host.dialog.lock().unwrap().as_ref(){let _=sender.send(json!({"cancelled":true}));}}
                    if window.label()=="main"{host.shutdown();window.app_handle().exit(0);}
                }
            }
        }).run(tauri::generate_context!()).expect("Private Brain Pro konnte nicht starten");
}
