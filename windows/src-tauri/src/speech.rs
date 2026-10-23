//! Local Windows SAPI dictation; no audio or text goes to a network service.
use std::sync::{Arc,atomic::{AtomicBool,Ordering}};

#[cfg(windows)]
pub fn recognize(language:&str,cancel:Arc<AtomicBool>)->Result<Option<String>,String>{
    use windows::{core::{HSTRING,PCWSTR,PWSTR,IUnknown,Interface},Win32::{Media::Speech::*,System::Com::*}};
    struct Apartment;
    impl Drop for Apartment {fn drop(&mut self){unsafe{CoUninitialize();}}}
    let language=match language{"de-DE"=>"407","en-US"=>"409","ru-RU"=>"419","pl-PL"=>"415",_=>return Err("INVALID_INPUT".into())};
    let result=(||->windows::core::Result<Option<String>>{unsafe{
        CoInitializeEx(None,COINIT_MULTITHREADED).ok()?;let _apartment=Apartment;
        let category:ISpObjectTokenCategory=CoCreateInstance(&SpObjectTokenCategory,None,CLSCTX_INPROC_SERVER)?;
        category.SetId(SPCAT_RECOGNIZERS,false)?;
        let engines=category.EnumTokens(&HSTRING::from(format!("Language={language}")),PCWSTR::null())?;
        let mut token=None;let mut fetched=0;engines.Next(1,&mut token,Some(&mut fetched))?;
        let token=token.ok_or_else(windows::core::Error::from_thread)?;
        let recognizer:ISpRecognizer=CoCreateInstance(&SpInprocRecognizer,None,CLSCTX_INPROC_SERVER)?;
        recognizer.SetRecognizer(&token)?;
        let input_category:ISpObjectTokenCategory=CoCreateInstance(&SpObjectTokenCategory,None,CLSCTX_INPROC_SERVER)?;
        input_category.SetId(SPCAT_AUDIOIN,false)?;
        let id=input_category.GetDefaultTokenId()?;
        let input:ISpObjectToken=CoCreateInstance(&SpObjectToken,None,CLSCTX_INPROC_SERVER)?;
        let selected=input.SetId(PCWSTR::null(),PCWSTR(id.0),false);CoTaskMemFree(Some(id.0 as _));selected?;
        recognizer.SetInput(&input.cast::<IUnknown>()?,true)?;
        let context=recognizer.CreateRecoContext()?;context.SetNotifyWin32Event()?;
        let interest=(1u64<<SPEI_RECOGNITION.0)|(1u64<<SPEI_RESERVED1.0)|(1u64<<SPEI_RESERVED2.0);
        context.SetInterest(interest,interest)?;
        let grammar=context.CreateGrammar(1)?;grammar.LoadDictation(PCWSTR::null(),SPLO_STATIC)?;
        grammar.SetDictationState(SPRS_ACTIVE)?;recognizer.SetRecoState(SPRST_ACTIVE)?;
        let deadline=std::time::Instant::now()+std::time::Duration::from_secs(60);
        while !cancel.load(Ordering::SeqCst)&&std::time::Instant::now()<deadline {
            let mut event=SPEVENT::default();let mut count=0;context.GetEvents(1,&mut event,&mut count)?;
            if count>0 {
                let event_id=(event._bitfield as u32&0xffff) as i32;
                let kind=((event._bitfield as u32>>16)&0xffff) as i32;
                if event.lParam.0!=0&&(kind==SPET_LPARAM_IS_OBJECT.0||kind==SPET_LPARAM_IS_TOKEN.0){
                    // Each queued event owns one COM reference; consume it exactly once.
                    let object=IUnknown::from_raw(event.lParam.0 as *mut _);
                    if event_id==SPEI_RECOGNITION.0 {
                        let result:ISpRecoResult=object.cast()?;let mut text=PWSTR::null();result.GetText(0,u32::MAX,true,&mut text,None)?;
                        let value=text.to_string();CoTaskMemFree(Some(text.0 as _));
                        let value=value?.chars().take(2000).collect::<String>();
                        grammar.SetDictationState(SPRS_INACTIVE)?;return Ok(Some(value));
                    }
                }else if event.lParam.0!=0&&(kind==SPET_LPARAM_IS_POINTER.0||kind==SPET_LPARAM_IS_STRING.0){CoTaskMemFree(Some(event.lParam.0 as _));}
            }else{std::thread::sleep(std::time::Duration::from_millis(100));}
        }
        grammar.SetDictationState(SPRS_INACTIVE)?;Ok(None)
    }})();
    result.map_err(|_|"SPEECH_UNAVAILABLE".into())
}
#[cfg(not(windows))]
pub fn recognize(_:&str,_:Arc<AtomicBool>)->Result<Option<String>,String>{Err("SPEECH_UNAVAILABLE".into())}
