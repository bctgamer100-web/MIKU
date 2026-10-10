# MIKU — เซิร์ฟเวอร์เว็บเล็กๆ ในเครื่อง (ใช้กับ "เปิด MIKU.bat")
# ทำไมต้องมี: เปิด index.html ตรงๆ (file://) YouTube ไม่ยอมเล่นเพลงในหน้า · เปิดผ่าน http://localhost แล้ว MIKU RADIO เล่นในหน้าได้
# เปิดให้เฉพาะเครื่องนี้ (127.0.0.1) เท่านั้น เครื่องอื่นในวงแลนเข้าไม่ได้ · ไม่ต้องใช้สิทธิ์ผู้ดูแล · ปิดเองเมื่อปิดหน้าต่างแอป
param([int]$Port = 3939, [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)))
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path $Root).Path
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8';
  '.json' = 'application/json; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg';
  '.ico' = 'image/x-icon'; '.woff2' = 'font/woff2'; '.txt' = 'text/plain; charset=utf-8'; '.md' = 'text/plain; charset=utf-8'
}
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
$lastHit = Get-Date
while ($true) {
  # ไม่มีคนเรียกเลย 3 ชั่วโมง = ปิดตัวเอง (กันค้างในเครื่อง)
  if (-not $listener.Pending()) {
    if (((Get-Date) - $lastHit).TotalHours -gt 3) { break }
    Start-Sleep -Milliseconds 25; continue
  }
  $client = $listener.AcceptTcpClient()
  $lastHit = Get-Date
  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
    $line = $reader.ReadLine()
    while (($h = $reader.ReadLine()) -ne $null -and $h -ne '') { }
    $status = '200 OK'; $body = $null; $type = 'text/plain; charset=utf-8'
    if ($line -match '^(GET|HEAD) (\S+)') {
      $path = [Uri]::UnescapeDataString(($matches[2] -split '\?')[0])
      if ($path -eq '/__miku_quit') { $client.Close(); break }
      if ($path.EndsWith('/')) { $path += 'index.html' }
      $file = [System.IO.Path]::GetFullPath((Join-Path $Root ($path.TrimStart('/') -replace '/', '\')))
      if ($file.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
        $body = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
        if ($types.ContainsKey($ext)) { $type = $types[$ext] } else { $type = 'application/octet-stream' }
      } else { $status = '404 Not Found'; $body = [System.Text.Encoding]::UTF8.GetBytes('not found') }
    } else { $status = '405 Method Not Allowed'; $body = [byte[]]@() }
    $head = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
    $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($hb, 0, $hb.Length)
    if ($line -notmatch '^HEAD') { $stream.Write($body, 0, $body.Length) }
    $stream.Flush()
  } catch { } finally { $client.Close() }
}
$listener.Stop()
