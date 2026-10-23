//! Explicit custom scan of a verified export. No remediation or configuration changes.
use std::path::{Path,PathBuf};
#[cfg(windows)]
pub fn scan(path:&Path)->Result<serde_json::Value,String>{
    use windows::{core::GUID,Win32::{UI::Shell::*,System::Com::CoTaskMemFree}};
    use std::{os::windows::process::CommandExt,process::{Command,Stdio},time::{Instant,Duration}};
    fn known(id:&GUID)->Result<PathBuf,String>{unsafe{
        let raw=SHGetKnownFolderPath(id,KF_FLAG_DEFAULT,None).map_err(|_|"SCANNER_UNAVAILABLE")?;
        let value=raw.to_string();CoTaskMemFree(Some(raw.0 as _));Ok(PathBuf::from(value.map_err(|_|"SCANNER_UNAVAILABLE")?))
    }}
    crate::win::no_links(path)?;
    let platform=known(&FOLDERID_ProgramData)?.join("Microsoft/Windows Defender/Platform");
    let mut candidates=Vec::new();
    if crate::win::no_links(&platform).is_ok(){if let Ok(entries)=std::fs::read_dir(platform){
        for entry in entries.flatten(){let name=entry.file_name();if name.to_string_lossy().chars().all(|c|c.is_ascii_digit()||c=='.'||c=='-'){candidates.push(entry.path().join("MpCmdRun.exe"));}}
    }}
    candidates.sort();candidates.reverse();candidates.push(known(&FOLDERID_ProgramFiles)?.join("Windows Defender/MpCmdRun.exe"));
    let executable=candidates.into_iter().find(|p|p.is_file()&&crate::win::no_links(p).is_ok()).ok_or("SCANNER_UNAVAILABLE")?;
    let mut child=Command::new(executable).args(["-Scan","-ScanType","3","-DisableRemediation","-File"]).arg(path)
        .stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).creation_flags(0x08000000).spawn().map_err(|_|"SCANNER_UNAVAILABLE")?;
    let deadline=Instant::now()+Duration::from_secs(120);
    loop{
        if let Some(status)=child.try_wait().map_err(|_|"SCANNER_UNAVAILABLE")?{
            return Ok(serde_json::json!({"provider":"Microsoft Defender","status":match status.code(){Some(0)=>"completed",Some(2)=>"attention",_=>"unavailable"}}));
        }
        if Instant::now()>deadline{let _=child.kill();let _=child.wait();return Err("SCANNER_TIMEOUT".into());}
        std::thread::sleep(Duration::from_millis(100));
    }
}
#[cfg(not(windows))]
pub fn scan(_:&Path)->Result<serde_json::Value,String>{let _=PathBuf::new();Err("SCANNER_UNAVAILABLE".into())}
