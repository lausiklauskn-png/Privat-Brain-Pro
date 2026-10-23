$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true') { throw 'This installation probe is intended for an isolated GitHub Windows runner.' }
$appDir = Join-Path $env:LOCALAPPDATA 'Private Brain Pro'
$exe = Join-Path $appDir 'private-brain-pro.exe'
$env:PB_WINDOWS_TEST_EXE = $exe
$setup = (Get-ChildItem windows/src-tauri/target/release/bundle/nsis -Filter '*-setup.exe' | Select-Object -First 1).FullName
$env:PB_WINDOWS_TEST_FOLDER = Join-Path $env:RUNNER_TEMP 'private-brain-vault-probe'
$env:PB_WINDOWS_TEST_SAVE_FOLDER = Join-Path $env:RUNNER_TEMP 'private-brain-export-probe'
New-Item -ItemType Directory -Force $env:PB_WINDOWS_TEST_FOLDER, $env:PB_WINDOWS_TEST_SAVE_FOLDER, 'windows/pruef-out' | Out-Null
function Run-Setup($file) {
  $process = Start-Process -FilePath $file -ArgumentList '/S' -PassThru
  if (!$process.WaitForExit(180000)) { $process | Stop-Process -Force; throw 'Installer timed out.' }
  if ($process.ExitCode -ne 0) { throw "Installer failed: $($process.ExitCode)" }
}
function Phase($name) {
  $app = Start-Process -FilePath $exe -PassThru
  node windows/pruefung/installed.mjs $name "windows/pruef-out/$name.json"
  $code = $LASTEXITCODE
  $probe = Join-Path $env:LOCALAPPDATA 'de.familyprojekt.privatebrain.pro\startup-probe.txt'
  if (Test-Path $probe) { Copy-Item $probe "windows/pruef-out/$name-startup.txt"; Get-Content $probe }
  $engineProbe = Join-Path $env:LOCALAPPDATA 'de.familyprojekt.privatebrain.pro\engine-probe.txt'
  if (Test-Path $engineProbe) { Copy-Item $engineProbe "windows/pruef-out/$name-engine.txt"; Get-Content $engineProbe }
  $types = Join-Path $env:LOCALAPPDATA 'de.familyprojekt.privatebrain.pro\engine-types.txt'
  if (Test-Path $types) { Copy-Item $types "windows/pruef-out/$name-engine-types.txt"; Get-Content $types }
  $java = Get-CimInstance Win32_Process -Filter "name='javaw.exe' OR name='java.exe'" | Select-Object ProcessId, ParentProcessId
  $children = @($java | Where-Object ParentProcessId -eq $app.Id | ForEach-Object ProcessId)
  $children += @($java | Where-Object { $_.ParentProcessId -in $children } | ForEach-Object ProcessId)
  $requiredChildren = if ($name -eq 'first') { 2 } else { 1 }
  $missingLifetimeProof = $code -eq 0 -and $children.Count -lt $requiredChildren
  Get-Process private-brain-pro -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 3
  if ($children.Count -and (Get-Process -Id $children -ErrorAction SilentlyContinue)) { throw 'Native/PDF child survived app shutdown.' }
  if ($missingLifetimeProof) { throw 'Expected live native/PDF processes were not observed before shutdown.' }
  if ($code -ne 0) { throw "Installed acceptance failed: $name" }
}
Run-Setup $setup
node windows/engine/protocol-test.mjs (Join-Path $appDir 'runtime/jre/bin/java.exe') (Join-Path $appDir 'runtime')
if ($LASTEXITCODE -ne 0) { throw 'The NSIS-installed runtime failed its private protocol probe.' }
$registration = Get-ItemProperty 'HKCU:\Software\Classes\Applications\private-brain-pro.exe\shell\open\command'
if (!$registration.'(default)'.Contains('private-brain-pro.exe')) { throw 'Open-with registration missing.' }
Phase 'first'
Phase 'restart'
Run-Setup (Join-Path $appDir 'uninstall.exe')
Start-Sleep -Seconds 3
if (Test-Path $exe) { throw 'Uninstaller left the application binary.' }
Run-Setup $setup
Phase 'reinstalled'
Run-Setup (Join-Path $appDir 'uninstall.exe')
