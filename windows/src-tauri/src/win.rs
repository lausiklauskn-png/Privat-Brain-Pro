use std::path::Path;

pub fn no_links(path:&Path)->Result<(),String> {
    let mut current=std::path::PathBuf::new();
    for part in path.components() {
        current.push(part);
        match std::fs::symlink_metadata(&current) {
            Ok(meta)=>{
                if meta.file_type().is_symlink() {return Err("VAULT_FOLDER_UNAVAILABLE".into());}
                #[cfg(windows)] {use std::os::windows::fs::MetadataExt;if meta.file_attributes()&0x400!=0{return Err("VAULT_FOLDER_UNAVAILABLE".into());}}
            }
            Err(error) if error.kind()==std::io::ErrorKind::NotFound=>{},
            Err(_)=>return Err("VAULT_FOLDER_UNAVAILABLE".into()),
        }
    } Ok(())
}
#[cfg(windows)]
pub fn protect(data:&[u8],binding:&str,decrypt:bool)->Result<Vec<u8>,String>{
    use windows::{core::PCWSTR,Win32::{Foundation::{HLOCAL,LocalFree},Security::Cryptography::{CryptProtectData,CryptUnprotectData,CRYPTPROTECT_UI_FORBIDDEN,CRYPT_INTEGER_BLOB}}};
    let entropy=format!("private-brain-pro-windows|{}",binding).into_bytes();
    let blob=|bytes:&[u8]|CRYPT_INTEGER_BLOB{cbData:bytes.len() as u32,pbData:bytes.as_ptr() as *mut u8};
    let (input,extra)=(blob(data),blob(&entropy));let mut output=CRYPT_INTEGER_BLOB::default();
    unsafe{
        let result=if decrypt {CryptUnprotectData(&input,None,Some(&extra),None,None,CRYPTPROTECT_UI_FORBIDDEN,&mut output)}
            else {CryptProtectData(&input,PCWSTR::null(),Some(&extra),None,None,CRYPTPROTECT_UI_FORBIDDEN,&mut output)};
        result.map_err(|_|"VAULT_UNAVAILABLE")?;
        let bytes=if output.cbData==0{Vec::new()}else{std::slice::from_raw_parts(output.pbData,output.cbData as usize).to_vec()};
        std::ptr::write_bytes(output.pbData,0,output.cbData as usize);let _=LocalFree(Some(HLOCAL(output.pbData as *mut core::ffi::c_void)));Ok(bytes)
    }
}
#[cfg(not(windows))]
pub fn protect(_:&[u8],_:&str,_:bool)->Result<Vec<u8>,String>{Err("VAULT_UNAVAILABLE".into())}

#[cfg(windows)]
pub fn open(target:&str)->Result<(),String>{
    use windows::{core::{HSTRING,PCWSTR},Win32::UI::{Shell::ShellExecuteW,WindowsAndMessaging::SW_SHOWNORMAL}};
    let result=unsafe{ShellExecuteW(None,&HSTRING::from("open"),&HSTRING::from(target),PCWSTR::null(),PCWSTR::null(),SW_SHOWNORMAL)};
    if result.0 as isize>32{Ok(())}else{Err("FILE_UNAVAILABLE".into())}
}
#[cfg(not(windows))]
pub fn open(_:&str)->Result<(),String>{Err("FILE_UNAVAILABLE".into())}

#[cfg(windows)]
pub fn metered()->bool {
    use windows::Networking::Connectivity::{NetworkInformation,NetworkCostType};
    NetworkInformation::GetInternetConnectionProfile().and_then(|p|p.GetConnectionCost()).and_then(|c|c.NetworkCostType())
        .map(|cost|cost!=NetworkCostType::Unrestricted).unwrap_or(true)
}
#[cfg(not(windows))]
pub fn metered()->bool {true}
