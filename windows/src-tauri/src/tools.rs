//! Bundled tools have a separate origin. They never receive the app IPC capability.
pub fn response(context:tauri::UriSchemeContext<'_,tauri::Wry>,request:tauri::http::Request<Vec<u8>>)->tauri::http::Response<Vec<u8>>{
    let path=request.uri().path().trim_start_matches('/');
    let allowed=!path.contains('%')&&!path.contains('\\')&&!path.split('/').any(|p|p==".."||p==".")
        &&(path.starts_with("kimboard/")||path.starts_with("kimseek/")||path.starts_with("vendor/pdfjs/")||["tool-gate.js","windows/tool-client.js"].contains(&path));
    if allowed {
        if let Some(asset)=context.app_handle().asset_resolver().get(path.into()){
            return tauri::http::Response::builder().header("Content-Type",asset.mime_type)
                .header("X-Content-Type-Options","nosniff").header("Cache-Control","no-store")
                .body(asset.bytes).unwrap();
        }
    }
    tauri::http::Response::builder().status(404).header("Content-Type","text/plain").body(b"Not found".to_vec()).unwrap()
}
