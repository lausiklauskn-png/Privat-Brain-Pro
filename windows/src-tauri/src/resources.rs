//! WebView2 request boundary; pinned model files stay local even with internet off.
use std::sync::{Arc,atomic::Ordering};
use crate::{host::Host,win};
use serde_json::json;
use tauri::Manager;

pub fn install(window:&tauri::WebviewWindow,host:Arc<Host>)->Result<(),String>{
    #[cfg(windows)] {
        use windows::{core::{HSTRING,PWSTR,Interface},Win32::System::Com::{IStream,STGM_READ,STGM_SHARE_DENY_WRITE},Win32::UI::Shell::SHCreateStreamOnFileEx};
        use webview2_com::{Microsoft::Web::WebView2::Win32::{ICoreWebView2_2,COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL},WebResourceRequestedEventHandler,take_pwstr};
        let navigate=window.clone();
        window.with_webview(move|view|{
            let setup=(||->windows::core::Result<()>{unsafe{
                let core=view.controller().CoreWebView2()?;
                let advanced:ICoreWebView2_2=core.cast()?;let environment=advanced.Environment()?;
                core.AddWebResourceRequestedFilter(&HSTRING::from("*"),COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL)?;
                let callback=WebResourceRequestedEventHandler::create(Box::new(move|_,arguments|{
                    let Some(arguments)=arguments else{return Ok(())};
                    let request=arguments.Request()?;let mut raw=PWSTR::null();request.Uri(&mut raw)?;let value=take_pwstr(raw);
                    let Ok(url)=tauri::Url::parse(&value)else{return Ok(())};
                    let model=(url.scheme()=="https"&&url.host_str()==Some("cdn.jsdelivr.net")&&url.path().starts_with("/npm/@xenova/transformers@2.17.2"))
                        ||(url.host_str()==Some("tauri.localhost")&&url.path().starts_with("/models/Xenova/multilingual-e5-small/"));
                    if model {
                        let engine=host.engine.lock().unwrap().clone();
                        let response=engine.and_then(|e|e.call("DesktopInternal","modelAsset",json!({"url":value})).ok());
                        if let Some(path)=response.as_ref().and_then(|r|r.get("path")).and_then(|p|p.as_str()){
                            let path=std::path::PathBuf::from(path);
                            if path.starts_with(host.data.join("semantic"))&&win::no_links(&path).is_ok(){
                                let stream=SHCreateStreamOnFileEx(&HSTRING::from(path.to_string_lossy().as_ref()),(STGM_READ|STGM_SHARE_DENY_WRITE).0,0,false,None)?;
                                let mime=match path.extension().and_then(|x|x.to_str()).unwrap_or(""){"js"=>"text/javascript","json"=>"application/json","wasm"=>"application/wasm",_=>"application/octet-stream"};
                                let headers=format!("Content-Type: {}\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: no-store",mime);
                                let response=environment.CreateWebResourceResponse(&stream,200,&HSTRING::from("OK"),&HSTRING::from(headers))?;arguments.SetResponse(&response)?;return Ok(());
                            }
                        }
                        let response=environment.CreateWebResourceResponse(None::<&IStream>,404,&HSTRING::from("Local model unavailable"),&HSTRING::from("Cache-Control: no-store"))?;arguments.SetResponse(&response)?;return Ok(());
                    }
                    let local=url.scheme()=="https"&&[Some("tauri.localhost"),Some("ipc.localhost")].contains(&url.host_str());
                    if !local&&["http","https","ws","wss"].contains(&url.scheme())&&host.offline.load(Ordering::SeqCst){
                        let response=environment.CreateWebResourceResponse(None::<&IStream>,403,&HSTRING::from("APP_OFFLINE"),&HSTRING::from("Cache-Control: no-store"))?;arguments.SetResponse(&response)?;
                    }
                    Ok(())
                }));
                let mut token=0;core.add_WebResourceRequested(&callback,&mut token)?;Ok(())
            }})();
            if setup.is_ok(){let _=navigate.navigate(tauri::Url::parse("https://tauri.localhost/index.html").unwrap());}
            else {let _=navigate.close();}
        }).map_err(|_|"APP_WEBVIEW_UNAVAILABLE")?;
        Ok(())
    }
    #[cfg(not(windows))] {let _=(window,host);Err("APP_WEBVIEW_UNAVAILABLE".into())}
}
