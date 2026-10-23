#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod engine;
mod host;
mod win;
mod resources;
mod tools;
use host::Host;
use serde_json::{Value,json};
use std::sync::Arc;
use tauri::{Manager,WebviewWindow,WebviewUrl,WebviewWindowBuilder};

#[tauri::command]
async fn pb_call(window:WebviewWindow,host:tauri::State<'_,Arc<Host>>,request:tauri::ipc::Request<'_>,plugin:String,method:String,options:Value)->Result<Value,String>{
    let url=window.url().map_err(|_|"NOT_ALLOWED")?;
    if !host.authorized(&request)||window.label()!="main"||url.scheme()!="https"||url.host_str()!=Some("tauri.localhost")||!["/","/index.html"].contains(&url.path()){return Err("NOT_ALLOWED".into());}
    let allowed:Value=serde_json::from_str(include_str!("../../bridge/contracts.json")).map_err(|_|"APP_CONFIGURATION_INVALID")?;
    if !allowed.get(&plugin).and_then(Value::as_array).is_some_and(|methods|methods.iter().any(|m|m.as_str()==Some(&method))){return Err("NOT_ALLOWED".into());}
    let host=host.inner().clone();tauri::async_runtime::spawn_blocking(move||host.call(&plugin,&method,options)).await.map_err(|_|"APP_RUNTIME_UNAVAILABLE".to_string())?
}
#[tauri::command]
fn pb_dialog(window:WebviewWindow,host:tauri::State<'_,Arc<Host>>,request:tauri::ipc::Request<'_>,action:String,fields:Option<Value>)->Result<Value,String>{
    let url=window.url().map_err(|_|"NOT_ALLOWED")?;
    if !host.authorized(&request)||window.label()!="native-dialog"||url.scheme()!="https"||url.host_str()!=Some("tauri.localhost")||url.path()!="/windows/dialog/index.html"{return Err("NOT_ALLOWED".into());}
    if action=="config"{return Ok(host.dialog_config.lock().unwrap().clone());}
    let value=match action.as_str(){"cancel"=>json!({"cancelled":true}),"submit"=>fields.unwrap_or(Value::Null),_=>return Err("NOT_ALLOWED".into())};
    if serde_json::to_vec(&value).map_err(|_|"INVALID_INPUT")?.len()>32768{return Err("INVALID_INPUT".into());}
    host.dialog.lock().unwrap().as_ref().ok_or("VAULT_CANCELLED")?.send(value).map_err(|_|"VAULT_CANCELLED")?;Ok(json!({"ok":true}))
}
fn main(){
    tauri::Builder::default().plugin(tauri_plugin_dialog::init())
        .register_uri_scheme_protocol("pbtool",tools::response)
        .plugin(tauri_plugin_single_instance::init(|app,arguments,cwd|{
            if let Some(window)=app.get_webview_window("main"){let _=window.set_focus();}
            if let Some(host)=app.try_state::<Arc<Host>>(){let host=host.inner().clone();std::thread::spawn(move||host.receive(arguments,Some(cwd)));}
        }))
        .invoke_handler(tauri::generate_handler![pb_call,pb_dialog])
        .setup(|app|{
            let host=Host::new(app.handle().clone()).map_err(std::io::Error::other)?;host.start().map_err(std::io::Error::other)?;app.manage(host.clone());
            let window=WebviewWindowBuilder::new(app,"main",WebviewUrl::App("windows/start.html".into()))
                .title("Private Brain Pro").inner_size(1280.,900.).min_inner_size(360.,480.).use_https_scheme(true)
                .devtools(cfg!(feature="messprobe")).disable_drag_drop_handler()
                .additional_browser_args(host::BROWSER_ARGS)
                .initialization_script_for_all_frames(include_str!("../../bridge/network-frames.js"))
                .initialization_script(include_str!("../../bridge/capacitor-tauri.js").replace("__PB_SESSION_TOKEN__",&serde_json::to_string(&host.session).unwrap()))
                .on_navigation(|url|url.scheme()=="https"&&((url.host_str()==Some("tauri.localhost")&&["/","/index.html","/windows/start.html"].contains(&url.path()))||url.host_str()==Some("pbtool.localhost")))
                .on_new_window(|_,_|tauri::webview::NewWindowResponse::Deny);
            let window=window.build()?;resources::install(&window,host.clone()).map_err(std::io::Error::other)?;
            let arguments=std::env::args().collect();std::thread::spawn(move||host.receive(arguments,None));Ok(())
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
