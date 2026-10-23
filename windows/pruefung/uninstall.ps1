# NSIS starts its uninstaller from a temporary copy. Waiting for the original
# launcher alone does not mean the temporary process has removed the app yet.
function Wait-ApplicationRemoval {
  $deadline = [DateTime]::UtcNow.AddSeconds(60)
  do {
    if (!(Test-Path $exe) -and !(Test-Path 'HKCU:\Software\Classes\Applications\private-brain-pro.exe')) { return }
    Start-Sleep -Milliseconds 250
  } while ([DateTime]::UtcNow -lt $deadline)
  if (Test-Path $exe) { throw 'Uninstaller left the application binary after 60 seconds.' }
  throw 'Open-with registration survived uninstall after 60 seconds.'
}
