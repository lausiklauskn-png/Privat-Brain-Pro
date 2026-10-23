$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true') { throw 'Production installation probe requires the isolated CI runner.' }
Remove-Item Env:PB_WINDOWS_TEST_FOLDER -ErrorAction SilentlyContinue
Remove-Item Env:PB_WINDOWS_TEST_SAVE_FOLDER -ErrorAction SilentlyContinue
$setup = (Get-ChildItem windows/src-tauri/target/release/bundle/nsis -Filter '*-setup.exe' | Select-Object -First 1).FullName
if ((Get-AuthenticodeSignature -LiteralPath $setup).Status -ne 'NotSigned') { throw 'Expected the explicitly chosen unsigned installer.' }
$appDir = Join-Path $env:LOCALAPPDATA 'Private Brain Pro'
$exe = Join-Path $appDir 'private-brain-pro.exe'
function Install($path) {
  $process = Start-Process -FilePath $path -ArgumentList '/S' -PassThru
  if (!$process.WaitForExit(180000)) { $process | Stop-Process -Force; throw 'Installer timed out.' }
  if ($process.ExitCode -ne 0) { throw 'Installer failed.' }
}
function DebugPortOpen {
  $client = [System.Net.Sockets.TcpClient]::new()
  try { $task = $client.ConnectAsync('127.0.0.1',9223); return $task.Wait(500) -and $client.Connected }
  catch { return $false }
  finally { $client.Dispose() }
}
if (DebugPortOpen) { throw 'A previous test endpoint is still running.' }
Install $setup
$app = Start-Process -FilePath $exe -PassThru
try {
  for ($i=0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 500
    $app.Refresh()
    if ($app.HasExited) { throw 'Production app exited during startup.' }
    if ($app.MainWindowHandle -ne 0) { break }
  }
  if ($app.MainWindowHandle -eq 0) { throw 'No production app window.' }
  Start-Sleep -Seconds 3
  if (DebugPortOpen) { throw 'Production build exposes a test endpoint.' }
  $children = @(Get-CimInstance Win32_Process -Filter "name='java.exe'" | Where-Object ParentProcessId -eq $app.Id)
  if ($children.Count -ne 1) { throw 'Production native core is missing.' }
  Write-Output 'PASS unsigned production installer starts the window and its ready native core without a debugging endpoint'
} finally {
  Get-Process private-brain-pro -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 3
}
Install (Join-Path $appDir 'uninstall.exe')
if (Test-Path $exe) { throw 'Production uninstall left the application binary.' }
if (Test-Path 'HKCU:\Software\Classes\Applications\private-brain-pro.exe') { throw 'Open-with registration survived uninstall.' }
if (!(Test-Path (Join-Path $env:LOCALAPPDATA 'de.familyprojekt.privatebrain.pro'))) { throw 'Uninstall removed app data.' }
Write-Output 'PASS production uninstall removes binaries and registration, preserving app data'
