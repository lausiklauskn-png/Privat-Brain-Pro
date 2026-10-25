# Shared, bounded diagnostics for the CI-only production-binary probes.
function Assert-ProbeNativeOutputPath([string]$captureDir) {
  if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_OS -ne 'Windows' -or !$env:RUNNER_TEMP) { throw 'Native probe output requires the isolated Windows runner.' }
  if (!$captureDir) { return $null }
  if (![IO.Path]::IsPathRooted($captureDir)) { throw 'Native capture must have an absolute path.' }
  $full = [IO.Path]::GetFullPath($captureDir)
  $root = [IO.Path]::GetFullPath($env:RUNNER_TEMP).TrimEnd([char[]]@('\','/'))
  if (!$full.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Native capture must remain inside RUNNER_TEMP.' }
  $cursor = $full
  while ($cursor -and $cursor -ne $root) {
    if (Test-Path -LiteralPath $cursor) {
      $item = Get-Item -LiteralPath $cursor -Force
      if (!$item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Native capture directory must be regular and not redirected.' }
    }
    $cursor = [IO.Path]::GetDirectoryName($cursor)
  }
  return $full
}

function Assert-ProbeNativeOutputBound([string]$captureDir) {
  $directory = Assert-ProbeNativeOutputPath $captureDir
  if (!$directory -or !(Test-Path -LiteralPath $directory)) { return }
  foreach ($name in @('stdout.txt','stderr.txt')) {
    $path = Join-Path $directory $name
    if (!(Test-Path -LiteralPath $path)) { continue }
    $item = Get-Item -LiteralPath $path -Force
    if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Native output must be a regular file.' }
    if ($item.Length -gt 262144) { throw ('Native probe output exceeded the 262144-byte raw bound: ' + $name) }
  }
}

function Export-ProbeNativeOutput([string]$captureDir, [string]$reportDir, [string]$phase) {
  $directory = Assert-ProbeNativeOutputPath $captureDir
  if ($phase -notmatch '^[a-z][a-z0-9-]{0,39}$') { throw 'Native output phase is invalid.' }
  if (!$env:GITHUB_WORKSPACE -or !$reportDir -or ![IO.Path]::IsPathRooted($reportDir)) { throw 'Explicit checkout report directory required.' }
  $reports = [IO.Path]::GetFullPath($reportDir)
  $root = [IO.Path]::GetFullPath((Join-Path $env:GITHUB_WORKSPACE 'windows/pruef-out')).TrimEnd([char[]]@('\','/'))
  if ($reports -ne $root -and !$reports.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Native reports must remain in windows/pruef-out.' }
  $cursor = $reports
  while ($cursor -and $cursor -ne [IO.Path]::GetDirectoryName($root)) {
    if (Test-Path -LiteralPath $cursor) {
      $item = Get-Item -LiteralPath $cursor -Force
      if (!$item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Native report directory must not be redirected.' }
    }
    $cursor = [IO.Path]::GetDirectoryName($cursor)
  }
  $output = Join-Path $reports 'native'
  if (Test-Path -LiteralPath $output) {
    $item = Get-Item -LiteralPath $output -Force
    if (!$item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Native output report directory must be regular.' }
  } else { New-Item -ItemType Directory -Path $output -Force | Out-Null }
  $metadata = [ordered]@{ phase = $phase; captureAvailable = [bool]($directory -and (Test-Path -LiteralPath $directory)); exportLimitBytes = 65536; rawLimitBytes = 262144; streams = @() }
  $rawLimitExceeded = $false
  $utf8 = [Text.UTF8Encoding]::new($false, $false)
  foreach ($name in @('stdout.txt','stderr.txt')) {
    $entry = [ordered]@{ stream = $name; available = $false; rawBytes = 0; exportedBytes = 0; truncated = $false; rawLimitExceeded = $false }
    if ($directory) {
      $path = Join-Path $directory $name
      if (Test-Path -LiteralPath $path) {
        $item = Get-Item -LiteralPath $path -Force
        if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Native output must be a regular file.' }
        $stream = $null
        try {
          $stream = [IO.FileStream]::new($path, [IO.FileMode]::Open, [IO.FileAccess]::Read, ([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
          $entry.available = $true
          $entry.rawBytes = $stream.Length
          $entry.rawLimitExceeded = $stream.Length -gt 262144
          if ($entry.rawLimitExceeded) { $rawLimitExceeded = $true }
          $offset = [Math]::Max([long]0, $stream.Length - 65536)
          [void]$stream.Seek($offset, [IO.SeekOrigin]::Begin)
          $buffer = [byte[]]::new(65536)
          $count = 0
          while ($count -lt $buffer.Length) {
            $read = $stream.Read($buffer, $count, $buffer.Length - $count)
            if ($read -eq 0) { break }
            $count += $read
          }
          $bounded = [byte[]]::new($count)
          [Array]::Copy($buffer, $bounded, $count)
          $entry.exportedBytes = $count
          $entry.truncated = $offset -gt 0
          $destination = Join-Path $output ($phase + '-' + $name)
          $target = [IO.FileStream]::new($destination, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
          try { $target.Write($bounded, 0, $bounded.Length) } finally { $target.Dispose() }
          $text = $utf8.GetString($bounded)
          $lines = [regex]::Split($text, '\r?\n')
          $first = [Math]::Max(0, $lines.Length - 80)
          $display = [String]::Join([Environment]::NewLine, [string[]]$lines[$first..($lines.Length - 1)])
          # At most 16384 UTF-16 code units: even replacement characters fit
          # well within the 65536-byte console budget after UTF-8 encoding.
          if ($display.Length -gt 16384) { $display = $display.Substring($display.Length - 16384) }
          Write-Output ('WINDOWS_PROBE_NATIVE_STREAM ' + $phase + ' ' + $name)
          if ($display.Length -gt 0) { Write-Output $display }
        } finally { if ($stream) { $stream.Dispose() } }
      }
    }
    $metadata.streams += $entry
  }
  $json = $metadata | ConvertTo-Json -Depth 5
  $metadataPath = Join-Path $output ($phase + '-metadata.json')
  if (Test-Path -LiteralPath $metadataPath) { throw 'Native output metadata already exists.' }
  [IO.File]::WriteAllText($metadataPath, $json + [Environment]::NewLine, $utf8)
  Write-Output ('WINDOWS_PROBE_NATIVE_OUTPUT ' + ($metadata | ConvertTo-Json -Depth 5 -Compress))
  if ($rawLimitExceeded) { throw 'Native output raw bound was exceeded; only bounded diagnostics were exported.' }
}
