; Per-user "Open with" registration. Does not change any default association.
!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe" "FriendlyAppName" "Private Brain Pro"
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\shell\open\command" "" '$\"$INSTDIR\private-brain-pro.exe$\" $\"%1$\"'
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\DefaultIcon" "" '$\"$INSTDIR\private-brain-pro.exe$\",0'
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\SupportedTypes" ".pdf" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\SupportedTypes" ".txt" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\SupportedTypes" ".csv" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\SupportedTypes" ".eml" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\SupportedTypes" ".mbox" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\SupportedTypes" ".docx" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\SupportedTypes" ".xlsx" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\SupportedTypes" ".png" ""
  WriteRegStr HKCU "Software\Classes\Applications\private-brain-pro.exe\SupportedTypes" ".jpg" ""
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "Software\Classes\Applications\private-brain-pro.exe"
!macroend
