# Windows PowerShell 5.1 / STA, isolated Actions runner only.
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_OS -ne 'Windows') { throw 'Installer upgrade probe requires the isolated GitHub Windows runner.' }
if (!$env:RUNNER_TEMP -or !$env:LOCALAPPDATA -or !$env:USERPROFILE -or $env:PB_SOURCE_COMMIT -notmatch '^[a-f0-9]{40}$') { throw 'Explicit runner and source context required.' }
if ($env:WEBVIEW2_USER_DATA_FOLDER) { throw 'A WebView profile override would invalidate the same-profile upgrade test.' }
if (Get-Process private-brain-pro -ErrorAction SilentlyContinue) { throw 'A previous app process is still running.' }
$appDir = Join-Path $env:LOCALAPPDATA 'Private Brain Pro'
$exe = Join-Path $appDir 'private-brain-pro.exe'
$dataDir = Join-Path $env:LOCALAPPDATA 'de.familyprojekt.privatebrain.pro'
if (Test-Path $exe) { throw 'Previous installed-acceptance cleanup did not remove the binary.' }
$setups = @(Get-ChildItem windows/src-tauri/target/release/bundle/nsis -Filter '*-setup.exe')
if ($setups.Count -ne 1) { throw 'Exactly one current production installer required.' }
$currentSetup = $setups[0].FullName
$config = Get-Content windows/src-tauri/tauri.conf.json -Raw | ConvertFrom-Json
if ($config.version -ne '1.0.36' -or $config.identifier -ne 'de.familyprojekt.privatebrain.pro') { throw 'Wrong version or app identity.' }
if ((Get-AuthenticodeSignature -LiteralPath $currentSetup).Status -ne 'NotSigned') { throw 'Expected the chosen unsigned production installer.' }
$token = [Guid]::NewGuid().ToString('N')
$work = Join-Path $env:RUNNER_TEMP ('private-brain-upgrade-' + $token)
$reports = Join-Path (Get-Location) 'windows/pruef-out/upgrade-29-36'
$vault = Join-Path $work 'chosen-vault'
New-Item -ItemType Directory -Force $work, $reports, $vault | Out-Null
$oldSetup = Join-Path $work 'Private-Brain-Pro-Windows-1.0.0-preview.29-x64-setup.exe'
$oldUrl = 'https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/Private-Brain-Pro-Windows-1.0.0-preview.29-x64-setup.exe'
Invoke-WebRequest -UseBasicParsing -Uri $oldUrl -OutFile $oldSetup
$oldHash = (Get-FileHash -LiteralPath $oldSetup -Algorithm SHA256).Hash.ToLowerInvariant()
if ($oldHash -ne '55d5728a4623e079ac0303442c6ff94fe77c35621f1c935c0342d1cfeab52e97' -or (Get-Item $oldSetup).Length -ne 48562317) { throw 'Published .29 installer differs from its independently verified release pin.' }
if ((Get-AuthenticodeSignature -LiteralPath $oldSetup).Status -ne 'NotSigned') { throw 'Unexpected legacy installer signing state.' }
# The prior installed test used synthetic data in this isolated account. Reset
# it ONCE before .29 starts; there is strictly no reset between versions.
if (Test-Path $dataDir) {
  if (((Get-Item -LiteralPath $dataDir -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Refusing a redirected app data root.' }
  Remove-Item -LiteralPath $dataDir -Recurse -Force
}
if (Test-Path $dataDir) { throw 'Fresh legacy fixture root was not established.' }
$requestedBrowserArgs = '--remote-debugging-port=9224 --remote-debugging-address=127.0.0.1'
Remove-Item Env:PB_WINDOWS_TEST_FOLDER -ErrorAction SilentlyContinue
Remove-Item Env:PB_WINDOWS_TEST_SAVE_FOLDER -ErrorAction SilentlyContinue
$env:PB_WINDOWS_UPGRADE_CDP_PORT = '9224'
$env:PB_WINDOWS_UPGRADE_MARKER = $token
$env:PB_WINDOWS_UPGRADE_REPORT_ROOT = $reports
$env:PB_WINDOWS_UPGRADE_VAULT = $vault
Add-Type -AssemblyName @('UIAutomationClient','UIAutomationTypes','System.Windows.Forms')
Add-Type -Path (Join-Path $PSScriptRoot 'upgrade-launcher.cs')
. (Join-Path $PSScriptRoot 'native-output.ps1')
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class UpgradeProbeWindow {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
'@
function Install-Setup([string]$path) {
  $process = Start-Process -FilePath $path -ArgumentList '/S' -PassThru
  if (!$process.WaitForExit(180000)) { $process | Stop-Process -Force; throw 'Installer timed out.' }
  if ($process.ExitCode -ne 0 -or !(Test-Path $exe)) { throw 'Installer failed to establish the same app path.' }
}
function Test-ProbePort {
  $client = [System.Net.Sockets.TcpClient]::new()
  try { $task = $client.ConnectAsync('127.0.0.1',9224); return $task.Wait(300) -and $client.Connected }
  catch { return $false }
  finally { $client.Dispose() }
}
function Stop-ProbeApp($app) {
  if (!$app) { return }
  $app.Refresh()
  if (!$app.HasExited) {
    [void]$app.CloseMainWindow()
    if (!$app.WaitForExit(10000)) { Stop-Process -Id $app.Id -Force; [void]$app.WaitForExit(10000) }
  }
  Start-Sleep -Milliseconds 1000
  if (Get-Process private-brain-pro -ErrorAction SilentlyContinue) { throw 'The probe app did not stop before the next installation phase.' }
  $portDeadline = [DateTime]::UtcNow.AddSeconds(10)
  while ((Test-ProbePort) -and [DateTime]::UtcNow -lt $portDeadline) { Start-Sleep -Milliseconds 200 }
  if (Test-ProbePort) { throw 'The previous app CDP listener survived app shutdown.' }
}
function Select-ProbeFolder([int]$owner, [string]$path, $nodeProcess, [string]$nativeCapture) {
  $deadline = [DateTime]::UtcNow.AddSeconds(150)
  $dialog = $null
  $processCondition = [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $owner)
  do {
    Assert-ProbeNativeOutputBound $nativeCapture
    $nodeProcess.Refresh()
    if ($nodeProcess.HasExited) { throw 'Seed exited before a real folder dialog could be selected.' }
    $windows = [System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children, $processCondition)
    foreach ($candidate in $windows) {
      if ($candidate.Current.ClassName -eq '#32770') { $dialog = $candidate; break }
    }
    if (!$dialog) { Start-Sleep -Milliseconds 250 }
  } while (!$dialog -and [DateTime]::UtcNow -lt $deadline)
  if (!$dialog) { throw 'No process-owned Windows folder picker appeared.' }
  $handle = [IntPtr]$dialog.Current.NativeWindowHandle
  [void][UpgradeProbeWindow]::SetForegroundWindow($handle)
  $dialog.SetFocus()
  [System.Windows.Forms.SendKeys]::SendWait('%d')
  $edit = $null
  $focusDeadline = [DateTime]::UtcNow.AddSeconds(10)
  do {
    $candidate = [System.Windows.Automation.AutomationElement]::FocusedElement
    if ($candidate -and $candidate.Current.ProcessId -eq $owner -and $candidate.Current.ControlType -eq [System.Windows.Automation.ControlType]::Edit) { $edit = $candidate; break }
    Start-Sleep -Milliseconds 100
  } while ([DateTime]::UtcNow -lt $focusDeadline)
  if (!$edit) { throw 'Owned folder picker address field did not receive focus.' }
  $value = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
  if ($value.Current.IsReadOnly) { throw 'Folder picker address is read-only.' }
  $value.SetValue($path)
  [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
  [System.Windows.Forms.SendKeys]::SendWait('{TAB}')
  $leaf = Split-Path $path -Leaf
  $arrived = $false
  $navigateDeadline = [DateTime]::UtcNow.AddSeconds(15)
  $buttonCondition = [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
  do {
    foreach ($button in $dialog.FindAll([System.Windows.Automation.TreeScope]::Descendants, $buttonCondition)) {
      if ($button.Current.Name -like ('*' + $leaf + '*')) { $arrived = $true; break }
    }
    if (!$arrived) { Start-Sleep -Milliseconds 100 }
  } while (!$arrived -and [DateTime]::UtcNow -lt $navigateDeadline)
  if (!$arrived) { throw 'Folder picker did not show the requested fresh fixture directory.' }
  $idCondition = [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::AutomationIdProperty, '1')
  $condition = [System.Windows.Automation.AndCondition]::new($idCondition, $buttonCondition)
  $select = $dialog.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
  if (!$select -or !$select.Current.IsEnabled) { throw 'Owned folder picker has no enabled Select Folder action.' }
  $invoke = $select.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
  $invoke.Invoke()
}
function Write-ProbeProcessEvidence($app, [string]$phaseName) {
  if (!$app) { return }
  try {
    $app.Refresh()
    $state = [ordered]@{ phase = $phaseName; processId = $app.Id; exited = $app.HasExited }
    if ($app.HasExited) { $state.exitCode = $app.ExitCode }
    else { $state.mainWindowTitle = $app.MainWindowTitle; $state.mainWindowHandle = $app.MainWindowHandle.ToInt64() }
    $queue = [System.Collections.Generic.Queue[int]]::new()
    $queue.Enqueue($app.Id)
    $seen = [System.Collections.Generic.HashSet[int]]::new()
    $descendants = @()
    while ($queue.Count -gt 0 -and $seen.Count -lt 24) {
      $ownerId = $queue.Dequeue()
      if (!$seen.Add($ownerId)) { continue }
      foreach ($child in @(Get-CimInstance Win32_Process -Filter ('ParentProcessId=' + $ownerId))) {
        $queue.Enqueue([int]$child.ProcessId)
        $entry = [ordered]@{ name = $child.Name; processId = $child.ProcessId; parentProcessId = $child.ParentProcessId }
        if ($child.Name -eq 'msedgewebview2.exe') {
          $entry.requestedPortPresent = [bool]($child.CommandLine -match '(?:^|\s)--remote-debugging-port=9224(?:\s|$)')
          $entry.loopbackAddressPresent = [bool]($child.CommandLine -match '(?:^|\s)--remote-debugging-address=127\.0\.0\.1(?:\s|$)')
          if ($child.ExecutablePath) { $entry.runtimeVersion = [Diagnostics.FileVersionInfo]::GetVersionInfo($child.ExecutablePath).ProductVersion }
        }
        $descendants += $entry
      }
    }
    $state.descendants = $descendants
    Write-Output ('WINDOWS_UPGRADE_PROCESS ' + ($state | ConvertTo-Json -Depth 6 -Compress))
  } catch { Write-Output ('WINDOWS_UPGRADE_PROCESS_DIAGNOSTIC_FAILED ' + $_.Exception.Message) }
}
function Phase([string]$name, [bool]$needsFolder) {
  $app = $null
  $node = $null
  $stdout = Join-Path $reports ($name + '-stdout.txt')
  $stderr = Join-Path $reports ($name + '-stderr.txt')
  $nativeCapture = Join-Path $work ('native-' + $name)
  New-Item -ItemType Directory -Path $nativeCapture | Out-Null
  try {
    if (Get-Process private-brain-pro -ErrorAction SilentlyContinue) { throw 'Refusing a second-instance handoff to an uncontrolled existing app.' }
    # WebView2 >=150 ignores environment browser arguments in elevated hosts.
    # Run each unchanged production binary as this same user's linked Medium
    # token. No policy, runtime, profile, installer or app-code change is used.
    $launch = [UpgradeProbeLauncher]::Start($exe, $appDir, $env:LOCALAPPDATA, $env:USERPROFILE, $requestedBrowserArgs, $nativeCapture)
    $app = $launch.Process
    $launch | Select-Object -Property @('ProcessId','CurrentIntegrityRid','CurrentElevationType','CurrentElevated','TargetIntegrityRid','TargetElevationType','TargetElevated','SameUserSid') | ConvertTo-Json -Compress | Write-Output
    $script = Join-Path (Get-Location) 'windows/pruefung/upgrade.mjs'
    $node = Start-Process -FilePath (Get-Command node).Source -ArgumentList ('"' + $script + '" ' + $name) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    if ($needsFolder) { Select-ProbeFolder -owner $app.Id -path $vault -nodeProcess $node -nativeCapture $nativeCapture }
    $phaseDeadline = [DateTime]::UtcNow.AddSeconds(240)
    while (!$node.WaitForExit(250)) {
      Assert-ProbeNativeOutputBound $nativeCapture
      $app.Refresh()
      if ($app.HasExited) { throw 'The installed app exited during the upgrade data phase; inspect its bounded native output.' }
      if ([DateTime]::UtcNow -ge $phaseDeadline) { throw 'Upgrade data phase timed out.' }
    }
    if ($node.ExitCode -ne 0) { throw ('Upgrade phase failed: ' + $name) }
    $report = Get-Content (Join-Path $reports ($name + '.json')) -Raw | ConvertFrom-Json
    if ($report.success -ne $true) { throw ('No successful exact report for phase ' + $name) }
  } finally {
    if ($node -and !$node.HasExited) { Stop-Process -Id $node.Id -Force }
    # Folder selection may fail after Node has already written its actual error.
    # Preserve that bounded evidence in the job log as well as in the artifact.
    if (Test-Path $stdout) { Get-Content $stdout -Tail 80 }
    if (Test-Path $stderr) { Get-Content $stderr -Tail 80 }
    $phaseReport = Join-Path $reports ($name + '.json')
    if (Test-Path $phaseReport) { Get-Content $phaseReport -Tail 80 }
    Write-ProbeProcessEvidence $app $name
    try { Stop-ProbeApp $app }
    finally {
      if ($app) { $app.Dispose() }
      Export-ProbeNativeOutput $nativeCapture $reports $name
    }
  }
}
$finished = $false
try {
  Install-Setup $oldSetup
  Phase 'seed' $true
  if (!(Test-Path $dataDir)) { throw 'Legacy app did not use the default app data path.' }
  # The actual current production setup replaces the old installation in place.
  Install-Setup $currentSetup
  Phase 'verify' $false
  Phase 'verify-unlock' $false
  $summary = [ordered]@{ from = '1.0.0-preview.29'; to = '1.0.36'; oldInstallerSha256 = $oldHash; newInstallerSha256 = (Get-FileHash -LiteralPath $currentSetup -Algorithm SHA256).Hash.ToLowerInvariant(); source = $env:PB_SOURCE_COMMIT; sameDataPath = $true; profileOverride = $false; productionBinaries = $true; phases = @('seed','verify','verify-unlock'); success = $true }
  $summary | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $reports 'summary.json') -Encoding UTF8
  $finished = $true
  Write-Output 'WINDOWS_INSTALLER_UPGRADE_29_TO_36_PASS'
} finally {
  foreach ($name in @('PB_WINDOWS_UPGRADE_CDP_PORT','PB_WINDOWS_UPGRADE_MARKER','PB_WINDOWS_UPGRADE_REPORT_ROOT','PB_WINDOWS_UPGRADE_VAULT')) { Remove-Item ('Env:' + $name) -ErrorAction SilentlyContinue }
  # Existing production.ps1 must subsequently start the exact new binary with
  # no externally enabled CDP endpoint and verify the ordinary production path.
  if (!$finished) { Write-Output 'WINDOWS_INSTALLER_UPGRADE_29_TO_36_FAIL' }
}
