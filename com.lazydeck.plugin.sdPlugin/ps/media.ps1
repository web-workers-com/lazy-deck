Add-Type -AssemblyName System.Runtime.WindowsRuntime
$global:LDAsTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function LDAwait($op, [Type]$type) { $t = $global:LDAsTask.MakeGenericMethod($type).Invoke($null, @($op)); $null = $t.Wait(3000); if ($t.IsCompleted) { $t.Result } }
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
$global:LDThumbKey = ''
$global:LDThumb = $null
function LDNowPlaying {
  try {
    $mgr = LDAwait ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    $s = $mgr.GetCurrentSession()
    if (-not $s) { return '{"ok":true,"playing":false,"title":null}' }
    $p = LDAwait ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    $status = $s.GetPlaybackInfo().PlaybackStatus.ToString()
    $key = "$($p.Title)|$($p.Artist)"
    if ($key -ne $global:LDThumbKey) {
      $global:LDThumbKey = $key; $global:LDThumb = $null
      if ($p.Thumbnail) {
        $stream = LDAwait ($p.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
        if ($stream) {
          $net = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($stream)
          $ms = New-Object System.IO.MemoryStream; $net.CopyTo($ms)
          if ($ms.Length -lt 400000) { $global:LDThumb = 'data:' + $stream.ContentType + ';base64,' + [Convert]::ToBase64String($ms.ToArray()) }
        }
      }
    }
    [ordered]@{ ok = $true; playing = ($status -eq 'Playing'); status = $status; title = $p.Title; artist = $p.Artist; app = $s.SourceAppUserModelId; art = $global:LDThumb } | ConvertTo-Json -Compress
  } catch { '{"ok":false,"error":' + ($_.Exception.Message | ConvertTo-Json) + '}' }
}
