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
pub fn open_document(path:&Path)->Result<(),String>{
    use windows::{core::{HSTRING,PCWSTR},Win32::UI::Shell::{SHOpenWithDialog,OPENASINFO,OAIF_EXEC,OAIF_HIDE_REGISTRATION}};
    use windows::Win32::System::Com::{CoInitializeEx,CoUninitialize,COINIT_APARTMENTTHREADED};
    unsafe{CoInitializeEx(None,COINIT_APARTMENTTHREADED)}.ok().map_err(|_|"FILE_UNAVAILABLE")?;
    struct Apartment;impl Drop for Apartment{fn drop(&mut self){unsafe{CoUninitialize();}}}let _apartment=Apartment;
    let target=HSTRING::from(path.to_str().ok_or("FILE_UNAVAILABLE")?);
    let info=OPENASINFO{pcszFile:PCWSTR(target.as_ptr()),pcszClass:PCWSTR::null(),oaifInFlags:OAIF_EXEC|OAIF_HIDE_REGISTRATION};
    // Always ask which installed application should receive this copy.
    unsafe{SHOpenWithDialog(None,&info)}.map_err(|_|"FILE_UNAVAILABLE".into())
}
#[cfg(not(windows))]
pub fn open_document(_:&Path)->Result<(),String>{Err("FILE_UNAVAILABLE".into())}

#[cfg(windows)]
pub fn metered()->bool {
    use windows::Networking::Connectivity::{NetworkInformation,NetworkCostType};
    NetworkInformation::GetInternetConnectionProfile().and_then(|p|p.GetConnectionCost()).and_then(|c|c.NetworkCostType())
        .map(|cost|cost!=NetworkCostType::Unrestricted).unwrap_or(true)
}
#[cfg(not(windows))]
pub fn metered()->bool {true}

/// Closing/crashing the app also terminates its Java and isolated PDF processes.
pub struct Job(usize);
#[cfg(windows)]
impl Job {
    pub fn attach(child:&std::process::Child)->Result<Self,String>{
        use std::os::windows::io::AsRawHandle;
        use windows::{core::PCWSTR,Win32::{Foundation::{HANDLE,CloseHandle},System::JobObjects::*}};
        unsafe{
            let handle=CreateJobObjectW(None,PCWSTR::null()).map_err(|_|"APP_RUNTIME_UNAVAILABLE")?;
            let mut information=JOBOBJECT_EXTENDED_LIMIT_INFORMATION::default();information.BasicLimitInformation.LimitFlags=JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            let result=SetInformationJobObject(handle,JobObjectExtendedLimitInformation,&information as *const _ as *const core::ffi::c_void,std::mem::size_of_val(&information) as u32)
                .and_then(|_|AssignProcessToJobObject(handle,HANDLE(child.as_raw_handle())));
            if result.is_err(){let _=CloseHandle(handle);return Err("APP_RUNTIME_UNAVAILABLE".into());}
            Ok(Self(handle.0 as usize))
        }
    }
}
#[cfg(windows)]
impl Drop for Job {fn drop(&mut self){unsafe{let _=windows::Win32::Foundation::CloseHandle(windows::Win32::Foundation::HANDLE(self.0 as *mut core::ffi::c_void));}}}
#[cfg(not(windows))]
impl Job {pub fn attach(_:&std::process::Child)->Result<Self,String>{Ok(Self(0))}}
