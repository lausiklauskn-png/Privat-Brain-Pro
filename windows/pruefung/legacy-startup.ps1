# Early, isolated acceptance of the exact published production .29 installer.
# No WebView profile override, test build, catalog seed or application rewrite.
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_OS -ne 'Windows') { throw 'Legacy startup acceptance requires the isolated GitHub Windows runner.' }
if (!$env:RUNNER_TEMP -or !$env:GITHUB_WORKSPACE -or !$env:LOCALAPPDATA -or !$env:USERPROFILE -or $env:PB_SOURCE_COMMIT -notmatch '^[a-f0-9]{40}$') { throw 'Explicit runner, same-user profile and source context required.' }
if ($env:WEBVIEW2_USER_DATA_FOLDER -or $env:WEBVIEW2_BROWSER_EXECUTABLE_FOLDER) { throw 'A WebView profile or runtime override would invalidate production startup acceptance.' }
$appDir = Join-Path $env:LOCALAPPDATA 'Private Brain Pro'
$exe = Join-Path $appDir 'private-brain-pro.exe'
$dataDir = Join-Path $env:LOCALAPPDATA 'de.familyprojekt.privatebrain.pro'
$registration = 'HKCU:\Software\Classes\Applications\private-brain-pro.exe'
if (Get-Process private-brain-pro -ErrorAction SilentlyContinue) { throw 'A previous Private Brain process is still running.' }
if ((Test-Path -LiteralPath $exe) -or (Test-Path -LiteralPath $registration)) { throw 'The early legacy probe requires an initially uninstalled application.' }
$defaultLocal = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE 'AppData/Local')).TrimEnd([char[]]@('\','/'))
if (![String]::Equals([IO.Path]::GetFullPath($env:LOCALAPPDATA).TrimEnd([char[]]@('\','/')), $defaultLocal, [StringComparison]::OrdinalIgnoreCase)) { throw 'The existing default local app-data path is required.' }

. (Join-Path $PSScriptRoot 'native-output.ps1')
. (Join-Path $PSScriptRoot 'uninstall.ps1')
Add-Type -Path (Join-Path $PSScriptRoot 'upgrade-launcher.cs')
$token = [Guid]::NewGuid().ToString('N')
$work = Join-Path $env:RUNNER_TEMP ('private-brain-legacy-startup-' + $token)
$capture = Join-Path $work 'native-capture'
$reports = Join-Path $env:GITHUB_WORKSPACE ('windows/pruef-out/legacy-startup/' + $token)
New-Item -ItemType Directory -Path $work, $capture, $reports | Out-Null
$setup = Join-Path $work 'Private-Brain-Pro-Windows-1.0.0-preview.29-x64-setup.exe'
$url = 'https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v1.0.0-preview.29/Private-Brain-Pro-Windows-1.0.0-preview.29-x64-setup.exe'
$pin = '55d5728a4623e079ac0303442c6ff94fe77c35621f1c935c0342d1cfeab52e97'
$browserArguments = '--remote-debugging-port=9224 --remote-debugging-address=127.0.0.1'
$report = [ordered]@{ source = $env:PB_SOURCE_COMMIT; version = '1.0.0-preview.29'; installerSha256 = $pin; installerBytes = 48562317; sameUserDefaultProfile = $true; profileOverride = $false; catalogFixture = $false; checks = @(); success = $false; cleanupSuccess = $false }
$app = $null
$installerStarted = $false
$ownData = $false
$installedExeHash = $null
$failure = $null
$cleanupErrors = [System.Collections.Generic.List[string]]::new()

function Assert-LegacyRegularTree([string]$path) {
  if (!(Test-Path -LiteralPath $path)) { return }
  $queue = [System.Collections.Generic.Queue[string]]::new()
  $queue.Enqueue($path)
  $count = 0
  while ($queue.Count -gt 0) {
    $directory = $queue.Dequeue()
    $item = Get-Item -LiteralPath $directory -Force
    if (!$item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Refusing redirected synthetic app data.' }
    foreach ($child in @(Get-ChildItem -LiteralPath $directory -Force)) {
      $count++
      if ($count -gt 20000) { throw 'Synthetic data cleanup exceeds its bounded tree size.' }
      if (($child.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Refusing a link inside synthetic app data.' }
      if ($child.PSIsContainer) { $queue.Enqueue($child.FullName) }
    }
  }
}
function Test-LegacyPort {
  $client = [Net.Sockets.TcpClient]::new()
  try { $pending = $client.ConnectAsync('127.0.0.1',9224); return $pending.Wait(200) -and $client.Connected }
  catch { return $false }
  finally { $client.Dispose() }
}
function Invoke-LegacySetup([string]$path, [int]$timeout = 120000) {
  $process = Start-Process -FilePath $path -ArgumentList '/S' -PassThru
  try {
    [void]$process.Handle
    if (!$process.WaitForExit($timeout)) { $process.Kill(); [void]$process.WaitForExit(5000); throw 'The exact legacy installer operation timed out.' }
    if ($process.ExitCode -ne 0) { throw ('Legacy installer operation failed with exit code ' + $process.ExitCode) }
  } finally { $process.Dispose() }
}
function Read-LegacyVersionEndpoint {
  $request = [Net.HttpWebRequest]::Create('http://127.0.0.1:9224/json/version')
  $request.Proxy = $null
  $request.Timeout = 1500
  $request.ReadWriteTimeout = 1500
  $request.MaximumResponseHeadersLength = 16
  $response = $null
  $stream = $null
  try {
    $response = $request.GetResponse()
    if ([int]$response.StatusCode -ne 200 -or $response.ContentLength -gt 16384) { throw 'CDP version response has an unexpected status or size.' }
    $stream = $response.GetResponseStream()
    $buffer = [byte[]]::new(16385)
    $count = 0
    while ($count -lt $buffer.Length) {
      $read = $stream.Read($buffer, $count, $buffer.Length - $count)
      if ($read -eq 0) { break }
      $count += $read
    }
    if ($count -eq 0 -or $count -gt 16384) { throw 'CDP version body exceeds its bounded size.' }
    $version = [Text.Encoding]::UTF8.GetString($buffer, 0, $count) | ConvertFrom-Json
    $endpoint = [Uri]$version.webSocketDebuggerUrl
    if ($endpoint.Scheme -ne 'ws' -or $endpoint.Host -ne '127.0.0.1' -or $endpoint.Port -ne 9224 -or !$endpoint.AbsolutePath.StartsWith('/devtools/browser/') -or !$version.Browser -or ([string]$version.Browser).Length -gt 256) { throw 'The exact loopback browser endpoint was not confirmed.' }
    return [string]$version.Browser
  } finally {
    if ($stream) { $stream.Dispose() }
    if ($response) { $response.Dispose() }
  }
}
function Stop-LegacyProbeApp {
  if (!$app) { return }
  $app.Refresh()
  if (!$app.HasExited) {
    [void]$app.CloseMainWindow()
    if (!$app.WaitForExit(5000)) { $app.Kill(); if (!$app.WaitForExit(5000)) { throw 'The exact probe process did not stop.' } }
  }
  $report.processExitCode = $app.ExitCode
  $deadline = [DateTime]::UtcNow.AddSeconds(10)
  while ((Test-LegacyPort) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 200 }
  if (Test-LegacyPort) { throw 'The legacy child endpoint survived its owning process.' }
  if (Get-Process private-brain-pro -ErrorAction SilentlyContinue) { throw 'An app process remains; no unrelated process will be stopped.' }
}

try {
  if (Test-LegacyPort) { throw 'A pre-existing process already owns the requested loopback port.' }
  [UpgradeProbeLauncher]::Preflight()
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $setup -TimeoutSec 90
  if ((Get-Item -LiteralPath $setup).Length -ne 48562317 -or (Get-FileHash -LiteralPath $setup -Algorithm SHA256).Hash.ToLowerInvariant() -ne $pin) { throw 'Published .29 installer differs from its immutable size/SHA-256 pin.' }
  if ((Get-AuthenticodeSignature -LiteralPath $setup).Status -ne 'NotSigned') { throw 'Unexpected legacy installer signing state.' }
  $report.checks += 'Exact published .29 installer size, SHA-256 and chosen signing state'
  # This reset is restricted to the exact default app-data root of this fresh
  # isolated CI account, before the old app starts and before any upgrade seed.
  Assert-LegacyRegularTree $dataDir
  if (Test-Path -LiteralPath $dataDir) { Remove-Item -LiteralPath $dataDir -Recurse -Force }
  if (Test-Path -LiteralPath $dataDir) { throw 'The isolated synthetic app-data reset did not finish.' }
  $ownData = $true
  $installerStarted = $true
  Invoke-LegacySetup $setup
  if (!(Test-Path -LiteralPath $exe)) { throw 'The pinned legacy installer did not create the exact app path.' }
  $installedExeHash = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash
  $report.checks += 'Pinned old installer established the unchanged per-user app path'
  if (Get-Process private-brain-pro -ErrorAction SilentlyContinue) { throw 'The installer unexpectedly started an uncontrolled app instance.' }
  $launch = [UpgradeProbeLauncher]::Start($exe, $appDir, $env:LOCALAPPDATA, $env:USERPROFILE, $browserArguments, $capture)
  $app = $launch.Process
  $report.token = $launch | Select-Object -Property @('CurrentIntegrityRid','CurrentElevationType','CurrentElevated','TargetIntegrityRid','TargetElevationType','TargetElevated','SameUserSid')
  $report.checks += 'Actual production process uses the same user, Medium integrity and no administrative authority'
  $deadline = [DateTime]::UtcNow.AddSeconds(45)
  $ready = $false
  while ([DateTime]::UtcNow -lt $deadline) {
    Assert-ProbeNativeOutputBound $capture
    $app.Refresh()
    if ($app.HasExited) { $report.processExitCode = $app.ExitCode; throw ('Unchanged .29 production app exited before readiness: ' + $app.ExitCode) }
    if ((Test-LegacyPort) -and $app.MainWindowHandle -ne [IntPtr]::Zero) {
      try { $report.browser = Read-LegacyVersionEndpoint; $ready = $true; break }
      catch { $report.lastVersionEndpointError = $_.Exception.Message }
    }
    Start-Sleep -Milliseconds 200
  }
  if (!$ready) { throw 'The unchanged .29 production app did not expose its loopback version endpoint and window within 45 seconds.' }
  # Require the real app to survive the successful endpoint response as well.
  $app.Refresh()
  if ($app.HasExited -or $app.MainWindowHandle -eq [IntPtr]::Zero) { throw 'The old production process did not retain its main window.' }
  Assert-ProbeNativeOutputBound $capture
  $report.mainWindowPresent = $true
  $report.nativeJavaChildren = @(Get-CimInstance Win32_Process -Filter ("name='java.exe' OR name='javaw.exe'") | Where-Object ParentProcessId -eq $app.Id).Count
  $report.checks += 'Alive old production window and bounded GET /json/version on externally requested loopback port'
  $report.success = $true
} catch {
  $failure = $_.Exception.Message
  $report.failure = $failure
} finally {
  try { Stop-LegacyProbeApp } catch { $cleanupErrors.Add($_.Exception.Message) }
  try { Export-ProbeNativeOutput $capture $reports 'legacy-startup' } catch { $cleanupErrors.Add($_.Exception.Message) }
  if ($installerStarted) {
    try {
      if ($app -and !$app.HasExited) { throw 'The owned app is still running; uninstall is refused.' }
      if (Get-Process private-brain-pro -ErrorAction SilentlyContinue) { throw 'An app instance remains; unrelated uninstall is refused.' }
      if ($installedExeHash -and (Test-Path -LiteralPath $exe) -and (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash -ne $installedExeHash) { throw 'The installed binary changed; unrelated uninstall is refused.' }
      $uninstaller = Join-Path $appDir 'uninstall.exe'
      if (Test-Path -LiteralPath $uninstaller) { Invoke-LegacySetup $uninstaller 60000 }
      Wait-ApplicationRemoval
      if (Test-LegacyPort) { throw 'The old endpoint is still present after uninstall.' }
      $report.cleanupSuccess = $true
    } catch { $cleanupErrors.Add($_.Exception.Message) }
  }
  if ($ownData -and $report.cleanupSuccess) {
    try {
      Assert-LegacyRegularTree $dataDir
      if (Test-Path -LiteralPath $dataDir) { Remove-Item -LiteralPath $dataDir -Recurse -Force }
      if (Test-Path -LiteralPath $dataDir) { throw 'The owned synthetic data survived cleanup.' }
    }
    catch { $cleanupErrors.Add($_.Exception.Message); $report.cleanupSuccess = $false }
  }
  # No raw native log is uploaded. Remove only this invocation's GUID-owned
  # temporary installer/capture tree after bounded export and app cleanup.
  if ($report.cleanupSuccess) {
    try {
      Remove-Item -LiteralPath $work -Recurse -Force
      if (Test-Path -LiteralPath $work) { throw 'The GUID-owned capture directory survived cleanup.' }
    } catch { $cleanupErrors.Add($_.Exception.Message); $report.cleanupSuccess = $false }
  }
  $report.cleanupErrors = @($cleanupErrors.ToArray())
  if ($cleanupErrors.Count -gt 0) { $report.success = $false }
  $utf8 = [Text.UTF8Encoding]::new($false)
  [IO.File]::WriteAllText((Join-Path $reports 'summary.json'), (($report | ConvertTo-Json -Depth 7) + [Environment]::NewLine), $utf8)
  Write-Output ('WINDOWS_LEGACY_STARTUP ' + ($report | ConvertTo-Json -Depth 7 -Compress))
  if ($app) { $app.Dispose() }
}
if ($failure) { throw ('Legacy production startup failed: ' + $failure) }
if ($cleanupErrors.Count -gt 0) { throw 'Legacy startup cleanup or bounded output export failed; see its report.' }
if (!$report.success -or !$report.cleanupSuccess) { throw 'Legacy startup acceptance did not finish successfully.' }
Write-Output 'WINDOWS_LEGACY_PRODUCTION_STARTUP_PASS'
